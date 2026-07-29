import { Schema, model, Document } from 'mongoose';

export interface ICampaign extends Document {
  title: string;
  description: string;
  banner?: string;
  category: string;
  organizer: Schema.Types.ObjectId;
  rewardPool: number;       // In NIM
  remainingPool: number;    // In NIM
  status: 'draft' | 'scheduled' | 'live' | 'paused' | 'completed' | 'archived' | 'cancelled';
  visibility: 'public' | 'private';
  startDate: Date;
  endDate: Date;
  location: string;
  latitude?: number;
  longitude?: number;
  participants: Schema.Types.ObjectId[];
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  banner: { type: String },
  category: { type: String, required: true, index: true },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rewardPool: { type: Number, required: true, min: 0 },
  remainingPool: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'live', 'paused', 'completed', 'archived', 'cancelled'], 
    default: 'draft',
    index: true
  },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  templateId: { type: String }
}, { timestamps: true });

export const Campaign = model<ICampaign>('Campaign', CampaignSchema);
