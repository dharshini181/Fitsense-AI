"""
Standalone test: generate one image with Cloudflare Workers AI and save it as PNG.

Usage (PowerShell, inside backend\\ with the venv active):
    python generate_image_cli.py "a red linen shirt with beige chinos, studio photo"
    python generate_image_cli.py "..." --steps 4 --seed 7 --out my_images
"""

import argparse
import sys

from app.services.image_service import ImageGenError, generate_image_bytes, save_png


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("prompt", nargs="?", default="Professional fashion photography, full-body shot of a model wearing a navy blazer and white shirt, studio lighting, neutral background")
    p.add_argument("--steps", type=int, default=4, help="1-8, higher = better but costs more free Neurons")
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--out", default="generated_images")
    a = p.parse_args()

    try:
        data = generate_image_bytes(a.prompt, steps=a.steps, seed=a.seed)
        path = save_png(data, a.out)
    except ImageGenError as e:
        print(f"FAILED [{e.kind}]: {e}")
        return 1
    print(f"OK - saved {path} ({len(data)} bytes received)")
    return 0


if __name__ == "__main__":
    sys.exit(main())