import { Router } from 'express';
import { createQRCode, listQRCodes } from '../controllers/qrcode.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

// Retrieve all recorded QR codes for user
router.get('/', auth, listQRCodes);

// Record a new QR code (generated or scanned)
router.post('/', auth, createQRCode);

export default router;
