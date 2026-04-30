export type BgVariant = "white" | "gray" | "black";

export type Palette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  text: string;
  tint: string;
  secondary: string;
  secondaryForeground: string;
  input: string;
  // board-specific
  boardBg: string;
  chainLine: string;
  circleFill: string;
  // status bar style
  statusBarStyle: "dark" | "light";
};

const BASE_BORDER_OPACITY = 0.12;

export const PALETTES: Record<BgVariant, Palette> = {
  white: {
    background: "#fafaf7",
    foreground: "#1a1714",
    card: "#ffffff",
    cardForeground: "#1a1714",
    border: "#e5e2d6",
    muted: "#f0ede4",
    mutedForeground: "#7a7159",
    primary: "#0f766e",
    primaryForeground: "#ffffff",
    accent: "#9333ea",
    accentForeground: "#ffffff",
    destructive: "#dc2626",
    destructiveForeground: "#ffffff",
    text: "#1a1714",
    tint: "#0f766e",
    secondary: "#f0ede4",
    secondaryForeground: "#1a1714",
    input: "#e5e2d6",
    boardBg: "#fafaf7",
    chainLine: "#3a3528",
    circleFill: "#ffffff",
    statusBarStyle: "dark",
  },
  gray: {
    background: "#cdc8b8",
    foreground: "#1a1714",
    card: "#e3dfd0",
    cardForeground: "#1a1714",
    border: "#a8a290",
    muted: "#bcb6a3",
    mutedForeground: "#5a5446",
    primary: "#0f766e",
    primaryForeground: "#ffffff",
    accent: "#7e22ce",
    accentForeground: "#ffffff",
    destructive: "#b91c1c",
    destructiveForeground: "#ffffff",
    text: "#1a1714",
    tint: "#0f766e",
    secondary: "#bcb6a3",
    secondaryForeground: "#1a1714",
    input: "#a8a290",
    boardBg: "#cdc8b8",
    chainLine: "#2a261c",
    circleFill: "#f5f1e2",
    statusBarStyle: "dark",
  },
  black: {
    background: "#15120e",
    foreground: "#f4f0e0",
    card: "#26221a",
    cardForeground: "#f4f0e0",
    border: "#3a3328",
    muted: "#1f1c15",
    mutedForeground: "#9b9682",
    primary: "#2dd4bf",
    primaryForeground: "#0c1816",
    accent: "#c084fc",
    accentForeground: "#1a1714",
    destructive: "#f87171",
    destructiveForeground: "#1a1714",
    text: "#f4f0e0",
    tint: "#2dd4bf",
    secondary: "#26221a",
    secondaryForeground: "#f4f0e0",
    input: "#3a3328",
    boardBg: "#15120e",
    chainLine: "#f4f0e0",
    circleFill: "#26221a",
    statusBarStyle: "light",
  },
};

export const DEFAULT_BG: BgVariant = "white";
export const _BORDER_OPACITY = BASE_BORDER_OPACITY;
