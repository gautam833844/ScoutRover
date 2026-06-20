import request from 'supertest';
import app from '../app';
import Map from '../models/Map';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../models/Map');

jest.mock('../services/audit.service', () => {
  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
    listLogs: jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
  };
  return {
    __esModule: true,
    auditService: mockAudit,
    default: mockAudit,
  };
});

describe('Map API Endpoints', () => {
  let token: string;

  beforeAll(() => {
    // Generate valid mock JWT for auth middleware
    token = jwt.sign(
      { userId: 'mock_operator_id', role: 'OPERATOR' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/v1/maps', () => {
    it('should save a map scan when operator is authenticated', async () => {
      const mockMap = {
        _id: 'mock_map_id_999',
        name: 'LiDAR Calibration Room',
        width: 10,
        height: 10,
        resolution: 0.05,
        originX: 0,
        originY: 0,
        gridData: '[]',
        createdBy: 'mock_operator_id',
      };

      (Map.create as jest.Mock).mockResolvedValue(mockMap);

      const response = await request(app)
        .post('/api/v1/maps')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'LiDAR Calibration Room',
          width: 10,
          height: 10,
          resolution: 0.05,
          originX: 0,
          originY: 0,
          gridData: '[]',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('LiDAR Calibration Room');
    });

    it('should reject map creation if authorization token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/maps')
        .send({
          name: 'LiDAR Calibration Room',
          width: 10,
          height: 10,
          resolution: 0.05,
          originX: 0,
          originY: 0,
          gridData: '[]',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should reject if payload fails schema validation tests', async () => {
      const response = await request(app)
        .post('/api/v1/maps')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '', // Empty name triggers validation failure
          width: 10,
          height: 10,
          resolution: 0.05,
          originX: 0,
          originY: 0,
          gridData: '', // Empty grid data triggers validation failure
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Request validation failed');
    });
  });
});
