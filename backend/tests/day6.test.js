const fetch = global.fetch || require('node-fetch');

const run = async () => {
  const app = require('../server');
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}/api`;
  const results = [];

  const uid = Math.floor(Math.random() * 100000);
  const user = {
    name: `G6 ${uid}`,
    email: `g6_${uid}@example.com`,
    password: 'password123',
  };

  const ok = (name, cond) => {
    results.push({ name, pass: !!cond });
    console.log(`${name}: ${cond ? 'PASS' : 'FAIL'}`);
  };

  try {
    // register & login
    let res = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    const reg = await res.json();
    ok('Register', res.status === 201 && reg.token);
    const token = reg.token;

    // health
    res = await fetch(`${base}/health`);
    ok('Health', res.status === 200);

    // auth-url without JWT
    res = await fetch(`${base}/gmail/auth-url`);
    ok('Auth URL without JWT', res.status === 401);

    // status without JWT
    res = await fetch(`${base}/gmail/status`);
    ok('Status without JWT', res.status === 401);

    // sync without JWT
    res = await fetch(`${base}/gmail/sync`, { method: 'POST' });
    ok('Sync without JWT', res.status === 401);

    // disconnect without JWT
    res = await fetch(`${base}/gmail/disconnect`, { method: 'POST' });
    ok('Disconnect without JWT', res.status === 401);

    // auth-url with JWT
    res = await fetch(`${base}/gmail/auth-url`, { headers: { Authorization: `Bearer ${token}` } });
    const auth = await res.json();
    ok('Auth URL with JWT', res.status === 200 && auth.authUrl && auth.authUrl.startsWith('https://'));
    const url = new URL(auth.authUrl);
    ok('Auth URL has state', !!url.searchParams.get('state'));

    // callback without code -> expect redirect to frontend error
    res = await fetch(`${base}/gmail/callback`);
    ok('Callback without code', res.status === 302 || res.status === 200);

    // callback with invalid state -> redirect error
    res = await fetch(`${base}/gmail/callback?state=invalid&code=abc`);
    ok('Callback invalid state', res.status === 302 || res.status === 200);

    // status for unconnected user
    res = await fetch(`${base}/gmail/status`, { headers: { Authorization: `Bearer ${token}` } });
    const st = await res.json();
    ok('Status unconnected', res.status === 200 && st.connected === false);

    // sync for unconnected user should return 409
    res = await fetch(`${base}/gmail/sync`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 5 }) });
    ok('Sync for unconnected user', res.status === 409);

    // verify auth routes still work
    res = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    ok('Auth me works', res.status === 200);

    // existing email routes protected
    res = await fetch(`${base}/emails`, { headers: { Authorization: `Bearer ${token}` } });
    ok('Emails protected', res.status === 200);

    // AI endpoints smoke test
    res = await fetch(`${base}/ai/summarize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: 'Hello', sender: 'a@b.com', body: 'Test' }) });
    ok('AI summarize works', res.status === 200 || res.status === 201);

  } catch (err) {
    console.error('Test run error', err.message);
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
