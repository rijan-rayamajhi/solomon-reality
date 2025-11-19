const axios = require('axios');

async function testRegistration() {
  const API_URL = process.env.API_URL || 'http://localhost:5000/api';
  
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    phone: '+91 1234567890',
    password: 'Test1234'
  };

  try {
    console.log('🧪 Testing registration...');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔗 API URL: ${API_URL}/auth/register`);
    
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    
    console.log('\n✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ Registration failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response from server');
      console.log('💡 Make sure backend server is running on port 5000');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRegistration();

