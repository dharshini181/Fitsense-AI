"use client";

import { useState, useEffect } from "react";
import { UserCircle, Shield, Bell, Monitor, Loader2, Check } from "lucide-react";
import { authApi } from "@/lib/api";

type Profile = {
  id: number;
  name: string;
  email: string;
  role: string;
  gender: string;
  style_preference: string;
  body_shape: string;
  skin_tone: string;
  budget_limit: number;
};

const STYLE_OPTIONS = ["Minimalist", "Streetwear", "Preppy", "Bohemian", "Classic", "Edgy"];
const BODY_SHAPES = ["Rectangle", "Hourglass", "Pear", "Apple", "Inverted Triangle"];
const GENDERS = ["Unspecified", "Female", "Male", "Non-binary"];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then(setProfile)
      .catch((err) => console.error("Failed to load profile", err))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof Profile, value: string | number) => {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await authApi.updateProfile({
        gender: profile.gender,
        style_preference: profile.style_preference,
        body_shape: profile.body_shape,
        skin_tone: profile.skin_tone,
        budget_limit: profile.budget_limit,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex h-full items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Settings</h1>
        <p className="text-foreground/60">Change anything below and save. I&apos;ll use it everywhere else to pick better outfits for you.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Navigation — Notifications/Security/Appearance aren't
            backed by anything yet, shown for orientation only. */}
        <div className="space-y-2">
          {[
            { name: "Profile", icon: UserCircle, active: true },
            { name: "Notifications", icon: Bell, active: false },
            { name: "Security", icon: Shield, active: false },
            { name: "Appearance", icon: Monitor, active: false },
          ].map((item, i) => (
            <button
              key={i}
              disabled={!item.active}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/30 cursor-not-allowed"
              }`}
              title={item.active ? undefined : "Coming soon"}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <h3 className="text-xl font-display font-medium">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  disabled
                  title="Name changes aren't supported yet"
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-foreground/50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-foreground/50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Style Preference
                </label>
                <select
                  value={profile.style_preference}
                  onChange={(e) => update("style_preference", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  {STYLE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Monthly Shopping Budget (₹)
                </label>
                <input
                  type="number"
                  value={profile.budget_limit}
                  onChange={(e) => update("budget_limit", Number(e.target.value) || 0)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Body Shape
                </label>
                <select
                  value={profile.body_shape}
                  onChange={(e) => update("body_shape", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  {BODY_SHAPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="text-[11px] text-foreground/40 mt-1">
                  Or use Body Shape analysis on My Style for an AI-detected value.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Skin Tone
                </label>
                <input
                  type="text"
                  value={profile.skin_tone}
                  onChange={(e) => update("skin_tone", e.target.value)}
                  placeholder="e.g. Warm, Medium-Tan"
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <p className="text-[11px] text-foreground/40 mt-1">
                  Or use Skin Tone analysis on My Style for an AI-detected value.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider mb-1 block">
                  Gender
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end items-center gap-4">
              {saved && (
                <span className="text-sm text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-display font-medium">Account</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/60">Role</span>
              <span className="capitalize font-medium">{profile.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}