import { Campaign } from '../models/Campaign';
import { Stage } from '../models/Stage';
import { Claim, IClaim } from '../models/Claim';
import { Passport } from '../models/Passport';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { qrService } from './qr.service';
import { nimiqService } from './nimiq.service';
import mongoose from 'mongoose';
import crypto from 'crypto';

export class ClaimService {
  /**
   * Processes a reward claim. Uses Mongoose session transactions for atomic updates.
   */
  public async claimReward(
    userId: string,
    walletAddress: string,
    campaignId: string,
    stageId: string,
    verificationData?: string
  ): Promise<IClaim> {
    const cleanAddress = walletAddress.toLowerCase().trim();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch Campaign and Stage
      const campaign = await Campaign.findById(campaignId).session(session);
      if (!campaign) throw new Error('Campaign not found');
      if (campaign.status !== 'live') throw new Error('Campaign is not live');

      const now = new Date();
      if (campaign.startDate && now < new Date(campaign.startDate)) {
        throw new Error('This campaign has not started yet.');
      }
      if (campaign.endDate && now > new Date(campaign.endDate)) {
        throw new Error('This campaign has already ended.');
      }

      const stage = await Stage.findById(stageId).session(session);
      if (!stage) throw new Error('Stage not found');
      if (stage.status !== 'active') throw new Error('Stage is not active');

      if (stage.startsAt && now < new Date(stage.startsAt)) {
        throw new Error('This stage challenge has not opened yet.');
      }
      if (stage.endsAt && now > new Date(stage.endsAt)) {
        throw new Error('This stage challenge has already closed.');
      }

      // Enforce sequential stage claiming: if stage order is > 1, must have claimed previous stage (order - 1)
      if (stage.order > 1) {
        const prevStage = await Stage.findOne({ campaignId: campaign._id, order: stage.order - 1 }).session(session);
        if (prevStage) {
          const claimedPrev = await Claim.findOne({
            stageId: prevStage._id,
            walletAddress: cleanAddress,
          }).session(session);
          if (!claimedPrev) {
            throw new Error('Complete previous stages to unlock this one.');
          }
        }
      }

      // 2. Validate Budget and Capacity
      if (campaign.remainingPool < stage.rewardAmount) {
        throw new Error('Reward pool is exhausted');
      }

      if (stage.claimed >= stage.maximumClaims) {
        throw new Error('Maximum claim capacity reached for this stage');
      }

      // 3. Double-Claim Check
      const existingClaim = await Claim.findOne({
        stageId: stage._id,
        walletAddress: cleanAddress,
      }).session(session);

      if (existingClaim) {
        throw new Error('You have already claimed this stage');
      }

      // 4. Parse Verification Details and Geofence coordinates
      let parsedData: any = {};
      let token = verificationData || '';
      let secretCode = verificationData || '';
      let quizAnswers: any = null;
      let userLat: number | undefined;
      let userLng: number | undefined;

      if (verificationData) {
        try {
          const parsed = JSON.parse(verificationData);
          if (parsed && typeof parsed === 'object') {
            parsedData = parsed;
            token = parsed.token || token;
            secretCode = parsed.secretCode || parsed.code || secretCode;
            quizAnswers = parsed.answers || quizAnswers;
            userLat = parsed.latitude;
            userLng = parsed.longitude;
          }
        } catch (e) {
          // Keep raw string fallback
        }
      }

      // Check geofencing if campaign has coordinates
      if (campaign.latitude !== undefined && campaign.longitude !== undefined) {
        if (userLat === undefined || userLng === undefined) {
          throw new Error('Location coordinates are required for this campaign');
        }
        
        // Haversine formula to compute distance
        const R = 6371e3; // Earth radius in meters
        const phi1 = (campaign.latitude * Math.PI) / 180;
        const phi2 = (userLat * Math.PI) / 180;
        const deltaPhi = ((userLat - campaign.latitude) * Math.PI) / 180;
        const deltaLambda = ((userLng - campaign.longitude) * Math.PI) / 180;

        const a =
          Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // in meters

        if (distance > 200) {
          throw new Error(`Location verification failed: You are too far from the event (distance: ${Math.round(distance)}m, max allowed: 200m)`);
        }
      }

      // 5. Verification Method Check
      if (stage.verificationMethod === 'dynamic_qr') {
        if (!token) {
          throw new Error('Verification token is required for dynamic QR');
        }
        const isValid = qrService.verifyDynamicToken(token, stage._id.toString());
        if (!isValid) {
          throw new Error('Invalid or expired QR code');
        }
      } else if (stage.verificationMethod === 'secret_code') {
        if (secretCode !== 'nim_rally_2026') {
          throw new Error('Invalid secret code');
        }
      } else if (stage.verificationMethod === 'quiz') {
        let answersArray: number[] = [];
        if (Array.isArray(quizAnswers)) {
          answersArray = quizAnswers;
        } else {
          try {
            answersArray = JSON.parse(verificationData || '[]');
          } catch (e) {
            throw new Error('Invalid quiz answers format');
          }
        }
        
        if (stage.quizData && stage.quizData.length > 0) {
          for (let i = 0; i < stage.quizData.length; i++) {
            const q = stage.quizData[i];
            if (answersArray[i] === undefined || answersArray[i] !== q.correctAnswerIndex) {
              throw new Error(`Incorrect answer for question ${i + 1}`);
            }
          }
        }
      }

      // 6. Deduct Pool & Increment Claimed Counters
      campaign.remainingPool -= stage.rewardAmount;
      if (campaign.remainingPool < 0) campaign.remainingPool = 0;
      await campaign.save({ session });

      stage.claimed += 1;
      // If stage reached maximum claims, mark as completed
      if (stage.claimed >= stage.maximumClaims) {
        stage.status = 'completed';
      }
      await stage.save({ session });

      // 7. Execute Hot Wallet Payout on-chain (or simulated signature)
      const payoutTxHash = await nimiqService.executeRewardPayout(cleanAddress, stage.rewardAmount);

      // 8. Save Claim
      const claim = new Claim({
        campaignId: campaign._id,
        stageId: stage._id,
        walletAddress: cleanAddress,
        reward: stage.rewardAmount,
        status: 'completed',
        transactionHash: payoutTxHash,
      });
      await claim.save({ session });

      // 9. Record transaction history
      const transaction = new Transaction({
        walletAddress: cleanAddress,
        campaignId: campaign._id,
        amount: stage.rewardAmount,
        type: 'payout',
        status: 'success',
        network: process.env.NETWORK === 'mainnet' ? 'mainnet' : 'testnet',
        transactionHash: payoutTxHash,
      });
      await transaction.save({ session });

      // 9. Update Passport & Streaks
      const passport = await Passport.findOne({ walletAddress: cleanAddress }).session(session);
      if (passport) {
        passport.totalNIMEarned += stage.rewardAmount;
        
        // Add campaign to events attended list if not already present
        if (!passport.eventsAttended.includes(campaign._id as any)) {
          passport.eventsAttended.push(campaign._id as any);
        }

        // Handle milestones / achievements
        const achievementTitle = `Claimed Stage: ${stage.title}`;
        const hasAchievement = passport.achievements.some((a) => a.title === achievementTitle);
        if (!hasAchievement) {
          passport.achievements.push({
            title: achievementTitle,
            description: `Earned ${stage.rewardAmount} NIM at ${campaign.title}`,
            unlockedAt: new Date(),
          });
        }

        // Streak increment rules
        passport.streak += 1;
        
        // Reward Badges on milestones
        if (passport.totalNIMEarned >= 10 && !passport.badges.includes('NIM Pioneer')) {
          passport.badges.push('NIM Pioneer');
          passport.achievements.push({
            title: 'Badge Unlocked: NIM Pioneer',
            description: 'Earned more than 10 NIM in rewards',
            unlockedAt: new Date(),
          });
        }

        await passport.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return claim;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Retrieves reward history for a wallet.
   */
  public async getHistory(walletAddress: string): Promise<IClaim[]> {
    return Claim.find({ walletAddress: walletAddress.toLowerCase().trim() })
      .populate('campaignId', 'title description')
      .populate('stageId', 'title description order rewardType')
      .sort({ claimedAt: -1 });
  }

  /**
   * Retrieves reward payout history for campaigns created by an organizer.
   */
  public async getOrganizerHistory(organizerId: string): Promise<IClaim[]> {
    const campaigns = await Campaign.find({ organizer: organizerId }).select('_id');
    const campaignIds = campaigns.map((c) => c._id);
    return Claim.find({ campaignId: { $in: campaignIds } })
      .populate('campaignId', 'title description')
      .populate('stageId', 'title description order rewardType')
      .sort({ claimedAt: -1 });
  }

  public async getPublicStats(): Promise<{
    totalParticipants: number;
    totalClaimed: number;
    totalOrganizers: number;
    totalUniqueAddresses: number;
    recentClaims: any[];
  }> {
    const uniqueParticipants = await Claim.distinct('walletAddress', { status: 'completed' });
    const totalParticipants = uniqueParticipants.length;

    const allClaims = await Claim.find({ status: 'completed' }).select('reward');
    const totalClaimed = allClaims.reduce((acc, curr) => acc + curr.reward, 0);

    const uniqueOrganizerIds = await Campaign.distinct('organizer');
    const totalOrganizers = uniqueOrganizerIds.length;

    const totalUniqueAddresses = await User.countDocuments({});

    const recentClaims = await Claim.find({ status: 'completed' })
      .populate('campaignId', 'title')
      .populate('stageId', 'title')
      .sort({ claimedAt: -1 })
      .limit(15);

    return {
      totalParticipants,
      totalClaimed,
      totalOrganizers,
      totalUniqueAddresses,
      recentClaims
    };
  }

  public async getVerifiableParticipants(): Promise<Array<{
    walletAddress: string;
    totalClaimsCount: number;
    totalRewardsClaimed: number;
    claims: Array<{
      campaignTitle: string;
      stageTitle: string;
      rewardAmount: number;
      transactionHash?: string;
      claimedAt: Date;
    }>
  }>> {
    const completedClaims = await Claim.find({ status: 'completed' })
      .populate('campaignId', 'title')
      .populate('stageId', 'title')
      .sort({ claimedAt: -1 });

    const groupedMap = new Map<string, any>();

    for (const claim of completedClaims) {
      const wallet = claim.walletAddress.toLowerCase().trim();
      const campaignTitle = (claim.campaignId as any)?.title || 'Unknown Campaign';
      const stageTitle = (claim.stageId as any)?.title || 'Unknown Stage';

      if (!groupedMap.has(wallet)) {
        groupedMap.set(wallet, {
          walletAddress: wallet,
          totalClaimsCount: 0,
          totalRewardsClaimed: 0,
          claims: [],
        });
      }

      const walletGroup = groupedMap.get(wallet);
      walletGroup.totalClaimsCount += 1;
      walletGroup.totalRewardsClaimed += claim.reward;
      walletGroup.claims.push({
        campaignTitle,
        stageTitle,
        rewardAmount: claim.reward,
        transactionHash: claim.transactionHash,
        claimedAt: claim.claimedAt,
      });
    }

    return Array.from(groupedMap.values());
  }
}

export const claimService = new ClaimService();
