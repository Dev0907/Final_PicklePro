import pool from '../db.js';
import fs from 'fs';

async function setupMatchUpdates() {
  try {
    console.log('Setting up match update functionality...');
    
    const sql = fs.readFileSync('./add_match_status_column.sql', 'utf8');
    await pool.query(sql);
    
    console.log('Match status column and updates setup successfully!');
    console.log('You can now update and cancel matches.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up match updates:', error);
    process.exit(1);
  }
}

setupMatchUpdates();