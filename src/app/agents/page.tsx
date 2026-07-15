"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { Plus, Users, Brain, Wrench, Activity, Trash2, X, Loader2, Shield, Zap } from "lucide-react";

export default function AgentsPage() {
  return <AppShell><AgentsContent /></AppShell>;
}

function AgentsContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification, openModal, modal, closeModal } = useUI();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (currentWorkspace) loadAgents(); }, [currentWorkspace]);

  async function loadAgents() {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/ai/agents?workspaceId=${currentWorkspace.id}`);
      setAgents(res.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate(data: any) {
    if (!currentWorkspace) return;
    try {
      await api.post("/ai/agents", { workspaceId: currentWorkspace.id, ...data });
      addNotification("success", `Agent "${data.name}" created`);
      loadAgents();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/ai/agents/${id}`);
      addNotification("success", "Agent deleted");
      loadAgents();
    } catch (e: any) { addNotification("error", e.message); }
  }

  const roleColors: Record<string, string> = {
    sales: "bg-amber-50 text-amber-600 border-amber-200",
    marketing: "bg-pink-50 text-pink-600 border-pink-200",
    support: "bg-emerald-50 text-emerald-600 border-emerald-200",
    hr: "bg-purple-50 text-purple-600 border-purple-200",
    finance: "bg-blue-50 text-blue-600 border-blue-200",
    developer: "bg-slate-50 text-slate-600 border-slate-200",
    assistant: "bg-indigo-50 text-indigo-600 border-indigo-200",
    patient_coordinator: "bg-teal-50 text-teal-600 border-teal-200",
    billing: "bg-cyan-50 text-cyan-600 border-cyan-200",
    floor_manager: "bg-orange-50 text-orange-600 border-orange-200",
    case_manager: "bg-violet-50 text-violet-600 border-violet-200",
    member_success: "bg-lime-50 text-lime-600 border-lime-200",
    client_care: "bg-rose-50 text-rose-600 border-rose-200",
    lead_qualifier: "bg-sky-50 text-sky-600 border-sky-200",
    inventory: "bg-stone-50 text-stone-600 border-stone-200",
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Agents</h1>
          <p className="page-subtitle">Digital employees that work 24/7</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("createAgent")}>
          <Plus className="w-4 h-4" /> Create Agent
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
      ) : agents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-dark-3/20 mb-4" />
          <h3 className="font-semibold text-dark-0 mb-2">No AI Agents Yet</h3>
          <p className="text-sm text-dark-3 mb-6">Deploy your first digital employee.</p>
          <button className="btn btn-primary" onClick={() => openModal("createAgent")}>
            <Plus className="w-4 h-4" /> Create Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0">
                  <Brain className="w-6 h-6 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark-0">{agent.name}</h3>
                  <span className={cn("badge text-[10px] mt-1", roleColors[agent.role] || "bg-gray-50 text-gray-600 border border-gray-200")}>
                    {agent.role.replace(/_/g, " ")}
                  </span>
                </div>
                <span className={cn("badge", agent.active ? "badge-success" : "badge-gray")}>
                  {agent.active ? "Active" : "Inactive"}
                </span>
              </div>
              {agent.description && <p className="text-sm text-dark-3 mb-3 line-clamp-2">{agent.description}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(agent.tools as string[]).map((tool) => (
                  <span key={tool} className="badge badge-gray text-[10px]">
                    <Wrench className="w-2.5 h-2.5" /> {tool}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-surface-2">
                <button className="btn btn-ghost btn-sm flex-1">
                  <Zap className="w-3.5 h-3.5" /> Assign Task
                </button>
                <button onClick={() => handleDelete(agent.id)} className="btn btn-ghost btn-sm text-red-500 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "createAgent" && <CreateAgentModal onClose={closeModal} onSubmit={handleCreate} />}
    </div>
  );
}

function CreateAgentModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", role: "assistant", description: "", systemPrompt: "",
    tools: ["crm", "email"] as string[],
    capabilities: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: "sales", label: "Sales Agent" },
    { value: "marketing", label: "Marketing Agent" },
    { value: "support", label: "Support Agent" },
    { value: "hr", label: "HR Agent" },
    { value: "finance", label: "Finance Agent" },
    { value: "developer", label: "Developer Agent" },
    { value: "assistant", label: "General Assistant" },
    { value: "patient_coordinator", label: "Patient Coordinator" },
    { value: "billing", label: "Billing Agent" },
    { value: "case_manager", label: "Case Manager" },
    { value: "client_care", label: "Client Care" },
    { value: "lead_qualifier", label: "Lead Qualifier" },
  ];

  const toolOptions = ["crm", "email", "sms", "calendar", "analytics", "documents", "social_media", "accounting", "chat", "web_search"];

  function toggleTool(t: string) {
    setForm({ ...form, tools: form.tools.includes(t) ? form.tools.filter((x) => x !== t) : [...form.tools, t] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Create AI Agent</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Agent Name</label>
              <input className="input" placeholder="Sales Agent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Role</label>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Description</label>
              <textarea className="textarea" rows={2} placeholder="What does this agent do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">System Prompt</label>
              <textarea className="textarea" rows={3} placeholder="You are a professional sales agent..." value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-2">Tools</label>
              <div className="flex flex-wrap gap-2">
                {toolOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTool(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      form.tools.includes(t) ? "bg-brand-50 border-brand-300 text-brand-700" : "border-surface-3 text-dark-3 hover:border-brand-200"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
