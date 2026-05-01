import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ACHIEVEMENTS,
  ADD_COST,
  CHAIN_REACTION_BONUS,
  CHAIN_REACTION_CHANCE,
  CIRCLE_TTL_MS,
  CLEANSE_COST_ADD,
  CLEANSE_COST_EXP,
  CLEANSE_COST_MULT,
  COMBO_BONUS_PER_STACK,
  COMBO_MAX_STACKS,
  COMBO_WINDOW_MS,
  CORRUPT_CHANCE,
  CORRUPT_PENALTY,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  DISCOUNT_PER_LVL,
  ENERGY_BONUS_PER_LVL,
  ENERGY_COST,
  EXP_AOE_BONUS,
  EXP_COST,
  EXP_VALUE_DIVISOR,
  MAX_ADD,
  MAX_EXP,
  MAX_MULT,
  MAX_TOTAL_CIRCLES,
  MULT_EXHAUST_MS,
  MULT_COST,
  PERM_DISCOUNT_COST,
  PERM_MULT_BONUS,
  PERM_MULT_COST,
  PERM_POWER_BONUS,
  PERM_POWER_COST,
  REBIRTH_GAIN,
  REBIRTH_THRESHOLD,
  REROLL_COST_ADD,
  REROLL_COST_EXP,
  REROLL_COST_MULT,
  STREAK_BONUS_PER_EXTRA,
  STREAK_THRESHOLD,
} from "@/constants/game";
import { type BgVariant, DEFAULT_BG } from "@/lib/theme";

export type CircleType = "add" | "mult" | "exp";

export type CircleNode = {
  id: string;
  type: CircleType;
  value: number;
  x?: number;
  y?: number;
  reRollCount: number;
  // null = permanent (starting circles), timestamp = expires at that time
  expiresAt: number | null;
  // whether this circle spawned corrupted
  corrupted: boolean;
  // timestamp until which this mult circle is exhausted (can't join chains)
  exhaustedUntil: number | null;
};

export type Settings = {
  soundEnabled: boolean;
  bgVariant: BgVariant;
};

export type ReleaseInfo = {
  earned: number;
  baseEarned: number;
  crit: boolean;
  comboCount: number;
  newAchievements: string[];
  expAOE: boolean;
  circlesDestroyed: number;
  chainReaction: boolean;
  chainReactionBonus: number;
};

export type GameState = {
  points: number;
  totalEarnedThisRun: number;
  totalLifetime: number;
  energyLevel: number;
  circles: CircleNode[];
  circlePoints: number;
  permPower: number;
  permMult: number;
  permDiscount: number;
  rebirthCount: number;
  bestChainLength: number;
  bestSingleEarning: number;
  totalReleases: number;
  comboCount: number;
  lastReleaseAt: number;
  achievements: string[];
  settings: Settings;
};

let idCounter = 0;
function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function makeStartingCircles(): CircleNode[] {
  return [
    {
      id: newId("add"),
      type: "add",
      value: 5,
      reRollCount: 0,
      expiresAt: null,
      corrupted: false,
      exhaustedUntil: null,
    },
    {
      id: newId("mult"),
      type: "mult",
      value: 2,
      reRollCount: 0,
      expiresAt: null,
      corrupted: false,
      exhaustedUntil: null,
    },
  ];
}

const initial: GameState = {
  points: 0,
  totalEarnedThisRun: 0,
  totalLifetime: 0,
  energyLevel: 0,
  circles: makeStartingCircles(),
  circlePoints: 0,
  permPower: 0,
  permMult: 0,
  permDiscount: 0,
  rebirthCount: 0,
  bestChainLength: 0,
  bestSingleEarning: 0,
  totalReleases: 0,
  comboCount: 0,
  lastReleaseAt: 0,
  achievements: [],
  settings: {
    soundEnabled: true,
    bgVariant: DEFAULT_BG,
  },
};

const STORAGE_KEY = "@circle-link/state-v4";

export type Costs = {
  energy: number;
  add: number | null;
  mult: number | null;
  exp: number | null;
  permPower: number | null;
  permMult: number | null;
  permDiscount: number | null;
  rebirthThreshold: number;
  rebirthCpGain: number;
};

type Ctx = {
  state: GameState;
  costs: Costs;
  applyDiscount: (cost: number) => number;
  reRollCostFor: (circle: CircleNode) => number;
  cleanseCostFor: (circle: CircleNode) => number;
  computeRelease: (chain: CircleNode[]) => number;
  computeReleaseStepwise: (chain: CircleNode[]) => number[];
  releaseChain: (chain: CircleNode[]) => ReleaseInfo;
  buyEnergy: () => boolean;
  addCircle: (type: CircleType) => boolean;
  reRollCircle: (id: string) => boolean;
  cleanseCircle: (id: string) => boolean;
  removeCircle: (id: string) => void;
  moveCircle: (id: string, x: number, y: number) => void;
  shuffleLayout: () => void;
  buyPermPower: () => boolean;
  buyPermMult: () => boolean;
  buyPermDiscount: () => boolean;
  rebirth: () => boolean;
  resetAll: () => Promise<void>;
  setSoundEnabled: (v: boolean) => void;
  setBgVariant: (v: BgVariant) => void;
  acknowledgeAchievement: (id: string) => void;
  pendingAchievement: string | null;
  canRebirth: boolean;
  boardFull: boolean;
  loaded: boolean;
};

export const GameContext = createContext<Ctx | null>(null);

// Type-aware random value ranges
// Add: 2–12  |  Mult: 2–5  |  Exp: 1–5
const randVal = (type: CircleType): number => {
  if (type === "mult") return Math.floor(Math.random() * 4) + 2;
  if (type === "exp") return Math.floor(Math.random() * 5) + 1;
  return Math.floor(Math.random() * 11) + 2;
};

function checkAchievements(s: GameState): string[] {
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    let ok = false;
    if (a.id === "first100") ok = s.totalLifetime >= 100;
    else if (a.id === "first1k") ok = s.totalLifetime >= 1000;
    else if (a.id === "first10k") ok = s.totalLifetime >= 10000;
    else if (a.id === "first100k") ok = s.totalLifetime >= 100000;
    else if (a.id === "chain3") ok = s.bestChainLength >= 3;
    else if (a.id === "chain4") ok = s.bestChainLength >= 4;
    else if (a.id === "chain5") ok = s.bestChainLength >= 5;
    else if (a.id === "chain6") ok = s.bestChainLength >= 6;
    else if (a.id === "combo5") ok = s.comboCount >= 5;
    else if (a.id === "rebirth1") ok = s.rebirthCount >= 1;
    else if (a.id === "energy5") ok = s.energyLevel >= 5;
    if (ok) unlocked.push(a.id);
  }
  return unlocked;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initial);
  const [loaded, setLoaded] = useState(false);
  const [pendingAchievement, setPendingAchievement] = useState<string | null>(null);
  const achievementQueue = useRef<string[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<GameState>;
          if (!parsed.circles || !Array.isArray(parsed.circles) || parsed.circles.length === 0) {
            parsed.circles = makeStartingCircles();
          } else {
            // Migrate old circles that lack new fields
            parsed.circles = parsed.circles.map((c: CircleNode) => ({
              ...c,
              expiresAt: c.expiresAt ?? null,
              corrupted: c.corrupted ?? false,
              exhaustedUntil: c.exhaustedUntil ?? null,
            }));
          }
          if (!parsed.settings) parsed.settings = initial.settings;
          if (!parsed.achievements) parsed.achievements = [];
          setState({ ...initial, ...parsed });
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [state, loaded]);

  // ── Expiry interval ─────────────────────────────────────────────────────────
  // Every second, remove circles whose expiresAt has passed
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => {
      const now = Date.now();
      setState((s) => {
        const expired = s.circles.filter(
          (c) => c.expiresAt !== null && now >= c.expiresAt,
        );
        if (expired.length === 0) return s;
        return {
          ...s,
          circles: s.circles.filter(
            (c) => c.expiresAt === null || now < c.expiresAt,
          ),
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [loaded]);

  const enqueueAchievements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    for (const id of ids) achievementQueue.current.push(id);
    setPendingAchievement((cur) => {
      if (cur !== null) return cur;
      return achievementQueue.current.shift() ?? null;
    });
  }, []);

  const acknowledgeAchievement = useCallback((id: string) => {
    const next = achievementQueue.current.shift() ?? null;
    setPendingAchievement((cur) => (cur === id ? next : cur));
  }, []);

  const applyDiscount = useCallback((cost: number) => {
    return Math.ceil(cost * (1 - stateRef.current.permDiscount * DISCOUNT_PER_LVL));
  }, []);

  const reRollCostFor = useCallback((circle: CircleNode): number => {
    const base =
      circle.type === "add"
        ? REROLL_COST_ADD(circle.reRollCount)
        : circle.type === "mult"
          ? REROLL_COST_MULT(circle.reRollCount)
          : REROLL_COST_EXP(circle.reRollCount);
    return Math.ceil(base * (1 - stateRef.current.permDiscount * DISCOUNT_PER_LVL));
  }, []);

  const cleanseCostFor = useCallback((circle: CircleNode): number => {
    const base =
      circle.type === "add"
        ? CLEANSE_COST_ADD
        : circle.type === "mult"
          ? CLEANSE_COST_MULT
          : CLEANSE_COST_EXP;
    return Math.ceil(base * (1 - stateRef.current.permDiscount * DISCOUNT_PER_LVL));
  }, []);

  // ── Computation ──────────────────────────────────────────────────────────────

  // Returns per-step running totals. Corrupted circles apply a -30% penalty at
  // the END via a flag, but we keep step values honest for the preview display.
  const computeReleaseStepwise = useCallback((chain: CircleNode[]): number[] => {
    if (chain.length === 0) return [];
    const s = stateRef.current;
    const steps: number[] = [];
    let result = chain[0].value;
    steps.push(result);
    for (let i = 1; i < chain.length; i++) {
      const c = chain[i];
      if (c.type === "add") {
        result = result + c.value;
      } else if (c.type === "mult") {
        result = result * c.value * (1 + s.permMult * PERM_MULT_BONUS);
      } else {
        result = Math.pow(result, 1 + c.value / EXP_VALUE_DIVISOR);
      }
      steps.push(result);
    }
    return steps;
  }, []);

  const computeRelease = useCallback(
    (chain: CircleNode[]): number => {
      if (chain.length < 2) return 0;
      const s = stateRef.current;
      const steps = computeReleaseStepwise(chain);
      let result = steps[steps.length - 1];

      // Corrupted penalty
      const corruptCount = chain.filter((c) => c.corrupted).length;
      if (corruptCount > 0) result *= Math.pow(1 - CORRUPT_PENALTY, corruptCount);

      // Streak bonus
      if (chain.length >= STREAK_THRESHOLD) {
        const extra = chain.length - STREAK_THRESHOLD + 1;
        result *= 1 + STREAK_BONUS_PER_EXTRA * extra;
      }

      // Exp AOE bonus preview
      const hasExp = chain.some((c) => c.type === "exp");
      if (hasExp) result *= EXP_AOE_BONUS;

      result *= 1 + s.energyLevel * ENERGY_BONUS_PER_LVL;
      result *= 1 + s.permPower * PERM_POWER_BONUS;

      const within = Date.now() - s.lastReleaseAt < COMBO_WINDOW_MS;
      const projectedCombo = within
        ? Math.min(s.comboCount + 1, COMBO_MAX_STACKS)
        : 1;
      result *= 1 + (projectedCombo - 1) * COMBO_BONUS_PER_STACK;

      return Math.floor(result);
    },
    [computeReleaseStepwise],
  );

  const releaseChain = useCallback(
    (chain: CircleNode[]): ReleaseInfo => {
      if (chain.length < 2) {
        return {
          earned: 0,
          baseEarned: 0,
          crit: false,
          comboCount: 0,
          newAchievements: [],
          expAOE: false,
          circlesDestroyed: 0,
          chainReaction: false,
          chainReactionBonus: 0,
        };
      }

      let info: ReleaseInfo = {
        earned: 0,
        baseEarned: 0,
        crit: false,
        comboCount: 0,
        newAchievements: [],
        expAOE: false,
        circlesDestroyed: 0,
        chainReaction: false,
        chainReactionBonus: 0,
      };

      setState((s) => {
        const steps = computeReleaseStepwise(chain);
        let result = steps[steps.length - 1];

        // Corrupted penalty (stacks per corrupted circle)
        const corruptedInChain = chain.filter((c) => c.corrupted);
        if (corruptedInChain.length > 0) {
          result *= Math.pow(1 - CORRUPT_PENALTY, corruptedInChain.length);
        }

        // Streak bonus
        if (chain.length >= STREAK_THRESHOLD) {
          const extra = chain.length - STREAK_THRESHOLD + 1;
          result *= 1 + STREAK_BONUS_PER_EXTRA * extra;
        }

        // Exp AOE: does this chain include an exp circle?
        const expInChain = chain.filter((c) => c.type === "exp");
        const hasExp = expInChain.length > 0;
        if (hasExp) result *= EXP_AOE_BONUS;

        result *= 1 + s.energyLevel * ENERGY_BONUS_PER_LVL;
        result *= 1 + s.permPower * PERM_POWER_BONUS;

        const now = Date.now();
        const within = now - s.lastReleaseAt < COMBO_WINDOW_MS;
        const newCombo = within ? Math.min(s.comboCount + 1, COMBO_MAX_STACKS) : 1;
        result *= 1 + (newCombo - 1) * COMBO_BONUS_PER_STACK;

        const baseEarned = Math.floor(result);
        const crit = Math.random() < CRIT_CHANCE;
        let earned = crit ? baseEarned * CRIT_MULTIPLIER : baseEarned;

        // Chain reaction (requires at least one rebirth)
        const chainReactionTriggered =
          s.rebirthCount >= 1 && Math.random() < CHAIN_REACTION_CHANCE;
        const chainReactionBonus = chainReactionTriggered
          ? Math.floor(earned * CHAIN_REACTION_BONUS)
          : 0;
        if (chainReactionTriggered) earned += chainReactionBonus;

        // Identify circles destroyed by exp AOE: add circles in the chain
        // (excluding starting/permanent circles so they can't all be wiped)
        const chainAddIds = new Set(
          chain
            .filter((c) => c.type === "add" && c.expiresAt !== null)
            .map((c) => c.id),
        );
        const circlesDestroyed = hasExp ? chainAddIds.size : 0;

        // Identify mult circles in chain → exhaust them
        const multIdsInChain = new Set(
          chain.filter((c) => c.type === "mult").map((c) => c.id),
        );

        // Update circles: destroy exp-wiped adds, exhaust mults
        const updatedCircles = s.circles
          .filter((c) => !(hasExp && chainAddIds.has(c.id)))
          .map((c) => {
            if (multIdsInChain.has(c.id)) {
              return { ...c, exhaustedUntil: now + MULT_EXHAUST_MS };
            }
            return c;
          });

        const next: GameState = {
          ...s,
          points: s.points + earned,
          totalEarnedThisRun: s.totalEarnedThisRun + earned,
          totalLifetime: s.totalLifetime + earned,
          totalReleases: s.totalReleases + 1,
          comboCount: newCombo,
          lastReleaseAt: now,
          bestChainLength: Math.max(s.bestChainLength, chain.length),
          bestSingleEarning: Math.max(s.bestSingleEarning, earned),
          circles: updatedCircles,
        };

        // Unlock achievements
        const unlocked = checkAchievements({ ...next, achievements: s.achievements });
        if (crit && !s.achievements.includes("crit")) unlocked.push("crit");
        if (hasExp && !s.achievements.includes("expburst")) unlocked.push("expburst");
        if (chainReactionTriggered && !s.achievements.includes("chainreact"))
          unlocked.push("chainreact");
        next.achievements = [...s.achievements, ...unlocked];

        info = {
          earned,
          baseEarned,
          crit,
          comboCount: newCombo,
          newAchievements: unlocked,
          expAOE: hasExp,
          circlesDestroyed,
          chainReaction: chainReactionTriggered,
          chainReactionBonus,
        };

        return next;
      });

      setTimeout(() => {
        if (info.newAchievements.length > 0) enqueueAchievements(info.newAchievements);
      }, 0);

      return info;
    },
    [computeReleaseStepwise, enqueueAchievements],
  );

  const buyEnergy = useCallback(() => {
    let ok = false;
    setState((s) => {
      const cost = Math.ceil(
        ENERGY_COST(s.energyLevel) * (1 - s.permDiscount * DISCOUNT_PER_LVL),
      );
      if (s.points < cost) return s;
      ok = true;
      const next = { ...s, points: s.points - cost, energyLevel: s.energyLevel + 1 };
      const unlocked = checkAchievements(next);
      if (unlocked.length > 0) {
        next.achievements = [...next.achievements, ...unlocked];
        setTimeout(() => enqueueAchievements(unlocked), 0);
      }
      return next;
    });
    return ok;
  }, [enqueueAchievements]);

  const addCircle = useCallback((type: CircleType) => {
    let ok = false;
    setState((s) => {
      // Hard cap on total circles
      if (s.circles.length >= MAX_TOTAL_CIRCLES) return s;

      const count = s.circles.filter((c) => c.type === type).length;
      const max = type === "add" ? MAX_ADD : type === "mult" ? MAX_MULT : MAX_EXP;
      if (count >= max) return s;

      const rawCost =
        type === "add" ? ADD_COST(count) : type === "mult" ? MULT_COST(count) : EXP_COST(count);
      const cost = Math.ceil(rawCost * (1 - s.permDiscount * DISCOUNT_PER_LVL));
      if (s.points < cost) return s;

      ok = true;
      const corrupted = Math.random() < CORRUPT_CHANCE;
      return {
        ...s,
        points: s.points - cost,
        circles: [
          ...s.circles,
          {
            id: newId(type),
            type,
            value: randVal(type),
            reRollCount: 0,
            expiresAt: Date.now() + CIRCLE_TTL_MS,
            corrupted,
            exhaustedUntil: null,
          },
        ],
      };
    });
    return ok;
  }, []);

  const reRollCircle = useCallback((id: string) => {
    let ok = false;
    setState((s) => {
      const circle = s.circles.find((c) => c.id === id);
      if (!circle) return s;
      const rawCost =
        circle.type === "add"
          ? REROLL_COST_ADD(circle.reRollCount)
          : circle.type === "mult"
            ? REROLL_COST_MULT(circle.reRollCount)
            : REROLL_COST_EXP(circle.reRollCount);
      const cost = Math.ceil(rawCost * (1 - s.permDiscount * DISCOUNT_PER_LVL));
      if (s.points < cost) return s;
      ok = true;
      // Re-rolling resets expiry timer and re-rolls corruption status
      const corrupted = circle.expiresAt !== null ? Math.random() < CORRUPT_CHANCE : false;
      return {
        ...s,
        points: s.points - cost,
        circles: s.circles.map((c) =>
          c.id === id
            ? {
                ...c,
                value: randVal(c.type),
                reRollCount: c.reRollCount + 1,
                expiresAt: c.expiresAt !== null ? Date.now() + CIRCLE_TTL_MS : null,
                corrupted,
                exhaustedUntil: null,
              }
            : c,
        ),
      };
    });
    return ok;
  }, []);

  const cleanseCircle = useCallback((id: string) => {
    let ok = false;
    setState((s) => {
      const circle = s.circles.find((c) => c.id === id);
      if (!circle || !circle.corrupted) return s;
      const base =
        circle.type === "add"
          ? CLEANSE_COST_ADD
          : circle.type === "mult"
            ? CLEANSE_COST_MULT
            : CLEANSE_COST_EXP;
      const cost = Math.ceil(base * (1 - s.permDiscount * DISCOUNT_PER_LVL));
      if (s.points < cost) return s;
      ok = true;
      return {
        ...s,
        points: s.points - cost,
        circles: s.circles.map((c) =>
          c.id === id ? { ...c, corrupted: false } : c,
        ),
      };
    });
    return ok;
  }, []);

  const removeCircle = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      circles: s.circles.filter((c) => c.id !== id),
    }));
  }, []);

  const moveCircle = useCallback((id: string, x: number, y: number) => {
    setState((s) => {
      const target = s.circles.find((c) => c.id === id);
      if (!target) return s;
      if (target.x === x && target.y === y) return s;
      return { ...s, circles: s.circles.map((c) => (c.id === id ? { ...c, x, y } : c)) };
    });
  }, []);

  const shuffleLayout = useCallback(() => {
    setState((s) => ({
      ...s,
      circles: s.circles.map((c) => ({ ...c, x: undefined, y: undefined })),
    }));
  }, []);

  const buyPermPower = useCallback(() => {
    let ok = false;
    setState((s) => {
      const raw = PERM_POWER_COST(s.permPower);
      if (raw === null) return s;
      if (s.circlePoints < raw) return s;
      ok = true;
      return { ...s, circlePoints: s.circlePoints - raw, permPower: s.permPower + 1 };
    });
    return ok;
  }, []);

  const buyPermMult = useCallback(() => {
    let ok = false;
    setState((s) => {
      const raw = PERM_MULT_COST(s.permMult);
      if (raw === null) return s;
      if (s.circlePoints < raw) return s;
      ok = true;
      return { ...s, circlePoints: s.circlePoints - raw, permMult: s.permMult + 1 };
    });
    return ok;
  }, []);

  const buyPermDiscount = useCallback(() => {
    let ok = false;
    setState((s) => {
      const raw = PERM_DISCOUNT_COST(s.permDiscount);
      if (raw === null) return s;
      if (s.circlePoints < raw) return s;
      ok = true;
      return { ...s, circlePoints: s.circlePoints - raw, permDiscount: s.permDiscount + 1 };
    });
    return ok;
  }, []);

  const rebirth = useCallback(() => {
    let ok = false;
    setState((s) => {
      const threshold = REBIRTH_THRESHOLD(s.rebirthCount);
      if (s.totalEarnedThisRun < threshold) return s;
      const gain = REBIRTH_GAIN(s.totalEarnedThisRun);
      if (gain <= 0) return s;
      ok = true;
      const next: GameState = {
        ...s,
        points: 0,
        totalEarnedThisRun: 0,
        energyLevel: 0,
        circles: makeStartingCircles(),
        circlePoints: s.circlePoints + gain,
        rebirthCount: s.rebirthCount + 1,
        comboCount: 0,
        lastReleaseAt: 0,
      };
      const unlocked = checkAchievements(next);
      if (unlocked.length > 0) {
        next.achievements = [...next.achievements, ...unlocked];
        setTimeout(() => enqueueAchievements(unlocked), 0);
      }
      return next;
    });
    return ok;
  }, [enqueueAchievements]);

  const resetAll = useCallback(async () => {
    setState({ ...initial, circles: makeStartingCircles() });
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const setSoundEnabled = useCallback((v: boolean) => {
    setState((s) => ({ ...s, settings: { ...s.settings, soundEnabled: v } }));
  }, []);

  const setBgVariant = useCallback((v: BgVariant) => {
    setState((s) => ({ ...s, settings: { ...s.settings, bgVariant: v } }));
  }, []);

  const costs = useMemo<Costs>(() => {
    const addCount = state.circles.filter((c) => c.type === "add").length;
    const multCount = state.circles.filter((c) => c.type === "mult").length;
    const expCount = state.circles.filter((c) => c.type === "exp").length;
    return {
      energy: ENERGY_COST(state.energyLevel),
      add: addCount >= MAX_ADD ? null : ADD_COST(addCount),
      mult: multCount >= MAX_MULT ? null : MULT_COST(multCount),
      exp: expCount >= MAX_EXP ? null : EXP_COST(expCount),
      permPower: PERM_POWER_COST(state.permPower),
      permMult: PERM_MULT_COST(state.permMult),
      permDiscount: PERM_DISCOUNT_COST(state.permDiscount),
      rebirthThreshold: REBIRTH_THRESHOLD(state.rebirthCount),
      rebirthCpGain: REBIRTH_GAIN(state.totalEarnedThisRun),
    };
  }, [state]);

  const canRebirth =
    state.totalEarnedThisRun >= costs.rebirthThreshold && costs.rebirthCpGain > 0;

  const boardFull = state.circles.length >= MAX_TOTAL_CIRCLES;

  const value: Ctx = {
    state,
    costs,
    applyDiscount,
    reRollCostFor,
    cleanseCostFor,
    computeRelease,
    computeReleaseStepwise,
    releaseChain,
    buyEnergy,
    addCircle,
    reRollCircle,
    cleanseCircle,
    removeCircle,
    moveCircle,
    shuffleLayout,
    buyPermPower,
    buyPermMult,
    buyPermDiscount,
    rebirth,
    resetAll,
    setSoundEnabled,
    setBgVariant,
    acknowledgeAchievement,
    pendingAchievement,
    canRebirth,
    boardFull,
    loaded,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const v = useContext(GameContext);
  if (!v) throw new Error("useGame must be used within GameProvider");
  return v;
};
