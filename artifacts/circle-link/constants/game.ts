export const POWER_COST = (lvl: number): number =>
  Math.floor(15 * Math.pow(1.6, lvl));

export const MULT_COST = (cnt: number): number | null =>
  cnt >= 4 ? null : Math.floor(400 * Math.pow(7, cnt));

export const EXP_COST = (cnt: number): number | null =>
  cnt >= 2 ? null : Math.floor(12000 * Math.pow(25, cnt));

export const PERM_POWER_COST = (lvl: number): number | null =>
  lvl >= 10 ? null : Math.floor(1 * Math.pow(2, lvl));

export const PERM_MULT_COST = (lvl: number): number | null =>
  lvl >= 8 ? null : Math.floor(2 * Math.pow(2, lvl));

export const PERM_DISCOUNT_COST = (lvl: number): number | null =>
  lvl >= 5 ? null : Math.floor(3 * Math.pow(2, lvl));

export const REBIRTH_THRESHOLD = (rb: number): number =>
  Math.floor(75000 * Math.pow(8, rb));

export const REBIRTH_GAIN = (totalEarned: number): number =>
  Math.floor(Math.sqrt(totalEarned / 1500));

export const POWER_BONUS_PER_LVL = 0.2;
export const PERM_POWER_BONUS = 0.5;
export const MULT_BONUS_PER_CIRCLE = 1.0;
export const PERM_MULT_BONUS = 0.5;
export const EXP_BASE = 1.85;
export const BASE_RATE_PER_CIRCLE = 0.6;
export const DISCOUNT_PER_LVL = 0.1;

export const NORMAL_COUNT = 4;
export const MAX_MULT = 4;
export const MAX_EXP = 2;
