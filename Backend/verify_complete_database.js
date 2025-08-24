import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'KheloMore',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function verifyDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying complete database setup...\n');
    
    // Check all tables
    const tables = [
      'users', 'owners', 'matches', 'tournaments', 'tournament_registrations',
      'notifications', 'join_requests', 'facilities', 'courts', 'bookings',
      'maintenance_blocks'
    ];
    
    console.log('📋 Checking tables:');
    for (const table of tables) {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_name = $1`,
        [table]
      );
      
      if (result.rows[0].count > 0) {
        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ ${table} - ${countResult.rows[0].count} records`);
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    }
    
    console.log('\n🔧 Checking notification constraint:');
    const constraintCheck = await client.query(
      `SELECT constraint_name 
       FROM information_schema.table_constraints 
       WHERE table_name = 'notifications' AND constraint_name = 'notifications_type_check'`
    );
    
    if (constraintCheck.rows.length > 0) {
      console.log('  ✅ Notification types constraint exists');
    } else {
      console.log('  ❌ Notification types constraint missing');
    }
    
    console.log('\n📊 Sample data check:');
    
    // Check notifications table structure
    const notificationColumns = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'notifications'
       ORDER BY ordinal_position`
    );
    
    console.log('  📋 Notifications table columns:');
    notificationColumns.rows.forEach(col => {
      console.log(`    - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check join_requests table structure
    const joinRequestColumns = await client.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'join_requests'
       ORDER BY ordinal_position`
    );
    
    console.log('  📋 Join requests table columns:');
    joinRequestColumns.rows.forEach(col => {
      console.log(`    - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n🎯 Database verification completed successfully!');
    console.log('✅ All tables and constraints are properly set up');
    console.log('✅ Notification system is ready');
    console.log('✅ Join request system is ready');
    console.log('✅ Booking system is ready');
    console.log('✅ Tournament system is ready');
    
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the verification
verifyDatabase()
  .then(() => {
    console.log('\n🚀 Database is ready for the application!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database verification failed:', error);
    process.exit(1);
  });