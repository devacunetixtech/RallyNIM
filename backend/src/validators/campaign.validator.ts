import { z } from 'zod';

export const createCampaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  banner: z.string().url('Banner must be a valid URL').optional(),
  category: z.string().min(2, 'Category must be at least 2 characters long'),
  rewardPool: z.number().nonnegative('Reward pool must be a non-negative number'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  location: z.string().min(2, 'Location must be at least 2 characters long'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  stages: z.array(
    z.object({
      title: z.string().min(2, 'Stage title must be at least 2 characters long'),
      description: z.string().min(5, 'Stage description must be at least 5 characters long'),
      rewardType: z.enum(['fixed', 'random', 'leaderboard', 'milestone', 'lottery']),
      rewardAmount: z.number().positive('Reward amount must be a positive number'),
      verificationMethod: z.enum([
        'static_qr',
        'dynamic_qr',
        'hidden_qr',
        'sponsor_qr',
        'merchant_qr',
        'personal_qr',
        'quiz',
        'secret_code',
      ]),
      maximumClaims: z.number().int().positive('Maximum claims must be a positive integer'),
      quizData: z.array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          correctAnswerIndex: z.number().int().nonnegative(),
        })
      ).optional(),
    })
  ).min(1, 'Campaign must have at least one stage'),
});
