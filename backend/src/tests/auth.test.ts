import request from 'supertest';
import app from '../app';
import User from '../models/User';
import ResetToken from '../models/ResetToken';

jest.mock('../models/User');
jest.mock('../models/ResetToken');

jest.mock('../services/audit.service', () => {
  return {
    __esModule: true,
    auditService: {
      log: jest.fn().mockResolvedValue(undefined),
      listLogs: jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    },
    default: {
      log: jest.fn().mockResolvedValue(undefined),
      listLogs: jest.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    },
  };
});

jest.mock('../services/email.service', () => {
  return {
    __esModule: true,
    emailService: {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    },
    default: {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    },
  };
});

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'mock_user_id_123',
        email: 'test@scoutrover.local',
        firstName: 'Test',
        lastName: 'User',
        role: 'VIEWER',
        toObject: jest.fn().mockReturnValue({
          id: 'mock_user_id_123',
          email: 'test@scoutrover.local',
          firstName: 'Test',
          lastName: 'User',
          role: 'VIEWER',
        }),
      };

      // Mock finding no user and creating the new user
      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@scoutrover.local',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@scoutrover.local');
    });

    it('should fail registration if validation checks fail (e.g. short password)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@scoutrover.local',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Request validation failed');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user and issue access tokens', async () => {
      const mockUser = {
        id: 'mock_user_id_123',
        email: 'test@scoutrover.local',
        password: 'hashed_password',
        role: 'OPERATOR',
        firstName: 'Test',
        lastName: 'Operator',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(this),
        toObject: jest.fn().mockReturnValue({
          id: 'mock_user_id_123',
          email: 'test@scoutrover.local',
          role: 'OPERATOR',
          firstName: 'Test',
          lastName: 'Operator',
        }),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@scoutrover.local',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('test@scoutrover.local');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send reset link successfully if user exists', async () => {
      const mockUser = {
        id: 'mock_user_id_123',
        email: 'test@scoutrover.local',
        firstName: 'Test',
        lastName: 'User',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      (ResetToken.deleteMany as jest.Mock).mockResolvedValue({});
      (ResetToken.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'test@scoutrover.local',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(ResetToken.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should successfully reset user password when token is valid', async () => {
      const mockRecord = {
        token: 'valid_token_123',
        userId: 'mock_user_id_123',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const mockUser = {
        id: 'mock_user_id_123',
        password: 'old_password',
        save: jest.fn().mockResolvedValue(this),
      };

      (ResetToken.findOne as jest.Mock).mockResolvedValue(mockRecord);
      (ResetToken.deleteOne as jest.Mock).mockResolvedValue({});
      (User.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid_token_123',
          password: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
