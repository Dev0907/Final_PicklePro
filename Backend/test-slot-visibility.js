import fetch from 'node-fetch';

async function testSlotVisibility() {
  try {
    console.log('🧪 Testing slot visibility...\n');
    
    // Test 1: Get slots for a court (public endpoint)
    console.log('1️⃣ Testing public slot endpoint...');
    const slotsResponse = await fetch('http://localhost:5000/api/bookings/slots/1?date=2024-01-15');
    
    if (slotsResponse.ok) {
      const slotsData = await slotsResponse.json();
      console.log('✅ Public slots endpoint working!');
      console.log(`   Found ${slotsData.slots?.length || 0} slots`);
      
      if (slotsData.slots && slotsData.slots.length > 0) {
        console.log('\n   Sample slots:');
        slotsData.slots.slice(0, 3).forEach((slot, index) => {
          console.log(`   ${index + 1}. ${slot.start_time}-${slot.end_time} - ${slot.is_available ? 'Available' : 'Not Available'} - ₹${slot.price}`);
        });
      }
    } else {
      console.log('❌ Public slots endpoint failed:', slotsResponse.status);
      const errorData = await slotsResponse.json();
      console.log('   Error:', errorData.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Test slot availability endpoint
    console.log('2️⃣ Testing slot availability endpoint...');
    const availabilityResponse = await fetch('http://localhost:5000/api/bookings/court/1/slots?date=2024-01-15');
    
    if (availabilityResponse.ok) {
      const availabilityData = await availabilityResponse.json();
      console.log('✅ Slot availability endpoint working!');
      console.log(`   Found ${availabilityData.slots?.length || 0} slots`);
      
      if (availabilityData.slots && availabilityData.slots.length > 0) {
        console.log('\n   Sample availability:');
        availabilityData.slots.slice(0, 3).forEach((slot, index) => {
          const status = slot.is_booked ? 'Booked' : slot.is_blocked ? 'Maintenance' : 'Available';
          console.log(`   ${index + 1}. ${slot.start_time}-${slot.end_time} - ${status} - ₹${slot.price}`);
        });
      }
    } else {
      console.log('❌ Slot availability endpoint failed:', availabilityResponse.status);
      const errorData = await availabilityResponse.json();
      console.log('   Error:', errorData.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Check if we have any courts in the database
    console.log('3️⃣ Testing court information...');
    const courtResponse = await fetch('http://localhost:5000/api/courts');
    
    if (courtResponse.ok) {
      const courtData = await courtResponse.json();
      console.log('✅ Courts endpoint working!');
      console.log(`   Found ${courtData.courts?.length || 0} courts`);
      
      if (courtData.courts && courtData.courts.length > 0) {
        console.log('\n   Available courts:');
        courtData.courts.forEach((court, index) => {
          console.log(`   ${index + 1}. ${court.name} (${court.sport_type}) - ₹${court.pricing_per_hour}/hour`);
          console.log(`      Operating hours: ${court.operating_hours_start} - ${court.operating_hours_end}`);
        });
      }
    } else {
      console.log('❌ Courts endpoint failed:', courtResponse.status);
      const errorData = await courtResponse.json();
      console.log('   Error:', errorData.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎯 Slot visibility test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Wait a bit for the server to start
setTimeout(testSlotVisibility, 2000);
