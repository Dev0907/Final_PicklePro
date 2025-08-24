import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'KheloMore',
  password: 'root',
  port: 5432,
});

async function checkBookingsSchema() {
  try {
    console.log('🔍 Checking bookings table schema...');
    
    // Get table structure
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position;
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    console.log('\n📋 Bookings table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Get constraints
    const constraintsQuery = `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'bookings'::regclass 
      AND contype = 'c';
    `;
    
    const constraintsResult = await pool.query(constraintsQuery);
    console.log('\n🔒 Check constraints:');
    constraintsResult.rows.forEach(row => {
      console.log(`  - ${row.conname}: ${row.definition}`);
    });
    
    // Check current data
    const dataQuery = 'SELECT * FROM bookings LIMIT 5';
    const dataResult = await pool.query(dataQuery);
    console.log('\n📊 Sample data:');
    console.log(dataResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBookingsSchema();