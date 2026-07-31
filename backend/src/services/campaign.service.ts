import { Campaign, ICampaign } from '../models/Campaign';
import { Stage, IStage } from '../models/Stage';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { nimiqService } from './nimiq.service';
import mongoose from 'mongoose';

export class CampaignService {
  /**
   * Creates a new campaign with multiple stages in 'draft' state.
   */
  public async createCampaign(
    campaignData: Partial<ICampaign>,
    stagesData: Partial<IStage>[]
  ): Promise<{ campaign: ICampaign; stages: IStage[] }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create campaign in draft
      const campaign = new Campaign({
        ...campaignData,
        remainingPool: campaignData.rewardPool || 0,
        status: 'draft',
      });
      await campaign.save({ session });

      // 2. Create associated stages
      const stages: IStage[] = [];
      for (const [index, stageData] of stagesData.entries()) {
        const stage = new Stage({
          ...stageData,
          campaignId: campaign._id,
          order: index + 1,
          status: index === 0 ? 'upcoming' : 'locked', // first stage is ready to unlock
          claimed: 0,
          startsAt: stageData.startsAt || campaign.startDate,
          endsAt: stageData.endsAt || campaign.endDate,
        });
        await stage.save({ session });
        stages.push(stage);
      }

      await session.commitTransaction();
      session.endSession();

      return { campaign, stages };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Automatically transitions 'scheduled' campaigns to 'live' if their startDate is in the past.
   */
  private async syncScheduledCampaigns(): Promise<void> {
    const now = new Date();
    const scheduledToLive = await Campaign.find({
      status: 'scheduled',
      startDate: { $lte: now }
    });

    for (const campaign of scheduledToLive) {
      campaign.status = 'live';
      await campaign.save();
      
      await Stage.updateMany(
        { campaignId: campaign._id },
        { status: 'active' }
      );
    }
  }

  /**
   * Retrieves all campaigns with basic filters.
   */
  public async getCampaigns(filters: {
    category?: string;
    status?: string;
    organizer?: string;
    requestingUserId?: string;
    requestingUserRole?: string;
  }): Promise<ICampaign[]> {
    await this.syncScheduledCampaigns();
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.organizer) query.organizer = filters.organizer;

    // Filter by status or enforce draft visibility
    if (filters.status) {
      if (filters.status === 'draft') {
        // Enforce that you can only request 'draft' if you are the organizer of those drafts
        if (filters.requestingUserRole === 'organizer' && filters.requestingUserId) {
          query.status = 'draft';
          query.organizer = filters.requestingUserId;
        } else {
          // Non-organizers cannot view drafts
          return [];
        }
      } else {
        query.status = filters.status;
      }
    } else {
      // No specific status requested: return all non-draft campaigns,
      // plus draft campaigns belonging to the requesting organizer.
      if (filters.requestingUserRole === 'organizer' && filters.requestingUserId) {
        query.$or = [
          { status: { $ne: 'draft' } },
          { status: 'draft', organizer: filters.requestingUserId }
        ];
      } else {
        query.status = { $ne: 'draft' };
      }
    }

    return Campaign.find(query).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a single campaign and its stages.
   */
  public async getCampaignById(id: string): Promise<{ campaign: ICampaign; stages: IStage[] }> {
    await this.syncScheduledCampaigns();
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const stages = await Stage.find({ campaignId: campaign._id }).sort({ order: 1 });
    return { campaign, stages };
  }

  /**
   * Verifies the funding transaction on-chain and publishes the campaign.
   */
  public async publishCampaign(campaignId: string, txHash: string): Promise<ICampaign> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new Error('Only draft campaigns can be published');
    }

    // Fetch organizer details to get their wallet address
    const organizerUser = await User.findById(campaign.organizer);
    if (!organizerUser) {
      throw new Error('Campaign organizer not found');
    }

    // Verify Nimiq on-chain transaction
    const isTxValid = await nimiqService.verifyFundingTransaction(
      txHash,
      organizerUser.walletAddress,
      campaign.rewardPool,
      campaignId
    );

    if (!isTxValid) {
      throw new Error('Blockchain funding transaction verification failed');
    }

    // Save transaction entry in database
    const transaction = new Transaction({
      walletAddress: organizerUser.walletAddress,
      campaignId: campaign._id,
      amount: campaign.rewardPool,
      type: 'funding',
      status: 'success',
      network: process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
      transactionHash: txHash,
    });
    await transaction.save();

    // Set campaign to live or scheduled depending on startDate
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      campaign.status = 'scheduled';
      // Set stages to lock/upcoming
      await Stage.updateMany(
        { campaignId: campaign._id },
        { status: 'upcoming' }
      );
    } else {
      campaign.status = 'live';
      // Activate all stages
      await Stage.updateMany(
        { campaignId: campaign._id },
        { status: 'active' }
      );
    }
    await campaign.save();

    return campaign;
  }

  /**
   * Toggles campaign activity during emergencies.
   */
  public async pauseCampaign(campaignId: string): Promise<ICampaign> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'live') throw new Error('Only live campaigns can be paused');

    campaign.status = 'paused';
    await campaign.save();
    return campaign;
  }

  public async resumeCampaign(campaignId: string): Promise<ICampaign> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'paused') throw new Error('Only paused campaigns can be resumed');

    // Reset status to live (or scheduled if startDate is in the future)
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      campaign.status = 'scheduled';
    } else {
      campaign.status = 'live';
    }
    await campaign.save();
    return campaign;
  }

  public async cancelCampaign(campaignId: string): Promise<ICampaign> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (['cancelled', 'completed', 'archived'].includes(campaign.status)) {
      throw new Error(`Campaign cannot be cancelled in status: ${campaign.status}`);
    }

    const organizerUser = await User.findById(campaign.organizer);
    if (!organizerUser || !organizerUser.walletAddress) {
      throw new Error('Campaign organizer does not have a registered wallet');
    }

    const refundAmount = campaign.remainingPool;
    let refundTxHash = '';

    if (refundAmount > 0) {
      // Execute the on-chain refund payout
      try {
        refundTxHash = await nimiqService.executeRewardPayout(
          organizerUser.walletAddress,
          refundAmount
        );
      } catch (err: any) {
        throw new Error(`Failed to refund remaining pool on-chain: ${err.message}`);
      }
    }

    campaign.status = 'cancelled';
    campaign.remainingPool = 0; // Empty the pool as it has been refunded
    await campaign.save();

    // Create a transaction record for the refund
    if (refundAmount > 0) {
      const transaction = new Transaction({
        walletAddress: organizerUser.walletAddress,
        campaignId: campaign._id,
        amount: refundAmount,
        type: 'refund',
        status: 'success',
        network: process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
        transactionHash: refundTxHash,
      });
      await transaction.save();
    }

    return campaign;
  }
}

export const campaignService = new CampaignService();
