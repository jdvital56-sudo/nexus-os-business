"use client";

import { useEffect, useState } from "react";
import { useAuth, useUI, api } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";
import {
  ShoppingBag, Search, Star, Download, Filter, Loader2, Globe, Database,
  Bot, Users, Zap, Package, Puzzle, ArrowRight, TrendingUp,
} from "lucide-react";

export default function MarketplacePage() {
  return <AppShell><MarketplaceContent /></AppShell>;
}

function MarketplaceContent() {
  const { currentWorkspace } = useAuth();
  const { addNotification } = useUI();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => { loadItems(); }, [category]);

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const res = await api.get(`/marketplace?${params.toString()}`);
      setItems(res.data.items);
    } catch { } finally { setLoading(false); }
  }

  const categories = [
    { id: "", label: "All", icon: ShoppingBag },
    { id: "website_template", label: "Websites", icon: Globe },
    { id: "crm_template", label: "CRM", icon: Database },
    { id: "bot", label: "AI Bots", icon: Bot },
    { id: "agent", label: "AI Agents", icon: Users },
    { id: "automation", label: "Automations", icon: Zap },
    { id: "package", label: "Packages", icon: Package },
    { id: "plugin", label: "Plugins", icon: Puzzle },
  ];

  const featuredItems = [
    { name: "Dental Clinic Pro", type: "package", desc: "Complete dental clinic with CRM, website, appointment bot, and automations", rating: 4.9, installs: 1240, price: "Free", color: "from-emerald-400 to-teal-500" },
    { name: "Restaurant Suite", type: "package", desc: "Full restaurant management with reservations, orders, and marketing", rating: 4.8, installs: 980, price: "$29/mo", color: "from-red-400 to-orange-500" },
    { name: "E-Commerce Starter", type: "package", desc: "Online store with products, cart, checkout, and customer support bot", rating: 4.7, installs: 2100, price: "$19/mo", color: "from-blue-400 to-indigo-500" },
    { name: "Sales Closer Bot", type: "bot", desc: "AI-powered sales bot that qualifies leads and closes deals", rating: 4.9, installs: 560, price: "$39/mo", color: "from-amber-400 to-orange-500" },
    { name: "SEO Agent Pro", type: "agent", desc: "Autonomous SEO agent that optimizes content and tracks rankings", rating: 4.6, installs: 340, price: "$49/mo", color: "from-purple-400 to-pink-500" },
    { name: "Lead Nurture Flow", type: "automation", desc: "7-step email nurture sequence with AI personalization", rating: 4.8, installs: 890, price: "Free", color: "from-cyan-400 to-blue-500" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketplace</h1>
          <p className="page-subtitle">Ready-made solutions for every business need</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-3" />
            <input
              className="input pl-10"
              placeholder="Search templates, bots, agents, automations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadItems()}
            />
          </div>
          <button className="btn btn-primary" onClick={loadItems}>Search</button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              category === cat.id ? "bg-brand-600 text-white" : "bg-white border border-surface-3 text-dark-2 hover:border-brand-300"
            )}
          >
            <cat.icon className="w-4 h-4" /> {cat.label}
          </button>
        ))}
      </div>

      {/* Featured */}
      {!category && (
        <div className="section">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" /> Featured Solutions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredItems.map((item) => (
              <div key={item.name} className="card-hover overflow-hidden group">
                <div className={cn("h-24 bg-gradient-to-r flex items-center justify-center", item.color)}>
                  <Package className="w-10 h-10 text-white/80" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-dark-0">{item.name}</h3>
                    <span className="badge badge-brand text-[10px]">{item.type}</span>
                  </div>
                  <p className="text-xs text-dark-3 mb-3 line-clamp-2">{item.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-dark-3">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {item.rating}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {item.installs}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-600">{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Items */}
      <div className="section">
        <h2 className="section-title">{category ? categories.find((c) => c.id === category)?.label : "All Items"}</h2>
        {loading ? (
          <div className="card p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
        ) : items.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-dark-3/20 mb-3" />
            <p className="text-sm text-dark-3">No items found. The marketplace is being populated.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="card-hover p-4">
                <h4 className="font-medium text-dark-0 mb-1">{item.name}</h4>
                <p className="text-xs text-dark-3 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-dark-3">
                    <Star className="w-3 h-3 text-amber-400" /> {item.ratingAvg.toFixed(1)}
                    <Download className="w-3 h-3" /> {item.installCount}
                  </div>
                  <span className="text-xs font-medium text-brand-600">
                    {item.priceModel === "free" ? "Free" : `$${item.priceAmount}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
