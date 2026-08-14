// Simple test script to POST JSON to local backend auth endpoints
const fetch = global.fetch || require('node-fetch');

async function run() {
  const base = 'http://localhost:5000/api';
  try {
    console.log('Testing /auth/register');
    const reg = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Automated Tester', email: 'automated+test@example.com', password: 'testing123' }),
    });
    const regText = await reg.text();
    console.log('/auth/register status', reg.status);
    console.log(regText);
  } catch (err) {
    console.error('Register request failed:', err.message);
  }

  try {
    console.log('\nTesting /auth/login');
    const login = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'automated+test@example.com', password: 'testing123' }),
    });
    const loginText = await login.text();
    console.log('/auth/login status', login.status);
    console.log(loginText);
  } catch (err) {
    console.error('Login request failed:', err.message);
  }
}

run();
