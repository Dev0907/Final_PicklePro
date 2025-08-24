import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationsByType,
  getRecentNotifications,
  createBulkNotifications,
  cleanupOldNotifications,
  getNotificationStats
} from '../models/notificationModel.js';

// Get user notifications
export async function getNotifications(req, res) {
  try {
    const user_id = req.user.id;
    const { limit = 50, type, recent } = req.query;

    let notifications;
    
    if (type) {
      notifications = await getNotificationsByType(user_id, type, parseInt(limit));
    } else if (recent) {
      notifications = await getRecentNotifications(user_id, parseInt(recent));
    } else {
      notifications = await getUserNotifications(user_id, parseInt(limit));
    }

    const unreadCount = await getUnreadNotificationCount(user_id);

    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// Get unread notification count
export async function getUnreadCount(req, res) {
  try {
    const user_id = req.user.id;
    const count = await getUnreadNotificationCount(user_id);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
}

// Mark notification as read
export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await markNotificationAsRead(id, user_id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

// Mark all notifications as read
export async function markAllAsRead(req, res) {
  try {
    const user_id = req.user.id;
    const result = await markAllNotificationsAsRead(user_id);
    res.json({ message: 'All notifications marked as read', updatedCount: result.updated_count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
}

// Delete notification
export async function deleteNotificationById(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const notification = await deleteNotification(id, user_id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

// Delete all read notifications
export async function deleteReadNotificationsForUser(req, res) {
  try {
    const user_id = req.user.id;
    const result = await deleteReadNotifications(user_id);
    res.json({ message: 'Read notifications deleted', deletedCount: result.deleted_count });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ error: 'Failed to delete read notifications' });
  }
}

// Create notification (admin only)
export async function createNotificationForUser(req, res) {
  try {
    const { user_id, type, title, message, related_id, related_type } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({ error: 'User ID, title, and message are required' });
    }

    const notification = await createNotification({
      user_id,
      type: type || 'info',
      title,
      message,
      related_id,
      related_type
    });

    res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
}

// Create bulk notifications (admin only)
export async function createBulkNotificationsForUsers(req, res) {
  try {
    const { notifications } = req.body;

    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ error: 'Notifications array is required' });
    }

    // Validate each notification
    for (const notification of notifications) {
      if (!notification.user_id || !notification.title || !notification.message) {
        return res.status(400).json({ error: 'Each notification must have user_id, title, and message' });
      }
    }

    const createdNotifications = await createBulkNotifications(notifications);

    res.status(201).json({ 
      message: 'Bulk notifications created successfully', 
      count: createdNotifications.length,
      notifications: createdNotifications 
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({ error: 'Failed to create bulk notifications' });
  }
}

// Get notification statistics (admin only)
export async function getNotificationStatistics(req, res) {
  try {
    const stats = await getNotificationStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
}

// Cleanup old notifications (admin only)
export async function cleanupNotifications(req, res) {
  try {
    const { days = 30 } = req.query;
    const result = await cleanupOldNotifications(parseInt(days));
    res.json({ 
      message: `Cleaned up notifications older than ${days} days`, 
      deletedCount: result.deleted_count 
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ error: 'Failed to cleanup notifications' });
  }
}