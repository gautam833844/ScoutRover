import mongoose, { Schema } from 'mongoose';
import { IMap } from '../types';

const MapSchema = new Schema<IMap>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    resolution: {
      type: Number,
      required: true,
    },
    originX: {
      type: Number,
      required: true,
    },
    originY: {
      type: Number,
      required: true,
    },
    gridData: {
      type: String, // Stringified JSON representation of the cell grid array
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Map = mongoose.model<IMap>('Map', MapSchema);
export default Map;
