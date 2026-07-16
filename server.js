// ─── Nexus OS Business — Standalone Express Server ─────────────────
// Запуск: node server.js
// http://localhost:3000

const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─── Prisma (SQLite) ──────────────────────────────────────────────
let prisma;
try {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
} catch (e) {
  console.error("❌ Prisma not generated. Run: npx prisma generate && npx prisma db push");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || "nexus-os-dev-secret-change-in-production";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: "10mb" }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Auth helpers ─────────────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

function requireAuth(req, res) {
  const user = getUser(req);
  if (!user) { res.status(401).json({ success: false, error: "Unauthorized" }); return null; }
  return user;
}

// JSON field helpers for SQLite
const JSON_FIELDS = {
  Organization: ["settings"],
  Workspace: ["settings"],
  Member: ["permissions"],
  CrmEntity: ["fields", "settings"],
  CrmRecord: ["data"],
  Website: ["config", "pages", "styles", "seo"],
  Automation: ["trigger", "nodes", "connections"],
  AiBot: ["personality", "channels", "flows", "config"],
  AiAgent: ["personality", "tools", "capabilities", "memory", "config"],
  MarketplaceItem: ["screenshots", "tags", "blueprint"],
  SmartPackage: ["items", "tags"],
  AuditLog: ["changes", "metadata"],
};

function P(v) { if (!v || typeof v !== "string") return v; try { return JSON.parse(v); } catch { return v; } }
function J(v) { return typeof v === "string" ? v : JSON.stringify(v ?? {}); }

function parseFields(model, data) {
  if (!data) return data;
  const fields = JSON_FIELDS[model] || [];
  const r = { ...data };
  for (const f of fields) if (f in r) r[f] = P(r[f]);
  return r;
}

// ─── API Routes ───────────────────────────────────────────────────

// Health
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: "healthy", db: "connected" } });
  } catch (e) {
    res.json({ success: true, data: { status: "degraded", db: "error" } });
  }
});

// ── Auth ──────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;
    if (!email || !password || !name) return res.status(400).json({ success: false, error: "email, password, name required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, name, passwordHash } });

    const org = await prisma.organization.create({ data: { name: organizationName || `${name}'s Organization`, slug: email.split("@")[0].replace(/[^a-z0-9]/g, "") + "-" + Date.now().toString(36) } });
    const ws = await prisma.workspace.create({ data: { organizationId: org.id, name: "My Workspace", slug: "default" } });
    await prisma.member.create({ data: { workspaceId: ws.id, userId: user.id, role: "owner", permissions: J(["*"]) } });
    await prisma.subscription.create({ data: { organizationId: org.id, plan: "professional", status: "active" } });

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, name: user.name }, workspaces: [{ id: ws.id, name: ws.name, slug: ws.slug, role: "owner" }] } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "email and password required" });

    const user = await prisma.user.findUnique({ where: { email }, include: { members: { include: { workspace: true } } } });
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: "Invalid credentials" });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken({ userId: user.id, email: user.email });
    const workspaces = user.members.map(m => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role }));
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, name: user.name }, workspaces } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const payload = getUser(req);
    if (!payload) return res.status(401).json({ success: false, error: "Not authenticated" });

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { members: { include: { workspace: true } } } });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    res.json({ success: true, data: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, workspaces: user.members.map(m => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role })) } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.patch("/api/auth/me", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name required" });
    const user = await prisma.user.update({ where: { id: payload.userId }, data: { name } });
    res.json({ success: true, data: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/auth/change-password", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: "Current and new password required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: "Current password is incorrect" });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ success: true, data: { message: "Password changed successfully" } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Workspaces ────────────────────────────────────────────────────

app.get("/api/workspaces", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const members = await prisma.member.findMany({ where: { userId: payload.userId }, include: { workspace: { include: { _count: { select: { crmEntities: true, websites: true, automations: true } } } } } });
    const workspaces = members.map(m => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role, stats: m.workspace._count }));
    res.json({ success: true, data: workspaces });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.patch("/api/workspaces", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { id, name } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "Workspace id required" });
    const member = await prisma.member.findFirst({ where: { userId: payload.userId, workspaceId: id } });
    if (!member || (member.role !== "owner" && member.role !== "admin")) return res.status(403).json({ success: false, error: "Not authorized" });
    const ws = await prisma.workspace.update({ where: { id }, data: { ...(name && { name }) } });
    res.json({ success: true, data: { id: ws.id, name: ws.name, slug: ws.slug } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── CRM Entities ──────────────────────────────────────────────────

app.get("/api/crm/entities", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const ws = req.query.workspaceId;
    if (!ws) return res.status(400).json({ success: false, error: "workspaceId required" });
    const entities = await prisma.crmEntity.findMany({ where: { workspaceId: ws }, include: { _count: { select: { records: true } } }, orderBy: { createdAt: "asc" } });
    res.json({ success: true, data: entities.map(e => ({ ...parseFields("CrmEntity", e), recordCount: e._count.records })) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/crm/entities", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, name, displayName, icon, color, fields } = req.body;
    if (!workspaceId) return res.status(400).json({ success: false, error: "workspaceId required" });
    const existing = await prisma.crmEntity.findFirst({ where: { workspaceId, name } });
    if (existing) return res.status(409).json({ success: false, error: "Entity already exists" });
    const entity = await prisma.crmEntity.create({ data: { workspaceId, name, displayName, icon: icon || "database", color: color || "#6366f1", fields: J(fields || []), settings: J({}) } });
    res.status(201).json({ success: true, data: parseFields("CrmEntity", entity) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.delete("/api/crm/entities/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    await prisma.crmRecord.deleteMany({ where: { entityId: req.params.id } });
    await prisma.crmEntity.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── CRM Records ───────────────────────────────────────────────────

app.get("/api/crm/records", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, entityId, pageSize = 100, page = 1 } = req.query;
    if (!workspaceId || !entityId) return res.status(400).json({ success: false, error: "workspaceId and entityId required" });
    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      prisma.crmRecord.findMany({ where: { workspaceId, entityId, deletedAt: null }, orderBy: { createdAt: "desc" }, skip, take: Number(pageSize) }),
      prisma.crmRecord.count({ where: { workspaceId, entityId, deletedAt: null } }),
    ]);
    res.json({ success: true, data: { items: items.map(r => parseFields("CrmRecord", r)), total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/crm/records", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, entityId, data } = req.body;
    if (!workspaceId || !entityId) return res.status(400).json({ success: false, error: "workspaceId and entityId required" });
    const record = await prisma.crmRecord.create({ data: { workspaceId, entityId, data: J(data || {}), createdBy: payload.userId } });
    res.status(201).json({ success: true, data: parseFields("CrmRecord", record) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.delete("/api/crm/records/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    await prisma.crmRecord.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Websites ──────────────────────────────────────────────────────

app.get("/api/websites", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const ws = req.query.workspaceId;
    if (!ws) return res.status(400).json({ success: false, error: "workspaceId required" });
    const sites = await prisma.website.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: sites.map(s => parseFields("Website", s)) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/websites", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, name, slug, templateId } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ success: false, error: "workspaceId and name required" });
    const site = await prisma.website.create({ data: { workspaceId, name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), templateId, config: J({}), pages: J([{ id: "home", name: "Home", slug: "/", isHome: true, sections: [{ id: "hero", type: "hero", props: { title: name, subtitle: "Welcome" } }] }]), styles: J({}), seo: J({}) } });
    res.status(201).json({ success: true, data: parseFields("Website", site) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.patch("/api/websites/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { name, pages, config, styles, seo, published } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (pages !== undefined) data.pages = J(pages);
    if (config !== undefined) data.config = J(config);
    if (styles !== undefined) data.styles = J(styles);
    if (seo !== undefined) data.seo = J(seo);
    if (published !== undefined) data.published = published;
    const site = await prisma.website.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: parseFields("Website", site) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.delete("/api/websites/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    await prisma.website.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Automations ───────────────────────────────────────────────────

app.get("/api/automations", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const ws = req.query.workspaceId;
    if (!ws) return res.status(400).json({ success: false, error: "workspaceId required" });
    const items = await prisma.automation.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items.map(a => parseFields("Automation", a)) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/automations", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, name, description, trigger } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ success: false, error: "workspaceId and name required" });
    const item = await prisma.automation.create({ data: { workspaceId, name, description, trigger: J(trigger || {}), nodes: J([]), connections: J([]) } });
    res.status(201).json({ success: true, data: parseFields("Automation", item) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.patch("/api/automations/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { name, description, active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (active !== undefined) data.active = active;
    const item = await prisma.automation.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: parseFields("Automation", item) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.delete("/api/automations/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    await prisma.automation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── AI Bots ───────────────────────────────────────────────────────

app.get("/api/ai/bots", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const ws = req.query.workspaceId;
    if (!ws) return res.status(400).json({ success: false, error: "workspaceId required" });
    const items = await prisma.aiBot.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items.map(b => parseFields("AiBot", b)) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/ai/bots", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, name, type, description, channels } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ success: false, error: "workspaceId and name required" });
    const item = await prisma.aiBot.create({ data: { workspaceId, name, type: type || "custom", description, personality: J({}), channels: J(channels || []), flows: J([]), config: J({}) } });
    res.status(201).json({ success: true, data: parseFields("AiBot", item) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.delete("/api/ai/bots/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    await prisma.aiBot.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── AI Agents ─────────────────────────────────────────────────────

app.get("/api/ai/agents", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const ws = req.query.workspaceId;
    if (!ws) return res.status(400).json({ success: false, error: "workspaceId required" });
    const items = await prisma.aiAgent.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items.map(a => parseFields("AiAgent", a)) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/ai/agents", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, name, role, description, tools } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ success: false, error: "workspaceId and name required" });
    const item = await prisma.aiAgent.create({ data: { workspaceId, name, role: role || "assistant", description, personality: J({}), tools: J(tools || []), capabilities: J([]), memory: J({}), config: J({}) } });
    res.status(201).json({ success: true, data: parseFields("AiAgent", item) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.delete("/api/ai/agents/:id", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    await prisma.aiAgent.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── AI Chat ───────────────────────────────────────────────────────

app.post("/api/ai/chat", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: "message required" });
    // Demo AI response
    const lower = message.toLowerCase();
    let reply = "I understand your request. Based on your business profile, I recommend focusing on lead generation and automation first.";
    if (lower.includes("lead") || lower.includes("customer")) reply = "Based on my analysis, this lead has a score of 78/100. Key factors: established business (5+ years), active social media presence. Recommendation: prioritize outreach via email with a personalized demo offer.";
    else if (lower.includes("email") || lower.includes("campaign")) reply = "I recommend a 5-step email sequence:\n\n1. Day 0: Introduction + value proposition\n2. Day 2: Case study from similar business\n3. Day 5: Free trial offer\n4. Day 8: Social proof + testimonials\n5. Day 12: Limited-time discount\n\nExpected conversion rate: 3-5%.";
    else if (lower.includes("report") || lower.includes("analytics")) reply = "Weekly Summary:\n• New leads: 24 (+12% vs last week)\n• Qualified leads: 8 (33% qualification rate)\n• Deals in pipeline: 5 ($47,000 total)\n• Conversion rate: 4.2%";
    res.json({ success: true, data: { content: reply, usage: { prompt: 0, completion: 0, total: 0 } } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Marketplace ───────────────────────────────────────────────────

app.get("/api/marketplace", async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search) where.name = { contains: search };
    where.status = "published";
    const items = await prisma.marketplaceItem.findMany({ where, orderBy: { installCount: "desc" } });
    res.json({ success: true, data: { items: items.map(i => parseFields("MarketplaceItem", i)) } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Packages ──────────────────────────────────────────────────────

app.get("/api/packages", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const ws = req.query.workspaceId;
    if (!ws) return res.status(400).json({ success: false, error: "workspaceId required" });
    const items = await prisma.smartPackage.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items.map(p => parseFields("SmartPackage", p)) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.post("/api/packages", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, name, description, items } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ success: false, error: "workspaceId and name required" });
    const pkg = await prisma.smartPackage.create({ data: { workspaceId, name, description, items: J(items || []), tags: J([]) } });
    res.status(201).json({ success: true, data: parseFields("SmartPackage", pkg) });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Generator ─────────────────────────────────────────────────────

const INDUSTRIES = {
  dental: { name: "Dental Clinic", industry: "dental", crm: { entities: [
    { name: "patients", displayName: "Patients", icon: "user", color: "#10b981", fields: [{ name: "first_name", type: "text", label: "First Name", required: true }, { name: "last_name", type: "text", label: "Last Name", required: true }, { name: "phone", type: "phone", label: "Phone", required: true }, { name: "email", type: "email", label: "Email" }, { name: "insurance", type: "text", label: "Insurance" }, { name: "status", type: "select", label: "Status", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] }] },
    { name: "appointments", displayName: "Appointments", icon: "calendar", color: "#6366f1", fields: [{ name: "patient", type: "text", label: "Patient", required: true }, { name: "doctor", type: "text", label: "Doctor", required: true }, { name: "date", type: "datetime", label: "Date & Time", required: true }, { name: "type", type: "select", label: "Type", options: [{ label: "Checkup", value: "checkup" }, { label: "Cleaning", value: "cleaning" }, { label: "Filling", value: "filling" }] }, { name: "status", type: "select", label: "Status", options: [{ label: "Scheduled", value: "scheduled" }, { label: "Confirmed", value: "confirmed" }, { label: "Completed", value: "completed" }, { label: "Cancelled", value: "cancelled" }] }] },
  ] }, bots: [{ name: "Appointment Bot", type: "appointment", description: "Handles patient booking and reminders", channels: ["whatsapp", "web", "telegram"] }], agents: [{ name: "Patient Coordinator", role: "patient_coordinator", description: "Manages patient communications and scheduling", tools: ["crm", "calendar", "email"] }], automations: [{ name: "Appointment Reminder", description: "Send reminder 24h before appointment", trigger: { type: "schedule", config: { before: "24h" } } }], website: { template: "dental", pages: ["Home", "Services", "Doctors", "Book Appointment", "Contact"], features: ["online_booking"] } },
  restaurant: { name: "Restaurant", industry: "restaurant", crm: { entities: [
    { name: "guests", displayName: "Guests", icon: "users", color: "#ef4444", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "phone", type: "phone", label: "Phone", required: true }, { name: "email", type: "email", label: "Email" }] },
    { name: "reservations", displayName: "Reservations", icon: "calendar", color: "#f59e0b", fields: [{ name: "guest", type: "text", label: "Guest", required: true }, { name: "date", type: "datetime", label: "Date & Time", required: true }, { name: "party_size", type: "number", label: "Party Size", required: true }, { name: "status", type: "select", label: "Status", options: [{ label: "Confirmed", value: "confirmed" }, { label: "Pending", value: "pending" }, { label: "Cancelled", value: "cancelled" }] }] },
  ] }, bots: [{ name: "Reservation Bot", type: "booking", description: "Handles table reservations", channels: ["whatsapp", "web", "instagram"] }], agents: [{ name: "Floor Manager", role: "floor_manager", description: "Manages reservations and table assignments", tools: ["crm", "calendar"] }], automations: [{ name: "Reservation Confirmation", description: "Auto-confirm and remind guests", trigger: { type: "event", config: { event: "reservation.created" } } }], website: { template: "restaurant", pages: ["Home", "Menu", "Reservations", "Gallery", "Contact"], features: ["menu_display", "online_reservations"] } },
  ecommerce: { name: "E-Commerce Store", industry: "ecommerce", crm: { entities: [
    { name: "customers", displayName: "Customers", icon: "users", color: "#3b82f6", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "email", type: "email", label: "Email", required: true }, { name: "total_spent", type: "currency", label: "Total Spent" }] },
    { name: "orders", displayName: "Orders", icon: "shopping-cart", color: "#10b981", fields: [{ name: "customer", type: "text", label: "Customer", required: true }, { name: "total", type: "currency", label: "Total", required: true }, { name: "status", type: "select", label: "Status", options: [{ label: "Pending", value: "pending" }, { label: "Shipped", value: "shipped" }, { label: "Delivered", value: "delivered" }] }] },
  ] }, bots: [{ name: "Sales Bot", type: "sales", description: "Product recommendations and order tracking", channels: ["web", "whatsapp"] }], agents: [{ name: "Sales Agent", role: "sales", description: "Handles product inquiries", tools: ["crm", "email"] }], automations: [{ name: "Abandoned Cart Recovery", description: "Email sequence for abandoned carts", trigger: { type: "event", config: { event: "cart.abandoned" } } }], website: { template: "ecommerce", pages: ["Home", "Shop", "Cart", "Checkout", "Contact"], features: ["product_catalog", "cart"] } },
  fitness: { name: "Fitness Club", industry: "fitness", crm: { entities: [
    { name: "members", displayName: "Members", icon: "user", color: "#10b981", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "phone", type: "phone", label: "Phone", required: true }, { name: "membership", type: "select", label: "Membership", options: [{ label: "Basic", value: "basic" }, { label: "Premium", value: "premium" }] }] },
  ] }, bots: [{ name: "Membership Bot", type: "sales", description: "Handles membership inquiries", channels: ["web", "whatsapp"] }], agents: [{ name: "Member Success Agent", role: "member_success", description: "Tracks engagement and retention", tools: ["crm", "email"] }], automations: [{ name: "Renewal Reminder", description: "Remind before membership expires", trigger: { type: "schedule", config: { before: "7d" } } }], website: { template: "fitness", pages: ["Home", "Classes", "Membership", "Schedule", "Contact"], features: ["class_schedule"] } },
  realestate: { name: "Real Estate Agency", industry: "realestate", crm: { entities: [
    { name: "leads", displayName: "Leads", icon: "user", color: "#3b82f6", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "phone", type: "phone", label: "Phone", required: true }, { name: "budget", type: "currency", label: "Budget" }] },
    { name: "properties", displayName: "Properties", icon: "home", color: "#10b981", fields: [{ name: "title", type: "text", label: "Title", required: true }, { name: "price", type: "currency", label: "Price", required: true }, { name: "bedrooms", type: "number", label: "Bedrooms" }] },
  ] }, bots: [{ name: "Property Bot", type: "sales", description: "Shows properties and schedules viewings", channels: ["web", "whatsapp"] }], agents: [{ name: "Lead Qualifier", role: "lead_qualifier", description: "Qualifies leads and assigns to agents", tools: ["crm", "email"] }], automations: [{ name: "New Listing Alert", description: "Notify matching leads about new properties", trigger: { type: "event", config: { event: "property.created" } } }], website: { template: "realestate", pages: ["Home", "Properties", "Agents", "Contact"], features: ["property_search"] } },
  spa: { name: "SPA & Wellness", industry: "spa", crm: { entities: [
    { name: "clients", displayName: "Clients", icon: "user", color: "#ec4899", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "phone", type: "phone", label: "Phone", required: true }] },
    { name: "bookings", displayName: "Bookings", icon: "calendar", color: "#8b5cf6", fields: [{ name: "client", type: "text", label: "Client", required: true }, { name: "service", type: "select", label: "Service", options: [{ label: "Massage", value: "massage" }, { label: "Facial", value: "facial" }] }, { name: "date", type: "datetime", label: "Date", required: true }] },
  ] }, bots: [{ name: "Booking Bot", type: "booking", description: "Handles service booking", channels: ["whatsapp", "web"] }], agents: [{ name: "Client Care Agent", role: "client_care", description: "Manages client relationships", tools: ["crm", "email"] }], automations: [{ name: "Booking Reminder", description: "Remind before appointments", trigger: { type: "schedule", config: { before: "24h" } } }], website: { template: "spa", pages: ["Home", "Services", "Book Now", "Gallery", "Contact"], features: ["online_booking"] } },
  legal: { name: "Law Firm", industry: "legal", crm: { entities: [
    { name: "clients", displayName: "Clients", icon: "user", color: "#1e40af", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "phone", type: "phone", label: "Phone", required: true }] },
    { name: "cases", displayName: "Cases", icon: "briefcase", color: "#f59e0b", fields: [{ name: "title", type: "text", label: "Title", required: true }, { name: "client", type: "text", label: "Client", required: true }, { name: "status", type: "select", label: "Status", options: [{ label: "Open", value: "open" }, { label: "Closed", value: "closed" }] }] },
  ] }, bots: [{ name: "Intake Bot", type: "lead_capture", description: "Collects case details", channels: ["web"] }], agents: [{ name: "Case Manager", role: "case_manager", description: "Tracks deadlines and documents", tools: ["crm", "calendar"] }], automations: [{ name: "Deadline Alert", description: "Alert about upcoming deadlines", trigger: { type: "schedule", config: { before: "3d" } } }], website: { template: "legal", pages: ["Home", "Practice Areas", "Attorneys", "Consultation", "Contact"], features: ["consultation_booking"] } },
};

function detectIndustry(desc) {
  const l = desc.toLowerCase();
  const map = { dental: ["dental", "dentist", "стоматолог"], restaurant: ["restaurant", "cafe", "ресторан", "кафе"], ecommerce: ["e-commerce", "shop", "store", "магазин"], fitness: ["fitness", "gym", "фитнес", "зал"], realestate: ["real estate", "property", "недвижимость"], spa: ["spa", "massage", "beauty", "салон", "спа"], legal: ["law", "legal", "attorney", "юридическ"] };
  for (const [k, v] of Object.entries(map)) { if (v.some(w => l.includes(w))) return k; }
  return null;
}

function genericTemplate(desc) {
  return { name: desc, industry: "general", crm: { entities: [
    { name: "contacts", displayName: "Contacts", icon: "user", color: "#6366f1", fields: [{ name: "name", type: "text", label: "Name", required: true }, { name: "email", type: "email", label: "Email" }, { name: "phone", type: "phone", label: "Phone" }, { name: "status", type: "select", label: "Status", options: [{ label: "Lead", value: "lead" }, { label: "Customer", value: "customer" }] }] },
    { name: "deals", displayName: "Deals", icon: "trending-up", color: "#10b981", fields: [{ name: "title", type: "text", label: "Title", required: true }, { name: "value", type: "currency", label: "Value" }, { name: "stage", type: "select", label: "Stage", options: [{ label: "New", value: "new" }, { label: "Won", value: "won" }] }] },
  ] }, bots: [{ name: "Lead Capture Bot", type: "lead_capture", description: "Captures and qualifies leads", channels: ["web", "whatsapp"] }], agents: [{ name: "Business Assistant", role: "assistant", description: "Helps with daily operations", tools: ["crm", "email"] }], automations: [{ name: "Lead Follow-up", description: "Auto follow-up for new leads", trigger: { type: "event", config: { event: "contact.created" } } }], website: { template: "business", pages: ["Home", "Services", "About", "Contact"], features: ["contact_form"] } };
}

app.post("/api/generator", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { description, industry: ind } = req.body;
    const detected = ind || detectIndustry(description || "");
    const tpl = (detected && INDUSTRIES[detected]) || genericTemplate(description || "My Business");
    res.json({ success: true, data: { preview: { ...tpl, estimatedSetupTime: "45 seconds", componentCount: { entities: tpl.crm.entities.length, bots: tpl.bots.length, agents: tpl.agents.length, automations: tpl.automations.length, websitePages: tpl.website.pages.length } }, autoDetected: !ind, industry: detected || "general" } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

app.put("/api/generator", async (req, res) => {
  try {
    const payload = requireAuth(req, res); if (!payload) return;
    const { workspaceId, preview } = req.body;
    if (!workspaceId || !preview) return res.status(400).json({ success: false, error: "workspaceId and preview required" });
    const results = { modules: [] };

    for (const e of preview.crm.entities) {
      const ent = await prisma.crmEntity.create({ data: { workspaceId, name: e.name, displayName: e.displayName, icon: e.icon || "database", color: e.color || "#6366f1", fields: J(e.fields || []), settings: J({}) } });
      results.modules.push({ type: "crm_entity", id: ent.id, name: ent.displayName });
    }
    for (const b of preview.bots) {
      const bot = await prisma.aiBot.create({ data: { workspaceId, name: b.name, type: b.type || "custom", description: b.description, channels: J(b.channels || []), personality: J({}), flows: J([]), config: J({}) } });
      results.modules.push({ type: "bot", id: bot.id, name: bot.name });
    }
    for (const a of preview.agents) {
      const agent = await prisma.aiAgent.create({ data: { workspaceId, name: a.name, role: a.role, description: a.description, tools: J(a.tools || []), personality: J({}), capabilities: J([]), memory: J({}), config: J({}) } });
      results.modules.push({ type: "agent", id: agent.id, name: agent.name });
    }
    for (const a of preview.automations) {
      const auto = await prisma.automation.create({ data: { workspaceId, name: a.name, description: a.description, trigger: J(a.trigger || {}), nodes: J([]), connections: J([]) } });
      results.modules.push({ type: "automation", id: auto.id, name: auto.name });
    }
    const website = await prisma.website.create({ data: { workspaceId, name: preview.name, slug: preview.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), templateId: preview.website?.template, config: J(preview.website || {}), pages: J((preview.website?.pages || []).map((p, i) => ({ id: p.toLowerCase().replace(/\s+/g, "-"), name: p, slug: i === 0 ? "/" : "/" + p.toLowerCase().replace(/\s+/g, "-"), isHome: i === 0, sections: i === 0 ? [{ id: "hero", type: "hero", props: { title: preview.name, subtitle: "Welcome" } }] : [{ id: "content", type: "content", props: { title: p } }] }))), styles: J({}), seo: J({}) } });
    results.modules.push({ type: "website", id: website.id, name: website.name });

    res.json({ success: true, data: { deployed: true, results } });
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: "Internal server error" }); }
});

// ── Integrations ──────────────────────────────────────────────────

app.get("/api/integrations/status", (req, res) => {
  res.json({ success: true, data: { openai: false, claude: false, telegram: false, whatsapp: false, stripe: false, email: false } });
});

// ── Static frontend ───────────────────────────────────────────────

// Serve dist/index.html for all non-API routes
app.use(express.static(path.join(__dirname, "dist")));
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ success: false, error: "Not found" });
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Nexus OS Business running at http://localhost:${PORT}`);
  console.log(`\n📋 Demo credentials:`);
  console.log(`   📧 Email:    demo@nexusos.com`);
  console.log(`   🔑 Password: demo1234\n`);
});
