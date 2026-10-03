"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, Scan, Loader2, X, Shirt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { wardrobeApi, analysisApi } from "@/lib/api";

type Item = {
  id: number;
  name: string;
  category: string;
  color: string;
  image_url: string;
};

type ScanResult = {
  clothing_type?: string;
  detected_colors?: string[];
  pattern?: string;
  fabric?: string;
  style?: string;
  confidence?: number;
};

export default function WardrobePage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "Tops", color: "", material: "", price: "" });

  const [scanPreview, setScanPreview] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await wardrobeApi.getWardrobe();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await wardrobeApi.searchWardrobe(search);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wardrobeApi.createItem({
        name: newItem.name,
        category: newItem.category,
        color: newItem.color,
        material: newItem.material || undefined,
        price: parseFloat(newItem.price) || 0,
      });
      closeAddModal();
      fetchItems();
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewItem({ name: "", category: "Tops", color: "", material: "", price: "" });
    setScanPreview("");
    setScanNote("");
  };

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanNote("");
    try {
      const result: ScanResult = await analysisApi.scan(file);
      const color = result.detected_colors?.[0] || "";
      setNewItem((prev) => ({
        ...prev,
        name: prev.name || [color, result.clothing_type].filter(Boolean).join(" "),
        category: result.clothing_type || prev.category,
        color: color || prev.color,
        material: result.fabric || prev.material,
      }));
      setScanNote("AI filled these in from your photo — check them over before saving.");
    } catch (err) {
      console.error("Scan failed", err);
      setScanNote("Couldn't read that photo. No problem — just fill the details in below.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Wardrobe</h1>
          <p className="text-foreground/60">Give each item a name, category, and color. Photo and price are optional.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="glass-panel px-4 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-[#595800]/8 transition-colors"
          >
            <Scan className="w-4 h-4" />
            AI Scan
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </header>

      <form onSubmit={handleSearch} className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input 
            type="text" 
            placeholder="Search by color, brand, category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button type="button" className="glass-panel px-4 py-3 rounded-full flex items-center gap-2 hover:bg-[#595800]/8 transition-colors">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-foreground/50 border border-dashed border-border rounded-3xl">
          <Scan className="w-12 h-12 mb-4 opacity-20" />
          <p>Your wardrobe is empty.</p>
          <p className="text-sm">Click &quot;Add Item&quot; to add your first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx % 10) * 0.05 }}
              key={item.id} 
              className="data-card overflow-hidden group cursor-pointer"
            >
              <div className="aspect-square w-full relative bg-chip/30">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="w-7 h-7 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="text-sm font-medium truncate">{item.name}</h3>
                <p className="text-xs text-on-surface-variant truncate">{item.category} · {item.color}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={closeAddModal}
                className="absolute top-6 right-6 text-foreground/50 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-display font-medium mb-6">Add New Item</h3>

              <label className="flex items-center gap-4 cursor-pointer border-2 border-dashed border-border rounded-xl p-4 mb-2 hover:bg-[#595800]/5 transition-colors">
                {scanning ? (
                  <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : scanPreview ? (
                  <img src={scanPreview} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center shrink-0">
                    <Scan className="w-5 h-5 text-foreground/40" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground/80">
                    {scanning ? "Reading the photo..." : "Upload a photo — I'll fill this in"}
                  </p>
                  <p className="text-xs text-foreground/40">Or skip it and type the details yourself below</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleScanFile} disabled={scanning} />
              </label>
              {scanNote && <p className="text-xs text-foreground/50 mb-4">{scanNote}</p>}
              
              <form onSubmit={handleAddItem} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">Item Name</label>
                  <input 
                    type="text" required 
                    value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Silk Midi Dress" 
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">Category</label>
                    <input
                      type="text" required list="category-suggestions"
                      value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      placeholder="e.g. Jacket"
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50"
                    />
                    <datalist id="category-suggestions">
                      <option value="Outerwear" />
                      <option value="Tops" />
                      <option value="Pants" />
                      <option value="Dresses" />
                      <option value="Shoes" />
                      <option value="Accessories" />
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">Primary Color</label>
                    <input 
                      type="text" required 
                      value={newItem.color} onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                      placeholder="e.g. Black" 
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">Material <span className="normal-case text-foreground/30">(optional)</span></label>
                    <input 
                      type="text"
                      value={newItem.material} onChange={(e) => setNewItem({...newItem, material: e.target.value})}
                      placeholder="e.g. Cotton" 
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">Estimated Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" 
                      value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      placeholder="e.g. 150" 
                      className="w-full bg-background border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium mt-6 hover:opacity-90 transition-opacity">
                  Add to Wardrobe
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}