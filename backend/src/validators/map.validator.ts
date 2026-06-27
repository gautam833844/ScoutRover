import { z } from 'zod';

export const createMapSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Map name is required').max(100),
    width: z.number().int().positive('Width must be a positive integer'),
    height: z.number().int().positive('Height must be a positive integer'),
    resolution: z.number().positive('Resolution must be a positive number'),
    originX: z.number(),
    originY: z.number(),
    gridData: z.string().min(1, 'Grid data is required').refine((val) => {
      if (val.startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) && parsed.every(x => typeof x === 'number' && x >= -1 && x <= 100);
        } catch {
          return false;
        }
      }
      const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
      return base64Regex.test(val.replace(/\s+/g, ''));
    }, {
      message: 'Grid data must be a valid JSON array of occupancy values (-1 to 100) or a base64 encoded binary string',
    }),
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
