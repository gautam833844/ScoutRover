import { z } from 'zod';

export const createMapSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Map name is required').max(100),
    width: z.number().int().positive('Width must be a positive integer'),
    height: z.number().int().positive('Height must be a positive integer'),
    resolution: z.number().positive('Resolution must be a positive number'),
    originX: z.number(),
    originY: z.number(),
    gridData: z.string().min(1, 'Grid data is required'), // Must contain grid JSON array
  }),
});

export const updateMapSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Map ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
  }),
});

export const mapIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Map ID format'),
  }),
});
