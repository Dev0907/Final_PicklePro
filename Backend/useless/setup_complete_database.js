import pool from '../db.js';
import fs from 'fs';

async function setupCompleteDatabase() {
  try {
    console.log('🚀 Setting up complete database schema...');
    console.log('This will create all missing tables and columns.');
    
    const sql = fs.readFileSync('./setup_complete_database.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('📋 What was created/updated:');
    console.log('  ✅ Added status column to matches table');
    console.log('  ✅ Added updated_at column to matches table');
    console.log('  ✅ Added description column to matches table');
    console.log('  ✅ Created tournament_registrations table');
    console.log('  ✅ Created facilities table');
    console.log('  ✅ Created courts table');
    console.log('  ✅ Created bookings table');
    console.log('  ✅ Created maintenance_blocks table');
    console.log('  ✅ Created all necessary indexes');
    console.log('  ✅ Updated existing data');
    console.log('');
    console.log('🎉 Your application should now work without database errors!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('  1. Make sure PostgreSQL is running');
    console.log('  2. Check your database connection in .env file');
    console.log('  3. Ensure the database "KheloMore" exists');
    console.log('  4. Verify your database credentials');
    
    process.exit(1);
  }
}

setupCompleteDatabase();