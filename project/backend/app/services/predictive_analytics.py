"""
Predictive Analytics & Data Science Module.
Features:
1. Clothing Lifespan Prediction
2. Carbon Footprint / Sustainability Score
3. Trend Prediction (Temporal Analysis)
4. Recommendation Evaluation Metrics
"""

from datetime import datetime, timedelta


class FashionPredictiveEngine:
    def __init__(self):
        # Baseline carbon footprints per fabric (kg CO2e per item)
        self.carbon_baselines = {
            "Cotton": 7.5,
            "Wool/Cashmere": 13.8,
            "Polyester": 5.5,
            "Silk": 10.0,
            "Unknown": 8.0,
        }

    def predict_clothing_lifespan(
        self, item_category: str, wash_count: int, fabric: str
    ) -> dict:
        """
        Uses heuristics to predict how many washes/wears an item has left
        before severe degradation.
        """
        # A simple simulated decay model
        max_washes = (
            50 if fabric == "Cotton" else (30 if fabric == "Wool/Cashmere" else 40)
        )
        remaining = max(0, max_washes - wash_count)

        status = "Healthy"
        if remaining < 10:
            status = "Nearing End of Life"
        elif remaining == 0:
            status = "Degraded"

        return {
            "max_washes_estimated": max_washes,
            "washes_remaining": remaining,
            "lifecycle_status": status,
        }

    def calculate_sustainability_score(self, items: list) -> dict:
        """
        Calculates a carbon footprint and sustainability score based on
        the wardrobe's composition and cost-per-wear efficiency.
        """
        total_carbon = 0.0
        for item in items:
            fabric = item.get("fabric_estimation", "Unknown")
            total_carbon += self.carbon_baselines.get(fabric, 8.0)

        # Score out of 100 (lower carbon = higher score)
        # Assuming an average 50-item wardrobe has ~400kg carbon.
        score = max(0, min(100, int(100 - (total_carbon / 10))))

        return {
            "total_carbon_footprint_kg": round(total_carbon, 2),
            "sustainability_score_100": score,
            "grade": "A" if score > 80 else ("B" if score > 60 else "C"),
        }

    def predict_trends(self, current_date=None) -> list:
        """
        Simulates a temporal trend prediction model (e.g. ARIMA on fashion search volume)
        to suggest upcoming seasonal trends.
        """
        if current_date is None:
            current_date = datetime.now()

        month = current_date.month
        trends = []
        if 9 <= month <= 11:
            trends = [
                "Earthy Tones (Terracotta, Olive)",
                "Chunky Knitwear",
                "Oversized Blazers",
            ]
        elif 3 <= month <= 5:
            trends = [
                "Pastel Colors (Mint, Lavender)",
                "Linen Blends",
                "Wide-leg Trousers",
            ]
        elif 6 <= month <= 8:
            trends = ["Vibrant Neons", "Breathable Mesh", "Bucket Hats"]
        else:
            trends = ["Monochrome Black", "Heavy Wool Coats", "Thermal Layering"]

        return trends

    def evaluate_model_performance(self, db=None) -> dict:
        """
        Computes real recommendation-engine health metrics from actual
        user feedback (Outfit.feedback) and actual measured inference time,
        rather than returning fixed placeholder numbers.

        Precision@K has no true meaning without a held-out relevance
        judgment, so we use "acceptance rate" (liked+favorited / all rated
        outfits) as an honest proxy, and report the raw counts alongside it
        so the number isn't dressed up as more rigorous than it is.
        """
        import time
        from app.models import Outfit

        if db is None:
            return {
                "Acceptance_Rate": None,
                "Precision@K": None,
                "Recall@K": None,
                "Mean_Average_Precision (mAP)": None,
                "Average_Inference_Time_ms": None,
                "Drift_Detected": False,
                "note": "No database session provided — metrics unavailable.",
            }

        rated = db.query(Outfit).filter(Outfit.feedback.isnot(None), Outfit.feedback != "none").all()
        total_rated = len(rated)

        if total_rated == 0:
            return {
                "Acceptance_Rate": None,
                "Precision@K": None,
                "Recall@K": None,
                "Mean_Average_Precision (mAP)": None,
                "Average_Inference_Time_ms": None,
                "Drift_Detected": False,
                "total_rated_outfits": 0,
                "note": "Not enough feedback yet to compute recommendation quality metrics.",
            }

        positive = sum(1 for o in rated if o.feedback in ("like", "favorite"))
        acceptance_rate = round(positive / total_rated, 3)

        # Real (not simulated) latency measurement: time a handful of actual
        # ranking calls against real data instead of reporting a fixed number.
        from app.services.recommendation_ranking import adaptive_rank_outfits
        sample_user_id = rated[0].user_id
        timings = []
        for _ in range(3):
            start = time.perf_counter()
            adaptive_rank_outfits(
                db, sample_user_id,
                [{"score": 5.0, "items": [{"id": iid} for iid in (rated[0].item_ids or [])]}]
            )
            timings.append((time.perf_counter() - start) * 1000)
        avg_inference_ms = round(sum(timings) / len(timings), 1)

        # Drift: compare acceptance rate in the most recent half of rated
        # outfits vs the earlier half. A real (if simple) trend signal.
        drift_detected = False
        if total_rated >= 6:
            rated_sorted = sorted(rated, key=lambda o: o.created_at)
            midpoint = len(rated_sorted) // 2
            earlier, recent = rated_sorted[:midpoint], rated_sorted[midpoint:]
            earlier_rate = sum(1 for o in earlier if o.feedback in ("like", "favorite")) / len(earlier)
            recent_rate = sum(1 for o in recent if o.feedback in ("like", "favorite")) / len(recent)
            drift_detected = (earlier_rate - recent_rate) > 0.25

        # We deliberately do NOT report Precision@K / Recall@K / mAP here.
        # Those require held-out ground-truth relevance labels (a set of
        # "correct" outfits per query) that this app has no mechanism to
        # collect. Reporting a single number under three different
        # academic-sounding names would look more rigorous than it is.
        # "Acceptance rate" is the one thing we can honestly measure from
        # real like/dislike/favorite feedback.
        return {
            "Acceptance_Rate": acceptance_rate,
            "Precision@K": None,
            "Recall@K": None,
            "Mean_Average_Precision (mAP)": None,
            "Average_Inference_Time_ms": avg_inference_ms,
            "Drift_Detected": drift_detected,
            "total_rated_outfits": total_rated,
            "positive_feedback": positive,
            "note": "Precision/Recall/mAP require ground-truth relevance labels this app doesn't collect; Acceptance_Rate (like+favorite ÷ all rated) is the honest measurable proxy.",
        }


predictive_engine = FashionPredictiveEngine()
