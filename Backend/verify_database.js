import pool from './db.js';

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database schema...');
    console.log('');

    // Check if all required tables exist
    const tables = [
      'users',
      'owners', 
      'matches',
      'matchparticipants',
      'tournaments',
      'tournament_registrations',
      'facilities',
      'courts',
      'bookings',
      'maintenance_blocks'
    ];

    console.log('📋 Checking tables:');
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ✅ ${table} - ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`  ❌ ${table} - MISSING or ERROR`);
      }
    }

    console.log('');
    console.log('📋 Checking matches table columns:');
    
    const matchesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matches'
      ORDER BY ordinal_position
    `);

    matchesColumns.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name} (${col.data_type})`);
    });

    console.log('');
    console.log('📋 Checking tournament_registrations table:');
    
    try {
      const regCount = await pool.query('SELECT COUNT(*) FROM tournament_registrations');
      console.log(`  ✅ tournament_registrations - ${regCount.rows[0].count} records`);
      
      const regColumns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'tournament_registrations'
        ORDER BY ordinal_position
      `);
      
      regColumns.rows.forEach(col => {
        console.log(`    - ${col.column_name} (${col.data_type})`);
      });
    } catch (error) {
      console.log('  ❌ tournament_registrations table missing');
    }

    console.log('');
    console.log('🎉 Database verification completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying database:', error);
    process.exit(1);
  }
}

verifyDatabase();