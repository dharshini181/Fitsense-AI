"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Shirt,
  Sparkles,
  Plane,
  Loader2,
  ShieldAlert,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { authApi, adminApi } from "@/lib/api";

type Overview = {
  total_users: number;
  new_users_30d: number;
  role_distribution: Record<string, number>;
  total_wardrobe_items: number;
  total_outfits_generated: number;
  total_trips_planned: number;
  total_planner_events: number;
  style_preference_distribution: Record<string, number>;
  outfit_feedback_distribution: Record<string, number>;
};

type TopUser = {
  id: number;
  name: string;
  email: string;
  wardrobe_items: number;
};

type ModelMetrics = {
  Acceptance_Rate: number | null;
  Average_Inference_Time_ms: number | null;
  Drift_Detected: boolean;
  total_rated_outfits?: number;
  note?: string;
};

export default function AdminPage() {
  const [authState, setAuthState] = useState<"checking" | "denied" | "allowed">("checking");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [series, setSeries] = useState<Array<{ date: string; signups: number }>>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [trends, setTrends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const me = await authApi.me();
        if (me.role !== "admin") {
          setAuthState("denied");
          setLoading(false);
          return;
        }
        setAuthState("allowed");

        const [ov, ts, tu, mm, tr] = await Promise.all([
          adminApi.getOverview(),
          adminApi.getSignupsTimeseries(30),
          adminApi.getTopUsers(5),
          adminApi.getModelMetrics(),
          adminApi.getTrends(),
        ]);
        setOverview(ov);
        setSeries(ts.series);
        setTopUsers(tu);
        setMetrics(mm);
        setTrends(tr.trends);
      } catch (err) {
        console.error(err);
        setAuthState("denied");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading || authState === "checking") {
    return (
      <div className="flex h-full items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (authState === "denied") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
        <ShieldAlert className="w-12 h-12 text-foreground/30" />
        <h2 className="text-2xl font-display font-medium">Admin access required</h2>
        <p className="text-foreground/60 max-w-md">
          This dashboard is restricted to accounts with the <code>admin</code> role.
          Ask a platform owner to promote your account if you believe you should have access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-foreground/60">Admin only. See how people are using FitSense — nothing to fill in, just look.</p>
      </header>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <Users className="absolute -right-4 -bottom-4 w-28 h-28 text-primary/5" />
          <p className="text-sm text-foreground/60 mb-2">Total Users</p>
          <p className="text-4xl font-display font-medium">{overview?.total_users ?? 0}</p>
          <p className="text-xs text-emerald-400 mt-2">
            +{overview?.new_users_30d ?? 0} in last 30 days
          </p>
        </div>
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <Shirt className="absolute -right-4 -bottom-4 w-28 h-28 text-primary/5" />
          <p className="text-sm text-foreground/60 mb-2">Wardrobe Items</p>
          <p className="text-4xl font-display font-medium">{overview?.total_wardrobe_items ?? 0}</p>
          <p className="text-xs text-foreground/50 mt-2">Across all users</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <Sparkles className="absolute -right-4 -bottom-4 w-28 h-28 text-primary/5" />
          <p className="text-sm text-foreground/60 mb-2">Outfits Generated</p>
          <p className="text-4xl font-display font-medium">{overview?.total_outfits_generated ?? 0}</p>
          <p className="text-xs text-foreground/50 mt-2">Saved outfit records</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
          <Plane className="absolute -right-4 -bottom-4 w-28 h-28 text-primary/5" />
          <p className="text-sm text-foreground/60 mb-2">Trips Planned</p>
          <p className="text-4xl font-display font-medium">{overview?.total_trips_planned ?? 0}</p>
          <p className="text-xs text-foreground/50 mt-2">
            {overview?.total_planner_events ?? 0} calendar events
          </p>
        </div>
      </div>

      {/* Signups chart */}
      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-xl font-display font-medium mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Signups — Last 30 Days
        </h3>
        {series.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                tickFormatter={(d) => d.slice(5)}
                interval={4}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Line type="monotone" dataKey="signups" stroke="currentColor" className="text-primary" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-foreground/40">No signup data yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top users */}
        <div className="glass-panel rounded-3xl p-6">
          <h3 className="text-xl font-display font-medium mb-6">Most Active Wardrobes</h3>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((u) => (
                <div key={u.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-[#595800]/5 transition-colors">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-foreground/50">{u.email}</p>
                  </div>
                  <p className="text-lg font-display font-medium text-primary">{u.wardrobe_items}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/40">No users yet.</p>
            )}
          </div>
        </div>

        {/* Role + style distribution */}
        <div className="glass-panel rounded-3xl p-6">
          <h3 className="text-xl font-display font-medium mb-6">Role Distribution</h3>
          <div className="space-y-3">
            {overview && Object.entries(overview.role_distribution).map(([role, count]) => (
              <div key={role} className="flex items-center gap-3">
                <span className="w-20 text-sm capitalize text-foreground/70">{role}</span>
                <div className="flex-1 h-2 bg-[#595800]/8 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60"
                    style={{ width: `${(count / (overview.total_users || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-foreground/50 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model health + trends */}
      <div className="glass-panel rounded-3xl p-6">
        <h3 className="text-xl font-display font-medium mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Recommendation Engine Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-border col-span-2">
              <p className="text-xs text-foreground/50 mb-1">Acceptance Rate</p>
              <p className="text-2xl font-medium">
                {metrics?.Acceptance_Rate != null ? `${Math.round(metrics.Acceptance_Rate * 100)}%` : "—"}
              </p>
              <p className="text-[11px] text-foreground/40 mt-1">
                Liked/favorited outfits ÷ all rated outfits ({metrics?.total_rated_outfits ?? 0} rated so far)
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface border border-border col-span-2">
              <p className="text-xs text-foreground/50 mb-1">Avg Inference Time</p>
              <p className="text-2xl font-medium">
                {metrics?.Average_Inference_Time_ms != null ? `${metrics.Average_Inference_Time_ms}ms` : "—"}
              </p>
              <p className="text-[11px] text-foreground/40 mt-1">Measured live from the ranking engine</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-foreground/60 mb-3">Predicted Seasonal Trends</p>
            <ul className="space-y-2">
              {trends.map((t, i) => (
                <li key={i} className="text-sm px-4 py-2 rounded-xl bg-[#595800]/5">{t}</li>
              ))}
            </ul>
          </div>
        </div>
        {metrics?.note && (!metrics.total_rated_outfits) && (
          <p className="text-sm text-foreground/50 mt-4">{metrics.note}</p>
        )}
        {metrics?.Drift_Detected && (
          <p className="text-sm text-amber-400 mt-4">⚠ Model drift detected — consider retraining.</p>
        )}
      </div>
    </div>
  );
}