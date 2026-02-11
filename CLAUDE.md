# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Waitlist landing page for Cathrin.ai — a premium desktop calendar app. Built as a static site with selective client-side hydration for interactive components.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (Astro)
pnpm build            # Production build → dist/
pnpm preview          # Preview production build locally
```

No test runner or linter is configured. TypeScript checking is handled by Astro's compilation.

## Architecture

**Astro 5 + Solid.js + Tailwind v4**

- **Astro pages** (`src/pages/`) are server-rendered static HTML. Routing is file-based.
- **Solid.js components** (`src/components/`) are interactive islands hydrated client-side via `client:load`. Solid was chosen over React for fine-grained reactivity without virtual DOM overhead.
- **Tailwind v4** uses the Vite plugin (`@tailwindcss/vite`), not PostCSS. Theme tokens are defined in `src/styles/global.css` under `@theme`.
- **Layout.astro** (`src/layouts/`) is the base HTML shell — fonts, meta tags, and slot-based page composition.

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Hero page with waitlist form and calendar preview |
| `src/components/CalendarPreview.tsx` | Interactive calendar grid simulation (~800 lines) |
| `src/components/WaitlistForm.tsx` | Email capture form with validation |
| `src/styles/global.css` | Tailwind theme tokens, custom fonts, global styles |
| `astro.config.mjs` | Astro config with Solid.js and Tailwind integrations |

### Design Tokens

Theme colors and fonts are defined in `src/styles/global.css`:
- `--color-bg: #fcfcfc`, `--color-dark: #212020`, `--color-primary: #2d6b8a`
- `--font-sans`: General Sans (Fontshare CDN)
- `--font-display`: TASA Orbiter Display (local WOFF2 in `public/fonts/`)

CalendarPreview has its own hardcoded color palette (Cathrin colors: graphite, coral, teal, sage, etc.) and grid constants (`HOUR_HEIGHT = 52`, `TIME_COL_WIDTH = 64`) that match the main calendar app's design.

### Patterns

- Solid.js state uses `createSignal` / `createEffect` for local reactivity
- Responsive typography via `clamp()` (e.g., `text-[clamp(2.5rem,5vw,5rem)]`)
- Calendar event positioning is done with inline styles computed from time values
- Waitlist API (Loops.io) is stubbed — ready for API key via `.env`
