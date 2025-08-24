import pool from './db.js';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
  try {
    console.log('Running message status table migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'migrations', 'create_message_status_table.sql'),
      'utf8'
    );
    
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Test the new table
    const testResult = await pool.query('SELECT COUNT(*) FROM message_status');
    console.log('✅ Message status table is working:', testResult.rows[0].count, 'records');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
};

runMigration();