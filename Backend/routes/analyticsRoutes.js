import express from 'express';
import {
  getOwnerAnalytics,
  getOwnerStats
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Owner analytics routes
router.get('/owner', getOwnerAnalytics);
router.get('/owner/stats', getOwnerStats);

export default router;