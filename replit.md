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

### Core Mechanics
- Order-based scoring: chains evaluated left-to-right, step-by-step.
- Circle types: Add (2–12 range), Mult (2–5 range), Exp (1–5 range, power = 1 + value/20).
- Customizable plain backgrounds: white / gray / black.
- Random circle placement; out-of-bounds circles auto-reposition on board resize.
- Pinch-to-zoom that scales circles together (0.6×–2.5×), with a reset-view button.

### Challenge / Pressure Mechanics (v2)
- **Circle expiry** (45 s): Non-starting bought circles show a draining arc and disappear when expired. Starting circles are permanent.
- **Corrupted circles** (15% spawn chance): Show with dashed border + "!" badge. Including one in a chain applies a -30% penalty per corrupted circle. Tap in Upgrade mode to cleanse (costs points).
- **Mult exhaustion** (12 s cooldown): Mult circles used in a chain release become grayed-out and unselectable temporarily.
- **Exp AOE wipe**: Including an exp circle in a release destroys all non-permanent add circles in that same chain for a +80% burst bonus — forces a "cash out and rebuild" decision.
- **Board cap** (10 circles total): Buying more fails at capacity. Remove circles in Layout mode via the "×" button.
- **Chain reactions** (unlocked after first rebirth): 28% chance per release of a +50% bonus firing automatically. Shows "⚡ CHAIN REACTION!" banner.

### Economy
- Combo: 5s window, 5% per stack, max 6 stacks (30% cap).
- Crit: 5% chance × 2 multiplier.
- Streak: +12% per chain circle above 4.
- Energy: +12% per level. Perm Power: +20% per level. Perm Mult: +20% per level.
- Rebirth threshold: 50,000 × 8^n. Gain = sqrt(totalEarned / 1000).

### Technical
- AsyncStorage key: `@circle-link/state-v4` (v3 → v4 due to CircleNode schema changes).
- Expiry interval: 1 s setInterval in GameProvider.
- Arc animation: 500 ms tick in GameBoard re-renders SVG strokeDasharray.
- Sound files: `artifacts/circle-link/assets/sounds/` (tick/pop/chaching/ding/buzz/whoosh/chime).
- Theme palettes: `lib/theme.ts`. Sound provider: `lib/sound.ts`.
