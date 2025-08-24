import fs from 'fs';
import path from 'path';
import pool from './db.js';

const runMigration = async () => {
  try {
    console.log('Running chat messages table migration...');
    
    const migrationPath = path.join(process.cwd(), 'migrations', 'create_chat_messages_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    console.log('Chat messages table created with indexes and triggers.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();