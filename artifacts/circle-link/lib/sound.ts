import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

const sources = {
  tick: require("@/assets/sounds/tick.wav"),
  pop: require("@/assets/sounds/pop.wav"),
  chaching: require("@/assets/sounds/chaching.wav"),
  ding: require("@/assets/sounds/ding.wav"),
  buzz: require("@/assets/sounds/buzz.wav"),
  whoosh: require("@/assets/sounds/whoosh.wav"),
  chime: require("@/assets/sounds/chime.wav"),
};

export type SoundName = keyof typeof sources;

type Ctx = {
  play: (name: SoundName, rate?: number) => void;
};

const SoundContext = createContext<Ctx>({ play: () => {} });

export function SoundProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  const players = useRef<Partial<Record<SoundName, AudioPlayer>>>({});
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    (Object.keys(sources) as SoundName[]).forEach((name) => {
      try {
        const p = createAudioPlayer(sources[name]);
        players.current[name] = p;
      } catch {
        // ignore (e.g., env without audio)
      }
    });
    return () => {
      Object.values(players.current).forEach((p) => {
        try {
          (p as AudioPlayer | undefined)?.release();
        } catch {}
      });
      players.current = {};
    };
  }, []);

  const play = useCallback((name: SoundName, rate = 1) => {
    if (!enabledRef.current) return;
    const p = players.current[name];
    if (!p) return;
    try {
      p.seekTo(0);
      p.playbackRate = Math.max(0.5, Math.min(2.5, rate));
      p.play();
    } catch {
      // ignore play errors
    }
  }, []);

  const value = useMemo<Ctx>(() => ({ play }), [play]);

  return React.createElement(SoundContext.Provider, { value }, children);
}

export const useSound = () => useContext(SoundContext);
