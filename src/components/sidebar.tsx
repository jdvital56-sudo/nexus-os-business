"use client";

import { useAuth, useUI } from "@/lib/store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Database, Globe, Zap, Bot, Users, ShoppingBag, Package,
  Sparkles, Settings, ChevronLeft, ChevronRight, LogOut, Building2, Menu,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Database },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/bots", label: "AI Bots", icon: Bot },
  { href: "/agents", label: "AI Agents", icon: Users },
  { href: "/generator", label: "Generator", icon: Sparkles },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, workspaces, currentWorkspace, setWorkspace, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUI();

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 z-40 bg-dark-0 text-white transition-all duration-300 flex flex-col",
      sidebarOpen ? "w-64" : "w-[68px]"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          N
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight">Nexus OS</h1>
            <p className="text-[10px] text-white/40">Business Platform</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="ml-auto p-1 rounded hover:bg-white/10 text-white/60 hover:text-white">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Workspace Selector */}
      {sidebarOpen && currentWorkspace && (
        <div className="px-3 py-3 border-b border-white/10">
          <select
            value={currentWorkspace.id}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) setWorkspace(ws);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-brand-500"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-dark-0">{ws.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                active ? "bg-brand-600 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-white/40 group-hover:text-white/70")} />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
