// Seed script for Nexus OS Business (JSON-file DB)
// Run: node prisma/seed.js

const bcrypt = require("bcryptjs");
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const DB_DIR = join(process.cwd(), ".data");
const DB_FILE = join(DB_DIR, "db.json");

function id() { return Math.random().toString(36).slice(2, 11) + Date.now().toString(36); }
function now() { return new Date().toISOString(); }

async function seed() {
  console.log("🌱 Seeding Nexus OS Business...");

  const demoId = id(), orgId = id(), wsId = id(), subId = id();
  const pwHash = await bcrypt.hash("demo1234", 12);

  const contactsEntityId = id(), dealsEntityId = id(), tasksEntityId = id();

  const db = {
    users: [{ id: demoId, email: "demo@nexusos.com", name: "Demo User", passwordHash: pwHash, emailVerified: true, mfaEnabled: false, createdAt: now(), updatedAt: now() }],
    organizations: [{ id: orgId, name: "Demo Organization", slug: "demo-org", settings: "{}", createdAt: now(), updatedAt: now() }],
    workspaces: [{ id: wsId, organizationId: orgId, name: "My Workspace", slug: "default", settings: "{}", createdAt: now(), updatedAt: now() }],
    members: [{ id: id(), workspaceId: wsId, userId: demoId, role: "owner", permissions: '["*"]', joinedAt: now() }],
    subscriptions: [{ id: subId, organizationId: orgId, plan: "professional", status: "active", createdAt: now() }],
    crmEntities: [
      { id: contactsEntityId, workspaceId: wsId, name: "contacts", displayName: "Contacts", icon: "user", color: "#6366f1",
        fields: JSON.stringify([
          { name: "first_name", type: "text", label: "First Name", required: true },
          { name: "last_name", type: "text", label: "Last Name", required: true },
          { name: "email", type: "email", label: "Email" },
          { name: "phone", type: "phone", label: "Phone" },
          { name: "company", type: "text", label: "Company" },
          { name: "status", type: "select", label: "Status", required: true, options: [{ label: "Lead", value: "lead" }, { label: "Customer", value: "customer" }, { label: "Partner", value: "partner" }] },
        ]), settings: "{}", isSystem: false, createdAt: now(), updatedAt: now() },
      { id: dealsEntityId, workspaceId: wsId, name: "deals", displayName: "Deals", icon: "trending-up", color: "#10b981",
        fields: JSON.stringify([
          { name: "title", type: "text", label: "Deal Title", required: true },
          { name: "value", type: "currency", label: "Value", required: true },
          { name: "contact", type: "text", label: "Contact" },
          { name: "stage", type: "select", label: "Stage", required: true, options: [{ label: "New", value: "new" }, { label: "Qualified", value: "qualified" }, { label: "Proposal", value: "proposal" }, { label: "Won", value: "won" }, { label: "Lost", value: "lost" }] },
          { name: "probability", type: "percent", label: "Probability" },
        ]), settings: "{}", isSystem: false, createdAt: now(), updatedAt: now() },
      { id: tasksEntityId, workspaceId: wsId, name: "tasks", displayName: "Tasks", icon: "check-square", color: "#f59e0b",
        fields: JSON.stringify([
          { name: "title", type: "text", label: "Title", required: true },
          { name: "description", type: "textarea", label: "Description" },
          { name: "due_date", type: "date", label: "Due Date" },
          { name: "priority", type: "select", label: "Priority", required: true, options: [{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }] },
          { name: "status", type: "select", label: "Status", required: true, options: [{ label: "To Do", value: "todo" }, { label: "In Progress", value: "in_progress" }, { label: "Done", value: "done" }] },
        ]), settings: "{}", isSystem: false, createdAt: now(), updatedAt: now() },
    ],
    crmRecords: [
      ...[
        { first_name: "Alice", last_name: "Johnson", email: "alice@example.com", phone: "+1 555-0101", company: "TechCorp", status: "customer" },
        { first_name: "Bob", last_name: "Smith", email: "bob@example.com", phone: "+1 555-0102", company: "StartupXYZ", status: "lead" },
        { first_name: "Carol", last_name: "Williams", email: "carol@example.com", phone: "+1 555-0103", company: "BigCo", status: "partner" },
        { first_name: "David", last_name: "Brown", email: "david@example.com", phone: "+1 555-0104", company: "NewVenture", status: "lead" },
        { first_name: "Eva", last_name: "Martinez", email: "eva@example.com", phone: "+1 555-0105", company: "GlobalInc", status: "customer" },
      ].map((d) => ({ id: id(), workspaceId: wsId, entityId: contactsEntityId, data: JSON.stringify(d), createdAt: now(), updatedAt: now() })),
      ...[
        { title: "Enterprise License", value: 50000, contact: "Alice Johnson", stage: "proposal", probability: 75 },
        { title: "Startup Package", value: 12000, contact: "Bob Smith", stage: "qualified", probability: 50 },
        { title: "Consulting Project", value: 25000, contact: "Carol Williams", stage: "won", probability: 100 },
        { title: "Annual Subscription", value: 8000, contact: "David Brown", stage: "new", probability: 30 },
      ].map((d) => ({ id: id(), workspaceId: wsId, entityId: dealsEntityId, data: JSON.stringify(d), createdAt: now(), updatedAt: now() })),
      ...[
        { title: "Prepare proposal for TechCorp", description: "Include enterprise pricing", due_date: "2026-07-20", priority: "high", status: "in_progress" },
        { title: "Follow up with Bob", description: "Discuss startup package details", due_date: "2026-07-18", priority: "medium", status: "todo" },
        { title: "Send contract to BigCo", description: "", due_date: "2026-07-22", priority: "high", status: "todo" },
      ].map((d) => ({ id: id(), workspaceId: wsId, entityId: tasksEntityId, data: JSON.stringify(d), createdAt: now(), updatedAt: now() })),
    ],
    crmViews: [],
    websites: [{
      id: id(), workspaceId: wsId, name: "My Business Website", slug: "my-business", templateId: "business", published: true,
      config: "{}",
      pages: JSON.stringify([
        { id: "home", name: "Home", slug: "/", isHome: true, sections: [
          { id: "hero", type: "hero", props: { title: "Welcome to Our Business", subtitle: "We provide the best services", cta: "Get Started" } },
          { id: "features", type: "features", props: { title: "Why Choose Us", items: ["Professional Team", "24/7 Support", "Best Prices"] } },
          { id: "contact", type: "contact", props: { title: "Get In Touch" } },
        ]},
        { id: "about", name: "About", slug: "/about", isHome: false, sections: [{ id: "content", type: "content", props: { title: "About Us" } }] },
        { id: "services", name: "Services", slug: "/services", isHome: false, sections: [{ id: "content", type: "content", props: { title: "Our Services" } }] },
      ]),
      styles: JSON.stringify({ primaryColor: "#6366f1" }), seo: JSON.stringify({ title: "My Business", description: "Professional services" }),
      createdAt: now(), updatedAt: now(),
    }],
    automations: [
      { id: id(), workspaceId: wsId, name: "Lead Follow-up", description: "Send follow-up email to new leads after 24h",
        trigger: JSON.stringify({ type: "event", config: { event: "contact.created", delay: "24h" } }),
        nodes: JSON.stringify([{ id: "t1", type: "trigger", name: "New Contact" }, { id: "e1", type: "send_email", name: "Send Follow-up" }]),
        connections: JSON.stringify([{ id: "c1", source: "t1", target: "e1" }]),
        active: true, executions: 12, createdAt: now(), updatedAt: now() },
      { id: id(), workspaceId: wsId, name: "Deal Won Notification", description: "Notify team when a deal is won",
        trigger: JSON.stringify({ type: "event", config: { event: "deal.won" } }),
        nodes: JSON.stringify([{ id: "t1", type: "trigger", name: "Deal Won" }, { id: "n1", type: "notification", name: "Notify Team" }]),
        connections: JSON.stringify([{ id: "c1", source: "t1", target: "n1" }]),
        active: true, executions: 5, createdAt: now(), updatedAt: now() },
    ],
    automationRuns: [],
    aiBots: [{
      id: id(), workspaceId: wsId, name: "Support Bot", type: "support",
      description: "Handles customer support inquiries and escalates to humans",
      personality: JSON.stringify({ tone: "friendly", language: "en" }),
      channels: JSON.stringify(["web", "whatsapp"]),
      flows: JSON.stringify([{ id: "greeting", name: "Greeting", message: "Hi! How can I help?" }]),
      config: "{}", active: true, createdAt: now(), updatedAt: now(),
    }],
    aiAgents: [{
      id: id(), workspaceId: wsId, name: "Sales Assistant", role: "sales",
      description: "Helps with lead qualification, outreach, and deal management",
      systemPrompt: "You are a professional sales assistant. Help qualify leads and track deal progress.",
      personality: "{}", tools: JSON.stringify(["crm", "email", "calendar"]),
      capabilities: JSON.stringify(["lead_qualification", "email_drafting"]),
      memory: "{}", config: "{}", active: true, createdAt: now(), updatedAt: now(),
    }],
    marketplaceItems: [
      { id: id(), publisherId: demoId, type: "package", name: "Dental Clinic Pro", slug: "dental-clinic-pro",
        description: "Complete dental clinic with CRM, website, appointment bot, and automations",
        category: "package", tags: JSON.stringify(["dental", "healthcare"]), priceModel: "free", version: "1.0.0",
        blueprint: "{}", ratingAvg: 4.9, ratingCount: 124, installCount: 1240, status: "published", publishedAt: now(), createdAt: now(), updatedAt: now() },
      { id: id(), publisherId: demoId, type: "crm_template", name: "Real Estate CRM", slug: "real-estate-crm",
        description: "CRM template for real estate agencies with properties, leads, and deals",
        category: "crm_template", tags: JSON.stringify(["real estate"]), priceModel: "one_time", priceAmount: 49, version: "1.2.0",
        blueprint: "{}", ratingAvg: 4.7, ratingCount: 89, installCount: 560, status: "published", publishedAt: now(), createdAt: now(), updatedAt: now() },
      { id: id(), publisherId: demoId, type: "bot", name: "Sales Closer Bot", slug: "sales-closer-bot",
        description: "AI-powered sales bot that qualifies leads and closes deals 24/7",
        category: "bot", tags: JSON.stringify(["sales", "ai"]), priceModel: "subscription", priceAmount: 39, version: "2.1.0",
        blueprint: "{}", ratingAvg: 4.8, ratingCount: 67, installCount: 340, status: "published", publishedAt: now(), createdAt: now(), updatedAt: now() },
    ],
    marketplaceReviews: [],
    smartPackages: [],
    auditLogs: [],
  };

  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  console.log("✅ Database seeded!");
  console.log(`   📧 Email:    demo@nexusos.com`);
  console.log(`   🔑 Password: demo1234`);
  console.log(`   📊 CRM:      3 entities, 12 records`);
  console.log(`   🌐 Website:  1 website (3 pages)`);
  console.log(`   ⚡ Automations: 2 workflows`);
  console.log(`   🤖 AI Bot:   1 support bot`);
  console.log(`   👤 AI Agent: 1 sales assistant`);
  console.log(`   🛒 Marketplace: 3 items`);
}

seed().catch(console.error);
