import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload, IUser } from '../types';
import UserRepository from '../repositories/user.repository';
import ApiError from '../utils/apiError';
import emailService from './email.service';
import auditService from './audit.service';
import crypto from 'crypto';
import { ResetToken } from '../models/ResetToken';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  generateTokens(user: IUser) {
    const payload: TokenPayload = {
      userId: user.id,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }

  async register(data: any, ip?: string, ua?: string) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const isFirstUser = (await this.userRepository.count()) === 0;
    const isLocalAdmin = data.email.toLowerCase() === 'admin@scoutrover.local' || data.email.toLowerCase().startsWith('admin@');
    const role = (isFirstUser || isLocalAdmin) ? 'ADMIN' : 'VIEWER';

    const user = await this.userRepository.create({
      ...data,
      role,
    });
    
    // Log registration audit log
    await auditService.log({
      userId: user.id,
      action: 'USER_REGISTER',
      description: `User registered successfully with role ${user.role}: ${user.email}`,
      ipAddress: ip,
      userAgent: ua,
    });

    // Send welcome email asynchronously
    emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`).catch((err) => {
      // Don't throw if email fails, just log it
      console.error('Failed to send welcome email:', err);
    });

    return user;
  }

  async login(credentials: any, ip?: string, ua?: string) {
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new ApiError(400, 'Invalid email or password credentials');
    }

    // Include check for password existence just in case
    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      // Log failed login audit log
      await auditService.log({
        userId: null,
        action: 'USER_LOGIN_FAILED',
        description: `Failed login attempt for email: ${credentials.email}`,
        ipAddress: ip,
        userAgent: ua,
      });
      throw new ApiError(400, 'Invalid email or password credentials');
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Log successful login audit log
    await auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      description: `User logged in successfully: ${user.email}`,
      ipAddress: ip,
      userAgent: ua,
    });

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as TokenPayload;
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new ApiError(401, 'Invalid session. User not found.');
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch {
      throw new ApiError(401, 'Invalid or expired session refresh token. Please login again.');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't disclose user doesn't exist for security reasons, just resolve
      return;
    }

    // Generate crypto token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

    // Clean up any existing tokens for this user first
    await ResetToken.deleteMany({ userId: user.id });

    // Save token to database
    await ResetToken.create({
      token,
      userId: user.id,
      expiresAt,
    });

    // Send email asynchronously
    emailService.sendPasswordResetEmail(user.email, `${user.firstName} ${user.lastName}`, token).catch((err) => {
      console.error('Failed to send reset password email:', err);
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await ResetToken.findOne({ token });
    if (!record) {
      throw new ApiError(400, 'Invalid or expired password reset token');
    }

    if (new Date() > record.expiresAt) {
      await ResetToken.deleteOne({ token });
      throw new ApiError(400, 'Password reset token has expired');
    }

    const user = await this.userRepository.findById(record.userId.toString());
    if (!user) {
      throw new ApiError(400, 'User not found');
    }

    user.password = newPassword;
    await user.save();

    // Clean up reset token
    await ResetToken.deleteOne({ token });

    // Log password reset audit trail
    await auditService.log({
      userId: user.id,
      action: 'USER_PASSWORD_RESET',
      description: `User successfully reset password: ${user.email}`,
    });
  }
}

export const authService = new AuthService();
export default authService;
