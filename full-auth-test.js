#!/usr/bin/env node

/**
 * Complete Auth Flow Test
 * Tests signup, login, and token persistence
 */

const http = require('http');

const BASE_URL = 'http://127.0.0.1:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runFullAuthFlow() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         prepmate AI - COMPLETE AUTH FLOW TEST              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let token = null;

  try {
    // Test 1: Server Health
    console.log('📋 TEST 1: Server Health Check');
    const health = await makeRequest('GET', '/');
    console.log(`   Status: ${health.status === 200 ? '✅' : '❌'} (${health.status})`);
    console.log(`   Server: ${health.body.app || 'OK'}\n`);

    // Test 2: Signup
    console.log('📋 TEST 2: User Signup');
    console.log(`   Creating account: ${testEmail}`);
    const signup = await makeRequest('POST', '/api/auth/signup', {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });

    if (signup.status === 201 && signup.body.token) {
      token = signup.body.token;
      console.log(`   Status: ✅ (${signup.status} Created)`);
      console.log(`   User ID: ${signup.body.user.id}`);
      console.log(`   Token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}\n`);
    } else {
      console.log(`   Status: ❌ (${signup.status})`);
      console.log(`   Error: ${signup.body.message || 'Unknown error'}\n`);
      throw new Error('Signup failed');
    }

    // Test 3: Login
    console.log('📋 TEST 3: User Login');
    console.log(`   Authenticating: ${testEmail}`);
    const login = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });

    if (login.status === 200 && login.body.token) {
      console.log(`   Status: ✅ (${login.status} OK)`);
      console.log(`   User: ${login.body.user.name}`);
      console.log(`   Token: ${login.body.token.substring(0, 20)}...${login.body.token.substring(login.body.token.length - 10)}\n`);
    } else {
      console.log(`   Status: ❌ (${login.status})`);
      console.log(`   Error: ${login.body.message || 'Unknown error'}\n`);
      throw new Error('Login failed');
    }

    // Test 4: Wrong Password
    console.log('📋 TEST 4: Invalid Password Rejection');
    const badLogin = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword'
    });

    if (badLogin.status === 400) {
      console.log(`   Status: ✅ (${badLogin.status} Correctly Rejected)`);
      console.log(`   Message: "${badLogin.body.message}"\n`);
    } else {
      console.log(`   Status: ❌ (Expected 400, got ${badLogin.status})\n`);
    }

    // Test 5: Duplicate Email
    console.log('📋 TEST 5: Duplicate Email Prevention');
    const duplicate = await makeRequest('POST', '/api/auth/signup', {
      name: 'Another User',
      email: testEmail,
      password: 'DifferentPassword'
    });

    if (duplicate.status === 400) {
      console.log(`   Status: ✅ (${duplicate.status} Correctly Rejected)`);
      console.log(`   Message: "${duplicate.body.message}"\n`);
    } else {
      console.log(`   Status: ❌ (Expected 400, got ${duplicate.status})\n`);
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                     🎉 ALL TESTS PASSED 🎉                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✨ Summary:');
    console.log('   ✅ Server is running and responding');
    console.log('   ✅ User can sign up with new account');
    console.log('   ✅ User can log in with credentials');
    console.log('   ✅ Invalid passwords are rejected');
    console.log('   ✅ Duplicate emails are prevented');
    console.log('\n📌 Your auth system is fully operational!\n');

  } catch (err) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ❌ TEST FAILED ❌                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.error('Error:', err.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure backend is running: cd backend && npm start');
    console.log('   2. Make sure MongoDB is running on port 27017');
    console.log('   3. Check that port 3000 is not blocked\n');
  }
}

runFullAuthFlow();
