import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  actionType: 'generated' | 'scanned';
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    actionType: { type: String, enum: ['generated', 'scanned'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);
