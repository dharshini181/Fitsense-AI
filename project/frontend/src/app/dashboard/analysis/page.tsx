"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, RefreshCw, Palette, Loader2, Star } from "lucide-react";
import { analysisApi } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultData = Record<string, any>;

function prettifyKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Fields shown as a headline badge instead of a plain row.
const CONFIDENCE_KEYS = ["confidence", "confidence_score"];

function ResultCard({ data }: { data: ResultData }) {
  const confidenceKey = CONFIDENCE_KEYS.find((k) => data[k] != null);
  const confidenceValue = confidenceKey ? data[confidenceKey] : null;
  const confidencePct =
    confidenceValue != null
      ? Math.round(confidenceValue <= 1 ? confidenceValue * 100 : confidenceValue)
      : null;

  const entries = Object.entries(data).filter(([key]) => !CONFIDENCE_KEYS.includes(key));

  return (
    <div className="space-y-5">
      {confidencePct != null && (
        <div className="chip inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium">
          <Star className="w-3.5 h-3.5" />
          {confidencePct}% confident
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entries.map(([key, value]) => (
          <div key={key} className={Array.isArray(value) ? "sm:col-span-2" : ""}>
            <p className="text-xs font-medium text-foreground/50 uppercase tracking-wider mb-1.5">
              {prettifyKey(key)}
            </p>
            {Array.isArray(value) ? (
              <div className="flex flex-wrap gap-2">
                {value.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#595800]/8 border border-border rounded-full text-sm"
                  >
                    {typeof item === "object" ? JSON.stringify(item) : String(item)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-base">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState<string>("");
  const [result, setResult] = useState<{ type: string; data?: ResultData; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview("");
    }
    setResult(null);
  };

  const runAnalysis = async (type: keyof typeof analysisApi) => {
    if (!file) return;
    setLoading(type);
    try {
      const method = analysisApi[type] as (file: File) => Promise<ResultData>;
      const res = await method(file);
      setResult({ type, data: res });
    } catch (e) {
      console.error(e);
      setResult({ type, error: (e as Error).message });
    } finally {
      setLoading("");
    }
  };

  const RESULT_TITLES: Record<string, string> = {
    scan: "Clothing Details",
    skinTone: "Your Skin Tone",
    bodyShape: "Your Body Shape",
    full: "Full Style Profile",
    rate: "Outfit Rating",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2">
            My Style
          </h1>
          <p className="text-foreground/60">
            Upload a photo, then pick what to check: clothing, skin tone, body shape, or a rating on your outfit.
          </p>
        </div>
        <button
          className="glass-panel px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:bg-[#595800]/8 transition-colors"
          onClick={() => {
            setFile(null);
            setPreview("");
            setResult(null);
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </header>

      {/* File uploader */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer bg-primary/10 text-primary rounded-xl px-4 py-2 hover:bg-primary/20 transition-colors">
          <Camera className="w-5 h-5" />
          <span>Choose Photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
        {preview && (
          <img src={preview} alt="preview" className="h-24 w-24 object-cover rounded-xl border border-border" />
        )}
      </div>

      {/* Action buttons */}
      {file && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ key: "scan", label: "Clothing Scan" },{ key: "skinTone", label: "Skin Tone" },{ key: "bodyShape", label: "Body Shape" },{ key: "full", label: "Full Analysis" },{ key: "rate", label: "Rate Outfit" }].map((item) => (
            <button
              key={item.key}
              disabled={!!loading}
              onClick={() => runAnalysis(item.key as keyof typeof analysisApi)}
              className="glass-panel p-4 rounded-xl hover:bg-[#595800]/5 transition-colors flex items-center gap-2"
            >
              {loading === item.key ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : item.key === "rate" ? (
                <Star className="w-5 h-5" />
              ) : (
                <Palette className="w-5 h-5" />
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Result display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6"
        >
          <h3 className="text-xl font-display font-medium mb-4">
            {RESULT_TITLES[result.type] || "Result"}
          </h3>
          {result.error ? (
            <p className="text-red-400">Something went wrong: {result.error}</p>
          ) : result.type === "rate" && result.data ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-display font-medium text-primary">
                  {result.data.overall_score}
                </span>
                <span className="text-foreground/50">/ 100 overall</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Color Matching", value: result.data.color_matching },
                  { label: "Silhouette", value: result.data.silhouette_balance },
                  { label: "Fit Accuracy", value: result.data.fit_accuracy },
                  { label: "Styling", value: result.data.styling_score },
                ].map((s) => (
                  <div key={s.label} className="bg-[#595800]/5 rounded-xl p-3">
                    <div className="text-2xl font-medium">{s.value}</div>
                    <div className="text-xs text-foreground/50">{s.label}</div>
                  </div>
                ))}
              </div>
              {result.data.grading_explanation && (
                <p className="text-sm text-foreground/70">{result.data.grading_explanation}</p>
              )}
              {result.data.improvement_tips && (
                <p className="text-sm text-primary/80">Tip: {result.data.improvement_tips}</p>
              )}
            </div>
          ) : result.data ? (
            <ResultCard data={result.data} />
          ) : null}
        </motion.div>
      )}
    </div>
  );
}