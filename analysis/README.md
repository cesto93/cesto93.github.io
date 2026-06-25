# Analysis — Artificial Analysis API

Fetches model benchmark, pricing, and performance data from [Artificial Analysis](https://artificialanalysis.ai/) via their REST API (V2).

## Setup

```bash
cp .env.example .env
# edit .env and paste your API key
```

## Run

```bash
uv add requests python-dotenv
uv run fetch_data.py
```

This hits all 12 free-tier endpoints and saves each response as `data/<endpoint>.json`.

## Free tier (100 req/day)

| Endpoint | File |
|---|---|
| `/language/models/free` | `data/language_models_free.json` |
| `/media/text-to-image/models/free` | `data/media_text-to-image_models_free.json` |
| `/media/image-editing/models/free` | `data/media_image-editing_models_free.json` |
| `/media/text-to-video/models/free` | `data/media_text-to-video_models_free.json` |
| `/media/image-to-video/models/free` | `data/media_image-to-video_models_free.json` |
| `/media/text-to-video-audio/models/free` | `data/media_text-to-video-audio_models_free.json` |
| `/media/image-to-video-audio/models/free` | `data/media_image-to-video-audio_models_free.json` |
| `/media/text-to-speech/models/free` | `data/media_text-to-speech_models_free.json` |
| `/media/speech-to-speech/models/free` | `data/media_speech-to-speech_models_free.json` |
| `/media/speech-to-text/models/free` | `data/media_speech-to-text_models_free.json` |
| `/media/music/instrumental/models/free` | `data/media_music_instrumental_models_free.json` |
| `/media/music/with-vocals/models/free` | `data/media_music_with-vocals_models_free.json` |

## API docs

Full OpenAPI spec in [`artificial-analysis-openapi.yaml`](./artificial-analysis-openapi.yaml).
