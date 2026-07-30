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
   * Retrieves all campaigns with basic filters.
   */
  public async getCampaigns(filters: {
    category?: string;
    status?: string;
    organizer?: string;
  }): Promise<ICampaign[]> {
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.organizer) query.organizer = filters.organizer;

    return Campaign.find(query).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a single campaign and its stages.
   */
  public async getCampaignById(id: string): Promise<{ campaign: ICampaign; stages: IStage[] }> {
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

    // Set campaign to live
    campaign.status = 'live';
    await campaign.save();

    // Activate the first stage
    await Stage.findOneAndUpdate(
      { campaignId: campaign._id, order: 1 },
      { status: 'active' }
    );

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

    campaign.status = 'live';
    await campaign.save();
    return campaign;
  }
}

export const campaignService = new CampaignService();
