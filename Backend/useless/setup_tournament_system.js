import pool from '../db.js';
import fs from 'fs';

async function setupTournamentSystem() {
  try {
    console.log('🚀 Setting up tournament registration system...');
    
    const sql = fs.readFileSync('./create_tournament_system.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✅ Tournament system setup completed successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('  ✅ tournament_registrations table');
    console.log('  ✅ notifications table');
    console.log('  ✅ status column in matches table');
    console.log('  ✅ updated_at column in matches table');
    console.log('  ✅ description column in matches table');
    console.log('  ✅ All necessary indexes');
    console.log('');
    console.log('🎉 You can now use tournament registration and match management!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up tournament system:', error);
    process.exit(1);
  }
}

setupTournamentSystem();