// Test script to verify revenue calculation fixes
import { getBookingAnalytics, getRevenueAnalytics } from './models/bookingModel.js';

async function testRevenueCalculation() {
  console.log('Testing revenue calculation...');
  
  try {
    // Test with a sample facility ID (replace with actual ID)
    const facilityId = 1;
    const period = 30;
    
    console.log('Testing booking analytics...');
    const analytics = await getBookingAnalytics(facilityId, period);
    console.log('Analytics result:', analytics);
    
    console.log('Testing revenue analytics...');
    const revenue = await getRevenueAnalytics(facilityId, period);
    console.log('Revenue result:', revenue);
    
    // Test revenue calculation logic
    const testBookings = [
      { total_amount: '500.00' },
      { total_amount: '750.50' },
      { total_amount: '1000' },
      { total_amount: 250 }
    ];
    
    // Test string concatenation vs addition
    console.log('\nTesting revenue calculation logic:');
    
    // Wrong way (concatenation)
    const wrongTotal = testBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    console.log('Wrong calculation (concatenation):', wrongTotal);
    
    // Correct way (addition with parseFloat)
    const correctTotal = testBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || '0'), 0);
    console.log('Correct calculation (addition):', correctTotal);
    
    console.log('Revenue calculation test completed successfully!');
    
  } catch (error) {
    console.error('Error testing revenue calculation:', error);
  }
}

// Run the test
testRevenueCalculation();