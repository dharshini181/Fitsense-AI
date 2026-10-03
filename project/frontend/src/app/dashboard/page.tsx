"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Sparkles,
  Shirt,
  Star,
  CalendarDays,
  Send,
  Sun,
  Cloud,
  CloudRain,
  Droplets,
  MapPin,
} from "lucide-react";
import { authApi, analyticsApi, outfitsApi } from "@/lib/api";

type Me = { name: string; role?: string };
type Analytics = {
  total_garments: number;
  total_value: number;
  most_worn: Array<{ name: string; wear_count: number }>;
  category_distribution: Record<string, number>;
};
type SavedOutfit = { id: number; name: string; occasion: string; score: number };
type Weather = {
  city: string;
  temp_c: number;
  condition: string;
  humidity: number;
  description: string;
};

const PENDING_MESSAGE_KEY = "fitsense_pending_stylist_message";
const CITY_STORAGE_KEY = "fitsense_city";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle") || c.includes("storm")) {
    return <CloudRain className={className} />;
  }
  if (c.includes("cloud") || c.includes("overcast")) {
    return <Cloud className={className} />;
  }
  return <Sun className={className} />;
}

export default function DashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [freshOutfit, setFreshOutfit] = useState<{
    title: string;
    score: number;
    image: string | null;
    color_harmony: string;
  } | null>(null);

  const [city, setCity] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(CITY_STORAGE_KEY) || "" : ""
  );
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [stylistInput, setStylistInput] = useState("");

  const fetchWeather = async (cityName: string) => {
    if (!cityName.trim()) return;
    setWeatherLoading(true);
    try {
      const data = await outfitsApi.getWeather(cityName);
      setWeather(data);
      localStorage.setItem(CITY_STORAGE_KEY, cityName);
    } catch (err) {
      console.error("Failed to fetch weather", err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [meData, statsData, outfitsData] = await Promise.all([
          authApi.me(),
          analyticsApi.getAnalytics(),
          outfitsApi.list(),
        ]);
        setMe(meData);
        setAnalytics(statsData);
        setOutfits(outfitsData.outfits || []);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    load();

    if (city) {
      const timer = setTimeout(() => fetchWeather(city), 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateToday = async () => {
    setGenerating(true);
    try {
      const res = await outfitsApi.generate(city ? { city } : {});
      setFreshOutfit({
        title: res.title,
        score: res.score,
        image: res.outfit_image,
        color_harmony: res.color_harmony,
      });
    } catch (err) {
      console.error("Failed to generate today's outfit", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAskStylist = () => {
    if (!stylistInput.trim()) {
      router.push("/dashboard/stylist");
      return;
    }
    sessionStorage.setItem(PENDING_MESSAGE_KEY, stylistInput.trim());
    router.push("/dashboard/stylist");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const topCategory = analytics
    ? Object.entries(analytics.category_distribution || {}).sort((a, b) => b[1] - a[1])[0]
    : null;

  const quickActions = [
    { name: "Generate Outfit", icon: Sparkles, onClick: handleGenerateToday },
    { name: "My Wardrobe", icon: Shirt, href: "/dashboard/wardrobe" },
    { name: "Rate an Outfit", icon: Star, href: "/dashboard/analysis" },
    { name: "Plan My Week", icon: CalendarDays, href: "/dashboard/planner" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-4xl font-display font-medium tracking-tight mb-2">
          {greeting()}{me?.name ? `, ${me.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-foreground/60">
          {analytics?.total_garments
            ? `${analytics.total_garments} pieces in your wardrobe, ready when you are.`
            : "Add a few pieces to your wardrobe and I'll start styling you."}
        </p>
      </header>

      <section className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-caption font-semibold uppercase tracking-wider">Personal AI Stylist</span>
        </div>
        <p className="text-foreground/60 mb-4 max-w-lg">
          Tell me what&apos;s going on — &quot;I&apos;m going for an outing&quot;, &quot;I have college tomorrow&quot;,
          &quot;I want something comfortable&quot; — and I&apos;ll take it from there.
        </p>
        <div className="flex items-center gap-2 bg-background border border-border rounded-2xl p-2 focus-within:border-primary/50 transition-colors">
          <input
            type="text"
            value={stylistInput}
            onChange={(e) => setStylistInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskStylist()}
            placeholder="What are you dressing for today?"
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none py-2.5 px-2 text-sm"
          />
          <button
            onClick={handleAskStylist}
            className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shrink-0"
            aria-label="Ask your stylist"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-6 flex flex-col">
          <p className="text-caption font-semibold uppercase tracking-wider text-foreground/50 mb-4">
            Today&apos;s Weather
          </p>
          {weather ? (
            <div className="flex items-center gap-4 flex-1">
              <WeatherIcon condition={weather.condition} className="w-12 h-12 text-primary shrink-0" />
              <div>
                <div className="text-4xl font-display font-medium tracking-tight">
                  {Math.round(weather.temp_c)}°C
                </div>
                <div className="text-sm text-foreground/60 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {weather.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> {weather.humidity}%
                  </span>
                </div>
                <p className="text-xs text-foreground/50 mt-1">{weather.description}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center gap-3">
              <p className="text-sm text-foreground/50">
                Add your city so weather can shape today&apos;s outfit.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchWeather(city)}
                  placeholder="e.g. Chennai"
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={() => fetchWeather(city)}
                  disabled={weatherLoading || !city.trim()}
                  className="btn-secondary px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {weatherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <p className="text-caption font-semibold uppercase tracking-wider text-foreground/50 mb-4">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const content = (
                <>
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-on-surface">{action.name}</span>
                </>
              );
              const className =
                "flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-3 hover:bg-[#595800]/5 active:scale-[0.98] transition-all";

              return action.href ? (
                <Link key={action.name} href={action.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button key={action.name} onClick={action.onClick} className={className}>
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold uppercase tracking-wider text-foreground/50 mb-4">
          Today&apos;s Outfit
        </h2>
        <div className="editorial-card p-6 md:p-8 relative overflow-hidden">
          {freshOutfit ? (
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
              {freshOutfit.image && (
                <img
                  src={freshOutfit.image}
                  alt={freshOutfit.title}
                  className="w-full md:w-48 h-64 object-cover rounded-2xl"
                />
              )}
              <div className="flex-1">
                <div className="chip h-8 px-4 rounded-full inline-flex items-center justify-center text-caption font-medium shadow-sm mb-4">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {Math.round(freshOutfit.score)}% Match
                </div>
                <h3 className="text-headline-lg-mobile md:text-headline-lg font-bold mb-2">
                  {freshOutfit.title}
                </h3>
                <p className="text-body-md opacity-80 max-w-md">{freshOutfit.color_harmony}</p>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center h-48 gap-4 text-center">
              <Sparkles className="w-8 h-8 text-primary" />
              <p className="text-body-md text-on-surface-variant">
                Get an outfit picked for you right now — no questions asked.
              </p>
              <button
                onClick={handleGenerateToday}
                disabled={generating}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Styling..." : "Style Me Today"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-caption font-semibold uppercase tracking-wider text-foreground/50 mb-4">
          Recent &amp; Favorite Outfits
        </h2>

        {outfits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outfits.slice(0, 6).map((outfit) => (
              <Link
                key={outfit.id}
                href="/dashboard/analytics"
                className="data-card p-4 flex items-center justify-between hover:bg-tertiary-container/20 transition-colors"
              >
                <div>
                  <div className="text-button font-semibold text-on-surface">{outfit.name}</div>
                  <div className="text-caption text-on-surface-variant">{outfit.occasion}</div>
                </div>
                <span className="chip h-7 px-3 rounded-full text-caption font-medium shrink-0">
                  {Math.round(outfit.score)}%
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="data-card p-6 flex items-center justify-center text-center">
            <p className="text-caption text-on-surface-variant">
              Outfits you save will show up here.
            </p>
          </div>
        )}

        {analytics && analytics.total_garments > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Link
              href="/dashboard/wardrobe"
              className="data-card p-4 flex items-center justify-between hover:bg-tertiary-container/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-primary shrink-0">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-button font-semibold text-on-surface">Total Garments</div>
                  <div className="text-caption text-on-surface-variant">
                    {analytics.total_garments} items · ₹{Math.round(analytics.total_value).toLocaleString()} value
                  </div>
                </div>
              </div>
            </Link>

            {analytics.most_worn?.length > 0 && (
              <Link
                href="/dashboard/wardrobe"
                className="data-card p-4 flex items-center justify-between hover:bg-tertiary-container/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-primary shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-button font-semibold text-on-surface">Most Worn</div>
                    <div className="text-caption text-on-surface-variant">
                      {analytics.most_worn[0].name} · {analytics.most_worn[0].wear_count}×
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {topCategory && (
              <Link
                href="/dashboard/analytics"
                className="data-card p-4 flex items-center justify-between hover:bg-tertiary-container/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-primary shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-button font-semibold text-on-surface">Top Category</div>
                    <div className="text-caption text-on-surface-variant">
                      {topCategory[0]} · {topCategory[1]} pieces
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {analytics && analytics.total_garments === 0 && (
          <Link
            href="/dashboard/wardrobe"
            className="data-card p-6 flex items-center justify-center text-center hover:bg-tertiary-container/20 transition-colors mt-4"
          >
            <p className="text-caption text-on-surface-variant">
              Your wardrobe is empty. Scan or add your first item to see stats here.
            </p>
          </Link>
        )}
      </section>
    </div>
  );
}