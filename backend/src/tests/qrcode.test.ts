import request from 'supertest';
import app from '../app';
import QRCode from '../models/QRCode';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

jest.mock('../models/QRCode');

describe('QR Code API Endpoints', () => {
  let token: string;

  beforeAll(() => {
    // Generate valid JWT
    token = jwt.sign(
      { userId: 'mock_user_id', role: 'OPERATOR' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/v1/qrcodes', () => {
    it('should successfully save a QR code entry when operator is authenticated', async () => {
      const mockQRCode = {
        _id: 'mock_qr_id_123',
        userId: 'mock_user_id',
        title: 'Connection Profile QR',
        content: 'http://atlas-slam.io/connect',
        actionType: 'generated',
      };

      (QRCode.create as jest.Mock).mockResolvedValue(mockQRCode);

      const response = await request(app)
        .post('/api/v1/qrcodes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Connection Profile QR',
          content: 'http://atlas-slam.io/connect',
          actionType: 'generated',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Connection Profile QR');
      expect(response.body.data.actionType).toBe('generated');
    });

    it('should reject QR code creation if authorization token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/qrcodes')
        .send({
          title: 'Connection Profile QR',
          content: 'http://atlas-slam.io/connect',
          actionType: 'generated',
        });

      expect(response.status).toBe(401);
    });

    it('should reject if payload is missing title or content', async () => {
      const response = await request(app)
        .post('/api/v1/qrcodes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Connection Profile QR',
          actionType: 'generated',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Title, content, and actionType are required');
    });
  });

  describe('GET /api/v1/qrcodes', () => {
    it('should return a list of QR codes logged by the current user', async () => {
      const mockQRCodes = [
        {
          _id: 'mock_qr_1',
          userId: 'mock_user_id',
          title: 'Setup Guide QR',
          content: 'http://atlas-slam.io/guide',
          actionType: 'scanned',
        },
        {
          _id: 'mock_qr_2',
          userId: 'mock_user_id',
          title: 'Connection Profile QR',
          content: 'http://atlas-slam.io/connect',
          actionType: 'generated',
        }
      ];

      (QRCode.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockQRCodes),
      } as any);

      const response = await request(app)
        .get('/api/v1/qrcodes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data[0].title).toBe('Setup Guide QR');
    });
  });
});
