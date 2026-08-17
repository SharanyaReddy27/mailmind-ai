const fetch = global.fetch || require('node-fetch');

const run = async () => {
  const app = require('../server');
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;
  const results = [];

  const uid = Math.floor(Math.random() * 100000);
  const user = {
    name: `Test User ${uid}`,
    email: `test${uid}@example.com`,
    password: 'password123',
  };

  const ok = (name, cond) => {
    results.push({ name, pass: !!cond });
    console.log(`${name}: ${cond ? 'PASS' : 'FAIL'}`);
  };

  try {
    // Register
    let res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const reg = await res.json();
    ok('Register', res.status === 201 && reg.token);

    // Duplicate register
    res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    ok('Duplicate Register', res.status === 400);

    // Login
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const login = await res.json();
    ok('Login', res.status === 200 && login.token);

    // Wrong password
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'wrongpass' }),
    });
    ok('Wrong Password', res.status === 401);

    const token = login.token;

    // Get current user
    res = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    const me = await res.json();
    ok('Get Current User', res.status === 200 && me.user && me.user.email === user.email);

    // Unauthorized access to emails
    res = await fetch(`${base}/emails`);
    ok('Unauthorized Email Access', res.status === 401);

    // Create email (authorized)
    const emailPayload = {
      senderName: 'Tester',
      senderEmail: 'tester@example.com',
      subject: 'Test Email',
      body: 'This is a test',
    };
    res = await fetch(`${base}/emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(emailPayload),
    });
    const created = await res.json();
    ok('Authorized Email Create', res.status === 201 && created.userId);

    // Get emails
    res = await fetch(`${base}/emails`, { headers: { Authorization: `Bearer ${token}` } });
    const list = await res.json();
    ok('Authorized Email List', res.status === 200 && Array.isArray(list) && list.length >= 1);

    // Cleanup: delete created email
    if (created && created._id) {
      res = await fetch(`${base}/emails/${created._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      ok('Delete Email', res.status === 200);
    }
  } catch (err) {
    console.error('Test run error', err);
    results.push({ name: 'exception', pass: false, error: err.message });
  } finally {
    server.close();
    const passed = results.every((r) => r.pass);
    console.log('--- Summary ---');
    results.forEach((r) => console.log(`${r.name}: ${r.pass ? 'PASS' : 'FAIL'}`));
    console.log(passed ? 'ALL TESTS PASS' : 'SOME TESTS FAILED');
    process.exit(passed ? 0 : 1);
  }
};

run();
