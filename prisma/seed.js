// Seed script for Nexus OS Business (PostgreSQL via Prisma)
// Run: node prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding Nexus OS Business (PostgreSQL)...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.smartPackage.deleteMany();
  await prisma.marketplaceReview.deleteMany();
  await prisma.marketplaceItem.deleteMany();
  await prisma.aiAgent.deleteMany();
  await prisma.aiBot.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.website.deleteMany();
  await prisma.crmRecord.deleteMany();
  await prisma.crmEntity.deleteMany();
  await prisma.member.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const pwHash = await bcrypt.hash("demo1234", 12);

  // Create user
  const user = await prisma.user.create({
    data: { email: "demo@nexusos.com", name: "Demo User", passwordHash: pwHash, emailVerified: true },
  });
  console.log(`  ✓ User: ${user.email}`);

  // Create org + workspace
  const org = await prisma.organization.create({
    data: {
      name: "Demo Organization", slug: "demo-org",
      subscriptions: { create: { plan: "professional", status: "active" } },
      workspaces: {
        create: {
          name: "My Workspace", slug: "default",
          members: { create: { userId: user.id, role: "owner", permissions: ["*"] } },
        },
      },
    },
    include: { workspaces: true },
  });
  const ws = org.workspaces[0];
  console.log(`  ✓ Organization: ${org.name}`);
  console.log(`  ✓ Workspace: ${ws.name}`);

  // CRM Entities
  const contacts = await prisma.crmEntity.create({
    data: {
      workspaceId: ws.id, name: "contacts", displayName: "Contacts", icon: "user", color: "#6366f1",
      fields: [
        { name: "first_name", type: "text", label: "First Name", required: true },
        { name: "last_name", type: "text", label: "Last Name", required: true },
        { name: "email", type: "email", label: "Email" },
        { name: "phone", type: "phone", label: "Phone" },
        { name: "company", type: "text", label: "Company" },
        { name: "status", type: "select", label: "Status", required: true, options: [{ label: "Lead", value: "lead" }, { label: "Customer", value: "customer" }, { label: "Partner", value: "partner" }] },
      ],
    },
  });

  const deals = await prisma.crmEntity.create({
    data: {
      workspaceId: ws.id, name: "deals", displayName: "Deals", icon: "trending-up", color: "#10b981",
      fields: [
        { name: "title", type: "text", label: "Deal Title", required: true },
        { name: "value", type: "currency", label: "Value", required: true },
        { name: "contact", type: "text", label: "Contact" },
        { name: "stage", type: "select", label: "Stage", required: true, options: [{ label: "New", value: "new" }, { label: "Qualified", value: "qualified" }, { label: "Proposal", value: "proposal" }, { label: "Won", value: "won" }, { label: "Lost", value: "lost" }] },
      ],
    },
  });

  const tasks = await prisma.crmEntity.create({
    data: {
      workspaceId: ws.id, name: "tasks", displayName: "Tasks", icon: "check-square", color: "#f59e0b",
      fields: [
        { name: "title", type: "text", label: "Title", required: true },
        { name: "description", type: "textarea", label: "Description" },
        { name: "due_date", type: "date", label: "Due Date" },
        { name: "priority", type: "select", label: "Priority", required: true, options: [{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }] },
        { name: "status", type: "select", label: "Status", required: true, options: [{ label: "To Do", value: "todo" }, { label: "In Progress", value: "in_progress" }, { label: "Done", value: "done" }] },
      ],
    },
  });
  console.log(`  ✓ CRM Entities: Contacts, Deals, Tasks`);

  // Sample records
  const contactData = [
    { first_name: "Alice", last_name: "Johnson", email: "alice@example.com", phone: "+1 555-0101", company: "TechCorp", status: "customer" },
    { first_name: "Bob", last_name: "Smith", email: "bob@example.com", phone: "+1 555-0102", company: "StartupXYZ", status: "lead" },
    { first_name: "Carol", last_name: "Williams", email: "carol@example.com", phone: "+1 555-0103", company: "BigCo", status: "partner" },
    { first_name: "David", last_name: "Brown", email: "david@example.com", phone: "+1 555-0104", company: "NewVenture", status: "lead" },
    { first_name: "Eva", last_name: "Martinez", email: "eva@example.com", phone: "+1 555-0105", company: "GlobalInc", status: "customer" },
  ];
  for (const d of contactData) {
    await prisma.crmRecord.create({ data: { workspaceId: ws.id, entityId: contacts.id, data: d } });
  }

  const dealData = [
    { title: "Enterprise License", value: 50000, contact: "Alice Johnson", stage: "proposal" },
    { title: "Startup Package", value: 12000, contact: "Bob Smith", stage: "qualified" },
    { title: "Consulting Project", value: 25000, contact: "Carol Williams", stage: "won" },
    { title: "Annual Subscription", value: 8000, contact: "David Brown", stage: "new" },
  ];
  for (const d of dealData) {
    await prisma.crmRecord.create({ data: { workspaceId: ws.id, entityId: deals.id, data: d } });
  }

  const taskData = [
    { title: "Prepare proposal for TechCorp", priority: "high", status: "in_progress", due_date: "2026-07-20" },
    { title: "Follow up with Bob", priority: "medium", status: "todo", due_date: "2026-07-18" },
    { title: "Send contract to BigCo", priority: "high", status: "todo", due_date: "2026-07-22" },
  ];
  for (const d of taskData) {
    await prisma.crmRecord.create({ data: { workspaceId: ws.id, entityId: tasks.id, data: d } });
  }
  console.log(`  ✓ Records: 5 contacts, 4 deals, 3 tasks`);

  // Automations
  await prisma.automation.create({
    data: {
      workspaceId: ws.id, name: "Lead Follow-up", description: "Send follow-up email to new leads after 24h",
      trigger: { type: "event", event: "contact.created" },
      nodes: [{ id: "t1", type: "trigger" }, { id: "e1", type: "send_email" }],
      connections: [{ id: "c1", from: "t1", to: "e1" }],
      active: true, executions: 12,
    },
  });
  await prisma.automation.create({
    data: {
      workspaceId: ws.id, name: "Deal Won Notification", description: "Notify team when deal is won",
      trigger: { type: "event", event: "deal.won" },
      nodes: [{ id: "t1", type: "trigger" }, { id: "n1", type: "notification" }],
      connections: [{ id: "c1", from: "t1", to: "n1" }],
      active: true, executions: 5,
    },
  });
  console.log(`  ✓ Automations: 2 workflows`);

  // AI Bots
  await prisma.aiBot.create({
    data: {
      workspaceId: ws.id, name: "Support Bot", type: "support",
      description: "Handles customer support inquiries",
      personality: { tone: "friendly" }, channels: ["web", "whatsapp"], active: true,
    },
  });
  console.log(`  ✓ AI Bot: Support Bot`);

  // AI Agents
  await prisma.aiAgent.create({
    data: {
      workspaceId: ws.id, name: "Sales Assistant", role: "sales",
      description: "Lead qualification and deal management",
      systemPrompt: "You are a professional sales assistant.",
      tools: ["crm", "email", "calendar"], capabilities: ["lead_qualification"], active: true,
    },
  });
  console.log(`  ✓ AI Agent: Sales Assistant`);

  // Website
  await prisma.website.create({
    data: {
      workspaceId: ws.id, name: "My Business Website", slug: "my-business", templateId: "business", published: true,
      pages: [
        { id: "home", name: "Home", slug: "/", isHome: true, sections: [
          { id: "hero", type: "hero", props: { title: "Welcome to Our Business", subtitle: "We provide the best services" } },
          { id: "features", type: "features", props: { title: "Why Choose Us" } },
          { id: "contact", type: "contact", props: { title: "Get In Touch" } },
        ]},
        { id: "about", name: "About", slug: "/about", isHome: false, sections: [{ id: "content", type: "content", props: { title: "About Us" } }] },
      ],
      styles: { primaryColor: "#6366f1" },
      seo: { title: "My Business", description: "Professional services" },
    },
  });
  console.log(`  ✓ Website: My Business Website`);

  // Marketplace
  const mktItems = [
    { type: "package", name: "Dental Clinic Pro", slug: "dental-clinic-pro", description: "Complete dental clinic with CRM, website, appointment bot", category: "healthcare", ratingAvg: 4.9, ratingCount: 124, installCount: 1240, status: "published", publishedAt: new Date() },
    { type: "crm_template", name: "Real Estate CRM", slug: "real-estate-crm", description: "CRM for agencies with properties, leads, deals", category: "realestate", ratingAvg: 4.7, ratingCount: 89, installCount: 560, status: "published", publishedAt: new Date() },
    { type: "bot", name: "Sales Closer Bot", slug: "sales-closer-bot", description: "AI sales bot that qualifies and closes 24/7", category: "sales", ratingAvg: 4.8, ratingCount: 67, installCount: 340, status: "published", publishedAt: new Date() },
  ];
  for (const item of mktItems) {
    await prisma.marketplaceItem.create({ data: { publisherId: user.id, ...item } });
  }
  console.log(`  ✓ Marketplace: 3 items`);

  console.log("\n✅ Database seeded!");
  console.log(`\n📋 Demo credentials:`);
  console.log(`   📧 Email:    demo@nexusos.com`);
  console.log(`   🔑 Password: demo1234`);
}

seed()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
