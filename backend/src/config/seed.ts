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
        latitude: 51.520448,
        longitude: -0.086976,
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
            maximumClaims: 100,
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
      },
      {
        title: 'Munich Web3 Meetup',
        description: 'An evening of technical talks on decentralized consensus, Nimiq PoS transition, and peer-to-peer browser networking.',
        category: 'Meetup',
        rewardPool: 150,
        remainingPool: 150,
        status: 'live',
        visibility: 'public',
        startDate: new Date(now.getTime() - oneDay * 0.5),
        endDate: new Date(now.getTime() + oneDay * 2),
        location: 'Werk1, Munich',
        latitude: 48.1245,
        longitude: 11.6063,
        stages: [
          {
            title: 'P2P Networking Check-In',
            description: 'Scan the registration desk QR code to confirm your physical attendance.',
            order: 1,
            rewardType: 'fixed',
            rewardAmount: 15,
            verificationMethod: 'static_qr',
            status: 'active',
            maximumClaims: 60,
            startsAt: new Date(now.getTime() - oneDay * 0.5),
            endsAt: new Date(now.getTime() + oneDay * 2)
          },
          {
            title: 'Feedback Secret Code',
            description: 'Enter the secret code announced at the end of the meetup.',
            order: 2,
            rewardType: 'fixed',
            rewardAmount: 25,
            verificationMethod: 'secret_code',
            status: 'active',
            maximumClaims: 60,
            startsAt: new Date(now.getTime() - oneDay * 0.5),
            endsAt: new Date(now.getTime() + oneDay * 2)
          }
        ]
      },
      {
        title: 'Paris Web3 Escrow Summit',
        description: 'A global gathering of top smart contract builders and legal tech projects to discuss decentralized escrow rails.',
        category: 'Summit',
        rewardPool: 500,
        remainingPool: 500,
        status: 'live',
        visibility: 'public',
        startDate: new Date(now.getTime() - oneDay * 2),
        endDate: new Date(now.getTime() + oneDay * 4),
        location: 'Palais des Congrès, Paris',
        latitude: 48.878776,
        longitude: 2.283457,
        stages: [
          {
            title: 'Escrow Keynote Scan',
            description: 'Scan the QR code displayed at the end of the escrow keynote presentation.',
            order: 1,
            rewardType: 'fixed',
            rewardAmount: 40,
            verificationMethod: 'dynamic_qr',
            status: 'active',
            maximumClaims: 200,
            startsAt: new Date(now.getTime() - oneDay * 2),
            endsAt: new Date(now.getTime() + oneDay * 4)
          }
        ]
      },
      {
        title: 'Berlin Blockchain Week: Nimiq Booth',
        description: 'Visit the Nimiq booth to experience web-native instant payments, get free stickers, and win testnet NIM.',
        category: 'Exhibition',
        rewardPool: 200,
        remainingPool: 200,
        status: 'live',
        visibility: 'public',
        startDate: new Date(now.getTime() - oneDay),
        endDate: new Date(now.getTime() + oneDay * 3),
        location: 'Berlin Congress Center, Berlin',
        latitude: 52.5218,
        longitude: 13.4132,
        stages: [
          {
            title: 'Booth Visitor Scan',
            description: 'Scan the big banner QR code at the Nimiq booth.',
            order: 1,
            rewardType: 'fixed',
            rewardAmount: 10,
            verificationMethod: 'static_qr',
            status: 'active',
            maximumClaims: 300,
            startsAt: new Date(now.getTime() - oneDay),
            endsAt: new Date(now.getTime() + oneDay * 3)
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
