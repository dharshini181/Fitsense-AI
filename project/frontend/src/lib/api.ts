/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * FitSense AI — API client
 *
 * This file was referenced by 10 pages (`@/lib/api`) but was missing from the
 * uploaded project, so the frontend could not compile. Re-created here to match
 * the exact call signatures already used across the dashboard pages, and to
 * match the FastAPI routes in `backend/app/routers/*`.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("fitsense_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("fitsense_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("fitsense_token");
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Backend errors come back as JSON like {"detail": "..."} — surface the
    // clean detail message instead of the raw JSON blob. slowapi's 429
    // response is plain text, so fall back to it (or the status text) if
    // parsing fails.
    let message = res.statusText || `Request failed (${res.status})`;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.detail)) {
          // FastAPI/Pydantic validation errors: detail is a list of
          // {loc, msg, type} objects, not a plain string.
          message = parsed.detail.map((d: { msg: string }) => d.msg).join(" ");
        } else {
          message = parsed.detail || parsed.message || text;
        }
      } catch {
        message = text;
      }
    }
    if (res.status === 429) {
      message = "Too many requests — please wait a moment and try again.";
    }
    throw new Error(message);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.blob() as unknown as T;
}

function get<T = any>(path: string) {
  return request<T>(path, { method: "GET" });
}
function post<T = any>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function patch<T = any>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
function del<T = any>(path: string) {
  return request<T>(path, { method: "DELETE" });
}
function upload<T = any>(path: string, file: File, extraFields?: Record<string, string>) {
  const form = new FormData();
  form.append("file", file);
  if (extraFields) {
    Object.entries(extraFields).forEach(([k, v]) => form.append(k, v));
  }
  return request<T>(path, { method: "POST", body: form });
}

// ── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (body: { name: string; email: string; password: string }) =>
    post<{ token: string; user_id: number; name: string }>(
      "/auth/signup",
      body
    ).then((r) => {
      setToken(r.token);
      return r;
    }),
  login: (body: { email: string; password: string }) =>
    post<{ token: string; user_id: number; name: string }>(
      "/auth/login",
      body
    ).then((r) => {
      setToken(r.token);
      return r;
    }),
  me: () => get("/auth/me"),
  updateProfile: (body: Record<string, unknown>) => patch(`/auth/profile`, body),
};

// ── Wardrobe ─────────────────────────────────────────────────────────────
export const wardrobeApi = {
  getWardrobe: () => get(`/wardrobe/`),
  searchWardrobe: (q: string) => get(`/wardrobe/search?q=${encodeURIComponent(q)}`),
  createItem: (body: Record<string, unknown>) => post("/wardrobe/", body),
  updateItem: (itemId: number, body: Record<string, unknown>) =>
    patch(`/wardrobe/${itemId}`, body),
  deleteItem: (itemId: number) => del(`/wardrobe/${itemId}`),
};

// ── Analysis (Gemini vision: clothing / body / skin tone) ───────────────
export const analysisApi = {
  scan: (file: File) => upload("/analysis/scan", file),
  bodyShape: (file: File) => upload("/analysis/body", file),
  skinTone: (file: File) => upload("/analysis/skin-tone", file),
  full: (file: File) => upload("/analysis/full", file),
  rate: (file: File) => upload("/analysis/rate", file),
};

// ── Analytics ────────────────────────────────────────────────────────────
export const analyticsApi = {
  getAnalytics: () => get(`/analytics/`),
};

// ── Stylist (AI chat + recommendations) ──────────────────────────────────
export const stylistApi = {
  chat: (message: string, stylePreference = "Minimalist", gender = "Unspecified") =>
    post<{ reply: string }>("/stylist/chat", {
      message,
      style_preference: stylePreference,
      gender,
    }).then((r) => r.reply),
  recommend: (weatherTemp: number, occasion: string, style: string, city = "") =>
    post("/stylist/recommend", {
      weather_temp: weatherTemp,
      occasion,
      style,
      city,
    }),
  visualize: (description: string) => post("/stylist/visualize", { description }),
};

// ── Outfits ──────────────────────────────────────────────────────────────
export const outfitsApi = {
  generate: (body: {
    mood?: string;
    occasion?: string;
    weather?: string;
    budget?: number;
    city?: string;
  }) => post("/outfits/generate", body),
  save: (body: Record<string, unknown>) => post("/outfits/save", body),
  list: () => get("/outfits/"),
  getWeather: (city: string) => get(`/outfits/weather?city=${encodeURIComponent(city)}`),
};

// ── Travel ───────────────────────────────────────────────────────────────
export const travelApi = {
  getTrips: () => get(`/travel/`),
  generate: (body: {
    destination: string;
    duration_days?: number;
    weather?: string;
    activities?: string;
  }) => post("/travel/generate", body),
  updatePackedItem: (tripId: number, itemName: string, packed: boolean) =>
    patch(`/travel/${tripId}/pack`, { item_name: itemName, packed }),
};

// ── Shopping / Wishlist ───────────────────────────────────────────────────
export const shoppingApi = {
  getWishlist: () => get(`/shopping/wishlist`),
  addWishlist: (body: {
    name: string;
    brand?: string;
    price?: number;
    image_url?: string;
  }) => post("/shopping/wishlist", body),
  deleteWishlist: (itemId: number) => del(`/shopping/wishlist/${itemId}`),
};

// ── Planner ──────────────────────────────────────────────────────────────
export const plannerApi = {
  getEvents: () => get(`/planner/`),
  createEvent: (body: {
    event_date: string;
    title: string;
    outfit_items?: string[];
  }) => post("/planner/", body),
  deleteEvent: (eventId: number) => del(`/planner/${eventId}`),
};

// ── OCR (label / receipt scanning) ────────────────────────────────────────
export const ocrApi = {
  scanLabel: (file: File) => upload("/ocr/label", file),
  scanReceipt: (file: File) => upload("/ocr/receipt", file),
  autoFill: (itemData: Record<string, unknown>) =>
    post("/ocr/auto-fill", itemData),
};

// ── Personalization ────────────────────────────────────────────────────────
export const personalizationApi = {
  getPreferences: () => get("/personalization/preferences"),
  updatePreferences: (body: Record<string, unknown>) =>
    request("/personalization/preferences", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  submitOutfitFeedback: (outfitId: number, feedback: string) =>
    post(`/personalization/feedback/outfit/${outfitId}`, { feedback }),
  getLearningProfile: () => get("/personalization/learning-profile"),
};

// ── Predictive analytics ──────────────────────────────────────────────────
export const predictiveApi = {
  predictLifespan: (body: {
    item_category: string;
    wash_count: number;
    fabric: string;
  }) => post("/predict/lifespan", body),
  getMySustainability: () => get("/predict/sustainability/me"),
  getTrends: () => get("/predict/trends"),
  getModelMetrics: () => get("/predict/model-metrics"),
  getCostPerWear: () => get("/predict/cost-per-wear"),
  getNextOutfit: () => get("/predict/next-outfit"),
};

// ── Admin ────────────────────────────────────────────────────────────────
export const adminApi = {
  getOverview: () => get("/admin/overview"),
  getSignupsTimeseries: (days = 30) => get(`/admin/signups-timeseries?days=${days}`),
  getTopUsers: (limit = 5) => get(`/admin/top-users?limit=${limit}`),
  getModelMetrics: () => get("/admin/model-metrics"),
  getTrends: () => get("/admin/trends"),
};

// ── Voice ────────────────────────────────────────────────────────────────
export const voiceApi = {
  transcribe: (file: File) => upload<{ text: string }>("/voice/transcribe", file),
  command: (text: string) =>
    post<{ action: string; data: Record<string, unknown>; spoken_response: string }>(
      "/voice/command",
      { text }
    ),
  synthesize: (text: string) => request<Blob>("/voice/synthesize", {
    method: "POST",
    body: JSON.stringify({ text }),
  }),
};