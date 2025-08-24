import pool from '../db.js';

// Create a new notification
export async function createNotification(notification) {
  const {
    user_id,
    type,
    title,
    message,
    related_id,
    related_type
  } = notification;

  const res = await pool.query(
    `INSERT INTO notifications 
      (user_id, type, title, message, related_id, related_type, created_at, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
     RETURNING *`,
    [user_id, type, title, message, related_id, related_type]
  );
  return res.rows[0];
}

// Get user notifications
export async function getUserNotifications(user_id, limit = 50) {
  const res = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [user_id, limit]
  );
  return res.rows;
}

// Get unread notification count
export async function getUnreadNotificationCount(user_id) {
  const res = await pool.query(
    `SELECT COUNT(*) as count 
     FROM notifications 
     WHERE user_id = $1 AND is_read = false`,
    [user_id]
  );
  return parseInt(res.rows[0].count);
}

// Mark notification as read
export async function markNotificationAsRead(notification_id, user_id) {
  const res = await pool.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notification_id, user_id]
  );
  return res.rows[0] || null;
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(user_id) {
  const res = await pool.query(
    `UPDATE notifications 
     SET is_read = true 
     WHERE user_id = $1 AND is_read = false
     RETURNING COUNT(*) as updated_count`,
    [user_id]
  );
  return res.rows[0];
}

// Delete notification
export async function deleteNotification(notification_id, user_id) {
  const res = await pool.query(
    `DELETE FROM notifications 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notification_id, user_id]
  );
  return res.rows[0] || null;
}

// Delete all read notifications for a user
export async function deleteReadNotifications(user_id) {
  const res = await pool.query(
    `DELETE FROM notifications 
     WHERE user_id = $1 AND is_read = true
     RETURNING COUNT(*) as deleted_count`,
    [user_id]
  );
  return res.rows[0];
}

// Get notifications by type
export async function getNotificationsByType(user_id, type, limit = 20) {
  const res = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 AND type = $2 
     ORDER BY created_at DESC 
     LIMIT $3`,
    [user_id, type, limit]
  );
  return res.rows;
}

// Get recent notifications (last 7 days)
export async function getRecentNotifications(user_id, days = 7) {
  const res = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     AND created_at >= NOW() - INTERVAL '${days} days'
     ORDER BY created_at DESC`,
    [user_id]
  );
  return res.rows;
}

// Bulk create notifications (for system-wide announcements)
export async function createBulkNotifications(notifications) {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const values = notifications.map((_, index) => {
    const baseIndex = index * 6;
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`;
  }).join(', ');

  const params = notifications.flatMap(n => [
    n.user_id, n.type, n.title, n.message, n.related_id, n.related_type
  ]);

  const res = await pool.query(
    `INSERT INTO notifications 
      (user_id, type, title, message, related_id, related_type)
     VALUES ${values}
     RETURNING *`,
    params
  );
  return res.rows;
}

// Clean up old notifications (older than specified days)
export async function cleanupOldNotifications(days = 30) {
  const res = await pool.query(
    `DELETE FROM notifications 
     WHERE created_at < NOW() - INTERVAL '${days} days'
     RETURNING COUNT(*) as deleted_count`
  );
  return res.rows[0];
}

// Get notification statistics for admin
export async function getNotificationStats() {
  const res = await pool.query(
    `SELECT 
        type,
        COUNT(*) as total_count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h_count
     FROM notifications 
     GROUP BY type
     ORDER BY total_count DESC`
  );
  return res.rows;
}