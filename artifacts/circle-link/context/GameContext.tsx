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
  BASE_RATE_PER_CIRCLE,
  DISCOUNT_PER_LVL,
  EXP_BASE,
  EXP_COST,
  MULT_BONUS_PER_CIRCLE,
  MULT_COST,
  PERM_DISCOUNT_COST,
  PERM_MULT_BONUS,
  PERM_MULT_COST,
  PERM_POWER_BONUS,
  PERM_POWER_COST,
  POWER_BONUS_PER_LVL,
  POWER_COST,
  REBIRTH_GAIN,
  REBIRTH_THRESHOLD,
} from "@/constants/game";

export type CircleType = "normal" | "multiplier" | "exponential";

export type CircleNode = {
  id: string;
  type: CircleType;
  x: number;
  y: number;
};

export type GameState = {
  points: number;
  totalEarnedThisRun: number;
  totalLifetime: number;
  powerLevel: number;
  multiplierCount: number;
  exponentialCount: number;
  circlePoints: number;
  permPower: number;
  permMult: number;
  permDiscount: number;
  rebirthCount: number;
};

const initial: GameState = {
  points: 0,
  totalEarnedThisRun: 0,
  totalLifetime: 0,
  powerLevel: 0,
  multiplierCount: 0,
  exponentialCount: 0,
  circlePoints: 0,
  permPower: 0,
  permMult: 0,
  permDiscount: 0,
  rebirthCount: 0,
};

const STORAGE_KEY = "@circle-link/state-v1";

export type Costs = {
  power: number;
  multiplier: number | null;
  exponential: number | null;
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
  addPoints: (n: number) => void;
  computeRate: (chain: CircleNode[]) => number;
  buyPower: () => boolean;
  buyMultiplierCircle: () => boolean;
  buyExponentialCircle: () => boolean;
  buyPermPower: () => boolean;
  buyPermMult: () => boolean;
  buyPermDiscount: () => boolean;
  rebirth: () => boolean;
  resetAll: () => Promise<void>;
  canRebirth: boolean;
  loaded: boolean;
};

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(initial);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<GameState>;
          setState({ ...initial, ...parsed });
        }
      } catch {
        // ignore corrupted storage
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [state, loaded]);

  const applyDiscount = useCallback((cost: number) => {
    return Math.ceil(
      cost * (1 - stateRef.current.permDiscount * DISCOUNT_PER_LVL),
    );
  }, []);

  const addPoints = useCallback((n: number) => {
    if (n <= 0) return;
    setState((s) => ({
      ...s,
      points: s.points + n,
      totalEarnedThisRun: s.totalEarnedThisRun + n,
      totalLifetime: s.totalLifetime + n,
    }));
  }, []);

  const computeRate = useCallback((chain: CircleNode[]) => {
    if (chain.length < 2) return 0;
    const s = stateRef.current;
    const len = chain.length;
    const multCount = chain.filter((c) => c.type === "multiplier").length;
    const expCount = chain.filter((c) => c.type === "exponential").length;
    const base =
      len *
      BASE_RATE_PER_CIRCLE *
      (1 + s.powerLevel * POWER_BONUS_PER_LVL) *
      (1 + s.permPower * PERM_POWER_BONUS);
    const mult =
      (1 + multCount * MULT_BONUS_PER_CIRCLE) *
      (1 + s.permMult * PERM_MULT_BONUS);
    const exp = Math.pow(EXP_BASE, expCount);
    return base * mult * exp;
  }, []);

  const buyPower = useCallback(() => {
    let ok = false;
    setState((s) => {
      const cost = Math.ceil(
        POWER_COST(s.powerLevel) * (1 - s.permDiscount * DISCOUNT_PER_LVL),
      );
      if (s.points < cost) return s;
      ok = true;
      return { ...s, points: s.points - cost, powerLevel: s.powerLevel + 1 };
    });
    return ok;
  }, []);

  const buyMultiplierCircle = useCallback(() => {
    let ok = false;
    setState((s) => {
      const raw = MULT_COST(s.multiplierCount);
      if (raw === null) return s;
      const cost = Math.ceil(raw * (1 - s.permDiscount * DISCOUNT_PER_LVL));
      if (s.points < cost) return s;
      ok = true;
      return {
        ...s,
        points: s.points - cost,
        multiplierCount: s.multiplierCount + 1,
      };
    });
    return ok;
  }, []);

  const buyExponentialCircle = useCallback(() => {
    let ok = false;
    setState((s) => {
      const raw = EXP_COST(s.exponentialCount);
      if (raw === null) return s;
      const cost = Math.ceil(raw * (1 - s.permDiscount * DISCOUNT_PER_LVL));
      if (s.points < cost) return s;
      ok = true;
      return {
        ...s,
        points: s.points - cost,
        exponentialCount: s.exponentialCount + 1,
      };
    });
    return ok;
  }, []);

  const buyPermPower = useCallback(() => {
    let ok = false;
    setState((s) => {
      const raw = PERM_POWER_COST(s.permPower);
      if (raw === null) return s;
      if (s.circlePoints < raw) return s;
      ok = true;
      return {
        ...s,
        circlePoints: s.circlePoints - raw,
        permPower: s.permPower + 1,
      };
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
      return {
        ...s,
        circlePoints: s.circlePoints - raw,
        permMult: s.permMult + 1,
      };
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
      return {
        ...s,
        circlePoints: s.circlePoints - raw,
        permDiscount: s.permDiscount + 1,
      };
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
      return {
        ...s,
        points: 0,
        totalEarnedThisRun: 0,
        powerLevel: 0,
        multiplierCount: 0,
        exponentialCount: 0,
        circlePoints: s.circlePoints + gain,
        rebirthCount: s.rebirthCount + 1,
      };
    });
    return ok;
  }, []);

  const resetAll = useCallback(async () => {
    setState(initial);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const costs = useMemo<Costs>(
    () => ({
      power: POWER_COST(state.powerLevel),
      multiplier: MULT_COST(state.multiplierCount),
      exponential: EXP_COST(state.exponentialCount),
      permPower: PERM_POWER_COST(state.permPower),
      permMult: PERM_MULT_COST(state.permMult),
      permDiscount: PERM_DISCOUNT_COST(state.permDiscount),
      rebirthThreshold: REBIRTH_THRESHOLD(state.rebirthCount),
      rebirthCpGain: REBIRTH_GAIN(state.totalEarnedThisRun),
    }),
    [state],
  );

  const canRebirth =
    state.totalEarnedThisRun >= costs.rebirthThreshold &&
    costs.rebirthCpGain > 0;

  const value: Ctx = {
    state,
    costs,
    applyDiscount,
    addPoints,
    computeRate,
    buyPower,
    buyMultiplierCircle,
    buyExponentialCircle,
    buyPermPower,
    buyPermMult,
    buyPermDiscount,
    rebirth,
    resetAll,
    canRebirth,
    loaded,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const v = useContext(GameContext);
  if (!v) throw new Error("useGame must be used within GameProvider");
  return v;
};
