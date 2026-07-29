import { Schema, model, Document } from 'mongoose';

export interface IPassport extends Document {
  walletAddress: string;
  eventsAttended: Schema.Types.ObjectId[];
  campaignsCompleted: Schema.Types.ObjectId[];
  totalNIMEarned: number;
  badges: string[];
  achievements: {
    title: string;
    unlockedAt: Date;
    description: string;
  }[];
  streak: number;
  leaderboardRank?: number;
}

const PassportSchema = new Schema<IPassport>({
  walletAddress: { type: String, required: true, unique: true, index: true, lowercase: true },
  eventsAttended: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
  campaignsCompleted: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
  totalNIMEarned: { type: Number, default: 0, min: 0 },
  badges: [{ type: String }],
  achievements: [{
    title: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    description: { type: String, required: true }
  }],
  streak: { type: Number, default: 0 },
  leaderboardRank: { type: Number }
});

export const Passport = model<IPassport>('Passport', PassportSchema);
