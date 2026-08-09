import { Router } from 'express';
import {
  createShareLink,
  revokeShareLink,
  getShareStatus,
  getPublicStatement
} from '../controllers/share.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Protected user share management routes
router.post('/billing/share', authenticateJWT, createShareLink);
router.post('/billing/share/revoke', authenticateJWT, revokeShareLink);
router.get('/billing/share/status', authenticateJWT, getShareStatus);

// Public read-only route (no authentication required)
router.get('/share/:token', getPublicStatement);

export default router;
