import pool from './db.js';
import fs from 'fs';
import path from 'path';

const runParticipantMigration = async () => {
  try {
    console.log('Running participant count migration...');
    
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'migrations', 'add_current_participants_column.sql'),
      'utf8'
    );
    
    await pool.query(migrationSQL);
    console.log('✅ Participant count migration completed successfully!');
    
    // Test the new column
    const testResult = await pool.query('SELECT id, current_participants, players_required FROM matches LIMIT 3');
    console.log('✅ Sample matches with participant counts:');
    testResult.rows.forEach(row => {
      console.log(`  Match ${row.id}: ${row.current_participants}/${row.players_required} players`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
};

runParticipantMigration();