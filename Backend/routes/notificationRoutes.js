import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  deleteReadNotificationsForUser,
  createNotificationForUser,
  createBulkNotificationsForUsers,
  getNotificationStatistics,
  cleanupNotifications
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// User notification routes (require authentication)
router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.delete('/:id', authenticateToken, deleteNotificationById);
router.delete('/read/cleanup', authenticateToken, deleteReadNotificationsForUser);

// Admin notification routes (require admin authentication)
router.post('/create', authenticateAdmin, createNotificationForUser);
router.post('/bulk-create', authenticateAdmin, createBulkNotificationsForUsers);
router.get('/admin/stats', authenticateAdmin, getNotificationStatistics);
router.delete('/admin/cleanup', authenticateAdmin, cleanupNotifications);

export default router;