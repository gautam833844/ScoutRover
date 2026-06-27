import { z } from 'zod';

const pointSchema = z.object({
  lat: z.number({ required_error: 'Latitude is required' }),
  lng: z.number({ required_error: 'Longitude is required' }),
});

export const createRouteSchema = z.object({
  body: z.object({
    mapId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Map ID format'),
    name: z.string().min(1, 'Route name is required').max(100),
    points: z.array(pointSchema).min(2, 'Route must contain at least 2 coordinate waypoints'),
    distance: z.number().nonnegative('Distance must be a non-negative number'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be in hex format, e.g. #7c3aed').optional(),
  }),
});

export const updateRouteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Route ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    points: z.array(pointSchema).min(2).optional(),
    distance: z.number().nonnegative().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
});

export const routeIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Route ID format'),
  }),
});
