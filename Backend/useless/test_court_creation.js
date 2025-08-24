import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'KheloMore',
  password: 'root',
  port: 5432,
});

async function testCourtCreation() {
  try {
    console.log('🧪 Testing court creation with new fields...');
    
    // Get a test facility
    const facilityResult = await pool.query('SELECT id FROM facilities LIMIT 1');
    if (facilityResult.rows.length === 0) {
      console.log('❌ No facilities found. Please create a facility first.');
      return;
    }
    
    const facilityId = facilityResult.rows[0].id;
    console.log(`✅ Using facility ID: ${facilityId}`);
    
    // Test court creation
    const testCourt = {
      facility_id: facilityId,
      name: 'Test Court A1',
      sport_type: 'Pickleball',
      surface_type: 'Synthetic',
      court_size: 'Standard',
      pricing_per_hour: 500,
      operating_hours_start: '06:00',
      operating_hours_end: '22:00'
    };
    
    const result = await pool.query(
      `INSERT INTO courts 
        (facility_id, name, sport_type, surface_type, court_size, pricing_per_hour, operating_hours_start, operating_hours_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [testCourt.facility_id, testCourt.name, testCourt.sport_type, testCourt.surface_type, testCourt.court_size, testCourt.pricing_per_hour, testCourt.operating_hours_start, testCourt.operating_hours_end]
    );
    
    console.log('✅ Court created successfully:');
    console.log(result.rows[0]);
    
    // Clean up test court
    await pool.query('DELETE FROM courts WHERE id = $1', [result.rows[0].id]);
    console.log('🧹 Test court cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testCourtCreation();