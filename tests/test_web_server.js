const assert = require('assert');
const os = require('os');
const path = require('path');
process.env.WAREHOUSE_DB_PATH = path.join(os.tmpdir(), `warehouse-web-test-${Date.now()}.db`);
const { createServer } = require('../src/web/server');

function request(baseUrl, pathName, options = {}) {
  return fetch(baseUrl + pathName, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  }).then(async response => ({ response, body: await response.json() }));
}

async function run() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    let result = await request(baseUrl, '/api/units');
    assert.strictEqual(result.response.status, 401);
    assert.strictEqual(result.body.success, false);

    result = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: { unitName: 'Test Unit', userName: 'Tester', password: '123456', theme: 'dark' }
    });
    assert.strictEqual(result.response.status, 200);
    assert.strictEqual(result.body.success, true);
    assert.strictEqual(result.body.data.userName, 'Tester');
    const cookie = result.response.headers.get('set-cookie').split(';')[0];
    assert.ok(cookie.includes('wm_session='));

    result = await request(baseUrl, '/api/units', { cookie });
    assert.strictEqual(result.response.status, 200);
    assert.strictEqual(result.body.success, true);
    assert.ok(Array.isArray(result.body.data));

    result = await request(baseUrl, '/api/stats/overview', { cookie });
    assert.strictEqual(result.response.status, 200);
    assert.strictEqual(result.body.success, true);
    assert.ok(Object.prototype.hasOwnProperty.call(result.body.data, 'warehousesTotal'));

    result = await request(baseUrl, '/api/search/smart', {
      method: 'POST',
      cookie,
      body: { query: 'kho', options: { limit: 5 } }
    });
    assert.strictEqual(result.response.status, 200);
    assert.strictEqual(result.body.success, true);
    assert.ok(Array.isArray(result.body.data));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

run()
  .then(() => {
    process.stdout.write('Web server smoke tests passed\n');
  })
  .catch(error => {
    process.stderr.write(error.stack + '\n');
    process.exit(1);
  });
