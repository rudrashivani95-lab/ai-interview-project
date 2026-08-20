// Comprehensive debug script for auth system
const http = require('http');

function makeRequest(method, path, body = null) {
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
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
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

async function testAuthFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           AUTH SYSTEM DEBUG TEST                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Create a test account
    const testEmail = `testuser${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('📋 TEST 1: User Signup');
    console.log(`─────────────────────────────────────────────────────────`);
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword} (length: ${testPassword.length})`);
    
    const signupRes = await makeRequest('POST', '/auth/signup', {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });

    console.log(`Response Status: ${signupRes.status}`);
    console.log(`Response Body:`, JSON.stringify(signupRes.body, null, 2));

    if (signupRes.status !== 201) {
      console.error('❌ Signup failed!');
      return;
    }

    console.log('✅ Signup successful\n');
    const signupToken = signupRes.body.token;
    const userId = signupRes.body.user.id;

    // Test 2: Login with correct password
    console.log('📋 TEST 2: User Login (with correct password)');
    console.log(`─────────────────────────────────────────────────────────`);
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: testPassword
    });

    console.log(`Response Status: ${loginRes.status}`);
    console.log(`Response Body:`, JSON.stringify(loginRes.body, null, 2));

    if (loginRes.status === 200) {
      console.log('✅ Login successful\n');
    } else {
      console.error('❌ Login failed!');
      console.log('\n🔍 DEBUGGING INFO:');
      console.log(`   - Signup stored password as hashed value`);
      console.log(`   - Login is trying to compare: "${testPassword}" with stored hash`);
      console.log(`   - bcrypt.compare() should work, but there might be an issue\n`);
    }

    // Test 3: Login with wrong password
    console.log('📋 TEST 4: User Login (with wrong password)');
    console.log(`─────────────────────────────────────────────────────────`);
    console.log(`Email: ${testEmail}`);
    console.log(`Password: WrongPassword123`);
    
    const wrongPassRes = await makeRequest('POST', '/auth/login', {
      email: testEmail,
      password: 'WrongPassword123'
    });

    console.log(`Response Status: ${wrongPassRes.status}`);
    console.log(`Response Body:`, JSON.stringify(wrongPassRes.body, null, 2));

    if (wrongPassRes.status === 400) {
      console.log('✅ Correctly rejected wrong password\n');
    }

    // Test 4: Login with non-existent email
    console.log('📋 TEST 5: User Login (non-existent email)');
    console.log(`─────────────────────────────────────────────────────────`);
    console.log(`Email: nonexistent@example.com`);
    
    const noEmailRes = await makeRequest('POST', '/auth/login', {
      email: 'nonexistent@example.com',
      password: testPassword
    });

    console.log(`Response Status: ${noEmailRes.status}`);
    console.log(`Response Body:`, JSON.stringify(noEmailRes.body, null, 2));

    if (noEmailRes.status === 400) {
      console.log('✅ Correctly rejected non-existent email\n');
    }

  } catch (err) {
    console.error('❌ Error during testing:', err.message);
    console.error('\nMake sure:');
    console.error('  1. Backend is running on port 3000');
    console.error('  2. MongoDB is running on port 27017');
    console.error('  3. Run: cd backend && npm start');
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              TEST COMPLETE                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

testAuthFlow();
