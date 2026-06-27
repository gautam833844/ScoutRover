import mongoose, { Schema } from 'mongoose';
import { IRoute } from '../types';

const RoutePointSchema = new Schema(
  {
    y: { type: Number, required: true, alias: 'lat' },
    x: { type: Number, required: true, alias: 'lng' },
  },
  { _id: false, toObject: { aliases: true }, toJSON: { aliases: true } }
);

const RouteSchema = new Schema<IRoute>(
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
    toObject: { virtuals: true, aliases: true },
    toJSON: { virtuals: true, aliases: true },
  }
);

RouteSchema.index({ mapId: 1, createdAt: -1 });

export const Route = mongoose.model<IRoute>('Route', RouteSchema);
export default Route;
