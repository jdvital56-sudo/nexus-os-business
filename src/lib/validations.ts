import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  organizationName: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Workspace ─────────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
});

// ─── CRM ───────────────────────────────────────────────────────────

export const fieldTypes = [
  "text", "number", "boolean", "date", "datetime", "email", "phone", "url",
  "select", "multiselect", "textarea", "richtext", "currency", "percent",
  "relation", "file", "image", "formula", "ai", "rating", "json",
] as const;

export const createEntitySchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, "Lowercase, underscore, start with letter"),
  displayName: z.string().min(1),
  icon: z.string().default("database"),
  color: z.string().default("#6366f1"),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(fieldTypes),
    label: z.string(),
    required: z.boolean().default(false),
    options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    defaultValue: z.any().optional(),
    settings: z.record(z.any()).optional(),
  })).default([]),
});

export const createRecordSchema = z.object({
  data: z.record(z.any()),
});

export const updateRecordSchema = z.object({
  data: z.record(z.any()),
});

// ─── Website ───────────────────────────────────────────────────────

export const createWebsiteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  templateId: z.string().optional(),
  config: z.record(z.any()).optional(),
});

// ─── Automation ────────────────────────────────────────────────────

export const createAutomationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.record(z.any()).default({}),
  nodes: z.array(z.any()).default([]),
  connections: z.array(z.any()).default([]),
});

// ─── AI ─────────────────────────────────────────────────────────────

export const createBotSchema = z.object({
  name: z.string().min(1),
  type: z.string().default("custom"),
  description: z.string().optional(),
  personality: z.record(z.any()).default({}),
  channels: z.array(z.string()).default([]),
  config: z.record(z.any()).default({}),
});

export const createAgentSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  personality: z.record(z.any()).default({}),
  tools: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  config: z.record(z.any()).default({}),
});

// ─── Marketplace ───────────────────────────────────────────────────

export const publishItemSchema = z.object({
  type: z.enum(["website_template", "crm_template", "bot", "agent", "automation", "plugin", "package"]),
  name: z.string().min(1),
  description: z.string().min(10),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priceModel: z.enum(["free", "one_time", "subscription"]).default("free"),
  priceAmount: z.number().optional(),
  blueprint: z.record(z.any()).default({}),
});

// ─── Business Generator ───────────────────────────────────────────

export const generateBusinessSchema = z.object({
  description: z.string().min(5),
  industry: z.string().optional(),
  features: z.array(z.string()).optional(),
  scale: z.enum(["solo", "small", "medium", "large"]).default("small"),
  region: z.string().default("global"),
  language: z.array(z.string()).default(["en"]),
});
