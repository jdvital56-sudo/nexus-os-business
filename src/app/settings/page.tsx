"use client";

import { useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { Settings, User, Building2, Shield, Bell, Palette, Globe, Key, Users, Database, Loader2, Check } from "lucide-react";

export default function SettingsPage() {
  return <AppShell><SettingsContent /></AppShell>;
}

function SettingsContent() {
  const { user, currentWorkspace, workspaces } = useAuth();
  const { addNotification } = useUI();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "team", label: "Team & Roles", icon: Users },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "api", label: "API Keys", icon: Key },
    { id: "billing", label: "Billing", icon: Database },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and workspace configuration</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 shrink-0">
          <div className="card p-2 space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                  activeTab === tab.id ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-surface-1 text-dark-2"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "workspace" && <WorkspaceTab />}
          {activeTab === "team" && <TeamTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "api" && <ApiKeysTab />}
          {activeTab === "billing" && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuth();
  const { addNotification } = useUI();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch("/auth/me", { name });
      addNotification("success", "Profile updated");
    } catch (e: any) {
      addNotification("error", e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-semibold text-dark-0">Profile Settings</h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-2xl font-bold">
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="font-medium text-dark-0">{user?.name}</p>
          <p className="text-sm text-dark-3">{user?.email}</p>
        </div>
      </div>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">Full Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">Email</label>
          <input className="input bg-surface-1" value={user?.email || ""} disabled />
          <p className="text-[10px] text-dark-3 mt-1">Email cannot be changed here</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Workspace Tab ─────────────────────────────────────────────────

function WorkspaceTab() {
  const { currentWorkspace } = useAuth();
  const { addNotification } = useUI();
  const [name, setName] = useState(currentWorkspace?.name || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!currentWorkspace) return;
    setSaving(true);
    try {
      await api.patch(`/workspaces/${currentWorkspace.id}`, { name });
      addNotification("success", "Workspace updated");
    } catch (e: any) {
      addNotification("error", e.message || "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-semibold text-dark-0">Workspace Settings</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">Workspace Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">Slug</label>
          <input className="input bg-surface-1" value={currentWorkspace?.slug || ""} disabled />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">Your Role</label>
          <input className="input bg-surface-1" value={currentWorkspace?.role || ""} disabled />
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Team Tab ──────────────────────────────────────────────────────

function TeamTab() {
  const { currentWorkspace } = useAuth();
  const { addNotification } = useUI();

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark-0">Team Members</h3>
        <button className="btn btn-primary btn-sm">Invite Member</button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-xs font-bold">D</div>
          <div className="flex-1">
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-dark-3">demo@nexusos.com</p>
          </div>
          <span className="badge badge-brand">Owner</span>
        </div>
      </div>
      <p className="text-xs text-dark-3">Invite team members to collaborate in this workspace.</p>
    </div>
  );
}

// ─── Security Tab ──────────────────────────────────────────────────

function SecurityTab() {
  const { addNotification } = useUI();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (!currentPw || !newPw) { addNotification("error", "Fill in all fields"); return; }
    if (newPw.length < 6) { addNotification("error", "Password must be at least 6 characters"); return; }
    setSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      addNotification("success", "Password changed");
      setCurrentPw(""); setNewPw("");
    } catch (e: any) {
      addNotification("error", e.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-semibold text-dark-0">Security Settings</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">Current Password</label>
          <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-2 mb-1">New Password</label>
          <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
        </div>
        <button onClick={handleChangePassword} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          Change Password
        </button>
      </div>
      <div className="border-t border-surface-2 pt-4">
        <h4 className="font-medium text-dark-0 mb-2">Two-Factor Authentication</h4>
        <p className="text-sm text-dark-3 mb-3">Add an extra layer of security to your account.</p>
        <button className="btn btn-secondary btn-sm">Enable 2FA</button>
      </div>
    </div>
  );
}

// ─── Notifications Tab ─────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
  });

  function toggle(key: keyof typeof prefs) {
    setPrefs({ ...prefs, [key]: !prefs[key] });
  }

  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-semibold text-dark-0">Notification Preferences</h3>
      <div className="space-y-4">
        {[
          { key: "emailNotifications" as const, label: "Email Notifications", desc: "Receive email alerts for important events" },
          { key: "pushNotifications" as const, label: "Push Notifications", desc: "Browser push notifications for real-time updates" },
          { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Weekly summary of workspace activity" },
          { key: "marketingEmails" as const, label: "Marketing Emails", desc: "Product updates and tips" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-surface-1 rounded-lg">
            <div>
              <p className="text-sm font-medium text-dark-0">{item.label}</p>
              <p className="text-xs text-dark-3">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={cn(
                "w-10 h-6 rounded-full transition-all relative",
                prefs[item.key] ? "bg-brand-500" : "bg-dark-3/30"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white shadow absolute top-1 transition-all",
                prefs[item.key] ? "left-5" : "left-1"
              )} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── API Keys Tab ──────────────────────────────────────────────────

function ApiKeysTab() {
  const { addNotification } = useUI();
  const [keys, setKeys] = useState([
    { id: "1", name: "Default Key", key: "nxs_••••••••••••", createdAt: "2026-07-15", lastUsed: "2026-07-16" },
  ]);

  function handleCopyKey() {
    navigator.clipboard.writeText("nxs_demo_key_12345");
    addNotification("success", "API key copied to clipboard");
  }

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark-0">API Keys</h3>
        <button className="btn btn-primary btn-sm">Generate New Key</button>
      </div>
      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
            <Key className="w-4 h-4 text-dark-3" />
            <div className="flex-1">
              <p className="text-sm font-medium">{k.name}</p>
              <p className="text-xs text-dark-3 font-mono">{k.key}</p>
            </div>
            <span className="text-xs text-dark-3">Last used: {k.lastUsed}</span>
            <button onClick={handleCopyKey} className="btn btn-ghost btn-xs">Copy</button>
          </div>
        ))}
      </div>
      <p className="text-xs text-dark-3">API keys allow external services to authenticate with your workspace.</p>
    </div>
  );
}

// ─── Billing Tab ───────────────────────────────────────────────────

function BillingTab() {
  return (
    <div className="card p-6 space-y-6">
      <h3 className="font-semibold text-dark-0">Billing & Subscription</h3>
      <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-brand-700">Professional Plan</p>
            <p className="text-sm text-brand-600">Active since July 2026</p>
          </div>
          <span className="badge badge-success">Active</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "CRM Entities", used: 3, limit: "Unlimited" },
          { label: "Websites", used: 1, limit: "10" },
          { label: "AI Bots", used: 1, limit: "5" },
        ].map((item) => (
          <div key={item.label} className="p-3 bg-surface-1 rounded-lg">
            <p className="text-xs text-dark-3">{item.label}</p>
            <p className="text-lg font-semibold text-dark-0">{item.used}</p>
            <p className="text-[10px] text-dark-3">of {item.limit}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-surface-2 pt-4">
        <h4 className="font-medium text-dark-0 mb-2">Payment Method</h4>
        <p className="text-sm text-dark-3">No payment method configured. Add a card for paid features.</p>
        <button className="btn btn-secondary btn-sm mt-3">Add Payment Method</button>
      </div>
    </div>
  );
}
