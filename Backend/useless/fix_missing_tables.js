import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'KheloMore',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function fixMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing missing tables and columns...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'fix_missing_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Missing tables and columns fixed successfully!');
    console.log('📋 What was fixed:');
    console.log('  ✅ maintenance_blocks table created');
    console.log('  ✅ join_requests table updated with missing columns');
    console.log('  ✅ All necessary indexes added');
    console.log('🎉 Database is now complete!');
    
  } catch (error) {
    console.error('❌ Error fixing tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
fixMissingTables()
  .then(() => {
    console.log('🎯 Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });