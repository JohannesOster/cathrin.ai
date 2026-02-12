# Landing Page — cathrin.ai

For brand and product context see @../../.claude/refs/identity.md
For design tokens see @../../.claude/refs/tokens.md

## Tech Stack

**Astro 5 + Solid.js + Tailwind v4**

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (Astro)
pnpm build            # Production build → dist/
pnpm preview          # Preview production build locally
```

No test runner or linter configured. TypeScript checking via Astro's compilation.

## Architecture

- **Astro pages** (`src/pages/`) — server-rendered static HTML, file-based routing
- **Solid.js components** (`src/components/`) — interactive islands via `client:load`
- **Tailwind v4** — uses Vite plugin (`@tailwindcss/vite`), theme tokens in `src/styles/global.css` under `@theme`
- **Layout.astro** (`src/layouts/`) — base HTML shell with fonts, meta tags, slot-based composition

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Hero page with waitlist form and calendar preview |
| `src/components/CalendarPreview.tsx` | Interactive calendar grid simulation (~800 lines) |
| `src/components/WaitlistForm.tsx` | Email capture form with validation |
| `src/styles/global.css` | Tailwind theme tokens, custom fonts, global styles |
| `astro.config.mjs` | Astro config with Solid.js and Tailwind integrations |

### Patterns

- Solid.js state: `createSignal` / `createEffect` for local reactivity
- Responsive typography via `clamp()` (e.g., `text-[clamp(2.5rem,5vw,5rem)]`)
- Calendar event positioning via inline styles computed from time values
- Waitlist API (Loops.io) stubbed — ready for API key via `.env`
