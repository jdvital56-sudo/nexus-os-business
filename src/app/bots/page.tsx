"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate } from "@/lib/utils";
import { Plus, Bot, MessageSquare, Settings, Trash2, X, Loader2, Wifi, WifiOff, Globe, Send } from "lucide-react";

export default function BotsPage() {
  return <AppShell><BotsContent /></AppShell>;
}

function BotsContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification, openModal, modal, closeModal } = useUI();
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (currentWorkspace) loadBots(); }, [currentWorkspace]);

  async function loadBots() {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/ai/bots?workspaceId=${currentWorkspace.id}`);
      setBots(res.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate(data: any) {
    if (!currentWorkspace) return;
    try {
      await api.post("/ai/bots", { workspaceId: currentWorkspace.id, ...data });
      addNotification("success", `Bot "${data.name}" created`);
      loadBots();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/ai/bots/${id}`);
      addNotification("success", "Bot deleted");
      loadBots();
    } catch (e: any) { addNotification("error", e.message); }
  }

  const botTypes: Record<string, { icon: any; color: string; desc: string }> = {
    appointment: { icon: MessageSquare, color: "bg-blue-50 text-blue-600", desc: "Handles scheduling and booking" },
    support: { icon: MessageSquare, color: "bg-emerald-50 text-emerald-600", desc: "Customer support automation" },
    sales: { icon: MessageSquare, color: "bg-amber-50 text-amber-600", desc: "Sales and lead qualification" },
    booking: { icon: MessageSquare, color: "bg-purple-50 text-purple-600", desc: "Reservation management" },
    lead_capture: { icon: MessageSquare, color: "bg-pink-50 text-pink-600", desc: "Lead capture and nurturing" },
    custom: { icon: Bot, color: "bg-gray-50 text-gray-600", desc: "Custom bot configuration" },
  };

  const channelIcons: Record<string, string> = {
    web: "🌐", whatsapp: "💬", telegram: "📱", instagram: "📸", facebook: "👤",
    email: "📧", sms: "📲", slack: "💼", discord: "🎮",
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Bots</h1>
          <p className="page-subtitle">Intelligent conversational assistants for every channel</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("createBot")}>
          <Plus className="w-4 h-4" /> Create Bot
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
      ) : bots.length === 0 ? (
        <div className="card p-12 text-center">
          <Bot className="w-16 h-16 mx-auto text-dark-3/20 mb-4" />
          <h3 className="font-semibold text-dark-0 mb-2">No AI Bots Yet</h3>
          <p className="text-sm text-dark-3 mb-6">Create your first intelligent bot assistant.</p>
          <button className="btn btn-primary" onClick={() => openModal("createBot")}>
            <Plus className="w-4 h-4" /> Create Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => {
            const typeInfo = botTypes[bot.type] || botTypes.custom;
            return (
              <div key={bot.id} className="card-hover p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", typeInfo.color)}>
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-0">{bot.name}</h3>
                    <p className="text-xs text-dark-3 mt-0.5">{typeInfo.desc}</p>
                  </div>
                  <span className={cn("badge", bot.active ? "badge-success" : "badge-gray")}>
                    {bot.active ? "Online" : "Offline"}
                  </span>
                </div>
                {bot.description && <p className="text-sm text-dark-3 mb-3 line-clamp-2">{bot.description}</p>}
                <div className="flex items-center gap-1 mb-3">
                  {(bot.channels as string[]).map((ch) => (
                    <span key={ch} className="text-sm" title={ch}>{channelIcons[ch] || "🔗"}</span>
                  ))}
                  {(bot.channels as string[]).length === 0 && <span className="text-xs text-dark-3">No channels</span>}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-surface-2">
                  <button className="btn btn-ghost btn-sm flex-1">
                    <Settings className="w-3.5 h-3.5" /> Configure
                  </button>
                  <button onClick={() => handleDelete(bot.id)} className="btn btn-ghost btn-sm text-red-500 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "createBot" && <CreateBotModal onClose={closeModal} onSubmit={handleCreate} />}
    </div>
  );
}

function CreateBotModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", type: "support", description: "",
    channels: ["web"] as string[],
  });
  const [loading, setLoading] = useState(false);

  const types = [
    { value: "appointment", label: "Appointment Bot", desc: "Scheduling and booking" },
    { value: "support", label: "Support Bot", desc: "Customer support" },
    { value: "sales", label: "Sales Bot", desc: "Lead qualification and sales" },
    { value: "booking", label: "Booking Bot", desc: "Reservations" },
    { value: "lead_capture", label: "Lead Capture", desc: "Collect and qualify leads" },
    { value: "custom", label: "Custom Bot", desc: "Build from scratch" },
  ];

  const channels = [
    { value: "web", label: "Website Widget" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "telegram", label: "Telegram" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook Messenger" },
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
  ];

  function toggleChannel(ch: string) {
    setForm({ ...form, channels: form.channels.includes(ch) ? form.channels.filter((c) => c !== ch) : [...form.channels, ch] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Create AI Bot</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Bot Name</label>
              <input className="input" placeholder="Support Bot" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Description</label>
              <textarea className="textarea" rows={2} placeholder="What does this bot do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-2">Bot Type</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      form.type === t.value ? "border-brand-500 bg-brand-50" : "border-surface-3 hover:border-brand-200"
                    )}
                  >
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-dark-3">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-2">Channels</label>
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => toggleChannel(ch.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      form.channels.includes(ch.value) ? "bg-brand-50 border-brand-300 text-brand-700" : "border-surface-3 text-dark-3 hover:border-brand-200"
                    )}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Bot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
