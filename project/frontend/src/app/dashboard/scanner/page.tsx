"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ocrApi } from "@/lib/api";

export default function ScannerPage() {
  const [scanType, setScanType] = useState<"label" | "receipt">("label");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview("");
    }
    setResult(null);
    setSaveStatus("");
  };

  const runScan = async () => {
    if (!file) return;
    setLoading(true);
    setSaveStatus("");
    try {
      if (scanType === "label") {
        const res = await ocrApi.scanLabel(file);
        setResult(res);
      } else {
        const res = await ocrApi.scanReceipt(file);
        setResult(res.extracted_data);
      }
    } catch (e) {
      console.error(e);
      const raw = (e as Error).message || "";
      const friendly = /gemini/i.test(raw)
        ? "Couldn't read that image right now. Try again in a moment."
        : raw || "Something went wrong. Try again.";
      setResult({ error: friendly });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = async () => {
    if (!result) return;
    try {
      const res = await ocrApi.autoFill({
        name: `${result.brand || "Unknown Brand"} ${result.fabric_composition ? "Item" : ""}`,
        brand: result.brand,
        fabric_composition: result.fabric_composition,
        care_instructions: result.care_instructions,
        price: result.total || 0, // Fallback if receipt data was passed
      });
      setSaveStatus(res.msg || "Saved!");
    } catch (e) {
      console.error(e);
      setSaveStatus("Failed to save.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Scan Clothes</h1>
        <p className="text-foreground/60">
          Scan a clothing label for care instructions, or a receipt to log the purchase.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => { setScanType("label"); setResult(null); }}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${scanType === "label" ? "bg-primary text-primary-foreground" : "glass-panel hover:bg-[#595800]/5"}`}
        >
          Clothing Label
        </button>
        <button
          onClick={() => { setScanType("receipt"); setResult(null); }}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${scanType === "receipt" ? "bg-primary text-primary-foreground" : "glass-panel hover:bg-[#595800]/5"}`}
        >
          Receipt
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <label className="flex-1 flex flex-col items-center justify-center gap-4 cursor-pointer border-2 border-dashed border-border rounded-xl p-8 hover:bg-[#595800]/5 transition-colors">
            <Camera className="w-8 h-8 text-foreground/40" />
            <span className="font-medium text-foreground/80">
              {file ? "Change Image" : "Upload Image to Scan"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          
          {preview && (
            <div className="relative w-48 h-48 rounded-xl overflow-hidden border border-border">
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={runScan}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {loading ? "Scanning..." : `Scan ${scanType === "label" ? "Label" : "Receipt"}`}
          </button>
        )}
      </div>

      {result && !result.error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-3xl">
          <h3 className="text-xl font-display font-medium mb-4">Extracted Data</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {Object.entries(result).map(([k, v]) => (
              <div key={k} className="bg-[#595800]/5 p-4 rounded-xl">
                <p className="text-xs text-foreground/50 uppercase tracking-wider mb-1">{k.replace(/_/g, " ")}</p>
                <p className="font-medium truncate" title={JSON.stringify(v)}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleAutoFill} className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors">
              Add to Wardrobe
            </button>
            {saveStatus && (
              <span className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" /> {saveStatus}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {result && result.error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {result.error}
        </div>
      )}
    </div>
  );
}