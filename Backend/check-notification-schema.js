import pool from './db.js';

const checkNotificationSchema = async () => {
  try {
    console.log('🔍 Checking current database schema...\n');
    
    // Check users table structure
    const usersSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('Users table columns:');
    usersSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });

    // Check notifications table structure
    const notificationsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    console.log('\nNotifications table columns:');
    notificationsSchema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });

    // Check notification type constraints
    const constraints = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%notification%'
    `);
    console.log('\nNotification constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`  ${constraint.constraint_name}: ${constraint.check_clause}`);
    });

    // Check if notification_preferences column exists
    const hasNotificationPrefs = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notification_preferences'
      ) as has_column
    `);
    
    console.log(`\nnotification_preferences column exists: ${hasNotificationPrefs.rows[0].has_column}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
};

checkNotificationSchema();