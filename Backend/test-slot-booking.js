import { getSlotsByCourtAndDate, createBooking } from './models/bookingModel.js';
import { getCourtById } from './models/courtModel.js';
import pool from './db.js';

async function testSlotBooking() {
  try {
    console.log('Testing slot booking functionality...\n');

    // Test parameters
    const courtId = 1; // Assuming court ID 1 exists
    const testDate = '2025-01-01'; // Future date
    const testUserId = 1; // Assuming user ID 1 exists

    console.log(`Testing with Court ID: ${courtId}, Date: ${testDate}, User ID: ${testUserId}\n`);

    // 1. Check if court exists
    console.log('1. Checking if court exists...');
    const court = await getCourtById(courtId);
    if (!court) {
      console.log('❌ Court not found');
      return;
    }
    console.log('✅ Court found:', court.name);
    console.log(`   Operating hours: ${court.operating_hours_start} - ${court.operating_hours_end}`);
    console.log(`   Pricing: ₹${court.pricing_per_hour}/hour\n`);

    // 2. Get available slots
    console.log('2. Fetching available slots...');
    const slots = await getSlotsByCourtAndDate(courtId, testDate, testUserId);
    console.log(`✅ Found ${slots.length} slots`);
    
    if (slots.length > 0) {
      console.log('First few slots:');
      slots.slice(0, 5).forEach(slot => {
        console.log(`   ${slot.start_time}-${slot.end_time}: ${slot.is_available ? 'Available' : 'Unavailable'} (₹${slot.price})`);
      });
    }
    console.log('');

    // 3. Find an available slot to book
    const availableSlot = slots.find(slot => slot.is_available && !slot.is_booked && !slot.is_blocked);
    if (!availableSlot) {
      console.log('❌ No available slots found for booking test');
      return;
    }

    console.log('3. Testing slot booking...');
    console.log(`   Attempting to book slot: ${availableSlot.start_time}-${availableSlot.end_time}`);

    // 4. Create a test booking
    const bookingData = {
      court_id: courtId,
      user_id: testUserId,
      booking_date: testDate,
      start_time: availableSlot.start_time,
      end_time: availableSlot.end_time,
      total_hours: 1,
      total_amount: availableSlot.price,
      notes: 'Test booking',
      status: 'booked'
    };

    try {
      const booking = await createBooking(bookingData);
      console.log('✅ Booking created successfully:', booking.id);
      console.log(`   Amount: ₹${booking.total_amount}`);
    } catch (error) {
      console.log('❌ Booking failed:', error.message);
    }

    // 5. Verify slot is now unavailable
    console.log('\n4. Verifying slot availability after booking...');
    const updatedSlots = await getSlotsByCourtAndDate(courtId, testDate, testUserId);
    const bookedSlot = updatedSlots.find(slot => 
      slot.start_time === availableSlot.start_time && 
      slot.end_time === availableSlot.end_time
    );

    if (bookedSlot && bookedSlot.is_booked) {
      console.log('✅ Slot is now marked as booked');
      if (bookedSlot.is_own_booking) {
        console.log('✅ Slot correctly identified as user\'s own booking');
      }
    } else {
      console.log('❌ Slot booking status not updated correctly');
    }

    console.log('\n✅ Slot booking test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testSlotBooking();