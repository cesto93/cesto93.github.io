import argparse
import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ARTIFICIAL_ANALYSIS_KEY")
BASE_URL = "https://artificialanalysis.ai/api/v2"
HEADERS = {"x-api-key": API_KEY}

parser = argparse.ArgumentParser()
parser.add_argument("--all", action="store_true", help="Fetch all model categories (default: language only)")
args = parser.parse_args()

LANGUAGE_ENDPOINTS = [
    "/language/models/free",
]

MEDIA_ENDPOINTS = [
    "/media/text-to-image/models/free",
    "/media/image-editing/models/free",
    "/media/text-to-video/models/free",
    "/media/image-to-video/models/free",
    "/media/text-to-video-audio/models/free",
    "/media/image-to-video-audio/models/free",
    "/media/text-to-speech/models/free",
    "/media/speech-to-speech/models/free",
    "/media/speech-to-text/models/free",
    "/media/music/instrumental/models/free",
    "/media/music/with-vocals/models/free",
]

endpoints = LANGUAGE_ENDPOINTS + (MEDIA_ENDPOINTS if args.all else [])

out_dir = Path("data")
out_dir.mkdir(exist_ok=True)

for ep in endpoints:
    url = f"{BASE_URL}{ep}"
    name = ep.strip("/").replace("/", "_")
    page = 1
    models = []
    meta = None
    while True:
        print(f"Fetching {url}?page={page} ...")
        resp = requests.get(url, headers=HEADERS, params={"page": page})
        if resp.status_code == 500:
            print(f"  Page {page} -> 500 (end of results)")
            break
        resp.raise_for_status()
        body = resp.json()
        items = body.get("data", body)
        if not items:
            break
        if page == 1:
            meta = {k: v for k, v in body.items() if k != "data"}
        models.extend(items)
        remaining = resp.headers.get("X-RateLimit-Remaining", "?")
        print(f"  Page {page} OK ({len(items)} items, remaining: {remaining})")
        total_pages = body.get("pagination", {}).get("total_pages", 0)
        if page >= total_pages:
            break
        page += 1
    output = {**meta, "data": models} if meta else models
    (out_dir / f"{name}.json").write_text(json.dumps(output, indent=2))
    print(f"  Done -> data/{name}.json ({len(models)} total items)")
