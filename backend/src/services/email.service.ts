import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import { env } from '../config/env';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info('📧 Nodemailer Transporter initialized.');
    } else {
      logger.warn(
        '📧 Email configuration not provided. Welcome & Password Reset emails will print to logger console only.'
      );
    }
  }

  async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"ScoutRover Support" <support@scoutrover.local>`,
          to,
          subject,
          text,
          html,
        });
        logger.info(`📧 Email sent successfully to ${to} (Subject: "${subject}")`);
        return true;
      } else {
        logger.info(
          `📧 [MOCK EMAIL SERVICE] Email dispatched:\nTo: ${to}\nSubject: ${subject}\nText: ${text}\n--------------------------------------`
        );
        return true;
      }
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to ScoutRover!';
    const text = `Hi ${name},\n\nWelcome to ScoutRover Autonomous Mapping Dashboard!\nYour user account has been successfully created.\n\nBest regards,\nThe ScoutRover Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #7c3aed;">Welcome to ScoutRover, ${name}!</h2>
        <p>We are excited to have you join our autonomous mapping system. Your user account has been successfully created.</p>
        <p>You can now log in, view live LiDAR mapping feeds, control rovers, generate custom QR connection codes, and plan route waypoints.</p>
        <div style="margin: 25px 0;">
          <a href="http://localhost:3000/login" style="background-color: #7c3aed; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Dashboard</a>
        </div>
        <p>Best regards,<br/><strong>The ScoutRover Team</strong></p>
      </div>
    `;
    return this.sendEmail(to, subject, html, text);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `http://localhost:3000/forgot-password?token=${token}`;
    const subject = 'ScoutRover Password Reset Request';
    const text = `Hi ${name},\n\nYou requested a password reset. Please click on the link below or copy and paste it into your browser to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nBest regards,\nThe ScoutRover Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #7c3aed;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You received this email because a password reset request was submitted for your ScoutRover account. Click the button below to set a new password:</p>
        <div style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #7c3aed; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}" style="color: #7c3aed;">${resetUrl}</a></p>
        <p>This reset link is valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
        <p>Best regards,<br/><strong>The ScoutRover Team</strong></p>
      </div>
    `;
    return this.sendEmail(to, subject, html, text);
  }
}

export const emailService = new EmailService();
export default emailService;
