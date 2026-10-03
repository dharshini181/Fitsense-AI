"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Shirt,
  Leaf,
  ThumbsUp,
  TrendingUp,
  Loader2,
  Palette,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { analyticsApi, predictiveApi } from "@/lib/api";

type AnalyticsData = {
  total_garments: number;
  total_value: number;
  color_distribution: Record<string, number>;
  cost_per_wear: Array<{ name: string; cost: number }>;
};

type PredictiveData = {
  sustainability: {
    total_carbon_footprint_kg: number;
    sustainability_score_100: number;
    grade: string;
  };
  trends: string[];
  metrics: {
    Acceptance_Rate: number | null;
    Average_Inference_Time_ms: number | null;
    total_rated_outfits?: number;
    note?: string;
  };
};

// Common fashion color names mapped to a real swatch. Falls back to the
// brand's neutral outline color for anything not in the list, rather than
// lumping every non-black item under one generic grey.
const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f0",
  grey: "#8a8a82",
  gray: "#8a8a82",
  navy: "#1f2b4d",
  blue: "#2f5fa8",
  "light blue": "#8fb8e0",
  red: "#b3352c",
  maroon: "#6b1f24",
  pink: "#dd8fa8",
  green: "#3f6b3f",
  olive: "#6b6b2e",
  khaki: "#b8ab7a",
  beige: "#d8c8a8",
  cream: "#f0e6c8",
  brown: "#6b4a30",
  tan: "#c8a878",
  yellow: "#d9c53a",
  mustard: "#c9a227",
  orange: "#cc7a2e",
  purple: "#6b4a8a",
  lavender: "#b6a3d0",
  teal: "#2f8a82",
  turquoise: "#3fb8ae",
  denim: "#4a6a8a",
  gold: "#c9a227",
  silver: "#b8b8b0",
};

function colorToHex(name: string): string {
  return COLOR_HEX[name.trim().toLowerCase()] || "#a6a34d"; // brand outline as neutral fallback
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="data-card p-5">
      <div className="w-9 h-9 rounded-xl bg-chip flex items-center justify-center text-primary mb-3">
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <p className="text-caption text-on-surface-variant mb-1">{label}</p>
      <p className="text-headline-lg-mobile font-display font-medium tracking-tight">{value}</p>
      {sublabel && <p className="text-caption text-on-surface-variant mt-1">{sublabel}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [predictive, setPredictive] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const stats = await analyticsApi.getAnalytics();
        setData(stats);

        const [sust, tr, met] = await Promise.all([
          predictiveApi.getMySustainability(),
          predictiveApi.getTrends(),
          predictiveApi.getModelMetrics(),
        ]);
        setPredictive({ sustainability: sust, trends: tr, metrics: met });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const colorEntries = Object.entries(data?.color_distribution || {}).sort((a, b) => b[1] - a[1]);
  const chartData = colorEntries.map(([name, count]) => ({ name, value: count }));
  const maxCost = Math.max(1, ...(data?.cost_per_wear || []).map((i) => i.cost));
  const acceptancePct =
    predictive?.metrics?.Acceptance_Rate != null
      ? Math.round(predictive.metrics.Acceptance_Rate * 100)
      : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Wardrobe Analytics</h1>
        <p className="text-foreground/60">
          Updates on its own from your wardrobe — your best buys, how sustainable you&apos;re being, and what&apos;s trending for you.
        </p>
      </header>

      {/* Top-line metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Wallet} label="Wardrobe Value" value={`$${(data?.total_value || 0).toFixed(0)}`} />
        <MetricCard icon={Shirt} label="Total Items" value={String(data?.total_garments || 0)} />
        <MetricCard
          icon={Leaf}
          label="Sustainability"
          value={predictive?.sustainability?.grade || "—"}
          sublabel={
            predictive?.sustainability?.sustainability_score_100 != null
              ? `${predictive.sustainability.sustainability_score_100}/100`
              : undefined
          }
        />
        <MetricCard
          icon={ThumbsUp}
          label="Recs You Liked"
          value={acceptancePct != null ? `${acceptancePct}%` : "—"}
          sublabel={acceptancePct == null ? "Not enough ratings yet" : undefined}
        />
      </section>

      {/* Color distribution + cost per wear */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="editorial-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant">
              Colors In Your Wardrobe
            </h2>
          </div>

          {chartData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="65%"
                      outerRadius="100%"
                      strokeWidth={0}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={colorToHex(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} items`, String(name)]}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5 min-w-0">
                {colorEntries.slice(0, 6).map(([color, count]) => (
                  <div key={color} className="flex items-center gap-2.5 text-sm">
                    <span
                      className="w-3 h-3 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: colorToHex(color) }}
                    />
                    <span className="flex-1 capitalize truncate">{color}</span>
                    <span className="text-on-surface-variant text-caption shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">Add a few items with colors set to see this chart.</p>
          )}
        </div>

        <div className="editorial-card p-6 md:p-8">
          <h2 className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant mb-6">
            Best Investments (Cost Per Wear)
          </h2>
          {data?.cost_per_wear && data.cost_per_wear.length > 0 ? (
            <div className="space-y-4">
              {data.cost_per_wear.slice(0, 5).map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-medium truncate pr-3">{item.name}</span>
                    <span className="text-sm font-display font-medium text-primary shrink-0">
                      ${item.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-chip/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, (item.cost / maxCost) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No wear data yet — log outfits to see this.</p>
          )}
        </div>
      </section>

      {/* Predictive insights */}
      <section>
        <h2 className="text-caption font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
          Looking Ahead
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="data-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-on-surface-variant">Carbon Footprint</p>
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <p className="text-headline-lg-mobile font-display font-medium tracking-tight">
              {predictive?.sustainability?.total_carbon_footprint_kg ?? "—"} kg
            </p>
            <p className="text-caption text-on-surface-variant mt-1">CO2e across your wardrobe</p>
          </div>

          <div className="data-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-on-surface-variant">Trending For You</p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            {predictive?.trends && predictive.trends.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {predictive.trends.slice(0, 4).map((t) => (
                  <span key={t} className="chip text-caption font-medium px-2.5 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-caption text-on-surface-variant">Nothing yet — wear a few more outfits.</p>
            )}
          </div>

          <div className="data-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-on-surface-variant">Recommendation Quality</p>
              <ThumbsUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm">
              {acceptancePct != null ? (
                <>You&apos;ve liked <span className="font-medium text-foreground">{acceptancePct}%</span> of recent picks.</>
              ) : (
                "Not enough ratings yet."
              )}
            </p>
            {predictive?.metrics?.Average_Inference_Time_ms != null && (
              <p className="text-caption text-on-surface-variant mt-1">
                Responds in {predictive.metrics.Average_Inference_Time_ms}ms on average
              </p>
            )}
            <p className="text-caption text-on-surface-variant/70 mt-1">
              Based on {predictive?.metrics?.total_rated_outfits ?? 0} rated outfits, platform-wide.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}