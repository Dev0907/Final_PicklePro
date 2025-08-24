import axios from 'axios';

const testBackend = async () => {
  try {
    console.log('Testing backend connection...');
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend is running!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Backend connection failed:');
    if (error.code === 'ECONNREFUSED') {
      console.log('- Backend server is not running');
      console.log('- Start the backend with: cd Backend && npm start');
    } else {
      console.log('- Error:', error.message);
    }
  }
};

testBackend();