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
  ADD_COST,
  DISCOUNT_PER_LVL,
  ENERGY_BONUS_PER_LVL,
  ENERGY_COST,
  EXP_COST,
  MAX_ADD,
  MAX_EXP,
  MAX_MULT,
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
} from "@/constants/game";

export type CircleType = "add" | "mult" | "exp";

export type CircleNode = {
  id: string;
  type: CircleType;
  value: number;
  x?: number;
  y?: number;
  reRollCount: number;
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
};

let idCounter = 0;
function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function makeStartingCircles(): CircleNode[] {
  return [
    { id: newId("add"), type: "add", value: 8, reRollCount: 0 },
    { id: newId("mult"), type: "mult", value: 2, reRollCount: 0 },
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
};

const STORAGE_KEY = "@circle-link/state-v2";

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
  computeRelease: (chain: CircleNode[]) => number;
  releaseChain: (chain: CircleNode[]) => number;
  buyEnergy: () => boolean;
  addCircle: (type: CircleType) => boolean;
  reRollCircle: (id: string) => boolean;
  moveCircle: (id: string, x: number, y: number) => void;
  buyPermPower: () => boolean;
  buyPermMult: () => boolean;
  buyPermDiscount: () => boolean;
  rebirth: () => boolean;
  resetAll: () => Promise<void>;
  canRebirth: boolean;
  loaded: boolean;
};

const GameContext = createContext<Ctx | null>(null);

const randVal = (): number => Math.floor(Math.random() * 10) + 1;

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
          if (
            !parsed.circles ||
            !Array.isArray(parsed.circles) ||
            parsed.circles.length === 0
          ) {
            parsed.circles = makeStartingCircles();
          }
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

  const reRollCostFor = useCallback((circle: CircleNode): number => {
    const base =
      circle.type === "add"
        ? REROLL_COST_ADD(circle.reRollCount)
        : circle.type === "mult"
          ? REROLL_COST_MULT(circle.reRollCount)
          : REROLL_COST_EXP(circle.reRollCount);
    return Math.ceil(
      base * (1 - stateRef.current.permDiscount * DISCOUNT_PER_LVL),
    );
  }, []);

  const computeRelease = useCallback((chain: CircleNode[]): number => {
    if (chain.length < 2) return 0;
    const s = stateRef.current;
    const adds = chain.filter((c) => c.type === "add");
    const mults = chain.filter((c) => c.type === "mult");
    const exps = chain.filter((c) => c.type === "exp");

    let base = adds.reduce((sum, c) => sum + c.value, 0);
    if (base === 0) base = chain.length;

    let result = base;
    for (const c of mults) {
      result *= c.value * (1 + s.permMult * PERM_MULT_BONUS);
    }
    for (const c of exps) {
      result = Math.pow(result, 1 + c.value / 10);
    }

    result *= 1 + s.energyLevel * ENERGY_BONUS_PER_LVL;
    result *= 1 + s.permPower * PERM_POWER_BONUS;
    return Math.floor(result);
  }, []);

  const releaseChain = useCallback(
    (chain: CircleNode[]): number => {
      const earned = computeRelease(chain);
      if (earned > 0) {
        setState((s) => ({
          ...s,
          points: s.points + earned,
          totalEarnedThisRun: s.totalEarnedThisRun + earned,
          totalLifetime: s.totalLifetime + earned,
        }));
      }
      return earned;
    },
    [computeRelease],
  );

  const buyEnergy = useCallback(() => {
    let ok = false;
    setState((s) => {
      const cost = Math.ceil(
        ENERGY_COST(s.energyLevel) * (1 - s.permDiscount * DISCOUNT_PER_LVL),
      );
      if (s.points < cost) return s;
      ok = true;
      return { ...s, points: s.points - cost, energyLevel: s.energyLevel + 1 };
    });
    return ok;
  }, []);

  const addCircle = useCallback((type: CircleType) => {
    let ok = false;
    setState((s) => {
      const count = s.circles.filter((c) => c.type === type).length;
      const max = type === "add" ? MAX_ADD : type === "mult" ? MAX_MULT : MAX_EXP;
      if (count >= max) return s;
      const rawCost =
        type === "add"
          ? ADD_COST(count)
          : type === "mult"
            ? MULT_COST(count)
            : EXP_COST(count);
      const cost = Math.ceil(rawCost * (1 - s.permDiscount * DISCOUNT_PER_LVL));
      if (s.points < cost) return s;
      ok = true;
      return {
        ...s,
        points: s.points - cost,
        circles: [
          ...s.circles,
          {
            id: newId(type),
            type,
            value: randVal(),
            reRollCount: 0,
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
      return {
        ...s,
        points: s.points - cost,
        circles: s.circles.map((c) =>
          c.id === id
            ? { ...c, value: randVal(), reRollCount: c.reRollCount + 1 }
            : c,
        ),
      };
    });
    return ok;
  }, []);

  const moveCircle = useCallback((id: string, x: number, y: number) => {
    setState((s) => {
      const target = s.circles.find((c) => c.id === id);
      if (!target) return s;
      if (target.x === x && target.y === y) return s;
      return {
        ...s,
        circles: s.circles.map((c) => (c.id === id ? { ...c, x, y } : c)),
      };
    });
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
        energyLevel: 0,
        circles: makeStartingCircles(),
        circlePoints: s.circlePoints + gain,
        rebirthCount: s.rebirthCount + 1,
      };
    });
    return ok;
  }, []);

  const resetAll = useCallback(async () => {
    setState({ ...initial, circles: makeStartingCircles() });
    await AsyncStorage.removeItem(STORAGE_KEY);
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
    state.totalEarnedThisRun >= costs.rebirthThreshold &&
    costs.rebirthCpGain > 0;

  const value: Ctx = {
    state,
    costs,
    applyDiscount,
    reRollCostFor,
    computeRelease,
    releaseChain,
    buyEnergy,
    addCircle,
    reRollCircle,
    moveCircle,
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
