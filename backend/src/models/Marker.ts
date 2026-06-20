import mongoose, { Schema } from 'mongoose';
import { IMarker } from '../types';

const MarkerSchema = new Schema<IMarker>(
  {
    mapId: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
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
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: '#7c3aed', // purple default color
    },
  },
  {
    timestamps: true,
  }
);

export const Marker = mongoose.model<IMarker>('Marker', MarkerSchema);
export default Marker;
