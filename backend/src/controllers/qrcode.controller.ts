import { Response, NextFunction } from 'express';
import QRCodeModel from '../models/QRCode';
import { RequestWithUser } from '../types';
import logger from '../utils/logger';

// @desc    Create a new saved/scanned QR code entry
// @route   POST /api/v1/qrcodes
// @access  Private
export const createQRCode = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, actionType } = req.body;

    if (!title || !content || !actionType) {
      res.status(400).json({ success: false, message: 'Title, content, and actionType are required' });
      return;
    }

    if (!['generated', 'scanned'].includes(actionType)) {
      res.status(400).json({ success: false, message: 'actionType must be generated or scanned' });
      return;
    }

    const qrCode = await QRCodeModel.create({
      userId: req.user!.userId,
      title,
      content,
      actionType,
    });

    logger.info(`[QR] User ${req.user!.userId} recorded a QR code: ${title} (${actionType})`);

    res.status(201).json({
      success: true,
      data: qrCode,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Retrieve all recorded QR codes for the current user
// @route   GET /api/v1/qrcodes
// @access  Private
export const listQRCodes = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const qrCodes = await QRCodeModel.find({ userId: req.user!.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: qrCodes.length,
      data: qrCodes,
    });
  } catch (err) {
    next(err);
  }
};
