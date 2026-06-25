import os
import json
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ARTIFICIAL_ANALYSIS_KEY")
BASE_URL = "https://artificialanalysis.ai/api/v2"
HEADERS = {"x-api-key": API_KEY}

FREE_ENDPOINTS = [
    "/language/models/free",
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

out_dir = Path("data")
out_dir.mkdir(exist_ok=True)

for ep in FREE_ENDPOINTS:
    url = f"{BASE_URL}{ep}"
    name = ep.strip("/").replace("/", "_")
    print(f"Fetching {url} ...")
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    (out_dir / f"{name}.json").write_text(json.dumps(resp.json(), indent=2))
    remaining = resp.headers.get("X-RateLimit-Remaining", "?")
    print(f"  OK -> data/{name}.json  (remaining: {remaining})")
