import pool from './db.js';

async function verifySlotBooking() {
  try {
    console.log('Verifying slot booking functionality...\n');

    // 1. Check courts table
    console.log('1. Checking courts...');
    const courtsRes = await pool.query('SELECT id, name, operating_hours_start, operating_hours_end, pricing_per_hour FROM courts LIMIT 5');
    console.log(`Found ${courtsRes.rows.length} courts:`);
    courtsRes.rows.forEach(court => {
      console.log(`   Court ${court.id}: ${court.name} (${court.operating_hours_start}-${court.operating_hours_end}, ₹${court.pricing_per_hour}/hr)`);
    });

    // 2. Check recent bookings
    console.log('\n2. Checking recent bookings...');
    const bookingsRes = await pool.query(`
      SELECT b.id, b.court_id, b.booking_date, b.start_time, b.end_time, b.status, b.total_amount,
             c.name as court_name, u.fullname as user_name
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      JOIN users u ON b.user_id = u.id
      WHERE b.booking_date >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY b.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${bookingsRes.rows.length} recent bookings:`);
    bookingsRes.rows.forEach(booking => {
      console.log(`   Booking ${booking.id}: ${booking.court_name} on ${booking.booking_date} ${booking.start_time}-${booking.end_time} by ${booking.user_name} (${booking.status}) - ₹${booking.total_amount}`);
    });

    // 3. Check maintenance blocks
    console.log('\n3. Checking maintenance blocks...');
    const maintenanceRes = await pool.query(`
      SELECT mb.*, c.name as court_name
      FROM maintenance_blocks mb
      JOIN courts c ON mb.court_id = c.id
      WHERE mb.block_date >= CURRENT_DATE
      ORDER BY mb.block_date, mb.start_time
      LIMIT 5
    `);
    
    console.log(`Found ${maintenanceRes.rows.length} maintenance blocks:`);
    maintenanceRes.rows.forEach(block => {
      console.log(`   ${block.court_name} on ${block.block_date} ${block.start_time}-${block.end_time}: ${block.reason}`);
    });

    // 4. Test slot generation for today
    console.log('\n4. Testing slot generation for today...');
    const today = new Date().toISOString().split('T')[0];
    const testCourtId = courtsRes.rows[0]?.id;
    
    if (testCourtId) {
      // Import the function
      const { getSlotsByCourtAndDate } = await import('./models/bookingModel.js');
      const slots = await getSlotsByCourtAndDate(testCourtId, today);
      
      console.log(`Generated ${slots.length} slots for court ${testCourtId} on ${today}:`);
      
      const availableSlots = slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked);
      const bookedSlots = slots.filter(s => s.is_booked);
      const blockedSlots = slots.filter(s => s.is_blocked);
      
      console.log(`   Available: ${availableSlots.length}`);
      console.log(`   Booked: ${bookedSlots.length}`);
      console.log(`   Blocked: ${blockedSlots.length}`);
      
      if (bookedSlots.length > 0) {
        console.log('   Booked slots:');
        bookedSlots.forEach(slot => {
          console.log(`     ${slot.start_time}-${slot.end_time} by ${slot.user_name || 'Unknown'}`);
        });
      }
    }

    console.log('\n✅ Verification completed successfully!');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await pool.end();
  }
}

verifySlotBooking();