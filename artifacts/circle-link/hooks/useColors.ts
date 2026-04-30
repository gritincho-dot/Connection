import { useContext } from "react";

import { GameContext } from "@/context/GameContext";
import { DEFAULT_BG, PALETTES, type Palette } from "@/lib/theme";

const RADIUS = 14;

export function useColors(): Palette & { radius: number } {
  const game = useContext(GameContext);
  const variant = game?.state.settings.bgVariant ?? DEFAULT_BG;
  const palette = PALETTES[variant] ?? PALETTES[DEFAULT_BG];
  return { ...palette, radius: RADIUS };
}
