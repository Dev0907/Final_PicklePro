import pool from '../db.js';
import fs from 'fs';

async function setupTournamentRegistrations() {
  try {
    console.log('Setting up tournament registrations table...');
    
    const sql = fs.readFileSync('./create_tournament_registrations_table.sql', 'utf8');
    await pool.query(sql);
    
    console.log('Tournament registrations table created successfully!');
    console.log('You can now use the tournament registration functionality.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up tournament registrations table:', error);
    process.exit(1);
  }
}

setupTournamentRegistrations();