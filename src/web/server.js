const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const controller = require('./controller');

const PORT = Number(process.env.PORT || process.env.WAREHOUSE_WEB_PORT || 3000);
const HOST = process.env.WAREHOUSE_WEB_HOST || '127.0.0.1';
const SESSION_COOKIE = 'wm_session';
const ROOT = path.resolve(__dirname, '..', '..');
const RENDERER_DIR = path.join(ROOT, 'src', 'renderer');
const SHARED_DIR = path.join(ROOT, 'src', 'shared');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const sessions = new Map();

function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((cookies, pair) => {
    const index = pair.indexOf('=');
    if (index === -1) return cookies;
    return {
      ...cookies,
      [pair.slice(0, index).trim()]: decodeURIComponent(pair.slice(index + 1).trim())
    };
  }, {});
}

function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  return token ? sessions.get(token) || null : null;
}

function createSession(res, session) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, session);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/`);
  return session;
}

function clearSession(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendSuccess(res, data) {
  sendJson(res, 200, { success: true, data, error: null });
}

function sendError(res, status, error) {
  const message = status >= 500
    ? 'Internal server error'
    : (error instanceof Error ? error.message : String(error || 'Unexpected error'));
  sendJson(res, status, { success: false, data: null, error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function serveFile(res, baseDir, filePath) {
  const resolved = path.resolve(baseDir, filePath);
  if (!isInside(baseDir, resolved) && resolved !== baseDir) {
    sendError(res, 403, 'Forbidden');
    return;
  }
  fs.readFile(resolved, (error, content) => {
    if (error) {
      sendError(res, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : error);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid id');
  return id;
}

function crudRoutes(resource, api) {
  return async (req, res, parts) => {
    const id = parts[1] ? parseId(parts[1]) : null;
    if (req.method === 'GET' && !id) return sendSuccess(res, api.getAll());
    if (req.method === 'GET' && id) return sendSuccess(res, api.getById(id));
    if (req.method === 'POST' && !id) return sendSuccess(res, api.create(await readBody(req)));
    if (req.method === 'PUT' && id) return sendSuccess(res, api.update(id, await readBody(req)));
    if (req.method === 'DELETE' && id) return sendSuccess(res, api.delete(id));
    sendError(res, 404, resource + ' route not found');
  };
}

const crudHandlers = {
  warehouses: crudRoutes('warehouses', controller.warehouses),
  cameras: crudRoutes('cameras', controller.cameras),
  fireSystems: crudRoutes('fireSystems', controller.fireSystems),
  constructions: crudRoutes('constructions', controller.constructions)
};

async function handleApi(req, res, url) {
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [resource, action, id] = parts;

  if (resource === 'auth' && action === 'login' && req.method === 'POST') {
    return sendSuccess(res, createSession(res, controller.authenticate(await readBody(req))));
  }
  if (resource === 'auth' && action === 'session' && req.method === 'GET') {
    return sendSuccess(res, getSession(req));
  }
  if (resource === 'auth' && action === 'logout' && req.method === 'POST') {
    clearSession(req, res);
    return sendSuccess(res, { success: true });
  }

  if (!getSession(req)) {
    sendError(res, 401, 'Authentication required');
    return;
  }

  if (resource === 'units') {
    if (req.method === 'GET' && action === 'tree') return sendSuccess(res, controller.units.getTree());
    if (req.method === 'GET' && !action) return sendSuccess(res, controller.units.getAll());
    if (req.method === 'POST' && !action) return sendSuccess(res, controller.units.create(await readBody(req)));
    if (req.method === 'PUT' && action) return sendSuccess(res, controller.units.update(parseId(action), await readBody(req)));
    if (req.method === 'DELETE' && action) return sendSuccess(res, controller.units.delete(parseId(action)));
  }

  if (resource === 'locations') {
    if (req.method === 'GET' && action === 'provinces') return sendSuccess(res, controller.locations.getProvinces());
    if (req.method === 'GET' && action === 'wards') return sendSuccess(res, controller.locations.getWardsByProvince(parseId(id)));
    if (req.method === 'POST' && action === 'provinces') return sendSuccess(res, controller.locations.createProvince(await readBody(req)));
    if (req.method === 'PUT' && action === 'provinces') return sendSuccess(res, controller.locations.updateProvince(parseId(id), await readBody(req)));
    if (req.method === 'DELETE' && action === 'provinces') return sendSuccess(res, controller.locations.deleteProvince(parseId(id)));
    if (req.method === 'POST' && action === 'wards') return sendSuccess(res, controller.locations.createWard(await readBody(req)));
    if (req.method === 'PUT' && action === 'wards') return sendSuccess(res, controller.locations.updateWard(parseId(id), await readBody(req)));
    if (req.method === 'DELETE' && action === 'wards') return sendSuccess(res, controller.locations.deleteWard(parseId(id)));
  }

  if (resource === 'catalogs') {
    const tableName = action;
    if (req.method === 'GET' && tableName) return sendSuccess(res, controller.catalogs.getAll(tableName));
    if (req.method === 'POST' && tableName) return sendSuccess(res, controller.catalogs.create(tableName, await readBody(req)));
    if (req.method === 'PUT' && tableName && id) return sendSuccess(res, controller.catalogs.update(tableName, parseId(id), await readBody(req)));
    if (req.method === 'DELETE' && tableName && id) return sendSuccess(res, controller.catalogs.remove(tableName, parseId(id)));
  }

  if (resource === 'warehouses' && action === 'search' && req.method === 'GET') {
    return sendSuccess(res, controller.warehouses.search(url.searchParams.get('q') || ''));
  }

  if (crudHandlers[resource]) {
    return crudHandlers[resource](req, res, parts);
  }

  if (resource === 'stats' && action === 'overview' && req.method === 'GET') return sendSuccess(res, controller.stats.overview());
  if (resource === 'search' && action === 'global' && req.method === 'GET') return sendSuccess(res, controller.search.global(url.searchParams.get('q') || ''));
  if (resource === 'search' && action === 'smart' && req.method === 'POST') {
    const body = await readBody(req);
    return sendSuccess(res, controller.search.smart(body.query || '', body.options || {}));
  }
  if (resource === 'search' && action === 'rebuild-index' && req.method === 'POST') return sendSuccess(res, controller.search.rebuildIndex());
  if (resource === 'system' && action === 'migrations' && req.method === 'GET') return sendSuccess(res, controller.system.migrations());
  if (resource === 'audit' && req.method === 'GET') return sendSuccess(res, controller.audit.list(Number(url.searchParams.get('limit') || 100)));
  if (resource === 'duplicates' && action === 'review' && req.method === 'GET') return sendSuccess(res, controller.duplicates.review());

  sendError(res, 404, 'API route not found');
}

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        await handleApi(req, res, url);
        return;
      }
      if (url.pathname.startsWith('/shared/')) {
        serveFile(res, SHARED_DIR, url.pathname.replace(/^\/shared\//, ''));
        return;
      }
      if (url.pathname === '/' || url.pathname === '/login') {
        serveFile(res, RENDERER_DIR, 'login.html');
        return;
      }
      if (url.pathname === '/app') {
        serveFile(res, RENDERER_DIR, 'index.html');
        return;
      }
      serveFile(res, RENDERER_DIR, decodeURIComponent(url.pathname.slice(1)));
    } catch (error) {
      sendError(res, 500, error);
    }
  });
}

function shouldStartServer() {
  return require.main === module || process.argv.some(arg => /src[\\/]web[\\/]server\.js$/.test(arg));
}

if (shouldStartServer()) {
  createServer().listen(PORT, HOST, () => {
    process.stdout.write(`Warehouse web app running at http://${HOST}:${PORT}\n`);
  });
}

module.exports = { createServer };
