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

### Challenge / Pressure Mechanics (v2 + v3 redesign)
- **Circle expiry**: Add circles expire hard at 45 s with a yellow→red arc. Mult/exp circles have gradual decay arcs (120 s / 90 s) shown in their own colour.
- **Corrupted circles** (15% spawn chance): Dashed border + "!" badge; -30% penalty per corrupted in chain. Cleanse in Upgrade mode.
- **Mult exhaustion** (7 s cooldown): Used mult circles show dashed stroke + 💤 label but remain joinable in chains — they apply at reduced power (exhaustionFactor: 0.5→1.0 over 7 s). No hard block.
- **Mult/Exp decay**: effectiveValue() interpolates mult value→2 over 120 s, exp value→1 over 90 s. Labels and formula preview show current effective value.
- **Primed mults**: A mult circle idle ≥12 s after last use shows a gold glow ring and grants +25% bonus in chain computation. "Primed flash" animation on release.
- **Exp AOE wipe**: Including an exp circle destroys non-permanent add circles in that chain (+80% burst bonus). Flash + chime.
- **Board cap** (10 circles): Buying more fails at capacity.
- **Chain reactions** (post-rebirth): 28% chance, +50% bonus, "⚡ CHAIN REACTION!" banner.
- **Surge** (chain ≥5): +25% bonus, "🔥 SURGE!" orange banner.
- **Mega Surge** (chain ≥7): +40% additional bonus, "🌀 MEGA SURGE!" purple banner.

### Economy
- Combo: 5 s window, 5% per stack, max 6 stacks (30% cap).
- Crit: 5% chance × 2 multiplier.
- Streak: +12% per chain circle above 4.
- Energy: +12% per level. Perm Power: +20% per level. Perm Mult: +20% per level.
- Rebirth threshold: 50,000 × 8^n. Gain = sqrt(totalEarned / 1000).

### Visual Feedback (v3)
- Type-specific particles: exp = 30 large/fast, mult = 18 medium, add = 8 small. Cascade delay 40 ms per circle.
- Earn float text scales with amount: 24 / 30 / 38 / 46 px (>500 / >5k / >50k). Bigger gains float higher.
- Surge/Mega banners animate in from centre with spring + fade.
- Primed glow ring (gold, r+13) on idle mult circles.

### Technical
- AsyncStorage key: `@circle-link/state-v5` (v4 → v5 due to chargedAt/lastUsedAt fields).
- CircleNode new fields: `chargedAt: number | null`, `lastUsedAt: number | null`.
- Exported helpers from GameContext: `effectiveValue(c, now)`, `exhaustionFactor(c, now)`, `isPrimed(c, now)`.
- Expiry interval: 1 s setInterval in GameProvider.
- Sound files: `artifacts/circle-link/assets/sounds/` (tick/pop/chaching/ding/buzz/whoosh/chime).
- Theme palettes: `lib/theme.ts`. Sound provider: `lib/sound.ts`.
