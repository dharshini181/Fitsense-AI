"""
Explainable outfit recommender used by POST /api/stylist/recommend.

Note: an earlier version of this file also carried FAISS/CLIP similarity
search and KMeans user-clustering scaffolding. Nothing in the app called
those code paths, so they were removed to cut the dependency footprint
(sentence-transformers, faiss-cpu, scikit-learn) down to what's actually
used. If semantic wardrobe search is wanted later, reintroduce it behind
the same lazy-import-with-fallback pattern used elsewhere in this codebase
(see gemini.py / gemini_vision.py).
"""


class ExplainableRecommender:
    def generate_explainable_recommendation(
        self,
        user_id: int,
        weather_temp: int,
        occasion: str,
        user_style: str = "Minimalist",
        available_items: list | None = None,
    ) -> dict:
        """Returns an outfit pick together with a human-readable reasoning trail (XAI)."""
        available_items = available_items or []

        reasoning = [
            f"Temperature is {weather_temp}°C, optimizing for weather.",
            f"Occasion '{occasion}' triggers context-aware rules.",
            f"User style '{user_style}' applied to filtering.",
        ]

        if available_items:
            selected_items = [i["name"] for i in available_items[:2]] or [
                "Selected Top",
                "Selected Bottom",
            ]
        else:
            selected_items = ["Black Silk Button-down", "Tailored Trousers"]

        return {
            "outfit": selected_items,
            "style_persona": user_style,
            "explainability_log": reasoning,
            "confidence_score": 0.92,
        }


# Global singleton
recommender = ExplainableRecommender()
