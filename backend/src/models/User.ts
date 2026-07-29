import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  username?: string;
  avatar?: string;
  bio?: string;
  role: 'organizer' | 'participant' | 'sponsor' | 'merchant';
  passportId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  walletAddress: { type: String, required: true, unique: true, index: true, lowercase: true },
  username: { type: String, trim: true },
  avatar: { type: String },
  bio: { type: String },
  role: { type: String, enum: ['organizer', 'participant', 'sponsor', 'merchant'], default: 'participant' },
  passportId: { type: Schema.Types.ObjectId, ref: 'Passport' }
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);
