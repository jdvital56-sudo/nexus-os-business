"use client";

import { useState } from "react";
import { useAuth, useUI } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { Settings, User, Building2, Shield, Bell, Palette, Globe, Key, Users, Database } from "lucide-react";

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
          {activeTab === "profile" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Profile Settings</h2>
              <div className="space-y-4 max-w-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm text-dark-3">{user?.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-2 mb-1">Full Name</label>
                  <input className="input" defaultValue={user?.name} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-2 mb-1">Email</label>
                  <input className="input" type="email" defaultValue={user?.email} />
                </div>
                <button className="btn btn-primary" onClick={() => addNotification("success", "Profile updated")}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === "workspace" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Workspace Settings</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-dark-2 mb-1">Workspace Name</label>
                  <input className="input" defaultValue={currentWorkspace?.name} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-2 mb-1">Workspace Slug</label>
                  <input className="input" defaultValue={currentWorkspace?.slug} />
                </div>
                <button className="btn btn-primary" onClick={() => addNotification("success", "Workspace updated")}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Team Members</h2>
              <div className="space-y-3">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">
                      {ws.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ws.name}</p>
                      <p className="text-xs text-dark-3">/{ws.slug}</p>
                    </div>
                    <span className="badge badge-brand">{ws.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Security Settings</h2>
              <div className="space-y-6 max-w-lg">
                <div>
                  <h3 className="font-medium mb-3">Change Password</h3>
                  <div className="space-y-3">
                    <input className="input" type="password" placeholder="Current password" />
                    <input className="input" type="password" placeholder="New password" />
                    <input className="input" type="password" placeholder="Confirm new password" />
                    <button className="btn btn-primary btn-sm">Update Password</button>
                  </div>
                </div>
                <div className="pt-4 border-t border-surface-3">
                  <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-dark-3 mb-3">Add an extra layer of security to your account.</p>
                  <button className="btn btn-secondary btn-sm">Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">API Keys</h2>
              <p className="text-sm text-dark-3 mb-4">Use API keys to access Nexus OS programmatically.</p>
              <div className="p-4 bg-surface-1 rounded-lg text-center">
                <Key className="w-8 h-8 mx-auto text-dark-3/30 mb-2" />
                <p className="text-sm text-dark-3">No API keys yet</p>
                <button className="btn btn-secondary btn-sm mt-3">Generate API Key</button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
              <div className="space-y-4 max-w-lg">
                {["Email notifications", "Push notifications", "SMS notifications", "In-app notifications"].map((item) => (
                  <label key={item} className="flex items-center justify-between p-3 bg-surface-1 rounded-lg cursor-pointer">
                    <span className="text-sm">{item}</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                ))}
                <button className="btn btn-primary btn-sm" onClick={() => addNotification("success", "Preferences saved")}>Save Preferences</button>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">Billing & Subscription</h2>
              <div className="p-6 bg-surface-1 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-dark-3">Current Plan</p>
                    <p className="text-2xl font-bold text-dark-0">Free</p>
                  </div>
                  <button className="btn btn-primary">Upgrade Plan</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Starter", price: "$29", features: ["5 CRM entities", "1 website", "2 bots", "1,000 records"] },
                  { name: "Professional", price: "$99", features: ["Unlimited entities", "5 websites", "10 bots", "100K records", "AI agents"] },
                  { name: "Enterprise", price: "Custom", features: ["Everything in Pro", "SSO/SAML", "Dedicated support", "Custom SLA", "Isolated DB"] },
                ].map((plan) => (
                  <div key={plan.name} className="card p-5 hover:shadow-md transition-all">
                    <h3 className="font-semibold mb-1">{plan.name}</h3>
                    <p className="text-2xl font-bold text-brand-600 mb-3">{plan.price}<span className="text-sm font-normal text-dark-3">/mo</span></p>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-dark-2 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-brand-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button className="btn btn-secondary w-full mt-4">Select Plan</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
