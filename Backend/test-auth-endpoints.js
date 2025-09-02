import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...\n');
  
  // Test data
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    age: 25,
    gender: 'male',
    level: 'beginner',
    password: 'testpassword123'
  };
  
  const testOwner = {
    name: 'Test Owner',
    email: 'owner@example.com',
    password: 'ownerpassword123',
    phone: '0987654321',
    location: 'Test Location',
    no_of_courts: 3
  };
  
  try {
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test user signup
    console.log('\n2. Testing user signup...');
    try {
      const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
      console.log('✅ User signup successful:', signupResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, continuing with login test...');
      } else {
        console.log('❌ User signup failed:', error.response?.data || error.message);
      }
    }
    
    // Test user login
    console.log('\n3. Testing user login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ User login successful:', {
        user: loginResponse.data.user?.email,
        role: loginResponse.data.user?.role,
        tokenExists: !!loginResponse.data.token
      });
    } catch (error) {
      console.log('❌ User login failed:', error.response?.data || error.message);
    }
    
    // Test owner signup
    console.log('\n4. Testing owner signup...');
    try {
      const ownerSignupResponse = await axios.post(`${BASE_URL}/auth/owner-signup`, testOwner);
      console.log('✅ Owner signup successful:', ownerSignupResponse.data);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Owner already exists, continuing with login test...');
      } else {
        console.log('❌ Owner signup failed:', error.response?.data || error.message);
      }
    }
    
    // Test owner login
    console.log('\n5. Testing owner login...');
    try {
      const ownerLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testOwner.email,
        password: testOwner.password
      });
      console.log('✅ Owner login successful:', {
        user: ownerLoginResponse.data.user?.email,
        role: ownerLoginResponse.data.user?.role,
        tokenExists: !!ownerLoginResponse.data.token
      });
    } catch (error) {
      console.log('❌ Owner login failed:', error.response?.data || error.message);
    }
    
    // Test invalid login
    console.log('\n6. Testing invalid login...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login properly rejected');
      } else {
        console.log('❌ Unexpected error for invalid login:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server might not be running. Try starting it with: npm start');
    }
  }
}

testAuthEndpoints();