import { z } from 'zod';

export const createMarkerSchema = z.object({
  body: z.object({
    mapId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Map ID format'),
    title: z.string().min(1, 'Marker title is required').max(100),
    description: z.string().max(200).optional().default(''),
    lat: z.number({ required_error: 'Latitude is required' }),
    lng: z.number({ required_error: 'Longitude is required' }),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be in hex format, e.g. #7c3aed').optional(),
  }),
});

export const updateMarkerSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Marker ID format'),
  }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(200).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
});

export const markerIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Marker ID format'),
  }),
});
