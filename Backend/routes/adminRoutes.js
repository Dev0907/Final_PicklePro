import express from 'express';
import { adminLogin, verifyAdminToken, isSuperAdmin } from '../controllers/adminAuthController.js';
import { getDashboardStats, getUserAnalytics, getMatchAnalytics } from '../controllers/adminStatsController.js';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes (require admin token)
router.use(verifyAdminToken);

// Dashboard routes
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Welcome to admin dashboard', user: req.user });
});

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Analytics routes
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/matches', getMatchAnalytics);

// Super admin only routes
router.use(isSuperAdmin);
router.get('/super-admin', (req, res) => {
  res.json({ message: 'Super admin access granted' });
});

export default router;
