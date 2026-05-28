# cesto93.github.io — AGENTS.md

Personal Hugo blog on GitHub Pages (PaperMod theme).

## Quick start

```bash
git submodule update --init --recursive   # fetch PaperMod theme
hugo server                                # dev server with hot-reload
hugo new posts/my-post.md                  # new draft
hugo --minify                              # production build
```

## Conventions

- **Front matter**: existing posts use **YAML** (`---` delimiters). The archetype generates **TOML** (`+++`). Align new posts with YAML to stay consistent.
- **No quality-gate tooling** — no linter, formatter, typechecker, or test suite exists.
- **No npm/Node** — zero JS build tooling; Hugo CLI is the only tool.
- **Theme**: PaperMod as a git submodule at `themes/PaperMod`. Update with `git submodule update --remote themes/PaperMod`.

## CI

GitHub Actions workflow (`.github/workflows/hugo.yml`): builds with Hugo extended `0.162.0`, deploys to GitHub Pages on push to `main`.

## Layout quirks

- `content/archives.md` and `content/search.md` rely on PaperMod layout types. Without the submodule checked out, they won't render.
- `assets/`, `static/`, `layouts/`, `data/`, `i18n/` are all empty — everything comes from the theme.
- `.hugo_build.lock` is gitignored but was accidentally committed early on; ignore it.
