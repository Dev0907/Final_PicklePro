import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'KheloMore',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function setupNotificationSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up comprehensive notification system...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'update_notification_system.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Notification system setup completed successfully!');
    console.log('📋 What was updated:');
    console.log('  ✅ notifications table with comprehensive type checking');
    console.log('  ✅ join_requests table for match join functionality');
    console.log('  ✅ All necessary indexes for performance');
    console.log('  ✅ Related type tracking for notifications');
    console.log('🎉 You can now use the full notification system!');
    
  } catch (error) {
    console.error('❌ Error setting up notification system:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the setup
setupNotificationSystem()
  .then(() => {
    console.log('🎯 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

export { setupNotificationSystem };