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

// Per-level bonuses — tuned down to prevent runaway stacking
export const ENERGY_BONUS_PER_LVL = 0.12;
export const PERM_POWER_BONUS = 0.2;
export const PERM_MULT_BONUS = 0.2;
export const DISCOUNT_PER_LVL = 0.1;

// Circle caps — one fewer mult circle to reduce extreme multiplication chains
export const MAX_ADD = 6;
export const MAX_MULT = 3;
export const MAX_EXP = 2;

// Exp circle: divisor controls how steep the exponent gets.
// value/20 means a max-roll (5) gives power 1.25 instead of the old 2.0 at value 10.
export const EXP_VALUE_DIVISOR = 20;

// Combo: shorter window, fewer stacks, smaller bonus per stack
export const COMBO_WINDOW_MS = 3000;
export const COMBO_BONUS_PER_STACK = 0.05;
export const COMBO_MAX_STACKS = 6;

// Crit: slightly rarer, less explosive
export const CRIT_CHANCE = 0.05;
export const CRIT_MULTIPLIER = 2;

// Streak: bonus kicks in at 4 circles but grows more slowly
export const STREAK_THRESHOLD = 4;
export const STREAK_BONUS_PER_EXTRA = 0.12;

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
];
