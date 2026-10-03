"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Heart,
  Tag,
  Palette,
  Scissors,
  Star,
  ChevronRight,
  Check,
} from "lucide-react";
import { personalizationApi } from "@/lib/api";

type Prefs = {
  favorite_colors: string[];
  favorite_brands: string[];
  favorite_styles: string[];
  favorite_fabrics: string[];
  favorite_fits: string[];
  favorite_occasions: string[];
};

type Profile = {
  implicit_colors: [string, number][];
  implicit_brands: [string, number][];
  implicit_styles: [string, number][];
};

const STYLE_OPTIONS = ["Minimalist", "Streetwear", "Preppy", "Bohemian", "Formal", "Athleisure", "Vintage", "Cottagecore"];
const FIT_OPTIONS = ["Slim", "Relaxed", "Oversized", "Tailored", "Regular"];
const OCCASION_OPTIONS = ["Work", "Casual", "Formal", "Date Night", "Travel", "Sports", "Party"];

function TagPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-foreground/60 hover:text-foreground hover:border-white/30"
      }`}
    >
      {active && <Check className="inline w-3 h-3 mr-1.5" />}
      {label}
    </button>
  );
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="h-1.5 w-full bg-[#595800]/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full bg-primary rounded-full"
      />
    </div>
  );
}

export default function PersonalizationPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    favorite_colors: [],
    favorite_brands: [],
    favorite_styles: [],
    favorite_fabrics: [],
    favorite_fits: [],
    favorite_occasions: [],
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [brandInput, setBrandInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, prof] = await Promise.all([
          personalizationApi.getPreferences(),
          personalizationApi.getLearningProfile(),
        ]);
        setPrefs(p);
        setProfile(prof);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (field: keyof Prefs, val: string) => {
    setPrefs((prev) => {
      const list = prev[field] || [];
      return {
        ...prev,
        [field]: list.includes(val) ? list.filter((x) => x !== val) : [...list, val],
      };
    });
  };

  const addChip = (field: keyof Prefs, val: string, clear: () => void) => {
    const v = val.trim();
    if (!v) return;
    setPrefs((prev) => ({
      ...prev,
      [field]: prev[field].includes(v) ? prev[field] : [...prev[field], v],
    }));
    clear();
  };

  const removeChip = (field: keyof Prefs, val: string) => {
    setPrefs((prev) => ({ ...prev, [field]: prev[field].filter((x) => x !== val) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await personalizationApi.updatePreferences(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2">
            Personalization
          </h1>
          <p className="text-foreground/60">
            Pick your style, fit, and occasions below — the more you choose, the better every recommendation gets.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
          {saved ? "Saved!" : "Save Preferences"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left col – Explicit prefs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Styles */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-display font-medium">Styles</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((s) => (
                <TagPill
                  key={s}
                  label={s}
                  active={prefs.favorite_styles.includes(s)}
                  onClick={() => toggle("favorite_styles", s)}
                />
              ))}
            </div>
          </div>

          {/* Fits & Occasions */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Scissors className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-display font-medium">Fit</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {FIT_OPTIONS.map((f) => (
                  <TagPill
                    key={f}
                    label={f}
                    active={prefs.favorite_fits.includes(f)}
                    onClick={() => toggle("favorite_fits", f)}
                  />
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Tag className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-display font-medium">Occasions</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {OCCASION_OPTIONS.map((o) => (
                  <TagPill
                    key={o}
                    label={o}
                    active={prefs.favorite_occasions.includes(o)}
                    onClick={() => toggle("favorite_occasions", o)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Brands & Colors */}
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-display font-medium">Brands & Colors</h2>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-2 block">
                Favorite Brands
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChip("favorite_brands", brandInput, () => setBrandInput(""))}
                  placeholder="Type a brand and press Enter"
                  className="flex-1 bg-surface border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => addChip("favorite_brands", brandInput, () => setBrandInput(""))}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {prefs.favorite_brands.map((b) => (
                  <span
                    key={b}
                    onClick={() => removeChip("favorite_brands", b)}
                    className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    {b} ×
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-2 block">
                Favorite Colors
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChip("favorite_colors", colorInput, () => setColorInput(""))}
                  placeholder="Type a color and press Enter"
                  className="flex-1 bg-surface border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => addChip("favorite_colors", colorInput, () => setColorInput(""))}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {prefs.favorite_colors.map((c) => (
                  <span
                    key={c}
                    onClick={() => removeChip("favorite_colors", c)}
                    className="px-3 py-1 bg-[#595800]/5 border border-white/10 rounded-full text-sm cursor-pointer hover:bg-[#595800]/8 transition-colors"
                  >
                    {c} ×
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right col – AI Learning Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-display font-medium">AI Profile</h2>
                <p className="text-xs text-foreground/50 mt-0.5">Learned from your wardrobe</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Implicit Colors */}
              <div>
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-3">
                  Top Colors
                </p>
                {profile?.implicit_colors?.length ? (
                  <div className="space-y-3">
                    {profile.implicit_colors.map(([color, score], i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{color}</span>
                          <span className="text-foreground/50">{score} pts</span>
                        </div>
                        <ScoreBar score={score} max={Math.max(...profile.implicit_colors.map(([, s]) => s)) || 10} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/40">Wear more items to build your profile.</p>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Implicit Brands */}
              <div>
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-3">
                  Top Brands
                </p>
                {profile?.implicit_brands?.length ? (
                  <div className="space-y-2">
                    {profile.implicit_brands.map(([brand, score], i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#595800]/5 transition-colors">
                        <span className="text-sm font-medium">{brand}</span>
                        <span className="text-xs text-primary font-medium">{score} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/40">No brand data yet.</p>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Implicit Styles */}
              <div>
                <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-3">
                  Style Affinity
                </p>
                {profile?.implicit_styles?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.implicit_styles.map(([style, score], i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20"
                      >
                        {style}
                        <span className="ml-1.5 opacity-60">{score}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/40">No style affinity data yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Feedback tip */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <ChevronRight className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm mb-1">How to improve your profile</p>
                <p className="text-xs text-foreground/50 leading-relaxed">
                  Use the <strong className="text-foreground/70">Outfit Planner</strong> to like or dislike outfits. FitSense learns from every interaction to rank recommendations better.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}