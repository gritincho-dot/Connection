# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Circle Link (Expo mobile incremental game)

- Order-based scoring (chains evaluated left-to-right with operator precedence respected per step).
- Customizable plain backgrounds: white / gray / black (no background dots).
- Random circle placement; out-of-bounds circles auto-reposition on board resize.
- Pinch-to-zoom that scales circles together (0.6x–2.5x), with a reset-view button.
- Variable click sounds via `expo-audio` with playback rate variation; achievement chime, ding/buzz feedback for upgrades.
- Combo system (chains within 5s stack ×0.1 each, capped), 8% crit chance for ×3 payout.
- Achievements with toast popups (best chain length, total releases, best earning, combo milestones, etc.).
- AsyncStorage key `@circle-link/state-v3`. On schema bumps, increment the suffix to invalidate persisted state.

Sound files live in `artifacts/circle-link/assets/sounds/` (tick/pop/chaching/ding/buzz/whoosh/chime). Theme palettes in `lib/theme.ts`. Sound provider in `lib/sound.ts`.
