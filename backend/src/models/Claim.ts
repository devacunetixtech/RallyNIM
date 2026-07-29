import { Schema, model, Document } from 'mongoose';

export interface IClaim extends Document {
  campaignId: Schema.Types.ObjectId;
  stageId: Schema.Types.ObjectId;
  walletAddress: string;
  reward: number;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  claimedAt: Date;
}

const ClaimSchema = new Schema<IClaim>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
  stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true, index: true },
  walletAddress: { type: String, required: true, lowercase: true, index: true },
  reward: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', index: true },
  transactionHash: { type: String },
  claimedAt: { type: Date, default: Date.now }
});

ClaimSchema.index({ stageId: 1, walletAddress: 1 }, { unique: true });

export const Claim = model<IClaim>('Claim', ClaimSchema);
