import pool from './db.js';

async function fixCourt19() {
  try {
    console.log('🔧 Fixing Court 19 operating hours...\n');
    
    // Fix Court 19's operating hours (change 00:00:00 to 23:00:00)
    const updateResult = await pool.query(`
      UPDATE courts 
      SET operating_hours_end = '23:00:00'
      WHERE id = 19
    `);
    
    if (updateResult.rowCount > 0) {
      console.log('✅ Court 19 operating hours fixed!');
      
      // Verify the fix
      const verifyResult = await pool.query(`
        SELECT id, name, operating_hours_start, operating_hours_end, pricing_per_hour
        FROM courts WHERE id = 19
      `);
      
      if (verifyResult.rows.length > 0) {
        const court = verifyResult.rows[0];
        const startHour = parseInt(court.operating_hours_start.split(':')[0]);
        const endHour = parseInt(court.operating_hours_end.split(':')[0]);
        const slotCount = endHour - startHour;
        
        console.log(`   Court ${court.id}: ${court.name}`);
        console.log(`   Operating Hours: ${court.operating_hours_start} - ${court.operating_hours_end}`);
        console.log(`   Expected Slots: ${slotCount} slots per day`);
        console.log(`   Pricing: ₹${court.pricing_per_hour}/hour`);
        
        if (slotCount > 0) {
          console.log('   ✅ Slots will now be visible for this court!');
        } else {
          console.log('   ❌ Still has operating hours issue');
        }
      }
    } else {
      console.log('❌ Court 19 not found or already fixed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing Court 19:', error);
  } finally {
    await pool.end();
  }
}

fixCourt19();
