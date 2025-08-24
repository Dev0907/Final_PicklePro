import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'KheloMore',
  password: 'root',
  port: 5432,
});

async function checkCourtsSchema() {
  try {
    console.log('🔍 Checking courts table schema...');
    
    // Get table structure
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'courts' 
      ORDER BY ordinal_position;
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    console.log('\n📋 Courts table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if surface_type and court_size columns exist
    const hasColumns = schemaResult.rows.some(row => row.column_name === 'surface_type') &&
                      schemaResult.rows.some(row => row.column_name === 'court_size');
    
    if (!hasColumns) {
      console.log('\n⚠️  Missing surface_type and court_size columns. Adding them...');
      
      await pool.query(`
        ALTER TABLE courts 
        ADD COLUMN IF NOT EXISTS surface_type VARCHAR(50) DEFAULT 'Synthetic',
        ADD COLUMN IF NOT EXISTS court_size VARCHAR(50) DEFAULT 'Standard'
      `);
      
      console.log('✅ Added surface_type and court_size columns');
    } else {
      console.log('\n✅ All required columns exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCourtsSchema();