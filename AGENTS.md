# cesto93.github.io — AGENTS.md

Personal Hugo blog on GitHub Pages (PaperMod theme).

## Quick start

```bash
git submodule update --init --recursive   # fetch PaperMod theme
hugo server                                # dev server with hot-reload
hugo new posts/my-post.md                  # new draft
hugo --minify -d ../public                 # production build
```

## Bilingual (IT/EN)

- **Default language**: Italian (at `/it/`), English at `/en/`.
- Content lives in language subdirectories: `content/it/` and `content/en/`.
- To link translations across languages, use `translationKey` in front matter.
- PaperMod provides built-in i18n for UI strings (menu, theme, read time, etc.) via `themes/PaperMod/i18n/{en,it}.yaml`.

### Adding a new post

```bash
hugo new content/it/posts/mio-post.md
hugo new content/en/posts/my-post.md
```

Then edit the files (convert front matter to YAML, add `translationKey` to link them).

## Conventions

- **Front matter**: use **YAML** (`---` delimiters). The archetype generates **TOML** (`+++`); convert to YAML for consistency.
- **No quality-gate tooling** — no linter, formatter, typechecker, or test suite exists.
- **No npm/Node** — zero JS build tooling; Hugo CLI is the only tool.
- **Theme**: PaperMod as a git submodule at `themes/PaperMod`. Update with `git submodule update --remote themes/PaperMod`.

## CI

GitHub Actions workflow (`.github/workflows/hugo.yml`): builds with Hugo extended `0.162.0`, deploys to GitHub Pages on push to `main`.

## Layout quirks

- `content/*/archives.md` and `content/*/search.md` rely on PaperMod layout types. Without the submodule checked out, they won't render.
- `assets/`, `static/`, `data/`, `i18n/` are all empty — everything comes from the theme.
- `.hugo_build.lock` is gitignored but was accidentally committed early on; ignore it.
