import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const SLOT_KEY = (slot: number) => `@circle-link/slot-${slot}`;
const GLOBAL_STATS_KEY = "@circle-link/global-stats";

export type SaveSlotMeta = {
  slot: 0 | 1 | 2;
  exists: boolean;
  rebirthCount: number;
  totalLifetime: number;
  lastPlayed: number;
  hasWon: boolean;
};

export type WinRecord = {
  slot: number;
  slotLabel: string;
  date: string;
  totalLifetime: number;
  rebirthCount: number;
};

export type GlobalStats = {
  wins: WinRecord[];
};

type SaveCtx = {
  activeSlot: number | null;
  slotKey: string | null;
  slots: SaveSlotMeta[];
  globalStats: GlobalStats;
  selectSlot: (slot: 0 | 1 | 2) => void;
  deleteSlot: (slot: 0 | 1 | 2) => Promise<void>;
  recordWin: (record: Omit<WinRecord, "slotLabel">) => Promise<void>;
  exitToMenu: () => void;
  refreshSlots: () => Promise<void>;
};

const SaveCtxRef = createContext<SaveCtx | null>(null);

export function useSave() {
  const ctx = useContext(SaveCtxRef);
  if (!ctx) throw new Error("useSave outside SaveProvider");
  return ctx;
}

function emptyMeta(slot: 0 | 1 | 2): SaveSlotMeta {
  return { slot, exists: false, rebirthCount: 0, totalLifetime: 0, lastPlayed: 0, hasWon: false };
}

async function readSlotMeta(slot: 0 | 1 | 2): Promise<SaveSlotMeta> {
  try {
    const raw = await AsyncStorage.getItem(SLOT_KEY(slot));
    if (!raw) return emptyMeta(slot);
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      slot,
      exists: true,
      rebirthCount: (parsed.rebirthCount as number) ?? 0,
      totalLifetime: (parsed.totalLifetime as number) ?? 0,
      lastPlayed: (parsed.lastPlayed as number) ?? 0,
      hasWon: (parsed.hasWon as boolean) ?? false,
    };
  } catch {
    return emptyMeta(slot);
  }
}

export function SaveProvider({ children }: { children: React.ReactNode }) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [slots, setSlots] = useState<SaveSlotMeta[]>([
    emptyMeta(0), emptyMeta(1), emptyMeta(2),
  ]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ wins: [] });

  const refreshSlots = useCallback(async () => {
    const [s0, s1, s2] = await Promise.all([
      readSlotMeta(0), readSlotMeta(1), readSlotMeta(2),
    ]);
    setSlots([s0, s1, s2]);
  }, []);

  useEffect(() => {
    (async () => {
      await refreshSlots();
      try {
        const raw = await AsyncStorage.getItem(GLOBAL_STATS_KEY);
        if (raw) setGlobalStats(JSON.parse(raw));
      } catch {}
    })();
  }, [refreshSlots]);

  const selectSlot = useCallback((slot: 0 | 1 | 2) => {
    setActiveSlot(slot);
  }, []);

  const deleteSlot = useCallback(async (slot: 0 | 1 | 2) => {
    await AsyncStorage.removeItem(SLOT_KEY(slot));
    setSlots(prev => {
      const next = [...prev] as SaveSlotMeta[];
      next[slot] = emptyMeta(slot);
      return next;
    });
  }, []);

  const recordWin = useCallback(async (record: Omit<WinRecord, "slotLabel">) => {
    const slotLabel = `Save ${record.slot + 1}`;
    const full: WinRecord = { ...record, slotLabel };
    const next: GlobalStats = { wins: [...globalStats.wins, full] };
    setGlobalStats(next);
    await AsyncStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(next));
    await refreshSlots();
  }, [globalStats, refreshSlots]);

  const exitToMenu = useCallback(() => {
    setActiveSlot(null);
    refreshSlots();
  }, [refreshSlots]);

  const slotKey = activeSlot !== null ? SLOT_KEY(activeSlot) : null;

  return (
    <SaveCtxRef.Provider value={{
      activeSlot,
      slotKey,
      slots,
      globalStats,
      selectSlot,
      deleteSlot,
      recordWin,
      exitToMenu,
      refreshSlots,
    }}>
      {children}
    </SaveCtxRef.Provider>
  );
}
