import mongoose, { Schema } from 'mongoose';
import { IRoute } from '../types';

const RoutePointSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const RouteSchema = new Schema<IRoute>(
  {
    mapId: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    points: {
      type: [RoutePointSchema],
      required: true,
      validate: {
        validator: function (val: any[]) {
          return val.length >= 2;
        },
        message: 'A route must have at least 2 points.',
      },
    },
    distance: {
      type: Number,
      required: true,
    },
    color: {
      type: String,
      default: '#7c3aed',
    },
  },
  {
    timestamps: true,
  }
);

export const Route = mongoose.model<IRoute>('Route', RouteSchema);
export default Route;
