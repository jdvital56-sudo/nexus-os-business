"use client";

import { useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import {
  Sparkles, Loader2, ArrowRight, Check, Globe, Database, Bot, Users, Zap,
  FileText, BarChart3, ChevronRight, Rocket,
} from "lucide-react";

export default function GeneratorPage() {
  return <AppShell><GeneratorContent /></AppShell>;
}

function GeneratorContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification } = useUI();
  const [step, setStep] = useState<"input" | "preview" | "deploying" | "done">("input");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [deployResults, setDeployResults] = useState<any>(null);

  const examples = [
    "Create a dental clinic with online booking and patient management",
    "Build a restaurant with reservations and delivery orders",
    "Set up an e-commerce store with product catalog and support",
    "Create a fitness club with class scheduling and memberships",
    "Build a real estate agency with property listings",
    "Create a SPA and wellness center with booking system",
    "Set up a law firm with case management",
  ];

  async function handleAnalyze() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/generator", { description, scale: "small" });
      setPreview(res.data.preview);
      setStep("preview");
    } catch (e: any) {
      addNotification("error", e.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeploy() {
    if (!currentWorkspace || !preview) return;
    setStep("deploying");
    try {
      const res = await api.put("/generator", { workspaceId: currentWorkspace.id, preview });
      setDeployResults(res.data.results);
      setStep("done");
      addNotification("success", "Business deployed successfully!");
    } catch (e: any) {
      addNotification("error", e.message || "Deployment failed");
      setStep("preview");
    }
  }

  function reset() {
    setStep("input");
    setDescription("");
    setPreview(null);
    setDeployResults(null);
  }

  const moduleIcons: Record<string, any> = {
    crm_entity: Database, bot: Bot, agent: Users, automation: Zap, website: Globe,
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500" /> Business Generator
          </h1>
          <p className="page-subtitle">Describe your business in natural language — AI builds everything</p>
        </div>
      </div>

      {/* Step: Input */}
      {step === "input" && (
        <div className="max-w-3xl mx-auto">
          <div className="card p-8">
            <h2 className="text-lg font-semibold mb-4">What business do you want to create?</h2>
            <textarea
              className="textarea min-h-[120px] text-base"
              placeholder="Describe your business... e.g., 'Create a dental clinic with online booking, patient management, and WhatsApp appointment bot'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handleAnalyze()}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-dark-3">Press ⌘+Enter to analyze</p>
              <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={loading || !description.trim()}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Analyze & Generate <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="mt-6">
            <p className="text-xs font-medium text-dark-3 mb-3 uppercase tracking-wide">Try these examples</p>
            <div className="grid grid-cols-1 gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setDescription(ex)}
                  className="card-hover p-3 text-left text-sm text-dark-2 hover:text-dark-0 flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
                  {ex}
                  <ChevronRight className="w-4 h-4 text-dark-3 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && preview && (
        <div className="max-w-4xl mx-auto">
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{preview.name}</h2>
                <p className="text-sm text-dark-3">Industry: {preview.industry} · Setup: {preview.estimatedSetupTime}</p>
              </div>
            </div>

            {/* Component Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: "CRM Entities", count: preview.componentCount.entities, icon: Database, color: "blue" },
                { label: "AI Bots", count: preview.componentCount.bots, icon: Bot, color: "pink" },
                { label: "AI Agents", count: preview.componentCount.agents, icon: Users, color: "purple" },
                { label: "Automations", count: preview.componentCount.automations, icon: Zap, color: "amber" },
                { label: "Website Pages", count: preview.componentCount.websitePages, icon: Globe, color: "emerald" },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 bg-surface-1 rounded-xl">
                  <item.icon className="w-6 h-6 mx-auto mb-1 text-dark-3" />
                  <p className="text-xl font-bold text-dark-0">{item.count}</p>
                  <p className="text-[10px] text-dark-3">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CRM Entities */}
          <div className="card p-6 mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-blue-500" /> CRM Entities</h3>
            <div className="space-y-2">
              {preview.crm.entities.map((entity: any) => (
                <div key={entity.name} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: entity.color + "20" }}>
                    <Database className="w-4 h-4" style={{ color: entity.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entity.displayName}</p>
                    <p className="text-xs text-dark-3">{entity.fields.length} fields</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entity.fields.slice(0, 4).map((f: any) => (
                      <span key={f.name} className="badge badge-gray text-[10px]">{f.label}</span>
                    ))}
                    {entity.fields.length > 4 && <span className="badge badge-gray text-[10px]">+{entity.fields.length - 4}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bots */}
          {preview.bots.length > 0 && (
            <div className="card p-6 mb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Bot className="w-4 h-4 text-pink-500" /> AI Bots</h3>
              <div className="space-y-2">
                {preview.bots.map((bot: any) => (
                  <div key={bot.name} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
                    <Bot className="w-5 h-5 text-pink-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{bot.name}</p>
                      <p className="text-xs text-dark-3">{bot.description}</p>
                    </div>
                    <div className="flex gap-1">
                      {bot.channels.map((ch: string) => <span key={ch} className="badge badge-gray text-[10px]">{ch}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agents */}
          {preview.agents.length > 0 && (
            <div className="card p-6 mb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> AI Agents</h3>
              <div className="space-y-2">
                {preview.agents.map((agent: any) => (
                  <div key={agent.name} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
                    <Users className="w-5 h-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-dark-3">{agent.description}</p>
                    </div>
                    <div className="flex gap-1">
                      {agent.tools.map((t: string) => <span key={t} className="badge badge-gray text-[10px]">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automations */}
          {preview.automations.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Automations</h3>
              <div className="space-y-2">
                {preview.automations.map((auto: any) => (
                  <div key={auto.name} className="flex items-center gap-3 p-3 bg-surface-1 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">{auto.name}</p>
                      <p className="text-xs text-dark-3">{auto.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button className="btn btn-secondary" onClick={reset}>← Start Over</button>
            <button className="btn btn-primary btn-lg" onClick={handleDeploy}>
              <Rocket className="w-5 h-5" /> Deploy Everything
            </button>
          </div>
        </div>
      )}

      {/* Step: Deploying */}
      {step === "deploying" && (
        <div className="max-w-md mx-auto text-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-brand-500 mb-6" />
          <h2 className="text-xl font-semibold mb-2">Deploying Your Business</h2>
          <p className="text-dark-3">Setting up CRM, website, bots, agents, and automations...</p>
          <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
            {["CRM Entities", "AI Bots", "AI Agents", "Automations", "Website"].map((item, i) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                <span className="text-dark-2">Creating {item}...</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && deployResults && (
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Business Deployed! 🎉</h2>
          <p className="text-dark-3 mb-8">All modules are ready. Start using them from the dashboard.</p>

          <div className="card p-6 text-left mb-8">
            <h3 className="font-semibold mb-4">Deployed Modules</h3>
            <div className="space-y-2">
              {deployResults.modules.map((mod: any) => {
                const Icon = moduleIcons[mod.type] || Database;
                return (
                  <div key={mod.id} className="flex items-center gap-3 p-2 bg-surface-1 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <Icon className="w-4 h-4 text-dark-3" />
                    <span className="text-sm">{mod.name}</span>
                    <span className="badge badge-gray text-[10px] ml-auto">{mod.type.replace("_", " ")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button className="btn btn-secondary" onClick={reset}>Create Another</button>
            <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
          </div>
        </div>
      )}
    </div>
  );
}
