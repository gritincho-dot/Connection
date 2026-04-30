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

export const ENERGY_BONUS_PER_LVL = 0.2;
export const PERM_POWER_BONUS = 0.5;
export const PERM_MULT_BONUS = 0.5;
export const DISCOUNT_PER_LVL = 0.1;

export const MAX_ADD = 6;
export const MAX_MULT = 4;
export const MAX_EXP = 2;
