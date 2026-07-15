"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Database, Globe, Zap, Bot, Users, TrendingUp, ArrowUpRight,
  ShoppingBag, Sparkles, Activity, Clock, BarChart3,
} from "lucide-react";

interface Stats {
  entities: number;
  records: number;
  websites: number;
  automations: number;
  bots: number;
  agents: number;
}

export default function DashboardPage() {
  const { currentWorkspace } = useAuth();
  const { addNotification } = useUI();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;
    loadStats();
  }, [currentWorkspace]);

  async function loadStats() {
    if (!currentWorkspace) return;
    try {
      const [entitiesRes, websitesRes, automationsRes, botsRes, agentsRes] = await Promise.allSettled([
        api.get(`/crm/entities?workspaceId=${currentWorkspace.id}`),
        api.get(`/websites?workspaceId=${currentWorkspace.id}`),
        api.get(`/automations?workspaceId=${currentWorkspace.id}`),
        api.get(`/ai/bots?workspaceId=${currentWorkspace.id}`),
        api.get(`/ai/agents?workspaceId=${currentWorkspace.id}`),
      ]);

      const entities = entitiesRes.status === "fulfilled" ? entitiesRes.value.data : [];
      const websites = websitesRes.status === "fulfilled" ? websitesRes.value.data : [];
      const automations = automationsRes.status === "fulfilled" ? automationsRes.value.data : [];
      const bots = botsRes.status === "fulfilled" ? botsRes.value.data : [];
      const agents = agentsRes.status === "fulfilled" ? agentsRes.value.data : [];

      setStats({
        entities: entities.length,
        records: entities.reduce((s: number, e: any) => s + (e.recordCount || 0), 0),
        websites: websites.length,
        automations: automations.length,
        bots: bots.length,
        agents: agents.length,
      });
    } catch (e) {
      addNotification("error", "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: "CRM Entities", value: stats?.entities ?? 0, icon: Database, color: "text-blue-600 bg-blue-50", href: "/crm" },
    { label: "Total Records", value: stats?.records ?? 0, icon: BarChart3, color: "text-emerald-600 bg-emerald-50", href: "/crm" },
    { label: "Websites", value: stats?.websites ?? 0, icon: Globe, color: "text-purple-600 bg-purple-50", href: "/websites" },
    { label: "Automations", value: stats?.automations ?? 0, icon: Zap, color: "text-amber-600 bg-amber-50", href: "/automations" },
    { label: "AI Bots", value: stats?.bots ?? 0, icon: Bot, color: "text-pink-600 bg-pink-50", href: "/bots" },
    { label: "AI Agents", value: stats?.agents ?? 0, icon: Users, color: "text-indigo-600 bg-indigo-50", href: "/agents" },
  ];

  const quickActions = [
    { label: "Generate Business", description: "AI-powered business setup from natural language", icon: Sparkles, color: "bg-brand-600", href: "/generator" },
    { label: "Browse Marketplace", description: "Ready-made templates and solutions", icon: ShoppingBag, color: "bg-emerald-600", href: "/marketplace" },
    { label: "Create Website", description: "Visual website builder with CRM integration", icon: Globe, color: "bg-purple-600", href: "/websites" },
    { label: "Setup CRM", description: "Custom entities, fields, and pipelines", icon: Database, color: "bg-blue-600", href: "/crm" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to {currentWorkspace?.name || "Nexus OS"}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <a key={stat.label} href={stat.href} className="stat-card group hover:shadow-md transition-all">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{loading ? "—" : stat.value}</p>
          </a>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a key={action.label} href={action.href} className="card-hover p-5 group">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white", action.color)}>
                <action.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-dark-0 mb-1 flex items-center gap-2">
                {action.label}
                <ArrowUpRight className="w-4 h-4 text-dark-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-dark-3">{action.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Platform Features */}
      <div className="section">
        <h2 className="section-title">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Business Generator", desc: "Describe your business in natural language and get a fully configured system in seconds. AI analyzes your needs and deploys CRM, website, bots, and automations automatically.", icon: Sparkles, color: "text-brand-600 bg-brand-50" },
            { title: "AI Agents", desc: "Deploy intelligent digital employees that work 24/7. Sales agents, support agents, marketing agents — each with memory, tools, and the ability to collaborate.", icon: Users, color: "text-emerald-600 bg-emerald-50" },
            { title: "Marketplace", desc: "Access hundreds of ready-made solutions. Website templates, CRM configurations, automation workflows, and complete industry packages — install with one click.", icon: ShoppingBag, color: "text-purple-600 bg-purple-50" },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-dark-0 mb-2">{item.title}</h3>
              <p className="text-sm text-dark-3 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
