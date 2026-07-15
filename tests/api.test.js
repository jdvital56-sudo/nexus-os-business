// ─── Nexus OS Business — API Tests ─────────────────────────────────
// Run: node tests/api.test.js

const http = require('http');

const BASE = 'http://localhost:3000';
let token = null;
let workspaceId = null;

async function fetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: options.method || 'GET', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

function assert(condition, message) {
  if (condition) { console.log(`  ✅ ${message}`); return true; }
  console.error(`  ❌ ${message}`);
  return false;
}

async function runTests() {
  console.log('\n🧪 Nexus OS Business — API Tests\n');
  let passed = 0, failed = 0;

  // ─── Health ──────────────────────────────────────────────────────
  console.log('📋 Health Check');
  const health = await fetch('/api/health');
  passed += assert(health.status === 200, 'GET /api/health → 200');
  passed += assert(health.data.success === true, 'Health returns success:true');

  // ─── Auth ────────────────────────────────────────────────────────
  console.log('\n📋 Authentication');

  const register = await fetch('/api/auth/register', {
    method: 'POST',
    body: { email: 'test@nexusos.com', password: 'test1234', name: 'Test User', organizationName: 'Test Org' }
  });
  passed += assert(register.status === 201, 'POST /api/auth/register → 201');
  passed += assert(register.data.data.token, 'Register returns token');

  const login = await fetch('/api/auth/login', {
    method: 'POST',
    body: { email: 'test@nexusos.com', password: 'test1234' }
  });
  passed += assert(login.status === 200, 'POST /api/auth/login → 200');
  passed += assert(login.data.data.token, 'Login returns token');
  token = login.data.data.token;

  const me = await fetch('/api/auth/me');
  passed += assert(me.status === 200, 'GET /api/auth/me → 200');
  passed += assert(me.data.data.email === 'test@nexusos.com', 'Me returns correct email');

  // ─── Workspaces ──────────────────────────────────────────────────
  console.log('\n📋 Workspaces');

  const workspaces = await fetch('/api/workspaces');
  passed += assert(workspaces.status === 200, 'GET /api/workspaces → 200');
  passed += assert(workspaces.data.data.length > 0, 'Has at least one workspace');
  workspaceId = workspaces.data.data[0]?.id;

  // ─── CRM ─────────────────────────────────────────────────────────
  console.log('\n📋 CRM');

  const createEntity = await fetch('/api/crm/entities', {
    method: 'POST',
    body: {
      workspaceId,
      name: 'test_contacts',
      displayName: 'Test Contacts',
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'Email' }
      ]
    }
  });
  passed += assert(createEntity.status === 201, 'POST /api/crm/entities → 201');
  const entityId = createEntity.data.data?.id;

  const entities = await fetch(`/api/crm/entities?workspaceId=${workspaceId}`);
  passed += assert(entities.status === 200, 'GET /api/crm/entities → 200');
  passed += assert(entities.data.data.length > 0, 'Has entities');

  const createRecord = await fetch('/api/crm/records', {
    method: 'POST',
    body: { workspaceId, entityId, data: { name: 'John Doe', email: 'john@example.com' } }
  });
  passed += assert(createRecord.status === 201, 'POST /api/crm/records → 201');
  const recordId = createRecord.data.data?.id;

  const records = await fetch(`/api/crm/records?workspaceId=${workspaceId}&entityId=${entityId}`);
  passed += assert(records.status === 200, 'GET /api/crm/records → 200');
  passed += assert(records.data.data.items.length > 0, 'Has records');

  const updateRecord = await fetch(`/api/crm/records/${recordId}`, {
    method: 'PATCH',
    body: { data: { name: 'John Updated', email: 'john@updated.com' } }
  });
  passed += assert(updateRecord.status === 200, 'PATCH /api/crm/records/:id → 200');

  // ─── Websites ────────────────────────────────────────────────────
  console.log('\n📋 Websites');

  const createWebsite = await fetch('/api/websites', {
    method: 'POST',
    body: { workspaceId, name: 'Test Site', slug: 'test-site' }
  });
  passed += assert(createWebsite.status === 201, 'POST /api/websites → 201');

  const websites = await fetch(`/api/websites?workspaceId=${workspaceId}`);
  passed += assert(websites.status === 200, 'GET /api/websites → 200');

  // ─── Automations ─────────────────────────────────────────────────
  console.log('\n📋 Automations');

  const createAuto = await fetch('/api/automations', {
    method: 'POST',
    body: { workspaceId, name: 'Test Automation', description: 'Test', trigger: { type: 'event' } }
  });
  passed += assert(createAuto.status === 201, 'POST /api/automations → 201');

  const automations = await fetch(`/api/automations?workspaceId=${workspaceId}`);
  passed += assert(automations.status === 200, 'GET /api/automations → 200');

  // ─── AI Bots ─────────────────────────────────────────────────────
  console.log('\n📋 AI Bots');

  const createBot = await fetch('/api/ai/bots', {
    method: 'POST',
    body: { workspaceId, name: 'Test Bot', type: 'support', channels: ['web'] }
  });
  passed += assert(createBot.status === 201, 'POST /api/ai/bots → 201');

  const bots = await fetch(`/api/ai/bots?workspaceId=${workspaceId}`);
  passed += assert(bots.status === 200, 'GET /api/ai/bots → 200');

  // ─── AI Agents ───────────────────────────────────────────────────
  console.log('\n📋 AI Agents');

  const createAgent = await fetch('/api/ai/agents', {
    method: 'POST',
    body: { workspaceId, name: 'Test Agent', role: 'sales', tools: ['crm', 'email'] }
  });
  passed += assert(createAgent.status === 201, 'POST /api/ai/agents → 201');

  const agents = await fetch(`/api/ai/agents?workspaceId=${workspaceId}`);
  passed += assert(agents.status === 200, 'GET /api/ai/agents → 200');

  // ─── Generator ───────────────────────────────────────────────────
  console.log('\n📋 Business Generator');

  const generate = await fetch('/api/generator', {
    method: 'POST',
    body: { description: 'Create a dental clinic' }
  });
  passed += assert(generate.status === 200, 'POST /api/generator → 200');
  passed += assert(generate.data.data.preview.industry === 'dental', 'Detects dental industry');
  passed += assert(generate.data.data.preview.componentCount.entities >= 2, 'Has 2+ entities');

  // ─── Marketplace ─────────────────────────────────────────────────
  console.log('\n📋 Marketplace');

  const marketplace = await fetch('/api/marketplace');
  passed += assert(marketplace.status === 200, 'GET /api/marketplace → 200');

  // ─── Summary ─────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Test error:', e); process.exit(1); });
