import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testAPI() {
  console.log('Testing API endpoints...\n');

  // Test 1: Get slots
  console.log('1. Testing GET /api/bookings/slots/1?date=2025-01-01');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/slots/1?date=2025-01-01',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await makeRequest(options);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Slots endpoint working');
      console.log(`Found ${result.data.slots?.length || 0} slots`);
      if (result.data.slots && result.data.slots.length > 0) {
        const firstSlot = result.data.slots[0];
        console.log(`First slot: ${firstSlot.start_time}-${firstSlot.end_time}`);
        console.log(`Available: ${firstSlot.is_available}, Booked: ${firstSlot.is_booked}`);
      }
    } else {
      console.log('❌ Error:', result.data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('');

  // Test 2: Debug endpoint
  console.log('2. Testing GET /api/bookings/debug/test');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/debug/test',
      method: 'GET'
    };

    const result = await makeRequest(options);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Debug endpoint working');
      console.log(`Message: ${result.data.message}`);
    } else {
      console.log('❌ Error:', result.data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n✅ API tests completed!');
}

testAPI();