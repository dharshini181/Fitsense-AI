"""
FitSense AI — FastAPI Main Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .database import engine, Base
from .config import settings
from .rate_limit import limiter
from .routers import (
    auth,
    wardrobe,
    analysis,
    stylist,
    outfits,
    travel,
    shopping,
    planner,
    analytics,
    predictive,
    ocr,
    personalization,
    voice,
    admin,
)

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitSense AI",
    description="Luxury AI-powered fashion platform backend",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Rate limiting ────────────────────────────────────────────────────────
# Global default (120 req/min/IP) plus tighter per-route limits declared
# with @limiter.limit(...) on the auth and AI-calling endpoints.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ─────────────────────────────────────────────────────────────────
# Explicit allow-list only. A "*" wildcard combined with allow_credentials
# is both rejected by browsers and, if it weren't, would let any website
# make authenticated calls against this API. Add production origins to
# CORS_ORIGINS in your .env (comma-separated) rather than widening this.
_allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
if settings.CORS_ORIGINS:
    _allowed_origins += [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup secret checks ───────────────────────────────────────────────
# Fail loudly (not silently) if the app is about to run with the
# publicly-known default secret — anyone who has read the docs (or this
# source file) could forge valid auth tokens against a deployment that
# forgot to set a real one.
_DEFAULT_JWT_SECRET = "super-secret-fitsense-key"
if settings.JWT_SECRET == _DEFAULT_JWT_SECRET:
    print(
        "\n"
        "############################################################\n"
        "# WARNING: JWT_SECRET is still the published default value.\n"
        "# Anyone can forge valid login tokens for ANY user, including\n"
        "# admins, against this deployment. Set a real JWT_SECRET in\n"
        "# your .env before exposing this server to the internet.\n"
        "############################################################\n"
    )

# Mount all routers under /api prefix
prefix = "/api"
app.include_router(auth.router, prefix=prefix)
app.include_router(wardrobe.router, prefix=prefix)
app.include_router(analysis.router, prefix=prefix)
app.include_router(stylist.router, prefix=prefix)
app.include_router(outfits.router, prefix=prefix)
app.include_router(travel.router, prefix=prefix)
app.include_router(shopping.router, prefix=prefix)
app.include_router(planner.router, prefix=prefix)
app.include_router(analytics.router, prefix=prefix)
app.include_router(predictive.router, prefix=prefix)
app.include_router(ocr.router, prefix=prefix)
app.include_router(personalization.router, prefix=prefix)
app.include_router(voice.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)


@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "FitSense AI",
        "version": "2.0.0",
        "docs": "/docs",
    }
