export const ENERGY_COST = (lvl: number): number =>
  Math.floor(25 * Math.pow(1.55, lvl));

export const ADD_COST = (cnt: number): number =>
  Math.floor(40 * Math.pow(2.8, cnt));

export const MULT_COST = (cnt: number): number =>
  Math.floor(300 * Math.pow(3.2, cnt));

export const EXP_COST = (cnt: number): number =>
  Math.floor(5000 * Math.pow(8, cnt));

export const REROLL_COST_ADD = (n: number): number =>
  Math.floor(40 * Math.pow(1.7, n));

export const REROLL_COST_MULT = (n: number): number =>
  Math.floor(250 * Math.pow(1.7, n));

export const REROLL_COST_EXP = (n: number): number =>
  Math.floor(3500 * Math.pow(1.7, n));

// Upgrade costs: increase circle value by 1
// Add: base + current value (each upgrade adds current value to base)
// Mult: base * current value (each upgrade multiplies base by current value)
// Exp: base * value^value (exponential self-multiplication)
export const UPGRADE_COST_ADD = (count: number, value: number): number =>
  Math.floor(60 * Math.pow(1.2, count) + value);

export const UPGRADE_COST_MULT = (count: number, value: number): number =>
  Math.floor(200 * Math.pow(1.3, count) * value);

export const UPGRADE_COST_EXP = (count: number, value: number): number =>
  Math.floor(1000 * Math.pow(1.4, count) * Math.pow(value, value));

// CP upgrade costs — Eternal Power and Eternal Multiplier are infinite
export const PERM_POWER_COST = (lvl: number): number =>
  Math.floor(1 * Math.pow(2, lvl));

export const PERM_MULT_COST = (lvl: number): number =>
  Math.floor(2 * Math.pow(2, lvl));

// Cheaper Upgrades stays capped at 5 levels
export const PERM_DISCOUNT_COST = (lvl: number): number | null =>
  lvl >= 5 ? null : Math.floor(3 * Math.pow(2, lvl));

export const REBIRTH_THRESHOLD = (rb: number): number =>
  Math.floor(12000 * Math.pow(5, rb));

export const REBIRTH_GAIN = (totalEarned: number): number =>
  Math.floor(Math.sqrt(totalEarned / 500));

// Per-level bonuses
export const ENERGY_BONUS_PER_LVL = 0.12;
export const PERM_POWER_BONUS = 0.2;
export const PERM_MULT_BONUS = 0.2;
export const DISCOUNT_PER_LVL = 0.1;

// Circle type limits
export const MAX_ADD = 12;
export const MAX_MULT = 6;
export const MAX_EXP = 4;
// Hard cap on total circles on the board at once (can increase via rebirth rewards)
export const MAX_TOTAL_CIRCLES = 20;

// Exp circle exponent divisor: value/EXP_VALUE_DIVISOR controls how steep the power is
export const EXP_VALUE_DIVISOR = 14;

// Combo system
export const COMBO_WINDOW_MS = 3000;
export const COMBO_BONUS_PER_STACK = 0.10;
export const COMBO_MAX_STACKS = 8;

// Crit
export const CRIT_CHANCE = 0.08;
export const CRIT_MULTIPLIER = 2;

// Streak
export const STREAK_THRESHOLD = 4;
export const STREAK_BONUS_PER_EXTRA = 0.12;

// ─── Challenge mechanics ─────────────────────────────────────────────────────

// Add circles: hard expiry (ms) — they're cheap so they pop quickly
export const CIRCLE_TTL_MS = 90_000;

// Mult circles: gradual value decay over this duration (ms), ending at ×2 minimum
export const MULT_DECAY_MS = 200_000;

// Exp circles: gradual value decay over this duration (ms), ending at ^1 minimum
export const EXP_DECAY_MS = 150_000;

// Probability that a newly spawned circle is corrupted
export const CORRUPT_CHANCE = 0.04;

// Corrupted circles that appear in a chain reduce the release by this factor
export const CORRUPT_PENALTY = 0.30;

// After a mult circle fires, it is "warming up" for this many ms.
// During warmup it can still join chains but applies a partial multiplier (50 → 100%).
export const MULT_EXHAUST_MS = 7_000;

// Mult circles idle for this long (since last use or purchase) become "primed" → bonus
export const PRIME_IDLE_MS = 10_000;
export const PRIME_BONUS = 0.40; // +40% effective multiplier when primed

// Point cost to cleanse (de-corrupt) a circle
export const CLEANSE_COST_ADD = 200;
export const CLEANSE_COST_MULT = 1_800;
export const CLEANSE_COST_EXP = 35_000;

// Fraction of a circle's value awarded when it expires/decays away naturally
export const EXPIRE_VALUE_FRACTION = 0.5;

// Passive income: awarded per second = sum(circle.value) * this rate
export const PASSIVE_INCOME_RATE = 0.5;

// Minimum ms between solo taps (single-circle tap when board has only one circle)
export const SOLO_TAP_COOLDOWN_MS = 800;

// Chain reaction: unlocked when rebirthCount >= 1
export const CHAIN_REACTION_CHANCE = 0.28;
// Extra fraction of the release added as chain-reaction bonus
export const CHAIN_REACTION_BONUS = 0.5;

// Chain length milestone bonuses (cumulative)
export const SURGE_THRESHOLD = 5;    // chain ≥ 5 circles → Surge
export const SURGE_BONUS = 0.25;     // +25%
export const MEGA_THRESHOLD = 7;     // chain ≥ 7 circles → Mega Surge
export const MEGA_BONUS = 0.40;      // additional +40%

// Win condition base (Easy difficulty)
export const WIN_TARGET = 1e100;

// ─── Difficulty system ────────────────────────────────────────────────────────
export type DifficultyKey = "easy" | "medium" | "hard" | "insane" | "hell" | "tree3";

export type Difficulty = {
  key: DifficultyKey;
  label: string;
  subLabel: string;
  description: string;
  winTarget: number;
  emoji: string;
  color: string;
};

export const DIFFICULTIES: Difficulty[] = [
  { key: "easy",   label: "Easy",               subLabel: "Googol",          description: "Reach 10¹⁰⁰ points",           winTarget: 1e100,            emoji: "🟢", color: "#16a34a" },
  { key: "medium", label: "Medium",              subLabel: "Googolplex",      description: "Reach 10¹⁵⁰ points",           winTarget: 1e150,            emoji: "🔵", color: "#2563eb" },
  { key: "hard",   label: "Hard",                subLabel: "Googolexian",     description: "Reach 10²⁰⁰ points",           winTarget: 1e200,            emoji: "🟠", color: "#ea580c" },
  { key: "insane", label: "Insane",              subLabel: "Graham's Number", description: "Reach 10²⁵⁰ points",           winTarget: 1e250,            emoji: "🔴", color: "#dc2626" },
  { key: "hell",   label: "Hell",                subLabel: "Rayo's Number",   description: "Reach 10³⁰⁰ points",           winTarget: 1e300,            emoji: "💀", color: "#7c3aed" },
  { key: "tree3",  label: "Don't attempt this",  subLabel: "TREE(3)",         description: "Reach the edge of computation", winTarget: Number.MAX_VALUE, emoji: "☠️", color: "#1a1714" },
];

export const DEFAULT_DIFFICULTY: DifficultyKey = "easy";

export function getDifficulty(key: DifficultyKey): Difficulty {
  return DIFFICULTIES.find((d) => d.key === key) ?? DIFFICULTIES[0];
}

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
  { id: "surge", label: "Surge", description: "Build a 5-circle chain" },
  { id: "megasurge", label: "Mega Surge", description: "Build a 7-circle chain" },
  { id: "primed", label: "Patience Pays", description: "Trigger a primed multiplier" },
];

// ─── Rebirth Reward System ────────────────────────────────────────────────────

export type RebirthRewardEffect =
  | { type: "passive_bonus"; pct: number }
  | { type: "release_bonus"; pct: number }
  | { type: "cp_bonus"; pct: number }
  | { type: "max_circles"; extra: number }
  | { type: "crit_chance"; extra: number }
  | { type: "combo_window"; extraMs: number }
  | { type: "combo_stacks"; extra: number }
  | { type: "surge_threshold"; delta: number }
  | { type: "mega_threshold"; delta: number };

export type RebirthReward = {
  label: string;
  description: string;
  effect: RebirthRewardEffect;
};

export const REBIRTH_REWARDS: RebirthReward[] = [
  // Tier 1 (1–10): Foundations
  { label: "Awakening", description: "+10% passive income", effect: { type: "passive_bonus", pct: 10 } },
  { label: "Momentum", description: "+10% release bonus", effect: { type: "release_bonus", pct: 10 } },
  { label: "Accumulation", description: "+5% CP gain", effect: { type: "cp_bonus", pct: 5 } },
  { label: "Expansion", description: "+1 board slot (11 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Fortune's Eye", description: "+2% crit chance", effect: { type: "crit_chance", extra: 0.02 } },
  { label: "Vitality", description: "+12% passive income", effect: { type: "passive_bonus", pct: 12 } },
  { label: "Impulse", description: "+12% release bonus", effect: { type: "release_bonus", pct: 12 } },
  { label: "Reservoir", description: "+8% CP gain", effect: { type: "cp_bonus", pct: 8 } },
  { label: "Rhythm", description: "+1s combo window", effect: { type: "combo_window", extraMs: 1000 } },
  { label: "Growth", description: "+1 board slot (12 max)", effect: { type: "max_circles", extra: 1 } },

  // Tier 2 (11–20): Acceleration
  { label: "Surge Tide", description: "+15% passive income", effect: { type: "passive_bonus", pct: 15 } },
  { label: "Force Flow", description: "+15% release bonus", effect: { type: "release_bonus", pct: 15 } },
  { label: "Harvest", description: "+10% CP gain", effect: { type: "cp_bonus", pct: 10 } },
  { label: "Keen Edge", description: "+3% crit chance", effect: { type: "crit_chance", extra: 0.03 } },
  { label: "Cascade Start", description: "+1 combo stack", effect: { type: "combo_stacks", extra: 1 } },
  { label: "Resonance", description: "+18% passive income", effect: { type: "passive_bonus", pct: 18 } },
  { label: "Amplify", description: "+18% release bonus", effect: { type: "release_bonus", pct: 18 } },
  { label: "Treasury", description: "+12% CP gain", effect: { type: "cp_bonus", pct: 12 } },
  { label: "Domain", description: "+1 board slot (13 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Precision", description: "+5% crit chance", effect: { type: "crit_chance", extra: 0.05 } },

  // Tier 3 (21–30): Power
  { label: "Wellspring", description: "+20% passive income", effect: { type: "passive_bonus", pct: 20 } },
  { label: "Torrent", description: "+20% release bonus", effect: { type: "release_bonus", pct: 20 } },
  { label: "Stockpile", description: "+15% CP gain", effect: { type: "cp_bonus", pct: 15 } },
  { label: "Extended Flow", description: "+2s combo window", effect: { type: "combo_window", extraMs: 2000 } },
  { label: "Double Tap", description: "+2 combo stacks", effect: { type: "combo_stacks", extra: 2 } },
  { label: "Deep Root", description: "+22% passive income", effect: { type: "passive_bonus", pct: 22 } },
  { label: "Overdrive", description: "+22% release bonus", effect: { type: "release_bonus", pct: 22 } },
  { label: "Bounty", description: "+18% CP gain", effect: { type: "cp_bonus", pct: 18 } },
  { label: "Spread", description: "+1 board slot (14 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Razor", description: "+7% crit chance", effect: { type: "crit_chance", extra: 0.07 } },

  // Tier 4 (31–40): Elite
  { label: "Flood", description: "+25% passive income", effect: { type: "passive_bonus", pct: 25 } },
  { label: "Barrage", description: "+25% release bonus", effect: { type: "release_bonus", pct: 25 } },
  { label: "Vault", description: "+20% CP gain", effect: { type: "cp_bonus", pct: 20 } },
  { label: "Sharpened", description: "+5% crit chance", effect: { type: "crit_chance", extra: 0.05 } },
  { label: "Afterburn", description: "+1 combo stack", effect: { type: "combo_stacks", extra: 1 } },
  { label: "Geyser", description: "+28% passive income", effect: { type: "passive_bonus", pct: 28 } },
  { label: "Onslaught", description: "+28% release bonus", effect: { type: "release_bonus", pct: 28 } },
  { label: "Coffers", description: "+22% CP gain", effect: { type: "cp_bonus", pct: 22 } },
  { label: "Long Wave", description: "+3s combo window", effect: { type: "combo_window", extraMs: 3000 } },
  { label: "Territory", description: "+1 board slot (15 max)", effect: { type: "max_circles", extra: 1 } },

  // Tier 5 (41–50): Master
  { label: "Deluge", description: "+30% passive income", effect: { type: "passive_bonus", pct: 30 } },
  { label: "Blitz", description: "+30% release bonus", effect: { type: "release_bonus", pct: 30 } },
  { label: "Hoard", description: "+25% CP gain", effect: { type: "cp_bonus", pct: 25 } },
  { label: "Piercing", description: "+7% crit chance", effect: { type: "crit_chance", extra: 0.07 } },
  { label: "Rapid Fire", description: "+2 combo stacks", effect: { type: "combo_stacks", extra: 2 } },
  { label: "Torrent II", description: "+33% passive income", effect: { type: "passive_bonus", pct: 33 } },
  { label: "Overload", description: "+33% release bonus", effect: { type: "release_bonus", pct: 33 } },
  { label: "Wealth", description: "+28% CP gain", effect: { type: "cp_bonus", pct: 28 } },
  { label: "Expanse", description: "+1 board slot (16 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Early Surge", description: "Surge activates at chain 4", effect: { type: "surge_threshold", delta: 1 } },

  // Tier 6 (51–60): Legend
  { label: "Cascade II", description: "+36% passive income", effect: { type: "passive_bonus", pct: 36 } },
  { label: "Volley", description: "+36% release bonus", effect: { type: "release_bonus", pct: 36 } },
  { label: "Reserve", description: "+30% CP gain", effect: { type: "cp_bonus", pct: 30 } },
  { label: "Deadly", description: "+9% crit chance", effect: { type: "crit_chance", extra: 0.09 } },
  { label: "Eternal Wave", description: "+4s combo window", effect: { type: "combo_window", extraMs: 4000 } },
  { label: "Maelstrom", description: "+40% passive income", effect: { type: "passive_bonus", pct: 40 } },
  { label: "Salvo", description: "+40% release bonus", effect: { type: "release_bonus", pct: 40 } },
  { label: "Windfall", description: "+33% CP gain", effect: { type: "cp_bonus", pct: 33 } },
  { label: "Realm", description: "+1 board slot (17 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Triple Down", description: "+3 combo stacks", effect: { type: "combo_stacks", extra: 3 } },

  // Tier 7 (61–70): Ascendant
  { label: "Surge III", description: "+45% passive income", effect: { type: "passive_bonus", pct: 45 } },
  { label: "Tempest", description: "+45% release bonus", effect: { type: "release_bonus", pct: 45 } },
  { label: "Trove", description: "+36% CP gain", effect: { type: "cp_bonus", pct: 36 } },
  { label: "Critical Mass", description: "+10% crit chance", effect: { type: "crit_chance", extra: 0.10 } },
  { label: "Momentum II", description: "+1 combo stack", effect: { type: "combo_stacks", extra: 1 } },
  { label: "Typhoon", description: "+50% passive income", effect: { type: "passive_bonus", pct: 50 } },
  { label: "Hurricane", description: "+50% release bonus", effect: { type: "release_bonus", pct: 50 } },
  { label: "Treasury II", description: "+40% CP gain", effect: { type: "cp_bonus", pct: 40 } },
  { label: "Dominion", description: "+1 board slot (18 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Early Mega", description: "Mega Surge activates at chain 6", effect: { type: "mega_threshold", delta: 1 } },

  // Tier 8 (71–80): Transcendent
  { label: "Torrent III", description: "+55% passive income", effect: { type: "passive_bonus", pct: 55 } },
  { label: "Fusillade", description: "+55% release bonus", effect: { type: "release_bonus", pct: 55 } },
  { label: "Stockpile II", description: "+45% CP gain", effect: { type: "cp_bonus", pct: 45 } },
  { label: "Lethal", description: "+12% crit chance", effect: { type: "crit_chance", extra: 0.12 } },
  { label: "Endless Tide", description: "+5s combo window", effect: { type: "combo_window", extraMs: 5000 } },
  { label: "Void Flood", description: "+60% passive income", effect: { type: "passive_bonus", pct: 60 } },
  { label: "Annihilation", description: "+60% release bonus", effect: { type: "release_bonus", pct: 60 } },
  { label: "Abundance", description: "+50% CP gain", effect: { type: "cp_bonus", pct: 50 } },
  { label: "Infinity Board", description: "+1 board slot (19 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Quad Strike", description: "+4 combo stacks", effect: { type: "combo_stacks", extra: 4 } },

  // Tier 9 (81–90): Cosmic
  { label: "Nebula Flow", description: "+65% passive income", effect: { type: "passive_bonus", pct: 65 } },
  { label: "Stellar Burst", description: "+65% release bonus", effect: { type: "release_bonus", pct: 65 } },
  { label: "Cosmic Hoard", description: "+55% CP gain", effect: { type: "cp_bonus", pct: 55 } },
  { label: "Supernova Eye", description: "+14% crit chance", effect: { type: "crit_chance", extra: 0.14 } },
  { label: "Deep Combo", description: "+2 combo stacks", effect: { type: "combo_stacks", extra: 2 } },
  { label: "Galactic Stream", description: "+70% passive income", effect: { type: "passive_bonus", pct: 70 } },
  { label: "Nova Strike", description: "+70% release bonus", effect: { type: "release_bonus", pct: 70 } },
  { label: "Star Wealth", description: "+60% CP gain", effect: { type: "cp_bonus", pct: 60 } },
  { label: "Cosmos Board", description: "+1 board slot (20 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Rift Window", description: "+6s combo window", effect: { type: "combo_window", extraMs: 6000 } },

  // Tier 10 (91–100): Divine
  { label: "Divine Tide", description: "+80% passive income", effect: { type: "passive_bonus", pct: 80 } },
  { label: "Omnistrike", description: "+80% release bonus", effect: { type: "release_bonus", pct: 80 } },
  { label: "Divine Treasury", description: "+70% CP gain", effect: { type: "cp_bonus", pct: 70 } },
  { label: "Godseye", description: "+15% crit chance", effect: { type: "crit_chance", extra: 0.15 } },
  { label: "Quintuple", description: "+3 combo stacks", effect: { type: "combo_stacks", extra: 3 } },
  { label: "Infinite Flow", description: "+90% passive income", effect: { type: "passive_bonus", pct: 90 } },
  { label: "Absolute Force", description: "+90% release bonus", effect: { type: "release_bonus", pct: 90 } },
  { label: "Ultimate Hoard", description: "+80% CP gain", effect: { type: "cp_bonus", pct: 80 } },
  { label: "Divine Board", description: "+1 board slot (21 max)", effect: { type: "max_circles", extra: 1 } },
  { label: "Ascension", description: "+100% passive income + +100% release bonus", effect: { type: "passive_bonus", pct: 100 } },
];

export type RebirthBonuses = {
  passivePct: number;
  releasePct: number;
  cpPct: number;
  extraBoardSlots: number;
  extraCritChance: number;
  extraComboWindowMs: number;
  extraComboStacks: number;
  surgeThresholdDelta: number;
  megaThresholdDelta: number;
};

export function computeRebirthBonuses(rebirthCount: number): RebirthBonuses {
  const n = Math.min(rebirthCount, REBIRTH_REWARDS.length);
  let passivePct = 0, releasePct = 0, cpPct = 0;
  let extraBoardSlots = 0, extraCritChance = 0;
  let extraComboWindowMs = 0, extraComboStacks = 0;
  let surgeThresholdDelta = 0, megaThresholdDelta = 0;

  for (let i = 0; i < n; i++) {
    const e = REBIRTH_REWARDS[i].effect;
    if (e.type === "passive_bonus") passivePct += e.pct;
    else if (e.type === "release_bonus") releasePct += e.pct;
    else if (e.type === "cp_bonus") cpPct += e.pct;
    else if (e.type === "max_circles") extraBoardSlots += e.extra;
    else if (e.type === "crit_chance") extraCritChance += e.extra;
    else if (e.type === "combo_window") extraComboWindowMs += e.extraMs;
    else if (e.type === "combo_stacks") extraComboStacks += e.extra;
    else if (e.type === "surge_threshold") surgeThresholdDelta += e.delta;
    else if (e.type === "mega_threshold") megaThresholdDelta += e.delta;
  }

  // Rebirth 100 also gives +100% release (dual effect handled manually)
  if (rebirthCount >= 100) releasePct += 100;

  return { passivePct, releasePct, cpPct, extraBoardSlots, extraCritChance, extraComboWindowMs, extraComboStacks, surgeThresholdDelta, megaThresholdDelta };
}
