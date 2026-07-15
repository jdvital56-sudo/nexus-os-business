"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn, formatDate, FIELD_TYPE_ICONS } from "@/lib/utils";
import {
  Plus, Database, ChevronRight, MoreVertical, Edit3, Trash2, Eye,
  Search, Filter, Download, Upload, X, Loader2, List, LayoutGrid,
} from "lucide-react";

export default function CRMPage() {
  return <AppShell><CRMContent /></AppShell>;
}

function CRMContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification, openModal, modal, modalData, closeModal } = useUI();
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");

  const loadEntities = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/crm/entities?workspaceId=${currentWorkspace.id}`);
      setEntities(res.data);
      if (res.data.length > 0 && !selectedEntity) setSelectedEntity(res.data[0]);
    } catch { } finally { setLoading(false); }
  }, [currentWorkspace]);

  const loadRecords = useCallback(async () => {
    if (!currentWorkspace || !selectedEntity) return;
    setRecordsLoading(true);
    try {
      const res = await api.get(`/crm/records?workspaceId=${currentWorkspace.id}&entityId=${selectedEntity.id}&pageSize=100`);
      setRecords(res.data.items);
    } catch { } finally { setRecordsLoading(false); }
  }, [currentWorkspace, selectedEntity]);

  useEffect(() => { loadEntities(); }, [loadEntities]);
  useEffect(() => { loadRecords(); }, [loadRecords]);

  async function handleCreateEntity(data: any) {
    if (!currentWorkspace) return;
    try {
      await api.post("/crm/entities", { workspaceId: currentWorkspace.id, ...data });
      addNotification("success", `Entity "${data.displayName}" created`);
      loadEntities();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleCreateRecord(data: Record<string, any>) {
    if (!currentWorkspace || !selectedEntity) return;
    try {
      await api.post("/crm/records", { workspaceId: currentWorkspace.id, entityId: selectedEntity.id, data });
      addNotification("success", "Record created");
      loadRecords();
      closeModal();
    } catch (e: any) { addNotification("error", e.message); }
  }

  async function handleDeleteRecord(id: string) {
    try {
      await api.delete(`/crm/records/${id}`);
      addNotification("success", "Record deleted");
      loadRecords();
    } catch (e: any) { addNotification("error", e.message); }
  }

  const fields = (selectedEntity?.fields as any[]) || [];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM</h1>
          <p className="page-subtitle">Manage your business data with dynamic entities</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => openModal("createEntity")}>
            <Plus className="w-4 h-4" /> New Entity
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Entity Sidebar */}
        <div className="w-56 shrink-0">
          <div className="card p-2 space-y-0.5">
            {loading ? (
              <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
            ) : entities.length === 0 ? (
              <div className="p-4 text-center text-sm text-dark-3">No entities yet</div>
            ) : entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                  selectedEntity?.id === entity.id ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-surface-1 text-dark-1"
                )}
              >
                <Database className="w-4 h-4 shrink-0" style={{ color: entity.color }} />
                <span className="truncate">{entity.displayName}</span>
                <span className="ml-auto text-xs text-dark-3">{entity.recordCount || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Records Area */}
        <div className="flex-1 min-w-0">
          {selectedEntity ? (
            <>
              {/* Entity Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedEntity.color + "15", color: selectedEntity.color }}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-dark-0">{selectedEntity.displayName}</h2>
                    <p className="text-xs text-dark-3">{records.length} records · {fields.length} fields</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-surface-2 rounded-lg p-0.5">
                    <button onClick={() => setView("list")} className={cn("p-1.5 rounded", view === "list" ? "bg-white shadow-sm" : "text-dark-3")}>
                      <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => setView("grid")} className={cn("p-1.5 rounded", view === "grid" ? "bg-white shadow-sm" : "text-dark-3")}>
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => openModal("createRecord")}>
                    <Plus className="w-3.5 h-3.5" /> Add Record
                  </button>
                </div>
              </div>

              {/* Records Table */}
              {recordsLoading ? (
                <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
              ) : records.length === 0 ? (
                <div className="card p-12 text-center">
                  <Database className="w-12 h-12 mx-auto text-dark-3/30 mb-3" />
                  <p className="text-sm text-dark-3 mb-4">No records yet. Add your first record.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => openModal("createRecord")}>
                    <Plus className="w-3.5 h-3.5" /> Add Record
                  </button>
                </div>
              ) : view === "list" ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        {fields.slice(0, 6).map((f: any) => (
                          <th key={f.name}>{f.label}</th>
                        ))}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record: any) => (
                        <tr key={record.id}>
                          {fields.slice(0, 6).map((f: any) => (
                            <td key={f.name}>
                              <CellRenderer type={f.type} value={record.data?.[f.name]} />
                            </td>
                          ))}
                          <td>
                            <button onClick={() => handleDeleteRecord(record.id)} className="p-1 rounded hover:bg-red-50 text-dark-3 hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {records.map((record: any) => (
                    <div key={record.id} className="card-hover p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sm text-dark-0 truncate">
                          {record.data?.[fields[0]?.name] || "Untitled"}
                        </h4>
                        <button onClick={() => handleDeleteRecord(record.id)} className="p-1 rounded hover:bg-red-50 text-dark-3 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {fields.slice(1, 5).map((f: any) => record.data?.[f.name] && (
                          <div key={f.name} className="flex items-center gap-2 text-xs">
                            <span className="text-dark-3 w-20 truncate">{f.label}:</span>
                            <CellRenderer type={f.type} value={record.data[f.name]} />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-dark-3 mt-3">{formatDate(record.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <Database className="w-16 h-16 mx-auto text-dark-3/20 mb-4" />
              <h3 className="font-semibold text-dark-0 mb-2">No Entities Yet</h3>
              <p className="text-sm text-dark-3 mb-6">Create your first CRM entity to start managing data.</p>
              <button className="btn btn-primary" onClick={() => openModal("createEntity")}>
                <Plus className="w-4 h-4" /> Create Entity
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Entity Modal */}
      {modal === "createEntity" && <CreateEntityModal onClose={closeModal} onSubmit={handleCreateEntity} />}

      {/* Create Record Modal */}
      {modal === "createRecord" && selectedEntity && (
        <CreateRecordModal entity={selectedEntity} onClose={closeModal} onSubmit={handleCreateRecord} />
      )}
    </div>
  );
}

// ─── Cell Renderer ─────────────────────────────────────────────────

function CellRenderer({ type, value }: { type: string; value: any }) {
  if (value === null || value === undefined || value === "") return <span className="text-dark-3/40">—</span>;

  switch (type) {
    case "email": return <a href={`mailto:${value}`} className="text-brand-600 hover:underline">{value}</a>;
    case "phone": return <a href={`tel:${value}`} className="text-brand-600 hover:underline">{value}</a>;
    case "url": return <a href={value} target="_blank" className="text-brand-600 hover:underline truncate max-w-[200px]">{value}</a>;
    case "currency": return <span className="font-medium">${Number(value).toLocaleString()}</span>;
    case "boolean": return <span className={cn("badge", value ? "badge-success" : "badge-gray")}>{value ? "Yes" : "No"}</span>;
    case "rating": return <span>{"★".repeat(Number(value))}{"☆".repeat(5 - Number(value))}</span>;
    case "select": return <span className="badge badge-brand">{value}</span>;
    case "date": return <span>{formatDate(value)}</span>;
    default: return <span className="truncate max-w-[200px]">{String(value)}</span>;
  }
}

// ─── Create Entity Modal ───────────────────────────────────────────

function CreateEntityModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "", displayName: "", icon: "database", color: "#6366f1",
    fields: [
      { name: "name", type: "text" as const, label: "Name", required: true },
      { name: "email", type: "email" as const, label: "Email", required: false },
      { name: "phone", type: "phone" as const, label: "Phone", required: false },
      { name: "status", type: "select" as const, label: "Status", required: false, options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
    ],
  });
  const [loading, setLoading] = useState(false);

  function addField() {
    setForm({ ...form, fields: [...form.fields, { name: "", type: "text" as const, label: "", required: false }] });
  }

  function removeField(i: number) {
    setForm({ ...form, fields: form.fields.filter((_, idx) => idx !== i) });
  }

  function updateField(i: number, key: string, value: any) {
    const fields = [...form.fields];
    (fields[i] as any)[key] = value;
    if (key === "label" && !fields[i].name) fields[i].name = value.toLowerCase().replace(/\s+/g, "_");
    setForm({ ...form, fields });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Create CRM Entity</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-dark-2 mb-1">Display Name</label>
                <input className="input" placeholder="Contacts" value={form.displayName} onChange={(e) => {
                  setForm({ ...form, displayName: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "") });
                }} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-2 mb-1">Internal Name</label>
                <input className="input bg-surface-1" value={form.name} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-dark-2 mb-1">Color</label>
                <input type="color" className="input h-10 p-1 cursor-pointer" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-2 mb-1">Icon</label>
                <select className="select" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                  {["database", "user", "home", "calendar", "shopping-cart", "briefcase", "heart", "star", "file-text", "globe"].map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-dark-2">Fields</label>
                <button type="button" onClick={addField} className="text-xs text-brand-600 hover:underline">+ Add Field</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {form.fields.map((field, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                    <input className="input flex-1" placeholder="Label" value={field.label} onChange={(e) => updateField(i, "label", e.target.value)} />
                    <select className="select w-32" value={field.type} onChange={(e) => updateField(i, "type", e.target.value)}>
                      {["text", "number", "email", "phone", "date", "select", "textarea", "boolean", "currency", "url"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-dark-3">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(i, "required", e.target.checked)} />
                      Req
                    </label>
                    <button type="button" onClick={() => removeField(i)} className="p-1 rounded hover:bg-red-50 text-dark-3 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Entity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Record Modal ───────────────────────────────────────────

function CreateRecordModal({ entity, onClose, onSubmit }: { entity: any; onClose: () => void; onSubmit: (data: any) => void }) {
  const fields = (entity.fields as any[]) || [];
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  function updateField(name: string, value: any) {
    setData({ ...data, [name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(data);
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold">Add {entity.displayName} Record</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-dark-2 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <FieldInput field={field} value={data[field.name]} onChange={(v) => updateField(field.name, v)} />
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: any; value: any; onChange: (v: any) => void }) {
  switch (field.type) {
    case "textarea":
    case "richtext":
      return <textarea className="textarea" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
    case "select":
      return (
        <select className="select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {(field.options || []).map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="rounded" />
          <span className="text-sm">{value ? "Yes" : "No"}</span>
        </label>
      );
    case "number":
    case "currency":
    case "percent":
      return <input className="input" type="number" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
    case "date":
      return <input className="input" type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return <input className="input" type="datetime-local" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
    case "email":
      return <input className="input" type="email" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="email@example.com" />;
    case "phone":
      return <input className="input" type="tel" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="+1 (555) 000-0000" />;
    case "url":
      return <input className="input" type="url" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />;
    case "rating":
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} className={cn("text-xl", n <= (value || 0) ? "text-amber-400" : "text-dark-3/30")}>★</button>
          ))}
        </div>
      );
    default:
      return <input className="input" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
  }
}
