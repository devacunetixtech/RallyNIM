import { Schema, model, Document } from 'mongoose';

export interface IStage extends Document {
  campaignId: Schema.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  rewardType: 'fixed' | 'random' | 'leaderboard' | 'milestone' | 'lottery';
  rewardAmount: number;
  verificationMethod: 'static_qr' | 'dynamic_qr' | 'hidden_qr' | 'sponsor_qr' | 'merchant_qr' | 'personal_qr' | 'quiz' | 'secret_code';
  status: 'locked' | 'upcoming' | 'active' | 'completed' | 'expired';
  maximumClaims: number;
  claimed: number;
  startsAt: Date;
  endsAt: Date;
  quizData?: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
  }[];
}

const StageSchema = new Schema<IStage>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  rewardType: { 
    type: String, 
    enum: ['fixed', 'random', 'leaderboard', 'milestone', 'lottery'], 
    required: true 
  },
  rewardAmount: { type: Number, required: true, min: 0 },
  verificationMethod: { 
    type: String, 
    enum: ['static_qr', 'dynamic_qr', 'hidden_qr', 'sponsor_qr', 'merchant_qr', 'personal_qr', 'quiz', 'secret_code'], 
    required: true 
  },
  status: { type: String, enum: ['locked', 'upcoming', 'active', 'completed', 'expired'], default: 'locked' },
  maximumClaims: { type: Number, required: true },
  claimed: { type: Number, default: 0 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  quizData: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswerIndex: { type: Number }
  }]
});

StageSchema.index({ campaignId: 1, order: 1 }, { unique: true });

export const Stage = model<IStage>('Stage', StageSchema);
