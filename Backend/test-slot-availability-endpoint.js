// Test script to verify the slot availability endpoint
import fetch from 'node-fetch';

async function testSlotAvailabilityEndpoint() {
  console.log('Testing slot availability endpoint...');
  
  try {
    // Test data - replace with actual values from your database
    const testData = {
      court_id: 1,
      date: '2024-12-26',
      unavailable_slots: [
        {
          start_time: '10:00',
          end_time: '11:00',
          reason: 'Maintenance'
        },
        {
          start_time: '14:00',
          end_time: '15:00',
          reason: 'Owner blocked'
        }
      ]
    };

    // You'll need to get a valid token from your frontend or create one for testing
    const testToken = 'your-test-token-here';

    console.log('Sending POST request to /api/bookings/slots/availability');
    console.log('Test data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:5000/api/bookings/slots/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('Parsed JSON response:', jsonData);
      } catch (parseError) {
        console.log('Response is not JSON');
      }
    } else {
      console.log('Request failed with status:', response.status);
    }

  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

// Test the health endpoint first
async function testHealthEndpoint() {
  console.log('Testing health endpoint...');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('Health check response:', data);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  const healthOk = await testHealthEndpoint();
  
  if (healthOk) {
    console.log('\n--- Server is running, testing slot availability endpoint ---\n');
    await testSlotAvailabilityEndpoint();
  } else {
    console.log('Server is not running or health check failed');
  }
}

runTests();