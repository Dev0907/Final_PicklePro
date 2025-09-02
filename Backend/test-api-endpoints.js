import fetch from 'node-fetch';

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:5000';
  
  console.log('Testing API endpoints...\n');

  // Test 1: Get slots for a court
  console.log('1. Testing GET /api/bookings/slots/:court_id');
  try {
    const response = await fetch(`${baseURL}/api/bookings/slots/1?date=2025-01-01`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Slots endpoint working');
      console.log(`   Found ${data.slots?.length || 0} slots`);
      if (data.slots && data.slots.length > 0) {
        console.log(`   First slot: ${data.slots[0].start_time}-${data.slots[0].end_time} (Available: ${data.slots[0].is_available})`);
      }
    } else {
      console.log('❌ Slots endpoint failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('');

  // Test 2: Test booking creation (this will fail without auth, but we can see the error)
  console.log('2. Testing POST /api/bookings/create (without auth)');
  try {
    const response = await fetch(`${baseURL}/api/bookings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        court_id: 1,
        booking_date: '2025-01-01',
        start_time: '07:00',
        end_time: '08:00',
        notes: 'Test booking'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Booking endpoint working (correctly requires authentication)');
      console.log(`   Error: ${data.error}`);
    } else {
      console.log('❌ Unexpected response:', response.status, data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('');

  // Test 3: Test debug endpoint
  console.log('3. Testing GET /api/bookings/debug/test');
  try {
    const response = await fetch(`${baseURL}/api/bookings/debug/test`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Debug endpoint working');
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('❌ Debug endpoint failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n✅ API endpoint tests completed!');
}

testAPIEndpoints();