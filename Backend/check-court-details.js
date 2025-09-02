import pool from './db.js';

async function checkCourtDetails() {
  try {
    console.log('🔍 Checking detailed court information...\n');
    
    // Get all courts with their details
    const courtsResult = await pool.query(`
      SELECT 
        id, 
        name, 
        sport_type, 
        operating_hours_start, 
        operating_hours_end, 
        pricing_per_hour,
        is_active,
        facility_id
      FROM courts 
      ORDER BY id
    `);
    
    if (courtsResult.rows.length === 0) {
      console.log('❌ No courts found in the database!');
      return;
    }
    
    console.log(`📋 Found ${courtsResult.rows.length} courts:\n`);
    
    courtsResult.rows.forEach(court => {
      const startHour = court.operating_hours_start ? parseInt(court.operating_hours_start.split(':')[0]) : null;
      const endHour = court.operating_hours_end ? parseInt(court.operating_hours_end.split(':')[0]) : null;
      const slotCount = (startHour && endHour) ? endHour - startHour : 0;
      
      console.log(`🏟️ Court ${court.id}: ${court.name}`);
      console.log(`   Sport: ${court.sport_type}`);
      console.log(`   Facility ID: ${court.facility_id}`);
      console.log(`   Operating Hours: ${court.operating_hours_start} - ${court.operating_hours_end}`);
      console.log(`   Pricing: ₹${court.pricing_per_hour}/hour`);
      console.log(`   Active: ${court.is_active ? 'Yes' : 'No'}`);
      console.log(`   Expected Slots: ${slotCount} slots per day`);
      
      if (slotCount <= 0) {
        console.log(`   ❌ ISSUE: Invalid operating hours - no slots will be generated!`);
      } else if (slotCount < 8) {
        console.log(`   ⚠️ WARNING: Very few slots (${slotCount}) - consider extending hours`);
      } else {
        console.log(`   ✅ Good: ${slotCount} slots will be generated per day`);
      }
      console.log('');
    });
    
    // Check if there are any facilities
    const facilitiesResult = await pool.query(`
      SELECT id, name, owner_id FROM facilities
    `);
    
    console.log(`🏢 Found ${facilitiesResult.rows.length} facilities:\n`);
    facilitiesResult.rows.forEach(facility => {
      console.log(`   Facility ${facility.id}: ${facility.name} (Owner: ${facility.owner_id})`);
    });
    
    // Test slot generation for a specific court
    if (courtsResult.rows.length > 0) {
      const testCourt = courtsResult.rows[0];
      console.log(`\n🧪 Testing slot generation for Court ${testCourt.id}...`);
      
      const testDate = new Date().toISOString().split('T')[0];
      const startHour = parseInt(testCourt.operating_hours_start.split(':')[0]);
      const endHour = parseInt(testCourt.operating_hours_end.split(':')[0]);
      
      console.log(`   Test date: ${testDate}`);
      console.log(`   Operating hours: ${startHour}:00 - ${endHour}:00`);
      
      // Generate sample slots
      const slots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        slots.push(`${startTime}-${endTime}`);
      }
      
      console.log(`   Generated slots: ${slots.join(', ')}`);
      console.log(`   Total slots: ${slots.length}`);
      
      if (slots.length > 0) {
        console.log(`   ✅ Slots should be visible for this court!`);
      } else {
        console.log(`   ❌ No slots generated - check operating hours!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking court details:', error);
  } finally {
    await pool.end();
  }
}

checkCourtDetails();
