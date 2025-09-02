import pool from './db.js';

async function setupMaintenanceBlocks() {
  try {
    console.log('Setting up maintenance_blocks table...');
    
    // Create maintenance_blocks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_blocks (
        id SERIAL PRIMARY KEY,
        court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
        block_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        reason VARCHAR(255),
        created_by VARCHAR(100) DEFAULT 'owner',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_court_id ON maintenance_blocks(court_id);
      CREATE INDEX IF NOT EXISTS idx_maintenance_blocks_date ON maintenance_blocks(block_date);
    `);
    
    console.log('✅ maintenance_blocks table setup completed successfully!');
    
    // Check if table exists and show structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'maintenance_blocks' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up maintenance_blocks table:', error);
  } finally {
    await pool.end();
  }
}

setupMaintenanceBlocks();
