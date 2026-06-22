import request from 'supertest';
import app from '../app';
import Map from '../models/Map';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

jest.mock('../models/Map');

jest.mock('../services/audit.service', () => {
  const mockAudit = {
    log: jest.fn().mockResolvedValue(undefined),
  };
  return {
    __esModule: true,
    auditService: mockAudit,
    default: mockAudit,
  };
});

describe('Jetson Export API Endpoints', () => {
  let token: string;
  const testExportsDir = path.join(__dirname, 'test_exports');

  beforeAll(() => {
    // Generate valid JWT
    token = jwt.sign(
      { userId: 'mock_admin_id', role: 'ADMIN' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(() => {
    // Cleanup generated files
    if (fs.existsSync(testExportsDir)) {
      fs.rmSync(testExportsDir, { recursive: true, force: true });
    }
  });

  describe('POST /api/v1/jetson/export', () => {
    it('should successfully export map files to the specified directory', async () => {
      const mockMap = {
        _id: 'mock_map_id_123',
        name: 'SLAM Corridor Test',
        width: 3,
        height: 3,
        resolution: 0.05,
        originX: -1.0,
        originY: -1.0,
        gridData: JSON.stringify([-1, 0, 100, 0, 0, 0, 100, 100, -1]),
        createdBy: 'mock_admin_id',
      };

      (Map.findById as jest.Mock).mockResolvedValue(mockMap);

      const response = await request(app)
        .post('/api/v1/jetson/export')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mapId: 'mock_map_id_123',
          exportPath: testExportsDir,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.yamlFile).toBe('slam_corridor_test.yaml');
      expect(response.body.data.pgmFile).toBe('slam_corridor_test.pgm');

      // Verify files actually exist on disk
      const yamlPath = path.join(testExportsDir, 'slam_corridor_test.yaml');
      const pgmPath = path.join(testExportsDir, 'slam_corridor_test.pgm');
      
      expect(fs.existsSync(yamlPath)).toBe(true);
      expect(fs.existsSync(pgmPath)).toBe(true);

      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      expect(yamlContent).toContain('resolution: 0.05');
      expect(yamlContent).toContain('origin: [-1, -1, 0.0]');

      const pgmContent = fs.readFileSync(pgmPath, 'utf8');
      expect(pgmContent).toContain('P2');
      expect(pgmContent).toContain('3 3');
      expect(pgmContent).toContain('255');
    });

    it('should reject requests with missing mapId', async () => {
      const response = await request(app)
        .post('/api/v1/jetson/export')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Map ID is required');
    });

    it('should fail if the map is not found in database', async () => {
      (Map.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/jetson/export')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mapId: 'non_existent_map_id_000',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Map not found');
    });
  });
});
