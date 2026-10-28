# cesto93.github.io — AGENTS.md

Personal Hugo blog on GitHub Pages (PaperMod theme), bilingual IT/EN.

## Quick start

```bash
git submodule update --init --recursive   # fetch PaperMod theme
./start-blog.sh                            # dev server (kills stale Hugo, removes .hugo_build.lock)
hugo --minify                              # production build (outputs ./public/, matches CI)
```

## Bilingual (IT/EN)

- **Default language**: Italian at `/it/`, English at `/en/`.
- `content/it/` and `content/en/` — mirror the same posts.
- Link translations with matching `translationKey` in front matter.
- UI i18n from `themes/PaperMod/i18n/{en,it}.yaml`.

### Adding a post

```bash
hugo new content/it/posts/mio-post.md
hugo new content/en/posts/my-post.md
```

Convert archetype's TOML (`+++`) to YAML (`---`), add matching `translationKey`.

## Conventions

- **Front matter**: YAML (`---`). Archetype generates TOML; convert.
- No linter, formatter, typechecker, or test suite. No npm/Node — pure Hugo CLI.
- Theme: PaperMod submodule at `themes/PaperMod`. Update with `git submodule update --remote themes/PaperMod`.

## Architecture: custom LLM dashboards

Blog posts embed interactive Plotly charts via custom shortcodes:

```
analysis/                    # Python project (uv, Python 3.13)
  fetch_data.py              #   fetches Artificial Analysis API -> data/*.json
  streamlit_app.py           #   optional local Streamlit dashboard
  .env.example               #   needs ARTIFICIAL_ANALYSIS_KEY
static/data/                 # checked-in JSON consumed by shortcodes
layouts/shortcodes/          # llm-dashboard, llm-open-dashboard, llm-efficiency, llm-cheap-task, llm-intel-per-cost, llm-logistic, llm-open-logistic, ai-timeline
static/js/                   # companion JS for each shortcode
```

`ai-timeline` is the exception: it has no JSON data source. Milestones live inline in `static/js/ai-timeline.js` under `TIMELINES` (keyed by name, selected with the `timeline` shortcode param, default `dev-tools`), with `precision: 'month'` for entries where only the month is known. It draws a horizontal Plotly timeline, alternates labels above/below the axis and adds extra rows on the same side when measured label widths would collide, is theme-aware, and becomes horizontally scrollable below 620px. To add a milestone, append an event to the `TIMELINES` entry (and keep the post table in sync).

Logistic shortcodes (`llm-logistic`, `llm-open-logistic`) port `analysis/pages/1_Frontier.py` (`L/(1+exp(-k*(x-x0)))` with bounds `L in [yMax, max(100, yMax*1.5)]`, `k in [0,1]`, `x0 in [0, xMax+3650]`) to JS via Nelder-Mead on logit-transformed params — no scipy in the browser. Open variant also ports the 10-year catch-up search + ceiling check.

Each shortcode reads `data-max-date` from its container (set via `{{ .Page.Date.Format "2006-01-02" }}`) and filters out models with `release_date` after that date. This keeps old posts stable while new posts show latest data.

To update data: add API key, run `uv run fetch_data.py`, copy `analysis/data/language_models_free.json` to `static/data/` with a new date-stamped filename, and update `data-src` in all 7 shortcode HTML files + JS fallbacks.

## Layout quirks

- `content/*/archives.md` and `content/*/search.md` rely on PaperMod layout types — won't render without the submodule.
- `assets/`, `data/`, `i18n/` are empty (all from theme).
- `.hugo_build.lock` is gitignored but was accidentally committed early on; ignore it.
- `public/` is gitignored (CI generates it).

## CI

`.github/workflows/hugo.yml`: Hugo extended `0.162.0`, deploy to GitHub Pages on push to `main`.
