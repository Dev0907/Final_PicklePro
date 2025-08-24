import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'KheloMore',
  password: 'root',
  port: 5432,
});

async function addCourtColumns() {
  try {
    console.log('🔧 Adding missing court columns...');
    
    // Add operating hours columns
    await pool.query(`
      ALTER TABLE courts 
      ADD COLUMN IF NOT EXISTS operating_hours_start TIME DEFAULT '06:00',
      ADD COLUMN IF NOT EXISTS operating_hours_end TIME DEFAULT '22:00'
    `);
    
    console.log('✅ Added operating hours columns');
    
    // Verify all columns exist
    const schemaQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'courts' 
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(schemaQuery);
    console.log('\n📋 Updated courts table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addCourtColumns();