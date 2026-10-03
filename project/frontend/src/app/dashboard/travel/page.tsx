"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Calendar as CalIcon, MapPin, CheckCircle2, Circle, Loader2, X, Sparkles } from "lucide-react";
import { travelApi } from "@/lib/api";

type PackedItem = { name: string; packed: boolean };

type Trip = {
  id: number;
  destination: string;
  duration_days: number;
  weather: string;
  packed_items: PackedItem[];
  outfit_combinations: string[];
  missing_items: string[];
};

export default function TravelPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Minimal-input trip form — just destination + days. Weather and packing
  // list are derived automatically; activities is the only optional extra.
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [activities, setActivities] = useState("");

  const active = trips.find((t) => t.id === activeId) || trips[0];

  async function fetchTrips() {
    try {
      const data = await travelApi.getTrips();
      setTrips(data.trips || []);
      if (data.trips?.length) setActiveId((prev) => prev ?? data.trips[0].id);
    } catch (err) {
      console.error("Failed to load trips", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrips();
  }, []);

  const handleGenerate = async () => {
    if (!destination.trim()) return;
    setGenerating(true);
    try {
      const result = await travelApi.generate({
        destination,
        duration_days: days,
        activities,
      });
      setShowForm(false);
      setDestination("");
      setActivities("");
      setDays(3);
      await fetchTrips();
      if (result.trip_id) setActiveId(result.trip_id);
    } catch (err) {
      console.error("Failed to generate trip", err);
    } finally {
      setGenerating(false);
    }
  };

  const togglePacked = async (item: PackedItem) => {
    if (!active) return;
    const nextPacked = !item.packed;
    // optimistic update
    setTrips((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              packed_items: t.packed_items.map((i) =>
                i.name === item.name ? { ...i, packed: nextPacked } : i
              ),
            }
          : t
      )
    );
    try {
      await travelApi.updatePackedItem(active.id, item.name, nextPacked);
    } catch (err) {
      console.error("Failed to update packed state", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const packedCount = active?.packed_items?.filter((i) => i.packed).length ?? 0;
  const totalCount = active?.packed_items?.length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium tracking-tight mb-2">Travel Packing</h1>
          <p className="text-foreground/60">Tell me where you&apos;re going, for how many days, and what you&apos;ll be doing — I&apos;ll build the packing list.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plane className="w-4 h-4" />
          Plan New Trip
        </button>
      </header>

      {/* Trip tabs, if more than one */}
      {trips.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {trips.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active?.id === t.id
                  ? "bg-primary/20 text-primary"
                  : "bg-[#595800]/5 text-foreground/60 hover:bg-[#595800]/8"
              }`}
            >
              {t.destination}
            </button>
          ))}
        </div>
      )}

      {!active ? (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <Plane className="w-10 h-10 text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/60 mb-4">No trips planned yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plane className="w-4 h-4" />
            Plan Your First Trip
          </button>
        </div>
      ) : (
        <>
          {/* Active Trip Widget */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80')] bg-cover bg-center" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-4">
                  Upcoming Trip
                </div>
                <h2 className="text-3xl font-display font-medium mb-2">{active.destination}</h2>
                <div className="flex gap-6 text-foreground/70 text-sm">
                  <span className="flex items-center gap-2">
                    <CalIcon className="w-4 h-4" /> {active.duration_days} Days
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {active.weather || "Weather pending"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl font-display text-primary">
                  {packedCount}/{totalCount}
                </span>
                <p className="text-sm text-foreground/60">Items packed</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-display font-medium mb-6">Packing List</h3>
              <div className="space-y-3">
                {active.packed_items?.length ? (
                  active.packed_items.map((i, idx) => (
                    <div
                      key={idx}
                      onClick={() => togglePacked(i)}
                      className="glass-panel rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-[#595800]/5 transition-colors"
                    >
                      <span className={`font-medium ${i.packed ? "text-foreground/40 line-through" : "text-foreground"}`}>
                        {i.name}
                      </span>
                      {i.packed ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-border" />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/40">No items generated yet.</p>
                )}
              </div>

              {active.missing_items?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-foreground/60 mb-3">Consider Buying</h4>
                  <div className="flex flex-wrap gap-2">
                    {active.missing_items.map((m, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-display font-medium mb-6">Planned Outfits</h3>
              <div className="space-y-4">
                {active.outfit_combinations?.length ? (
                  active.outfit_combinations.map((combo, idx) => (
                    <div key={idx} className="glass-panel rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-2 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Day {idx + 1}</span>
                      </div>
                      <p className="text-sm text-foreground/70 leading-relaxed">{combo}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-foreground/40">No outfit suggestions yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Trip Modal — deliberately minimal: destination + days only */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !generating && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-3xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-6 text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-display font-medium mb-1">Plan a Trip</h3>
              <p className="text-sm text-foreground/50 mb-6">
                Weather and packing suggestions are generated automatically from your destination.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-foreground/50 mb-1.5 block">Destination</label>
                  <input
                    autoFocus
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Paris, France"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 mb-1.5 block">Duration (days)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) || 1)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/50 mb-1.5 block">Activities (optional)</label>
                  <input
                    value={activities}
                    onChange={(e) => setActivities(e.target.value)}
                    placeholder="museums, hiking, fine dining..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !destination.trim()}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? "Generating..." : "Generate Packing List"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}