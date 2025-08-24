import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'KheloMore',
  password: 'root',
  port: 5432,
});

async function checkBookingDefaults() {
  try {
    console.log('🔍 Checking booking table defaults...');
    
    // Get column defaults
    const defaultsQuery = `
      SELECT column_name, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_default IS NOT NULL
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(defaultsQuery);
    console.log('\n📋 Columns with defaults:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.column_default}`);
    });
    
    // Test creating a booking without status
    console.log('\n🧪 Testing booking creation without explicit status...');
    
    // Get a test user and court
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    const courtResult = await pool.query('SELECT id FROM courts LIMIT 1');
    
    if (userResult.rows.length > 0 && courtResult.rows.length > 0) {
      const testBooking = await pool.query(
        `INSERT INTO bookings (court_id, user_id, booking_date, start_time, end_time, total_hours, total_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [courtResult.rows[0].id, userResult.rows[0].id, '2025-08-20', '10:00', '11:00', 1, 500]
      );
      
      console.log('   ✅ Test booking created with status:', testBooking.rows[0].status);
      
      // Clean up test booking
      await pool.query('DELETE FROM bookings WHERE id = $1', [testBooking.rows[0].id]);
      console.log('   🧹 Test booking cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBookingDefaults();