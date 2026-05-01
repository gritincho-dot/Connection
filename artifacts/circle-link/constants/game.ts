export const ENERGY_COST = (lvl: number): number =>
  Math.floor(25 * Math.pow(1.55, lvl));

export const ADD_COST = (cnt: number): number =>
  Math.floor(75 * Math.pow(3.5, cnt));

export const MULT_COST = (cnt: number): number =>
  Math.floor(900 * Math.pow(5.5, cnt));

export const EXP_COST = (cnt: number): number =>
  Math.floor(20000 * Math.pow(18, cnt));

export const REROLL_COST_ADD = (n: number): number =>
  Math.floor(40 * Math.pow(1.7, n));

export const REROLL_COST_MULT = (n: number): number =>
  Math.floor(400 * Math.pow(1.7, n));

export const REROLL_COST_EXP = (n: number): number =>
  Math.floor(6000 * Math.pow(1.7, n));

export const PERM_POWER_COST = (lvl: number): number | null =>
  lvl >= 10 ? null : Math.floor(1 * Math.pow(2, lvl));

export const PERM_MULT_COST = (lvl: number): number | null =>
  lvl >= 8 ? null : Math.floor(2 * Math.pow(2, lvl));

export const PERM_DISCOUNT_COST = (lvl: number): number | null =>
  lvl >= 5 ? null : Math.floor(3 * Math.pow(2, lvl));

export const REBIRTH_THRESHOLD = (rb: number): number =>
  Math.floor(50000 * Math.pow(8, rb));

export const REBIRTH_GAIN = (totalEarned: number): number =>
  Math.floor(Math.sqrt(totalEarned / 1000));

// Per-level bonuses
export const ENERGY_BONUS_PER_LVL = 0.12;
export const PERM_POWER_BONUS = 0.2;
export const PERM_MULT_BONUS = 0.2;
export const DISCOUNT_PER_LVL = 0.1;

// Circle type limits
export const MAX_ADD = 6;
export const MAX_MULT = 3;
export const MAX_EXP = 2;
// Hard cap on total circles on the board at once
export const MAX_TOTAL_CIRCLES = 10;

// Exp circle exponent divisor: value/EXP_VALUE_DIVISOR controls how steep the power is
export const EXP_VALUE_DIVISOR = 20;

// Combo system
export const COMBO_WINDOW_MS = 3000;
export const COMBO_BONUS_PER_STACK = 0.05;
export const COMBO_MAX_STACKS = 6;

// Crit
export const CRIT_CHANCE = 0.05;
export const CRIT_MULTIPLIER = 2;

// Streak
export const STREAK_THRESHOLD = 4;
export const STREAK_BONUS_PER_EXTRA = 0.12;

// ─── New challenge mechanics ─────────────────────────────────────────────────

// How long a non-permanent circle lasts before it expires (ms)
export const CIRCLE_TTL_MS = 45_000;

// Probability that a newly spawned circle is corrupted
export const CORRUPT_CHANCE = 0.15;

// Corrupted circles that appear in a chain reduce the release by this factor
export const CORRUPT_PENALTY = 0.30;

// How long a mult circle is exhausted after being used in a release (ms)
export const MULT_EXHAUST_MS = 12_000;

// When an exp circle fires in a release, add circles in that chain are
// destroyed — but the release earns this bonus multiplier as compensation
export const EXP_AOE_BONUS = 1.8;

// Point cost to cleanse (de-corrupt) a circle
export const CLEANSE_COST_ADD = 300;
export const CLEANSE_COST_MULT = 3_000;
export const CLEANSE_COST_EXP = 60_000;

// Chain reaction: unlocked when rebirthCount >= 1
export const CHAIN_REACTION_CHANCE = 0.28;
// Extra fraction of the release added as chain-reaction bonus
export const CHAIN_REACTION_BONUS = 0.5;

export type Achievement = {
  id: string;
  label: string;
  description: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first100", label: "Spark", description: "Earn 100 points" },
  { id: "first1k", label: "Flow", description: "Earn 1,000 points" },
  { id: "first10k", label: "Cascade", description: "Earn 10,000 points" },
  { id: "first100k", label: "Surge", description: "Earn 100,000 points" },
  { id: "chain3", label: "Triad", description: "Chain 3 circles" },
  { id: "chain4", label: "Quartet", description: "Chain 4 circles" },
  { id: "chain5", label: "Quintet", description: "Chain 5 circles" },
  { id: "chain6", label: "Hexa", description: "Chain 6 circles" },
  { id: "combo5", label: "Combo Streak", description: "Reach a 5x combo" },
  { id: "crit", label: "Lucky Strike", description: "Land a critical hit" },
  { id: "rebirth1", label: "Reborn", description: "Rebirth for the first time" },
  { id: "energy5", label: "Charged", description: "Reach Connection Energy 5" },
  { id: "chainreact", label: "Aftershock", description: "Trigger a chain reaction" },
  { id: "expburst", label: "Supernova", description: "Trigger an exp AOE wipe" },
];
