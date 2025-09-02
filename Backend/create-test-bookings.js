import { createBooking } from './models/bookingModel.js';
import pool from './db.js';

async function createTestBookings() {
  try {
    console.log('Creating test bookings to demonstrate slot highlighting...\n');

    const testDate = new Date().toISOString().split('T')[0]; // Today
    const courtId = 1; // Court A1
    const testUserId = 2; // Different user to show "booked by others"

    const testBookings = [
      {
        court_id: courtId,
        user_id: testUserId,
        booking_date: testDate,
        start_time: '10:00',
        end_time: '11:00',
        total_hours: 1,
        total_amount: 500,
        notes: 'Test booking - should show as red',
        status: 'booked'
      },
      {
        court_id: courtId,
        user_id: testUserId,
        booking_date: testDate,
        start_time: '14:00',
        end_time: '15:00',
        total_hours: 1,
        total_amount: 500,
        notes: 'Test booking - should show as red',
        status: 'booked'
      },
      {
        court_id: courtId,
        user_id: testUserId,
        booking_date: testDate,
        start_time: '18:00',
        end_time: '19:00',
        total_hours: 1,
        total_amount: 500,
        notes: 'Test booking - should show as red',
        status: 'booked'
      }
    ];

    console.log(`Creating ${testBookings.length} test bookings for court ${courtId} on ${testDate}:`);

    for (const bookingData of testBookings) {
      try {
        const booking = await createBooking(bookingData);
        console.log(`✅ Created booking: ${booking.start_time}-${booking.end_time} (ID: ${booking.id})`);
      } catch (error) {
        if (error.code === '23505') {
          console.log(`⚠️  Booking already exists: ${bookingData.start_time}-${bookingData.end_time}`);
        } else {
          console.log(`❌ Failed to create booking ${bookingData.start_time}-${bookingData.end_time}:`, error.message);
        }
      }
    }

    console.log('\n✅ Test bookings creation completed!');
    console.log(`\nNow check the frontend with Court ID: ${courtId} and Date: ${testDate}`);
    console.log('You should see:');
    console.log('- 10:00-11:00 slot highlighted in RED (booked by others)');
    console.log('- 14:00-15:00 slot highlighted in RED (booked by others)');
    console.log('- 18:00-19:00 slot highlighted in RED (booked by others)');
    console.log('- Other slots should be GREEN (available)');

  } catch (error) {
    console.error('❌ Error creating test bookings:', error);
  } finally {
    await pool.end();
  }
}

createTestBookings();