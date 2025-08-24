import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:6000/api/admin';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    // Test with correct credentials
    console.log('\n1. Testing with correct credentials...');
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: 'admin@odoo.com',
      password: '123456'
    });
    
    console.log('Login successful!');
    console.log('User:', response.data.user);
    console.log('Token:', response.data.token.slice(0, 20) + '...');
    
    // Test accessing protected route with the token
    console.log('\n2. Testing protected route...');
    const protectedResponse = await axios.get(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('Protected route response:', protectedResponse.data);
    
  } catch (error) {
    console.error('Test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
}

testAdminLogin();
