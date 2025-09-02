import pool from './db.js';

async function fixCourtOperatingHours() {
  try {
    console.log('🔍 Checking courts for missing operating hours...\n');
    
    // Check courts with missing operating hours
    const checkResult = await pool.query(`
      SELECT id, name, sport_type, operating_hours_start, operating_hours_end, pricing_per_hour
      FROM courts 
      WHERE operating_hours_start IS NULL 
         OR operating_hours_end IS NULL 
         OR pricing_per_hour IS NULL
         OR pricing_per_hour = 0
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('✅ All courts have proper operating hours and pricing set up!');
      return;
    }
    
    console.log(`❌ Found ${checkResult.rows.length} courts with missing or invalid operating hours:`);
    checkResult.rows.forEach(court => {
      console.log(`   Court ID ${court.id}: ${court.name} (${court.sport_type})`);
      console.log(`     Operating Hours: ${court.operating_hours_start || 'MISSING'} - ${court.operating_hours_end || 'MISSING'}`);
      console.log(`     Pricing: ₹${court.pricing_per_hour || 'MISSING'}/hour`);
      console.log('');
    });
    
    console.log('🔧 Fixing courts with default values...\n');
    
    // First, handle empty string values by setting them to NULL
    const emptyStringUpdate = await pool.query(`
      UPDATE courts 
      SET 
        operating_hours_start = NULL,
        operating_hours_end = NULL
      WHERE 
        operating_hours_start = '' 
        OR operating_hours_end = ''
    `);
    
    if (emptyStringUpdate.rowCount > 0) {
      console.log(`✅ Converted ${emptyStringUpdate.rowCount} empty string values to NULL`);
    }
    
    // Set default operating hours for courts that are missing them
    const updateResult = await pool.query(`
      UPDATE courts 
      SET 
        operating_hours_start = COALESCE(operating_hours_start, '06:00:00'),
        operating_hours_end = COALESCE(operating_hours_end, '22:00:00'),
        pricing_per_hour = COALESCE(NULLIF(pricing_per_hour, 0), 500.00)
      WHERE 
        operating_hours_start IS NULL 
        OR operating_hours_end IS NULL 
        OR pricing_per_hour IS NULL 
        OR pricing_per_hour = 0
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} courts with default values`);
    
    // Verify the fix
    const verifyResult = await pool.query(`
      SELECT id, name, sport_type, operating_hours_start, operating_hours_end, pricing_per_hour
      FROM courts 
      WHERE operating_hours_start IS NULL 
         OR operating_hours_end IS NULL 
         OR pricing_per_hour IS NULL
         OR pricing_per_hour = 0
    `);
    
    if (verifyResult.rows.length === 0) {
      console.log('\n✅ All courts now have proper operating hours and pricing!');
    } else {
      console.log('\n❌ Some courts still have issues:');
      verifyResult.rows.forEach(court => {
        console.log(`   Court ID ${court.id}: ${court.name} - ${court.operating_hours_start} to ${court.operating_hours_end} - ₹${court.pricing_per_hour}/hour`);
      });
    }
    
    // Show all courts for verification
    console.log('\n📋 Current court status:');
    const allCourts = await pool.query(`
      SELECT id, name, sport_type, operating_hours_start, operating_hours_end, pricing_per_hour
      FROM courts 
      ORDER BY id
    `);
    
    allCourts.rows.forEach(court => {
      const status = (court.operating_hours_start && court.operating_hours_end && court.pricing_per_hour) 
        ? '✅ Ready for slots' 
        : '❌ Needs attention';
      console.log(`   ${status} - Court ${court.id}: ${court.name} (${court.sport_type})`);
      console.log(`     Hours: ${court.operating_hours_start} - ${court.operating_hours_end}, Price: ₹${court.pricing_per_hour}/hour`);
    });
    
    // Test slot generation for first court
    if (allCourts.rows.length > 0) {
      const testCourt = allCourts.rows[0];
      console.log(`\n🧪 Testing slot generation for Court ${testCourt.id} (${testCourt.name})...`);
      
      const testDate = new Date().toISOString().split('T')[0];
      const startHour = parseInt(testCourt.operating_hours_start.split(':')[0]);
      const endHour = parseInt(testCourt.operating_hours_end.split(':')[0]);
      const slotCount = endHour - startHour;
      
      console.log(`   Operating hours: ${startHour}:00 - ${endHour}:00`);
      console.log(`   Expected slots: ${slotCount} slots per day`);
      console.log(`   Test date: ${testDate}`);
      console.log(`   Pricing: ₹${testCourt.pricing_per_hour}/hour`);
      
      if (slotCount > 0) {
        console.log('   ✅ Slots should now be visible for this court!');
      } else {
        console.log('   ❌ Operating hours issue - start hour >= end hour');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing court operating hours:', error);
  } finally {
    await pool.end();
  }
}

fixCourtOperatingHours();
