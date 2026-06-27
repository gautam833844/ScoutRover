import mongoose, { Schema } from 'mongoose';
import { IMarker } from '../types';

const MarkerSchema = new Schema<IMarker>(
  {
    mapId: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    y: {
      type: Number,
      required: true,
      alias: 'lat',
    },
    x: {
      type: Number,
      required: true,
      alias: 'lng',
    },
    color: {
      type: String,
      default: '#7c3aed', // purple default color
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true, aliases: true },
    toJSON: { virtuals: true, aliases: true },
  }
);

MarkerSchema.index({ mapId: 1, createdAt: -1 });

export const Marker = mongoose.model<IMarker>('Marker', MarkerSchema);
export default Marker;
