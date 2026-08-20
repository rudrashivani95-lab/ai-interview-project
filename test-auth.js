// Simple test script to diagnose auth issues
const http = require('http');

function testAPI(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Auth API...\n');

  try {
    // Test 1: Server health
    console.log('1️⃣  Testing server connection...');
    const testEmail = `test-${Date.now()}@test.com`;
    const testPassword = 'TestPassword123!';
    
    // Test 2: Signup
    console.log('\n2️⃣  Testing signup endpoint...');
    const signupResult = await testAPI('POST', '/api/auth/signup', {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });
    console.log(`Status: ${signupResult.status}`);
    console.log(`Response:`, JSON.stringify(signupResult.body, null, 2));
    
    if (signupResult.status !== 201) {
      console.log('\n❌ Signup failed! This is the issue.');
      return;
    }

    const token = signupResult.body.token;
    console.log(`✅ Signup successful! Token: ${token.substring(0, 20)}...`);

    // Test 3: Login
    console.log('\n3️⃣  Testing login endpoint...');
    const loginResult = await testAPI('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    console.log(`Status: ${loginResult.status}`);
    console.log(`Response:`, JSON.stringify(loginResult.body, null, 2));

    if (loginResult.status === 200) {
      console.log(`✅ Login successful!`);
    } else {
      console.log(`❌ Login failed!`);
    }

  } catch (err) {
    console.error('❌ Error during testing:', err.message);
    console.error('\nMake sure the backend is running on port 3000!');
  }
}

runTests();
