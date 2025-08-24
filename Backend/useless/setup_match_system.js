import pool from '../db.js';

async function setupMatchSystem() {
  try {
    console.log('🚀 Setting up match system tables...');

    // Create matchparticipants table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matchparticipants (
        id SERIAL PRIMARY KEY,
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(match_id, user_id)
      );
    `);

    // Add indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matchparticipants_match_id ON matchparticipants(match_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_matchparticipants_user_id ON matchparticipants(user_id);
    `);

    // Check if matches table has all required columns
    const matchesColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' AND table_schema = 'public';
    `);

    const columnNames = matchesColumns.rows.map(row => row.column_name);
    
    // Add missing columns to matches table if needed
    if (!columnNames.includes('status')) {
      await pool.query(`
        ALTER TABLE matches ADD COLUMN status VARCHAR(20) DEFAULT 'active';
      `);
      console.log('✅ Added status column to matches table');
    }

    if (!columnNames.includes('description')) {
      await pool.query(`
        ALTER TABLE matches ADD COLUMN description TEXT;
      `);
      console.log('✅ Added description column to matches table');
    }

    if (!columnNames.includes('created_at')) {
      await pool.query(`
        ALTER TABLE matches ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Added created_at column to matches table');
    }

    if (!columnNames.includes('updated_at')) {
      await pool.query(`
        ALTER TABLE matches ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Added updated_at column to matches table');
    }

    // Add sport column if it doesn't exist (for notifications)
    if (!columnNames.includes('sport')) {
      await pool.query(`
        ALTER TABLE matches ADD COLUMN sport VARCHAR(50) DEFAULT 'Pickleball';
      `);
      console.log('✅ Added sport column to matches table');
    }

    console.log('✅ Match system setup completed successfully!');
    console.log('📋 What was created/updated:');
    console.log('  ✅ matchparticipants table');
    console.log('  ✅ Required indexes for performance');
    console.log('  ✅ Missing columns in matches table');
    console.log('🎉 Match system is now ready to use!');

  } catch (error) {
    console.error('❌ Error setting up match system:', error);
    throw error;
  }
}

// Run the setup
setupMatchSystem()
  .then(() => {
    console.log('🎯 Match system setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });