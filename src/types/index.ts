// ─── Core Types ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  settings: Record<string, any>;
}

export interface Member {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  permissions: string[];
}

// ─── CRM Types ─────────────────────────────────────────────────────

export type FieldType =
  | "text" | "number" | "boolean" | "date" | "datetime" | "email" | "phone" | "url"
  | "select" | "multiselect" | "textarea" | "richtext" | "currency" | "percent"
  | "relation" | "file" | "image" | "formula" | "ai" | "rating" | "json";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  settings?: Record<string, any>;
}

export interface EntityDefinition {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  fields: FieldDefinition[];
  recordCount?: number;
}

export interface CrmRecord {
  id: string;
  entityId: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ─── Website Types ─────────────────────────────────────────────────

export interface WebsiteConfig {
  id: string;
  name: string;
  slug: string;
  templateId?: string;
  domain?: string;
  published: boolean;
  config: Record<string, any>;
  pages: PageConfig[];
  styles: Record<string, any>;
  seo: Record<string, any>;
}

export interface PageConfig {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  sections: SectionConfig[];
}

export interface SectionConfig {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: SectionConfig[];
}

// ─── Automation Types ──────────────────────────────────────────────

export interface AutomationConfig {
  id: string;
  name: string;
  description?: string;
  trigger: TriggerConfig;
  nodes: NodeConfig[];
  connections: ConnectionConfig[];
  active: boolean;
}

export interface TriggerConfig {
  type: string;
  config: Record<string, any>;
}

export interface NodeConfig {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface ConnectionConfig {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// ─── AI Types ──────────────────────────────────────────────────────

export interface BotConfig {
  id: string;
  name: string;
  type: string;
  description?: string;
  personality: Record<string, any>;
  channels: string[];
  active: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description?: string;
  systemPrompt?: string;
  tools: string[];
  capabilities: string[];
  active: boolean;
}

// ─── Business Generator Types ──────────────────────────────────────

export interface BusinessIntent {
  description: string;
  industry?: string;
  features?: string[];
  scale: "solo" | "small" | "medium" | "large";
  region: string;
  language: string[];
}

export interface GeneratedBusiness {
  name: string;
  industry: string;
  website: any;
  crm: any;
  bots: any[];
  agents: any[];
  automations: any[];
  integrations: any[];
}

// ─── Marketplace Types ─────────────────────────────────────────────

export interface MarketplaceItem {
  id: string;
  type: string;
  name: string;
  slug: string;
  description: string;
  category?: string;
  tags: string[];
  priceModel: string;
  priceAmount?: number;
  ratingAvg: number;
  ratingCount: number;
  installCount: number;
  version: string;
}

// ─── Smart Package Types ───────────────────────────────────────────

export interface SmartPackageConfig {
  id: string;
  name: string;
  description?: string;
  items: PackageItemConfig[];
  totalPrice: number;
  visibility: string;
}

export interface PackageItemConfig {
  type: string;
  refId: string;
  name: string;
  config: Record<string, any>;
}
