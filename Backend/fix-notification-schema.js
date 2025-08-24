import pool from './db.js';

const fixNotificationSchema = async () => {
  try {
    console.log('🔧 Fixing notification schema...\n');
    
    // 1. Add notification_preferences column to users table
    console.log('1. Adding notification_preferences column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
        "match_created": true,
        "tournament_created": true,
        "system_announcements": true,
        "match_updates": true,
        "tournament_updates": true,
        "join_requests": true,
        "email_notifications": true,
        "push_notifications": true
      }'::jsonb
    `);
    console.log('✅ notification_preferences column added');
    
    // 2. Update existing users with default notification preferences
    console.log('2. Updating existing users with default preferences...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET notification_preferences = '{
        "match_created": true,
        "tournament_created": true,
        "system_announcements": true,
        "match_updates": true,
        "tournament_updates": true,
        "join_requests": true,
        "email_notifications": true,
        "push_notifications": true
      }'::jsonb
      WHERE notification_preferences IS NULL
    `);
    console.log(`✅ Updated ${updateResult.rowCount} users with default preferences`);
    
    // 3. Drop the existing notification type constraint
    console.log('3. Dropping existing notification type constraint...');
    await pool.query(`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS notifications_type_check
    `);
    console.log('✅ Old constraint dropped');
    
    // 4. Add new comprehensive notification type constraint
    console.log('4. Adding new comprehensive notification type constraint...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK (type IN (
        'info', 'success', 'warning', 'error',
        'tournament_registration', 'tournament_update', 'tournament_withdrawal',
        'tournament_created', 'tournament_updated', 'tournament_cancelled', 'tournament_registration_confirmed',
        'new_tournament_available', 'new_player_joined',
        'match_created', 'match_updated', 'match_cancelled', 'new_match_available',
        'match_join_request', 'join_request_sent', 'join_request_accepted', 'join_request_declined',
        'match_partner_joined', 'system_announcement', 'maintenance', 'test_announcement',
        'booking_confirmed', 'booking_cancelled', 'booking_completed'
      ))
    `);
    console.log('✅ New constraint added with all notification types');
    
    // 5. Add additional columns for enhanced notifications
    console.log('5. Adding additional notification columns...');
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'normal',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unread'
    `);
    console.log('✅ Priority and status columns added');
    
    // 6. Update existing notifications with new status field
    console.log('6. Updating existing notifications with status field...');
    const statusUpdateResult = await pool.query(`
      UPDATE notifications 
      SET status = CASE 
        WHEN is_read = true THEN 'read' 
        ELSE 'unread' 
      END
      WHERE status IS NULL OR status = 'unread'
    `);
    console.log(`✅ Updated ${statusUpdateResult.rowCount} notifications with status`);
    
    // 7. Create indexes for better performance
    console.log('7. Creating performance indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_notification_preferences 
      ON users USING GIN (notification_preferences)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_priority 
      ON notifications(priority)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_status 
      ON notifications(status)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_status_created 
      ON notifications(user_id, status, created_at DESC)
    `);
    console.log('✅ Performance indexes created');
    
    // 8. Test the schema
    console.log('8. Testing the updated schema...');
    
    // Test notification preferences
    const prefsTest = await pool.query(`
      SELECT id, fullname, notification_preferences 
      FROM users 
      WHERE notification_preferences IS NOT NULL 
      LIMIT 3
    `);
    console.log(`✅ ${prefsTest.rows.length} users have notification preferences`);
    
    // Test notification types
    const typeTest = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
      VALUES (1, 'new_match_available', 'Test Notification', 'This is a test', 1, 'match')
      RETURNING id, type
    `);
    console.log(`✅ Test notification created with type: ${typeTest.rows[0].type}`);
    
    // Clean up test notification
    await pool.query(`DELETE FROM notifications WHERE id = $1`, [typeTest.rows[0].id]);
    
    console.log('\n🎉 NOTIFICATION SCHEMA FIXED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ notification_preferences column added to users');
    console.log('✅ All users updated with default preferences');
    console.log('✅ Notification type constraint updated with all types');
    console.log('✅ Priority and status columns added');
    console.log('✅ Performance indexes created');
    console.log('✅ Schema tested and working');
    
  } catch (error) {
    console.error('❌ Error fixing notification schema:', error.message);
  } finally {
    await pool.end();
  }
};

fixNotificationSchema();