import { Schema, model, Document } from 'mongoose';

export interface ITransaction extends Document {
  walletAddress: string;
  campaignId?: Schema.Types.ObjectId;
  amount: number;
  type: 'funding' | 'payout' | 'refund';
  status: 'pending' | 'success' | 'failed';
  network: 'testnet' | 'mainnet';
  transactionHash: string;
  timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  walletAddress: { type: String, required: true, lowercase: true, index: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['funding', 'payout', 'refund'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
  network: { type: String, enum: ['testnet', 'mainnet'], required: true },
  transactionHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now }
});

export const Transaction = model<ITransaction>('Transaction', TransactionSchema);
