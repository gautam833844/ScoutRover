import { Document, Types } from 'mongoose';
import { Request } from 'express';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  firstName: string;
  lastName: string;
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IMap extends Document {
  name: string;
  width: number;
  height: number;
  resolution: number;
  originX: number;
  originY: number;
  gridData: Buffer; // Raw binary buffer of grid cells
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarker extends Document {
  mapId: Types.ObjectId | string;
  createdBy: Types.ObjectId | string;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  y?: number;
  x?: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoutePoint {
  lat: number;
  lng: number;
  y?: number;
  x?: number;
}

export interface IRoute extends Document {
  mapId: Types.ObjectId | string;
  createdBy: Types.ObjectId | string;
  name: string;
  points: IRoutePoint[];
  distance: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog extends Document {
  userId?: Types.ObjectId | string | null;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface TokenPayload {
  userId: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface RequestWithUser extends Request {
  user?: TokenPayload;
}
