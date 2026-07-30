import { User } from '../models/User';
import { Passport } from '../models/Passport';
import { Campaign } from '../models/Campaign';
import { Stage } from '../models/Stage';
import { logger } from '../utils/logger';

export const seedDatabase = async (): Promise<void> => {
  try {
    const campaignCount = await Campaign.countDocuments();
    if (campaignCount > 0) {
      logger.info('Database already has campaigns, skipping seed.');
      return;
    }

    logger.info('Seeding database with demo events...');

    // 1. Create a dummy organizer user if none exists
    const seedWallet = 'nq07000000000000000000000000000000000000';
    let organizer = await User.findOne({ walletAddress: seedWallet });
    if (!organizer) {
      const passport = new Passport({
        walletAddress: seedWallet,
        eventsAttended: [],
        campaignsCompleted: [],
        totalNIMEarned: 0,
        badges: [],
        achievements: [],
        streak: 0,
      });
      await passport.save();

      organizer = new User({
        walletAddress: seedWallet,
        role: 'organizer',
        passportId: passport._id,
        username: 'RallyNIM Seed Organizer',
        bio: 'Official demo account for RallyNIM campaigns'
      });
      await organizer.save();
    }

    // 2. Define 4 high-fidelity campaigns
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const mockCampaigns = [
      {
        title: 'Nimiq London Hackathon 2026',
        description: 'A 48-hour building sprint focused on Nimiq Pay integrations, web-native micropayments, and decentralized UI development.',
        category: 'Hackathon',
        rewardPool: 300,
        remainingPool: 300,
        status: 'live',
        visibility: 'public',
        startDate: new Date(now.getTime() - oneDay),
        endDate: new Date(now.getTime() + oneDay * 5),
        location: 'CodeNode, London',
        latitude: 10.520448,
        longitude: 8.086976,
        stages: [
          {
            title: 'Opening Ceremony Check-In',
            description: 'Scan the presenter screen QR code during the introduction ceremony.',
            order: 1,
            rewardType: 'fixed',
            rewardAmount: 20,
            verificationMethod: 'dynamic_qr',
            status: 'active',
            maximumClaims: 150,
            startsAt: new Date(now.getTime() - oneDay),
            endsAt: new Date(now.getTime() + oneDay)
          },
          {
            title: 'Developer SDK Quiz',
            description: 'Test your understanding of the Nimiq Mini App SDK interfaces.',
            order: 2,
            rewardType: 'fixed',
            rewardAmount: 30,
            verificationMethod: 'quiz',
            status: 'active',
            maximumClaims: 150,
            startsAt: new Date(now.getTime() - oneDay),
            endsAt: new Date(now.getTime() + oneDay * 3),
            quizData: [
              {
                question: 'Which method returns the active user address in Nimiq Mini App SDK?',
                options: ['listAccounts()', 'getWalletAddress()', 'connect()', 'fetchAccount()'],
                correctAnswerIndex: 0
              },
              {
                question: 'Which parameter is required in Nimiq sendBasicTransaction?',
                options: ['recipient and value', 'gasPrice', 'chainId', 'nonce'],
                correctAnswerIndex: 0
              }
            ]
          }
        ]
      }
    ];

    // 3. Save campaigns and stages
    for (const c of mockCampaigns) {
      const { stages, ...campaignData } = c;

      const campaign = new Campaign({
        ...campaignData,
        organizer: organizer._id,
        participants: []
      });
      await campaign.save();

      for (const s of stages) {
        const stage = new Stage({
          ...s,
          campaignId: campaign._id,
          claimed: 0
        });
        await stage.save();
      }
    }

    logger.info('Database successfully seeded with 4 demo events.');
  } catch (error) {
    logger.error(`Error seeding database: ${error}`);
  }
};
