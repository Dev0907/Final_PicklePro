import { getSlotsByCourtAndDate, createBooking, isSlotAvailable } from './models/bookingModel.js';

// Test the slot system
async function testSlotSystem() {
  console.log('Testing Slot System...\n');

  try {
    // Test 1: Get slots for a court
    console.log('1. Testing slot retrieval...');
    const courtId = 1;
    const testDate = '2025-09-01';
    
    const slots = await getSlotsByCourtAndDate(courtId, testDate);
    console.log(`Found ${slots.length} slots for court ${courtId} on ${testDate}`);
    
    if (slots.length > 0) {
      console.log('Sample slot:', {
        time: `${slots[0].start_time} - ${slots[0].end_time}`,
        price: slots[0].price,
        available: slots[0].is_available,
        booked: slots[0].is_booked,
        blocked: slots[0].is_blocked
      });
    }

    // Test 2: Check slot availability
    console.log('\n2. Testing slot availability check...');
    const availableSlot = slots.find(s => s.is_available && !s.is_booked && !s.is_blocked);
    
    if (availableSlot) {
      const isAvailable = await isSlotAvailable(
        courtId, 
        testDate, 
        availableSlot.start_time, 
        availableSlot.end_time
      );
      console.log(`Slot ${availableSlot.start_time}-${availableSlot.end_time} availability:`, isAvailable);
    }

    // Test 3: Show booking status summary
    console.log('\n3. Slot Status Summary:');
    const available = slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked).length;
    const booked = slots.filter(s => s.is_booked).length;
    const blocked = slots.filter(s => s.is_blocked).length;
    const unavailable = slots.filter(s => !s.is_available && !s.is_booked && !s.is_blocked).length;

    console.log(`- Available: ${available}`);
    console.log(`- Booked: ${booked}`);
    console.log(`- Maintenance: ${blocked}`);
    console.log(`- Unavailable: ${unavailable}`);
    console.log(`- Total: ${slots.length}`);

    // Test 4: Show booked slots with player details
    console.log('\n4. Booked Slots with Player Details:');
    const bookedSlots = slots.filter(s => s.is_booked);
    bookedSlots.forEach(slot => {
      console.log(`- ${slot.start_time}-${slot.end_time}: ${slot.user_name} (${slot.user_phone}) - Status: ${slot.booking_status}`);
    });

    // Test 5: Show maintenance blocks
    console.log('\n5. Maintenance Blocks:');
    const maintenanceSlots = slots.filter(s => s.is_blocked);
    maintenanceSlots.forEach(slot => {
      console.log(`- ${slot.start_time}-${slot.end_time}: ${slot.maintenance_reason}`);
    });

    console.log('\n✅ Slot system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSlotSystem();