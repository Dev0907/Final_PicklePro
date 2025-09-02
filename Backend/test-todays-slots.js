import http from 'http';

function makeRequest(options) {
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

    req.end();
  });
}

async function testTodaysSlots() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Testing slots for today: ${today}\n`);

  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/bookings/slots/1?date=${today}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const result = await makeRequest(options);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Slots endpoint working');
      console.log(`Found ${result.data.slots?.length || 0} slots\n`);
      
      if (result.data.slots && result.data.slots.length > 0) {
        console.log('Slot Status Summary:');
        const available = result.data.slots.filter(s => s.is_available && !s.is_booked && !s.is_blocked);
        const booked = result.data.slots.filter(s => s.is_booked);
        const blocked = result.data.slots.filter(s => s.is_blocked);
        
        console.log(`- Available: ${available.length}`);
        console.log(`- Booked: ${booked.length}`);
        console.log(`- Blocked: ${blocked.length}\n`);
        
        if (booked.length > 0) {
          console.log('Booked slots (should show as RED in frontend):');
          booked.forEach(slot => {
            console.log(`  ${slot.start_time}-${slot.end_time}: Booked=${slot.is_booked}, Available=${slot.is_available}`);
          });
        }
        
        console.log('\nFirst few slots:');
        result.data.slots.slice(0, 8).forEach(slot => {
          const status = slot.is_booked ? 'BOOKED' : slot.is_blocked ? 'BLOCKED' : 'AVAILABLE';
          console.log(`  ${slot.start_time}-${slot.end_time}: ${status} (₹${slot.price})`);
        });
      }
    } else {
      console.log('❌ Error:', result.data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testTodaysSlots();