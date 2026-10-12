"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, ImagePlus, Check, Sparkles, Upload } from "lucide-react";
import { photoStyleApi, stylistApi, authApi } from "@/lib/api";

type Outfit = { title: string; pieces: string[]; why: string; image?: string | null; loading?: boolean };
type Result = {
  body_shape: string;
  skin_tone: string;
  undertone: string;
  fit_tips: string[];
  colors_to_wear: string[];
  colors_to_avoid: string[];
  outfits: Outfit[];
};

export default function PhotoStylePage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Free the preview URL when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = (f: File | null) => {
    setError("");
    setResult(null);
    setSaved(false);
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Please choose a JPG, PNG or WebP photo.");
      return;
    }
    if (f.size > 6 * 1024 * 1024) {
      setError("That photo is too large. Please use one under 6 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const analyse = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const res = (await photoStyleApi.suggest(file)) as Result;
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (index: number) => {
    if (!result) return;
    const o = result.outfits[index];
    const description = `${o.title}: ${o.pieces.join(", ")}.`;
    setResult((r) => r && { ...r, outfits: r.outfits.map((x, i) => (i === index ? { ...x, loading: true } : x)) });
    try {
      const res = await stylistApi.visualize(description);
      setResult((r) =>
        r && { ...r, outfits: r.outfits.map((x, i) => (i === index ? { ...x, image: res.outfit_image, loading: false } : x)) }
      );
    } catch {
      setResult((r) => r && { ...r, outfits: r.outfits.map((x, i) => (i === index ? { ...x, loading: false } : x)) });
    }
  };

  const saveToProfile = async () => {
    if (!result) return;
    try {
      const patch: Record<string, string> = {};
      if (result.body_shape) patch.body_shape = result.body_shape;
      if (result.skin_tone) patch.skin_tone = result.skin_tone;
      await authApi.updateProfile(patch);
      setSaved(true);
    } catch {
      setError("Couldn't save to your profile. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-display font-medium tracking-tight">Style From My Photo</h1>
        <p className="text-sm text-foreground/60">
          Upload a photo of yourself and get outfit ideas that suit you. Your photo is not saved.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:h-[calc(100dvh-12rem)] lg:min-h-[480px]">
        {/* Upload */}
        <div className="glass-panel rounded-3xl p-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 min-h-[220px] rounded-2xl border border-dashed border-border bg-surface/50 hover:bg-[#595800]/5 transition-colors flex items-center justify-center overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Your photo" className="w-full h-full object-contain" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-foreground/50 text-sm p-4 text-center">
                <Upload className="w-7 h-7" />
                Tap to choose a photo
                <span className="text-xs">A well-lit, full-body photo works best</span>
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={analyse}
            disabled={!file || loading}
            className="bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {loading ? "Looking at your photo…" : "Get outfit ideas"}
          </button>
        </div>

        {/* Results */}
        <div className="glass-panel rounded-3xl p-5 overflow-y-auto min-h-[300px]">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center text-foreground/50 gap-2">
              <Sparkles className="w-8 h-8" />
              <p className="text-sm">Your outfit ideas will show up here.</p>
            </div>
          )}
          {loading && (
            <div className="h-full flex items-center justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
          {result && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {result.body_shape && <Chip label={`Body shape: ${result.body_shape}`} />}
                {result.skin_tone && <Chip label={`Skin tone: ${result.skin_tone}`} />}
                {result.undertone && <Chip label={`Undertone: ${result.undertone}`} />}
                <button
                  onClick={saveToProfile}
                  disabled={saved}
                  className="ml-auto text-xs font-medium px-3 py-2 rounded-xl border border-border text-primary hover:bg-[#595800]/5 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  {saved && <Check className="w-3.5 h-3.5" />}
                  {saved ? "Saved to your profile" : "Save to my profile"}
                </button>
              </div>

              {result.fit_tips.length > 0 && (
                <Section title="What suits you">
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {result.fit_tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </Section>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Section title="Colours to wear">
                  <div className="flex flex-wrap gap-1.5">
                    {result.colors_to_wear.map((c) => <Chip key={c} label={c} />)}
                  </div>
                </Section>
                <Section title="Colours to skip">
                  <div className="flex flex-wrap gap-1.5">
                    {result.colors_to_avoid.map((c) => <Chip key={c} label={c} />)}
                  </div>
                </Section>
              </div>

              <Section title="Outfit ideas">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.outfits.map((o, i) => (
                    <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex flex-col">
                      <h3 className="font-medium text-sm mb-1">{o.title}</h3>
                      <p className="text-sm text-foreground/80">{o.pieces.join(" · ")}</p>
                      {o.why && <p className="text-xs text-foreground/50 mt-1">{o.why}</p>}
                      {o.image ? (
                        <img src={o.image} alt={o.title} className="mt-3 rounded-xl max-h-[300px] w-auto max-w-full object-contain self-start" />
                      ) : (
                        <button
                          onClick={() => generateImage(i)}
                          disabled={o.loading}
                          className="mt-3 self-start flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-border text-primary hover:bg-[#595800]/5 transition-colors disabled:opacity-60"
                        >
                          {o.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                          {o.loading ? "Generating..." : "Generate Image"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return <span className="text-xs bg-surface border border-border rounded-full px-3 py-1.5">{label}</span>;
}