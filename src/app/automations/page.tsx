"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate } from "@/lib/utils";
import { Plus, Zap, Play, Pause, Trash2, X, Loader2, GitBranch, Clock, CheckCircle } from "lucide-react";

export default function AutomationsPage() {
  return <AppShell><AutomationsContent /></AppShell>;
}

function AutomationsContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification, openModal, modal, closeModal } = useUI();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (currentWorkspace) loadAutomations(); }, [currentWorkspace]);

  async function loadAutomations() {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/automations?workspaceId=${currentWorkspace.id}`);
      setAutomations(res.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate(data: any) {
    if (!currentWorkspace) return;
    try {
      await api.post("/automations", { workspaceId: currentWorkspace.id, ...data });
      addNotification("success", `Automation "${data.name}" created`);
      loadAutomations();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleToggle(automation: any) {
    try {
      await api.patch(`/automations/${automation.id}`, { active: !automation.active });
      addNotification("success", automation.active ? "Automation paused" : "Automation activated");
      loadAutomations();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/automations/${id}`);
      addNotification("success", "Automation deleted");
      loadAutomations();
    } catch (e: any) { addNotification("error", e.message); }
  }

  const triggerTypes: Record<string, { icon: any; color: string; label: string }> = {
    event: { icon: Zap, color: "text-amber-500 bg-amber-50", label: "Event" },
    schedule: { icon: Clock, color: "text-blue-500 bg-blue-50", label: "Schedule" },
    webhook: { icon: GitBranch, color: "text-purple-500 bg-purple-50", label: "Webhook" },
    manual: { icon: Play, color: "text-emerald-500 bg-emerald-50", label: "Manual" },
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Automations</h1>
          <p className="page-subtitle">Visual workflow automation engine</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("createAutomation")}>
          <Plus className="w-4 h-4" /> Create Automation
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
      ) : automations.length === 0 ? (
        <div className="card p-12 text-center">
          <Zap className="w-16 h-16 mx-auto text-dark-3/20 mb-4" />
          <h3 className="font-semibold text-dark-0 mb-2">No Automations Yet</h3>
          <p className="text-sm text-dark-3 mb-6">Create your first automation workflow.</p>
          <button className="btn btn-primary" onClick={() => openModal("createAutomation")}>
            <Plus className="w-4 h-4" /> Create Automation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => {
            const trigger = triggerTypes[auto.trigger?.type] || triggerTypes.manual;
            return (
              <div key={auto.id} className="card-hover p-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", trigger.color)}>
                  <trigger.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-dark-0">{auto.name}</h3>
                  {auto.description && <p className="text-xs text-dark-3 mt-0.5 truncate">{auto.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("badge", auto.active ? "badge-success" : "badge-gray")}>
                    {auto.active ? "Active" : "Paused"}
                  </span>
                  <span className="text-xs text-dark-3">{auto.executions} runs</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(auto)}
                      className={cn("p-2 rounded-lg transition-all", auto.active ? "hover:bg-amber-50 text-amber-600" : "hover:bg-emerald-50 text-emerald-600")}
                    >
                      {auto.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(auto.id)} className="p-2 rounded-lg hover:bg-red-50 text-dark-3 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "createAutomation" && <CreateAutomationModal onClose={closeModal} onSubmit={handleCreate} />}
    </div>
  );
}

function CreateAutomationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", description: "",
    triggerType: "event",
    triggerConfig: "{}",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name: form.name,
      description: form.description,
      trigger: { type: form.triggerType, config: JSON.parse(form.triggerConfig || "{}") },
    });
    setLoading(false);
  }

  const triggerOptions = [
    { value: "event", label: "Event Trigger", desc: "When something happens in the system" },
    { value: "schedule", label: "Schedule", desc: "Run at specific times (cron)" },
    { value: "webhook", label: "Webhook", desc: "External HTTP trigger" },
    { value: "manual", label: "Manual", desc: "Run manually on demand" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Create Automation</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Name</label>
              <input className="input" placeholder="Lead Follow-up" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Description</label>
              <textarea className="textarea" rows={2} placeholder="What does this automation do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-2">Trigger Type</label>
              <div className="grid grid-cols-2 gap-2">
                {triggerOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, triggerType: opt.value })}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      form.triggerType === opt.value ? "border-brand-500 bg-brand-50" : "border-surface-3 hover:border-brand-200"
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-dark-3 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Automation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
