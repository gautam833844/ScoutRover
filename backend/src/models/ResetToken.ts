import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResetToken extends Document {
  token: string;
  userId: Types.ObjectId | string;
  expiresAt: Date;
}

const ResetTokenSchema = new Schema<IResetToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create TTL index to automatically remove expired documents
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ResetToken = mongoose.model<IResetToken>('ResetToken', ResetTokenSchema);
export default ResetToken;
