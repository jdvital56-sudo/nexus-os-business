"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate } from "@/lib/utils";
import { Plus, Globe, ExternalLink, Settings, Trash2, X, Loader2, Eye, Code, Edit3 } from "lucide-react";

export default function WebsitesPage() {
  return <AppShell><WebsitesContent /></AppShell>;
}

function WebsitesContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification, openModal, modal, closeModal } = useUI();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { if (currentWorkspace) loadWebsites(); }, [currentWorkspace]);

  async function loadWebsites() {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/websites?workspaceId=${currentWorkspace.id}`);
      setWebsites(res.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate(data: any) {
    if (!currentWorkspace) return;
    try {
      const res = await api.post("/websites", { workspaceId: currentWorkspace.id, ...data });
      addNotification("success", `Website "${data.name}" created`);
      loadWebsites();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/websites/${id}`);
      addNotification("success", "Website deleted");
      if (selected?.id === id) setSelected(null);
      loadWebsites();
    } catch (e: any) { addNotification("error", e.message); }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Websites</h1>
          <p className="page-subtitle">Build and manage your websites with visual builder</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("createWebsite")}>
          <Plus className="w-4 h-4" /> Create Website
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
      ) : websites.length === 0 ? (
        <div className="card p-12 text-center">
          <Globe className="w-16 h-16 mx-auto text-dark-3/20 mb-4" />
          <h3 className="font-semibold text-dark-0 mb-2">No Websites Yet</h3>
          <p className="text-sm text-dark-3 mb-6">Create your first website with our visual builder.</p>
          <button className="btn btn-primary" onClick={() => openModal("createWebsite")}>
            <Plus className="w-4 h-4" /> Create Website
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((site) => (
            <div key={site.id} className="card-hover overflow-hidden group">
              {/* Preview */}
              <div className="h-40 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative">
                <Globe className="w-12 h-12 text-brand-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button className="btn btn-sm bg-white text-dark-0 hover:bg-surface-1" onClick={() => setSelected(site)}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button className="btn btn-sm bg-white text-dark-0 hover:bg-surface-1">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-dark-0">{site.name}</h3>
                    <p className="text-xs text-dark-3 mt-0.5">/{site.slug}</p>
                  </div>
                  <span className={cn("badge", site.published ? "badge-success" : "badge-gray")}>
                    {site.published ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-dark-3">
                  <span>{(site.pages as any[])?.length || 0} pages</span>
                  <span>{formatDate(site.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-2">
                  <button className="btn btn-ghost btn-sm flex-1" onClick={() => setSelected(site)}>
                    <Code className="w-3.5 h-3.5" /> Edit Pages
                  </button>
                  <button className="btn btn-ghost btn-sm text-red-500 hover:text-red-600" onClick={() => handleDelete(site.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Editor */}
      {selected && <PageEditor website={selected} onClose={() => setSelected(null)} onUpdate={loadWebsites} />}

      {/* Create Website Modal */}
      {modal === "createWebsite" && <CreateWebsiteModal onClose={closeModal} onSubmit={handleCreate} />}
    </div>
  );
}

// ─── Create Website Modal ──────────────────────────────────────────

function CreateWebsiteModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ name: "", slug: "", templateId: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ ...form, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
    setLoading(false);
  }

  const templates = [
    { id: "business", name: "Business", desc: "Professional business website" },
    { id: "restaurant", name: "Restaurant", desc: "Menu, reservations, gallery" },
    { id: "ecommerce", name: "E-Commerce", desc: "Online store with products" },
    { id: "portfolio", name: "Portfolio", desc: "Showcase your work" },
    { id: "landing", name: "Landing Page", desc: "High-converting single page" },
    { id: "clinic", name: "Medical Clinic", desc: "Appointments and services" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Create Website</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Website Name</label>
              <input className="input" placeholder="My Website" value={form.name} onChange={(e) => {
                setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
              }} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">URL Slug</label>
              <input className="input" placeholder="my-website" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-2">Template</label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, templateId: t.id })}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      form.templateId === t.id ? "border-brand-500 bg-brand-50" : "border-surface-3 hover:border-brand-200"
                    )}
                  >
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-dark-3 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Website"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page Editor ───────────────────────────────────────────────────

function PageEditor({ website, onClose, onUpdate }: { website: any; onClose: () => void; onUpdate: () => void }) {
  const { addNotification } = useUI();
  const pages = (website.pages as any[]) || [];
  const [selectedPage, setSelectedPage] = useState(pages[0] || null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch(`/websites/${website.id}`, { pages });
      addNotification("success", "Pages saved");
      onUpdate();
    } catch (e: any) { addNotification("error", e.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-4xl h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="font-semibold">{website.name} — Page Editor</h3>
            <p className="text-xs text-dark-3 mt-0.5">/{website.slug}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {/* Page list */}
          <div className="w-48 border-r border-surface-3 p-3 space-y-1 overflow-y-auto">
            {pages.map((page: any, i: number) => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                  selectedPage?.id === page.id ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-surface-1 text-dark-2"
                )}
              >
                {page.name}
                {page.isHome && <span className="ml-1 text-[10px] text-brand-500">★</span>}
              </button>
            ))}
          </div>
          {/* Page content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedPage ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="font-medium">{selectedPage.name}</h4>
                  <span className="badge badge-gray text-[10px]">{selectedPage.slug}</span>
                </div>
                {(selectedPage.sections || []).map((section: any) => (
                  <div key={section.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge badge-brand">{section.type}</span>
                    </div>
                    <pre className="text-xs bg-surface-1 p-3 rounded-lg overflow-x-auto text-dark-2">
                      {JSON.stringify(section.props, null, 2)}
                    </pre>
                  </div>
                ))}
                {(!selectedPage.sections || selectedPage.sections.length === 0) && (
                  <div className="text-center text-sm text-dark-3 py-8">No sections yet</div>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-dark-3 py-8">Select a page to edit</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
