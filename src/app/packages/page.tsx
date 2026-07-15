"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import { Plus, Package, Trash2, X, Loader2, Share2, Copy, Edit3 } from "lucide-react";

export default function PackagesPage() {
  return <AppShell><PackagesContent /></AppShell>;
}

function PackagesContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification, openModal, modal, closeModal } = useUI();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (currentWorkspace) loadPackages(); }, [currentWorkspace]);

  async function loadPackages() {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/packages?workspaceId=${currentWorkspace.id}`);
      setPackages(res.data);
    } catch { } finally { setLoading(false); }
  }

  async function handleCreate(data: any) {
    if (!currentWorkspace) return;
    try {
      await api.post("/packages", { workspaceId: currentWorkspace.id, ...data });
      addNotification("success", `Package "${data.name}" created`);
      loadPackages();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Packages</h1>
          <p className="page-subtitle">Bundle solutions for reuse and sharing</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal("createPackage")}>
          <Plus className="w-4 h-4" /> Create Package
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
      ) : packages.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-dark-3/20 mb-4" />
          <h3 className="font-semibold text-dark-0 mb-2">No Packages Yet</h3>
          <p className="text-sm text-dark-3 mb-6">Create reusable bundles of solutions.</p>
          <button className="btn btn-primary" onClick={() => openModal("createPackage")}>
            <Plus className="w-4 h-4" /> Create Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-brand-600" />
                </div>
                <span className={cn("badge", pkg.visibility === "private" ? "badge-gray" : "badge-brand")}>
                  {pkg.visibility}
                </span>
              </div>
              <h3 className="font-semibold text-dark-0 mb-1">{pkg.name}</h3>
              {pkg.description && <p className="text-xs text-dark-3 mb-3 line-clamp-2">{pkg.description}</p>}
              <div className="flex items-center gap-3 text-xs text-dark-3 mb-3">
                <span>{(pkg.items as any[])?.length || 0} items</span>
                <span>v{pkg.version}</span>
                <span>{pkg.usageCount} uses</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(pkg.tags as string[]).map((tag) => (
                  <span key={tag} className="badge badge-gray text-[10px]">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-surface-2">
                <button className="btn btn-ghost btn-sm flex-1"><Share2 className="w-3.5 h-3.5" /> Share</button>
                <button className="btn btn-ghost btn-sm flex-1"><Copy className="w-3.5 h-3.5" /> Clone</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "createPackage" && <CreatePackageModal onClose={closeModal} onSubmit={handleCreate} />}
    </div>
  );
}

function CreatePackageModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ name: "", description: "", tags: "", visibility: "private" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name: form.name,
      description: form.description,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      visibility: form.visibility,
      items: [],
    });
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Create Smart Package</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Package Name</label>
              <input className="input" placeholder="Dental Clinic Starter Pack" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Description</label>
              <textarea className="textarea" rows={2} placeholder="What's included in this package?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Tags (comma-separated)</label>
              <input className="input" placeholder="dental, clinic, healthcare" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1">Visibility</label>
              <select className="select" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="marketplace">Marketplace</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
