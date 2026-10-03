"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, AlertTriangle, Loader2, X, Trash2 } from "lucide-react";
import { shoppingApi } from "@/lib/api";

type WishlistItem = {
  id: number;
  brand: string;
  name: string;
  price: number;
  match_rate: number;
  duplicate_alert: boolean;
  image_url: string;
};

// Fallback image if empty
const FALLBACK_IMG = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&q=80&w=600";

const MONTHLY_BUDGET = 2000;

export default function ShoppingPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", brand: "", price: "", image_url: "" });

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await shoppingApi.getWishlist();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWishlist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await shoppingApi.addWishlist({
        name: form.name.trim(),
        brand: form.brand.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        image_url: form.image_url.trim() || undefined,
      });
      setForm({ name: "", brand: "", price: "", image_url: "" });
      setIsAddOpen(false);
      await fetchWishlist();
    } catch (err) {
      setError((err as Error).message || "Could not add item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await shoppingApi.deleteWishlist(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to delete wishlist item", err);
    } finally {
      setDeletingId(null);
    }
  };

  const spent = items.reduce((sum, i) => sum + (i.price || 0), 0);
  const remaining = Math.max(MONTHLY_BUDGET - spent, 0);
  const pctUsed = Math.min((spent / MONTHLY_BUDGET) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Before You Buy</h1>
          <p className="text-foreground/60">Add something you&apos;re thinking of buying — I&apos;ll check it against your wardrobe and flag it if you already own something similar.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add to Wishlist
        </button>
      </header>

      {/* Budget Widget */}
      <div className="glass-panel rounded-3xl p-6 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-foreground/60 mb-1">Monthly Budget Remaining</h3>
          <p className="text-4xl font-display text-primary">
            ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-xl text-foreground/40"> / ${MONTHLY_BUDGET.toLocaleString()}</span>
          </p>
        </div>
        <div className="w-64 h-2 bg-[#595800]/8 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pctUsed}%` }} />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-display font-medium mb-6">Your Curated Wishlist</h3>
        {loading ? (
          <div className="flex justify-center items-center py-20 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-foreground/50 py-10">Your wishlist is empty.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={item.id}
                className="glass-panel rounded-2xl overflow-hidden flex flex-col group"
              >
                <div className="h-64 relative overflow-hidden bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url || FALLBACK_IMG}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {item.duplicate_alert && (
                    <div className="absolute top-4 left-4 bg-red-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                      <AlertTriangle className="w-3 h-3" />
                      Wardrobe Duplicate
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-primary" />
                    {item.match_rate}% Wardrobe Match
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    aria-label="Remove from wishlist"
                    className="absolute bottom-4 right-4 bg-black/60 hover:bg-red-500/90 text-white p-2 rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="p-5 flex justify-between items-start">
                  <div>
                    <h4 className="font-display font-medium text-lg">{item.brand}</h4>
                    <p className="text-foreground/60 text-sm">{item.name}</p>
                  </div>
                  <span className="font-medium">${item.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel bg-background rounded-3xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-display font-medium">Add to Wishlist</h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="p-2 hover:bg-[#595800]/8 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/60 mb-1 block">Item name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tailored Wool Coat"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/60 mb-1 block">Brand</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Everlane"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/60 mb-1 block">Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/60 mb-1 block">Image URL</label>
                  <input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/40 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://..."
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full h-14 font-semibold text-button flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add to Wishlist"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}