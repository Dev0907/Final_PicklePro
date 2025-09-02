import pool from './db.js';

async function ensureCourtSetup() {
  try {
    console.log('🏟️ Ensuring all courts are properly set up for slot visibility...\n');
    
    // Get all courts
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
      console.log('💡 To create courts, use the court creation endpoint with proper operating hours.');
      return;
    }
    
    console.log(`📋 Found ${courtsResult.rows.length} courts:\n`);
    
    let validCourts = 0;
    let invalidCourts = 0;
    
    courtsResult.rows.forEach(court => {
      const startHour = court.operating_hours_start ? parseInt(court.operating_hours_start.split(':')[0]) : null;
      const endHour = court.operating_hours_end ? parseInt(court.operating_hours_end.split(':')[0]) : null;
      const slotCount = (startHour && endHour && startHour < endHour) ? endHour - startHour : 0;
      
      const isValid = slotCount > 0 && court.pricing_per_hour > 0 && court.is_active;
      
      if (isValid) {
        validCourts++;
        console.log(`✅ Court ${court.id}: ${court.name} (${court.sport_type})`);
        console.log(`   Hours: ${court.operating_hours_start} - ${court.operating_hours_end} (${slotCount} slots/day)`);
        console.log(`   Price: ₹${court.pricing_per_hour}/hour, Active: Yes`);
      } else {
        invalidCourts++;
        console.log(`❌ Court ${court.id}: ${court.name} (${court.sport_type})`);
        console.log(`   Hours: ${court.operating_hours_start} - ${court.operating_hours_end} (${slotCount} slots/day)`);
        console.log(`   Price: ₹${court.pricing_per_hour}/hour, Active: ${court.is_active ? 'Yes' : 'No'}`);
        
        if (slotCount <= 0) {
          console.log(`   🚨 ISSUE: Invalid operating hours - no slots generated!`);
        }
        if (court.pricing_per_hour <= 0) {
          console.log(`   🚨 ISSUE: Invalid pricing!`);
        }
        if (!court.is_active) {
          console.log(`   🚨 ISSUE: Court is inactive!`);
        }
      }
      console.log('');
    });
    
    console.log(`📊 Summary: ${validCourts} valid courts, ${invalidCourts} invalid courts\n`);
    
    if (invalidCourts > 0) {
      console.log('🔧 Fixing invalid courts...\n');
      
      // Fix courts with invalid operating hours
      const fixOperatingHours = await pool.query(`
        UPDATE courts 
        SET 
          operating_hours_start = '06:00:00',
          operating_hours_end = '22:00:00'
        WHERE 
          operating_hours_start IS NULL 
          OR operating_hours_end IS NULL 
          OR operating_hours_start >= operating_hours_end
      `);
      
      if (fixOperatingHours.rowCount > 0) {
        console.log(`✅ Fixed ${fixOperatingHours.rowCount} courts with invalid operating hours`);
      }
      
      // Fix courts with invalid pricing
      const fixPricing = await pool.query(`
        UPDATE courts 
        SET pricing_per_hour = 500.00
        WHERE pricing_per_hour IS NULL OR pricing_per_hour <= 0
      `);
      
      if (fixPricing.rowCount > 0) {
        console.log(`✅ Fixed ${fixPricing.rowCount} courts with invalid pricing`);
      }
      
      // Activate inactive courts
      const fixActive = await pool.query(`
        UPDATE courts 
        SET is_active = true
        WHERE is_active = false
      `);
      
      if (fixActive.rowCount > 0) {
        console.log(`✅ Activated ${fixActive.rowCount} inactive courts`);
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...\n');
    const finalCheck = await pool.query(`
      SELECT 
        id, 
        name, 
        sport_type, 
        operating_hours_start, 
        operating_hours_end, 
        pricing_per_hour,
        is_active
      FROM courts 
      ORDER BY id
    `);
    
    let allValid = true;
    finalCheck.rows.forEach(court => {
      const startHour = parseInt(court.operating_hours_start.split(':')[0]);
      const endHour = parseInt(court.operating_hours_end.split(':')[0]);
      const slotCount = endHour - startHour;
      
      if (slotCount > 0 && court.pricing_per_hour > 0 && court.is_active) {
        console.log(`✅ Court ${court.id}: ${court.name} - ${slotCount} slots/day - ₹${court.pricing_per_hour}/hour`);
      } else {
        allValid = false;
        console.log(`❌ Court ${court.id}: ${court.name} still has issues`);
      }
    });
    
    if (allValid) {
      console.log('\n🎉 All courts are now properly configured for slot visibility!');
      console.log('💡 Players should now be able to see and book slots for all courts.');
    } else {
      console.log('\n⚠️ Some courts still have issues. Please check manually.');
    }
    
    // Show slot generation example
    if (finalCheck.rows.length > 0) {
      const exampleCourt = finalCheck.rows[0];
      const startHour = parseInt(exampleCourt.operating_hours_start.split(':')[0]);
      const endHour = parseInt(exampleCourt.operating_hours_end.split(':')[0]);
      
      console.log(`\n🧪 Example slot generation for ${exampleCourt.name}:`);
      console.log(`   Operating hours: ${startHour}:00 - ${endHour}:00`);
      console.log(`   Slots per day: ${endHour - startHour}`);
      console.log(`   Sample slots: ${startHour}:00-${startHour + 1}:00, ${startHour + 1}:00-${startHour + 2}:00, ...`);
      console.log(`   Pricing: ₹${exampleCourt.pricing_per_hour}/hour`);
    }
    
  } catch (error) {
    console.error('❌ Error ensuring court setup:', error);
  } finally {
    await pool.end();
  }
}

ensureCourtSetup();
