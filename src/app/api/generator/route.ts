import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

const INDUSTRIES: Record<string, any> = {
  dental: {
    name: "Dental Clinic", industry: "dental",
    crm: { entities: [
      { name: "patients", displayName: "Patients", icon: "user", color: "#10b981", fields: [
        { name: "first_name", type: "text", label: "First Name", required: true },
        { name: "last_name", type: "text", label: "Last Name", required: true },
        { name: "phone", type: "phone", label: "Phone", required: true },
        { name: "email", type: "email", label: "Email" },
        { name: "insurance", type: "text", label: "Insurance" },
        { name: "status", type: "select", label: "Status", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
      ]},
      { name: "appointments", displayName: "Appointments", icon: "calendar", color: "#6366f1", fields: [
        { name: "patient", type: "text", label: "Patient", required: true },
        { name: "doctor", type: "text", label: "Doctor", required: true },
        { name: "date", type: "datetime", label: "Date & Time", required: true },
        { name: "type", type: "select", label: "Type", options: [{ label: "Checkup", value: "checkup" }, { label: "Cleaning", value: "cleaning" }, { label: "Filling", value: "filling" }, { label: "Consultation", value: "consultation" }] },
        { name: "status", type: "select", label: "Status", options: [{ label: "Scheduled", value: "scheduled" }, { label: "Confirmed", value: "confirmed" }, { label: "Completed", value: "completed" }, { label: "Cancelled", value: "cancelled" }] },
      ]},
      { name: "treatments", displayName: "Treatments", icon: "activity", color: "#f59e0b", fields: [
        { name: "patient", type: "text", label: "Patient", required: true },
        { name: "procedure", type: "text", label: "Procedure", required: true },
        { name: "cost", type: "currency", label: "Cost" },
        { name: "status", type: "select", label: "Status", options: [{ label: "Planned", value: "planned" }, { label: "Completed", value: "completed" }] },
      ]},
    ]},
    bots: [{ name: "Appointment Bot", type: "appointment", description: "Handles patient booking and reminders", channels: ["whatsapp", "web", "telegram"] }],
    agents: [{ name: "Patient Coordinator", role: "patient_coordinator", description: "Manages patient communications and scheduling", tools: ["crm", "calendar", "email"] }],
    automations: [
      { name: "Appointment Reminder", description: "Send reminder 24h before appointment", trigger: { type: "schedule", config: { before: "24h" } } },
      { name: "New Patient Welcome", description: "Welcome sequence for new patients", trigger: { type: "event", config: { event: "patient.created" } } },
    ],
    website: { template: "dental", pages: ["Home", "Services", "Doctors", "Book Appointment", "Contact"], features: ["online_booking", "patient_portal"] },
  },
  restaurant: {
    name: "Restaurant", industry: "restaurant",
    crm: { entities: [
      { name: "guests", displayName: "Guests", icon: "users", color: "#ef4444", fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "phone", type: "phone", label: "Phone", required: true },
        { name: "email", type: "email", label: "Email" },
        { name: "preferences", type: "textarea", label: "Preferences" },
      ]},
      { name: "reservations", displayName: "Reservations", icon: "calendar", color: "#f59e0b", fields: [
        { name: "guest", type: "text", label: "Guest", required: true },
        { name: "date", type: "datetime", label: "Date & Time", required: true },
        { name: "party_size", type: "number", label: "Party Size", required: true },
        { name: "status", type: "select", label: "Status", options: [{ label: "Confirmed", value: "confirmed" }, { label: "Pending", value: "pending" }, { label: "Cancelled", value: "cancelled" }] },
      ]},
    ]},
    bots: [{ name: "Reservation Bot", type: "booking", description: "Handles table reservations and waitlist", channels: ["whatsapp", "web", "instagram"] }],
    agents: [{ name: "Floor Manager", role: "floor_manager", description: "Manages reservations and table assignments", tools: ["crm", "calendar"] }],
    automations: [
      { name: "Reservation Confirmation", description: "Auto-confirm and remind guests", trigger: { type: "event", config: { event: "reservation.created" } } },
      { name: "Review Request", description: "Ask for review after dining", trigger: { type: "schedule", config: { after: "2h" } } },
    ],
    website: { template: "restaurant", pages: ["Home", "Menu", "Reservations", "Gallery", "Contact"], features: ["menu_display", "online_reservations"] },
  },
  ecommerce: {
    name: "E-Commerce Store", industry: "ecommerce",
    crm: { entities: [
      { name: "customers", displayName: "Customers", icon: "users", color: "#3b82f6", fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "email", type: "email", label: "Email", required: true },
        { name: "total_spent", type: "currency", label: "Total Spent" },
        { name: "segment", type: "select", label: "Segment", options: [{ label: "New", value: "new" }, { label: "Returning", value: "returning" }, { label: "VIP", value: "vip" }] },
      ]},
      { name: "orders", displayName: "Orders", icon: "shopping-cart", color: "#10b981", fields: [
        { name: "customer", type: "text", label: "Customer", required: true },
        { name: "total", type: "currency", label: "Total", required: true },
        { name: "status", type: "select", label: "Status", options: [{ label: "Pending", value: "pending" }, { label: "Shipped", value: "shipped" }, { label: "Delivered", value: "delivered" }] },
      ]},
    ]},
    bots: [{ name: "Sales Bot", type: "sales", description: "Product recommendations and order tracking", channels: ["web", "whatsapp"] }],
    agents: [{ name: "Sales Agent", role: "sales", description: "Handles product inquiries and cart recovery", tools: ["crm", "email"] }],
    automations: [
      { name: "Abandoned Cart Recovery", description: "Email sequence for abandoned carts", trigger: { type: "event", config: { event: "cart.abandoned", delay: "1h" } } },
    ],
    website: { template: "ecommerce", pages: ["Home", "Shop", "Cart", "Checkout", "Contact"], features: ["product_catalog", "cart", "checkout"] },
  },
  fitness: {
    name: "Fitness Club", industry: "fitness",
    crm: { entities: [
      { name: "members", displayName: "Members", icon: "user", color: "#10b981", fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "phone", type: "phone", label: "Phone", required: true },
        { name: "membership", type: "select", label: "Membership", options: [{ label: "Basic", value: "basic" }, { label: "Premium", value: "premium" }] },
        { name: "status", type: "select", label: "Status", options: [{ label: "Active", value: "active" }, { label: "Expired", value: "expired" }] },
      ]},
    ]},
    bots: [{ name: "Membership Bot", type: "sales", description: "Handles membership inquiries and renewals", channels: ["web", "whatsapp"] }],
    agents: [{ name: "Member Success Agent", role: "member_success", description: "Tracks engagement and handles retention", tools: ["crm", "email"] }],
    automations: [{ name: "Renewal Reminder", description: "Remind before membership expires", trigger: { type: "schedule", config: { before: "7d" } } }],
    website: { template: "fitness", pages: ["Home", "Classes", "Membership", "Schedule", "Contact"], features: ["class_schedule", "membership_plans"] },
  },
  realestate: {
    name: "Real Estate Agency", industry: "realestate",
    crm: { entities: [
      { name: "leads", displayName: "Leads", icon: "user", color: "#3b82f6", fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "phone", type: "phone", label: "Phone", required: true },
        { name: "budget", type: "currency", label: "Budget" },
        { name: "status", type: "select", label: "Status", options: [{ label: "New", value: "new" }, { label: "Contacted", value: "contacted" }, { label: "Viewing", value: "viewing" }] },
      ]},
      { name: "properties", displayName: "Properties", icon: "home", color: "#10b981", fields: [
        { name: "title", type: "text", label: "Title", required: true },
        { name: "price", type: "currency", label: "Price", required: true },
        { name: "bedrooms", type: "number", label: "Bedrooms" },
        { name: "status", type: "select", label: "Status", options: [{ label: "Available", value: "available" }, { label: "Sold", value: "sold" }] },
      ]},
    ]},
    bots: [{ name: "Property Bot", type: "sales", description: "Shows properties and schedules viewings", channels: ["web", "whatsapp"] }],
    agents: [{ name: "Lead Qualifier", role: "lead_qualifier", description: "Qualifies leads and assigns to agents", tools: ["crm", "email"] }],
    automations: [{ name: "New Listing Alert", description: "Notify matching leads about new properties", trigger: { type: "event", config: { event: "property.created" } } }],
    website: { template: "realestate", pages: ["Home", "Properties", "Agents", "Contact"], features: ["property_search", "lead_capture"] },
  },
  spa: {
    name: "SPA & Wellness", industry: "spa",
    crm: { entities: [
      { name: "clients", displayName: "Clients", icon: "user", color: "#ec4899", fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "phone", type: "phone", label: "Phone", required: true },
        { name: "membership", type: "select", label: "Membership", options: [{ label: "None", value: "none" }, { label: "Gold", value: "gold" }] },
      ]},
      { name: "bookings", displayName: "Bookings", icon: "calendar", color: "#8b5cf6", fields: [
        { name: "client", type: "text", label: "Client", required: true },
        { name: "service", type: "select", label: "Service", options: [{ label: "Massage", value: "massage" }, { label: "Facial", value: "facial" }] },
        { name: "date", type: "datetime", label: "Date", required: true },
        { name: "status", type: "select", label: "Status", options: [{ label: "Booked", value: "booked" }, { label: "Completed", value: "completed" }] },
      ]},
    ]},
    bots: [{ name: "Booking Bot", type: "booking", description: "Handles service booking and reminders", channels: ["whatsapp", "web"] }],
    agents: [{ name: "Client Care Agent", role: "client_care", description: "Manages client relationships and loyalty", tools: ["crm", "email"] }],
    automations: [{ name: "Booking Reminder", description: "Remind before appointments", trigger: { type: "schedule", config: { before: "24h" } } }],
    website: { template: "spa", pages: ["Home", "Services", "Book Now", "Gallery", "Contact"], features: ["online_booking", "gallery"] },
  },
  legal: {
    name: "Law Firm", industry: "legal",
    crm: { entities: [
      { name: "clients", displayName: "Clients", icon: "user", color: "#1e40af", fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "phone", type: "phone", label: "Phone", required: true },
      ]},
      { name: "cases", displayName: "Cases", icon: "briefcase", color: "#f59e0b", fields: [
        { name: "title", type: "text", label: "Title", required: true },
        { name: "client", type: "text", label: "Client", required: true },
        { name: "status", type: "select", label: "Status", options: [{ label: "Open", value: "open" }, { label: "Closed", value: "closed" }] },
      ]},
    ]},
    bots: [{ name: "Intake Bot", type: "lead_capture", description: "Collects case details and schedules consultations", channels: ["web"] }],
    agents: [{ name: "Case Manager", role: "case_manager", description: "Tracks deadlines and manages documents", tools: ["crm", "calendar"] }],
    automations: [{ name: "Deadline Alert", description: "Alert about upcoming deadlines", trigger: { type: "schedule", config: { before: "3d" } } }],
    website: { template: "legal", pages: ["Home", "Practice Areas", "Attorneys", "Consultation", "Contact"], features: ["consultation_booking"] },
  },
};

function detectIndustry(desc: string): string | null {
  const l = desc.toLowerCase();
  const map: Record<string, string[]> = {
    dental: ["dental", "dentist", "стоматолог", "зубн"], restaurant: ["restaurant", "cafe", "ресторан", "кафе"],
    ecommerce: ["e-commerce", "shop", "store", "магазин"], fitness: ["fitness", "gym", "фитнес", "зал"],
    realestate: ["real estate", "property", "недвижимость"], spa: ["spa", "massage", "beauty", "салон", "спа"],
    legal: ["law", "legal", "attorney", "юридическ"],
  };
  for (const [k, v] of Object.entries(map)) { if (v.some((w) => l.includes(w))) return k; }
  return null;
}

function genericTemplate(desc: string) {
  return {
    name: desc, industry: "general",
    crm: { entities: [
      { name: "contacts", displayName: "Contacts", icon: "user", color: "#6366f1", fields: [
        { name: "name", type: "text", label: "Name", required: true }, { name: "email", type: "email", label: "Email" },
        { name: "phone", type: "phone", label: "Phone" }, { name: "status", type: "select", label: "Status", options: [{ label: "Lead", value: "lead" }, { label: "Customer", value: "customer" }] },
      ]},
      { name: "deals", displayName: "Deals", icon: "trending-up", color: "#10b981", fields: [
        { name: "title", type: "text", label: "Title", required: true }, { name: "value", type: "currency", label: "Value" },
        { name: "stage", type: "select", label: "Stage", options: [{ label: "New", value: "new" }, { label: "Won", value: "won" }] },
      ]},
    ]},
    bots: [{ name: "Lead Capture Bot", type: "lead_capture", description: "Captures and qualifies leads", channels: ["web", "whatsapp"] }],
    agents: [{ name: "Business Assistant", role: "assistant", description: "Helps with daily operations", tools: ["crm", "email"] }],
    automations: [{ name: "Lead Follow-up", description: "Auto follow-up for new leads", trigger: { type: "event", config: { event: "contact.created" } } }],
    website: { template: "business", pages: ["Home", "Services", "About", "Contact"], features: ["contact_form"] },
  };
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const desc = body.description || "";
    const detected = body.industry || detectIndustry(desc);
    const tpl = (detected && INDUSTRIES[detected]) || genericTemplate(desc);
    return apiSuccess({
      preview: {
        ...tpl,
        estimatedSetupTime: "45 seconds",
        componentCount: { entities: tpl.crm.entities.length, bots: tpl.bots.length, agents: tpl.agents.length, automations: tpl.automations.length, websitePages: tpl.website.pages.length },
      },
      autoDetected: !body.industry, industry: detected || "general",
    });
  } catch (e) { return handleApiError(e); }
}

export async function PUT(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, preview } = body;
    if (!workspaceId || !preview) return apiError("workspaceId and preview required", 400);
    const results: any = { modules: [] };

    for (const e of preview.crm.entities) {
      const ent = await prisma.crmEntity.create({ data: { workspaceId, name: e.name, displayName: e.displayName, icon: e.icon || "database", color: e.color || "#6366f1", fields: e.fields || [], settings: {} } });
      results.modules.push({ type: "crm_entity", id: ent.id, name: ent.displayName });
    }
    for (const b of preview.bots) {
      const bot = await prisma.aiBot.create({ data: { workspaceId, name: b.name, type: b.type || "custom", description: b.description, channels: b.channels || [], personality: {}, flows: [], config: {} } });
      results.modules.push({ type: "bot", id: bot.id, name: bot.name });
    }
    for (const a of preview.agents) {
      const agent = await prisma.aiAgent.create({ data: { workspaceId, name: a.name, role: a.role, description: a.description, tools: a.tools || [], personality: {}, capabilities: [], memory: {}, config: {} } });
      results.modules.push({ type: "agent", id: agent.id, name: agent.name });
    }
    for (const a of preview.automations) {
      const auto = await prisma.automation.create({ data: { workspaceId, name: a.name, description: a.description, trigger: a.trigger || {}, nodes: [], connections: [] } });
      results.modules.push({ type: "automation", id: auto.id, name: auto.name });
    }
    const website = await prisma.website.create({
      data: {
        workspaceId, name: preview.name, slug: preview.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        templateId: preview.website?.template, config: preview.website || {},
        pages: (preview.website?.pages || []).map((p: string, i: number) => ({
          id: p.toLowerCase().replace(/\s+/g, "-"), name: p, slug: i === 0 ? "/" : "/" + p.toLowerCase().replace(/\s+/g, "-"), isHome: i === 0,
          sections: i === 0 ? [{ id: "hero", type: "hero", props: { title: preview.name, subtitle: "Welcome" } }] : [{ id: "content", type: "content", props: { title: p } }],
        })),
        styles: {}, seo: {},
      },
    });
    results.modules.push({ type: "website", id: website.id, name: website.name });

    return apiSuccess({ deployed: true, results });
  } catch (e) { return handleApiError(e); }
}
