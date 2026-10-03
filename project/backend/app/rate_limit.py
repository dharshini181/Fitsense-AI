"""Shared rate limiter (slowapi/limits). Keyed by client IP.

Applied globally with a generous default, plus tighter limits on the
auth endpoints specifically (brute-force / spam-signup protection) and
the AI-calling endpoints (cost/abuse protection on Gemini, OpenWeatherMap,
and Hugging Face calls, which are billed or rate-limited upstream).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
