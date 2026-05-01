import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle as SvgCircle,
  Line,
} from "react-native-svg";

import {
  CIRCLE_TTL_MS,
  EXP_VALUE_DIVISOR,
  MULT_EXHAUST_MS,
} from "@/constants/game";
import {
  type CircleNode,
  type CircleType,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";
import { useSound } from "@/lib/sound";

const CIRCLE_RADIUS = 32;
const HIT_RADIUS = 44;
const MARGIN = 48;
const REMOVE_HIT = 18; // radius for the "×" remove target in layout mode

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;

export type Mode = "play" | "layout" | "upgrade";

type Props = {
  mode: Mode;
  onShuffle?: () => void;
  scale: Animated.Value;
  scaleRef: React.MutableRefObject<number>;
};

// Base colors by type (non-corrupted)
const colorForType = (type: CircleType): string => {
  if (type === "add") return "#16a34a";
  if (type === "mult") return "#9333ea";
  return "#ea580c";
};

const corruptedColorForType = (type: CircleType): string => {
  if (type === "add") return "#dc2626";
  if (type === "mult") return "#7c3aed";
  return "#b45309";
};

const labelFor = (c: CircleNode): string => {
  if (c.type === "add") return `${c.corrupted ? "⚠" : "+"}${c.value}`;
  if (c.type === "mult") return `${c.corrupted ? "⚠" : "×"}${c.value}`;
  return `^${c.value}`;
};

const opLabel = (c: CircleNode): string => {
  if (c.type === "add") return `+${c.value}`;
  if (c.type === "mult") return `×${c.value}`;
  return `^${(1 + c.value / EXP_VALUE_DIVISOR).toFixed(2)}`;
};

const triggerHaptic = (
  style: "light" | "select" | "heavy" | "warn" | "success" = "light",
) => {
  if (Platform.OS === "web") return;
  if (style === "light")
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else if (style === "heavy")
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  else if (style === "warn")
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  else if (style === "success")
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
};

function randomSpot(w: number, h: number): { x: number; y: number } {
  return {
    x: MARGIN + Math.random() * (w - MARGIN * 2),
    y: MARGIN + Math.random() * (h - MARGIN * 2),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function isExhausted(c: CircleNode): boolean {
  return c.exhaustedUntil !== null && Date.now() < c.exhaustedUntil;
}

type Particle = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  anim: Animated.Value;
};

let particleId = 0;

export function GameBoard({ mode, scale, scaleRef }: Props) {
  const colors = useColors();
  const sound = useSound();
  const {
    state,
    computeRelease,
    computeReleaseStepwise,
    releaseChain,
    moveCircle,
    reRollCircle,
    cleanseCircle,
    removeCircle,
    reRollCostFor,
    cleanseCostFor,
  } = useGame();

  // Tick every 500ms so expiry arcs and exhaust timers stay current
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  const [boardSize, setBoardSize] = useState<{ w: number; h: number } | null>(null);
  const initializedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!boardSize) return;
    const { w, h } = boardSize;
    for (const c of state.circles) {
      const unplaced = c.x === undefined || c.y === undefined;
      const outOfBounds =
        !unplaced &&
        (c.x! < MARGIN || c.x! > w - MARGIN || c.y! < MARGIN || c.y! > h - MARGIN);
      if (!unplaced && !outOfBounds) continue;
      initializedIds.current.add(c.id);
      const pos = randomSpot(w, h);
      moveCircle(c.id, pos.x, pos.y);
    }
  }, [state.circles, boardSize, moveCircle]);

  useEffect(() => {
    const live = new Set(state.circles.map((c) => c.id));
    initializedIds.current.forEach((id) => {
      if (!live.has(id)) initializedIds.current.delete(id);
    });
  }, [state.circles]);

  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize((cur) =>
      cur && cur.w === width && cur.h === height ? cur : { w: width, h: height },
    );
  }, []);

  // Chain state
  const [chain, setChain] = useState<CircleNode[]>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const chainRef = useRef(chain);
  chainRef.current = chain;
  const circlesRef = useRef(state.circles);
  circlesRef.current = state.circles;

  // Drag in layout mode
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // Tap tracking for upgrade mode
  const tapStartRef = useRef<{ x: number; y: number; circleId: string } | null>(null);

  // Pinch tracking
  const pinchInit = useRef<{ dist: number; startScale: number } | null>(null);
  const isPinchingRef = useRef(false);

  // Earn animation
  const earnAnim = useRef(new Animated.Value(0)).current;
  const [earnState, setEarnState] = useState<{ amount: number; crit: boolean } | null>(null);

  // Crit flash
  const critFlash = useRef(new Animated.Value(0)).current;

  // Combo bump
  const comboBumpAnim = useRef(new Animated.Value(0)).current;

  // Chain reaction banner
  const chainReactAnim = useRef(new Animated.Value(0)).current;
  const [chainReactBonus, setChainReactBonus] = useState(0);
  const triggerChainReact = useCallback((bonus: number) => {
    setChainReactBonus(bonus);
    chainReactAnim.setValue(0);
    Animated.sequence([
      Animated.spring(chainReactAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(chainReactAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [chainReactAnim]);

  // Exp AOE flash
  const expFlash = useRef(new Animated.Value(0)).current;
  const triggerExpFlash = useCallback(() => {
    expFlash.setValue(0);
    Animated.sequence([
      Animated.timing(expFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(expFlash, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [expFlash]);

  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const spawnParticles = useCallback(
    (cx: number, cy: number, color: string, count = 14) => {
      const newOnes: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 80;
        newOnes.push({
          id: particleId++,
          x: cx,
          y: cy,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          color,
          anim: new Animated.Value(0),
        });
      }
      setParticles((prev) => [...prev, ...newOnes]);
      newOnes.forEach((p) => {
        Animated.timing(p.anim, { toValue: 1, duration: 800, useNativeDriver: true }).start(
          () => { setParticles((prev) => prev.filter((x) => x.id !== p.id)); },
        );
      });
    },
    [],
  );

  // Per-circle pop animations
  const popAnims = useRef<Map<string, Animated.Value>>(new Map());
  const popCircle = useCallback((id: string) => {
    let v = popAnims.current.get(id);
    if (!v) {
      v = new Animated.Value(0);
      popAnims.current.set(id, v);
    }
    v.stopAnimation();
    v.setValue(0);
    Animated.spring(v, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, []);

  const flashEarning = useCallback(
    (amount: number, crit: boolean) => {
      setEarnState({ amount, crit });
      earnAnim.setValue(0);
      Animated.timing(earnAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
      if (crit) {
        critFlash.setValue(0);
        Animated.sequence([
          Animated.timing(critFlash, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(critFlash, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
      }
    },
    [earnAnim, critFlash],
  );

  const findCircleAt = useCallback(
    (x: number, y: number): CircleNode | null => {
      const w = boardSize?.w ?? 0;
      const h = boardSize?.h ?? 0;
      const s = scaleRef.current;
      const lx = (x - w / 2) / s + w / 2;
      const ly = (y - h / 2) / s + h / 2;
      const r = HIT_RADIUS;
      for (const c of circlesRef.current) {
        if (c.x === undefined || c.y === undefined) continue;
        const dx = lx - c.x;
        const dy = ly - c.y;
        if (dx * dx + dy * dy <= r * r) return c;
      }
      return null;
    },
    [boardSize, scaleRef],
  );

  // Check if a touch is near the remove "×" button of a circle (layout mode)
  const findRemoveTargetAt = useCallback(
    (x: number, y: number): CircleNode | null => {
      const w = boardSize?.w ?? 0;
      const h = boardSize?.h ?? 0;
      const s = scaleRef.current;
      const lx = (x - w / 2) / s + w / 2;
      const ly = (y - h / 2) / s + h / 2;
      for (const c of circlesRef.current) {
        if (c.x === undefined || c.y === undefined) continue;
        // "×" button is top-right of circle
        const bx = c.x + CIRCLE_RADIUS * 0.75;
        const by = c.y - CIRCLE_RADIUS * 0.75;
        const dx = lx - bx;
        const dy = ly - by;
        if (dx * dx + dy * dy <= REMOVE_HIT * REMOVE_HIT) return c;
      }
      return null;
    },
    [boardSize, scaleRef],
  );

  const handlePinch = useCallback(
    (touches: { pageX: number; pageY: number }[]): boolean => {
      if (touches.length < 2) {
        if (isPinchingRef.current) {
          isPinchingRef.current = false;
          pinchInit.current = null;
        }
        return false;
      }
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
      if (!pinchInit.current) {
        pinchInit.current = { dist, startScale: scaleRef.current };
        isPinchingRef.current = true;
        return true;
      }
      const ratio = dist / pinchInit.current.dist;
      const newScale = clamp(pinchInit.current.startScale * ratio, MIN_SCALE, MAX_SCALE);
      scaleRef.current = newScale;
      scale.setValue(newScale);
      return true;
    },
    [scale, scaleRef],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) { handlePinch(touches); return; }
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;

          if (mode === "layout") {
            // Check if touching a remove "×" button
            const removeTarget = findRemoveTargetAt(x, y);
            if (removeTarget) {
              triggerHaptic("warn");
              sound.play("buzz", 1.1);
              removeCircle(removeTarget.id);
              return;
            }
            const hit = findCircleAt(x, y);
            if (hit && hit.x !== undefined && hit.y !== undefined) {
              setDrag({ id: hit.id, x: hit.x, y: hit.y });
              triggerHaptic("light");
              sound.play("tick", 1.2);
            }
            return;
          }

          if (mode === "upgrade") {
            const hit = findCircleAt(x, y);
            if (hit) tapStartRef.current = { x, y, circleId: hit.id };
            return;
          }

          // play mode
          setPointer({ x, y });
          const hit = findCircleAt(x, y);
          if (hit && !isExhausted(hit)) {
            setChain([hit]);
            popCircle(hit.id);
            triggerHaptic("light");
            sound.play("tick", 1.0);
          } else {
            setChain([]);
          }
        },

        onPanResponderMove: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) { handlePinch(touches); return; }
          if (isPinchingRef.current) return;
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;

          if (mode === "layout") {
            const cur = dragRef.current;
            if (!cur || !boardSize) return;
            const w = boardSize.w;
            const h = boardSize.h;
            const s = scaleRef.current;
            const lx = (x - w / 2) / s + w / 2;
            const ly = (y - h / 2) / s + h / 2;
            setDrag({ id: cur.id, x: clamp(lx, MARGIN, w - MARGIN), y: clamp(ly, MARGIN, h - MARGIN) });
            return;
          }

          if (mode === "upgrade") {
            const start = tapStartRef.current;
            if (start) {
              const moved = Math.hypot(x - start.x, y - start.y);
              if (moved > 18) tapStartRef.current = null;
            }
            return;
          }

          // play mode
          setPointer({ x, y });
          const hit = findCircleAt(x, y);
          if (!hit) return;
          const current = chainRef.current;
          if (current.length === 0) {
            if (!isExhausted(hit)) {
              setChain([hit]);
              popCircle(hit.id);
              triggerHaptic("light");
              sound.play("tick", 1.0);
            }
            return;
          }
          const last = current[current.length - 1];
          if (last.id === hit.id) return;
          if (current.length >= 2 && current[current.length - 2].id === hit.id) {
            setChain(current.slice(0, -1));
            triggerHaptic("select");
            sound.play("tick", 0.85);
            return;
          }
          if (current.some((c) => c.id === hit.id)) return;
          // Don't add exhausted circles to chain
          if (isExhausted(hit)) return;
          const next = [...current, hit];
          setChain(next);
          popCircle(hit.id);
          triggerHaptic("light");
          const pitch = 0.9 + Math.min(0.8, (next.length - 1) * 0.12);
          sound.play("tick", pitch);
        },

        onPanResponderRelease: (evt) => {
          if (isPinchingRef.current) {
            const touches = evt.nativeEvent.touches;
            if (touches.length < 2) { isPinchingRef.current = false; pinchInit.current = null; }
            return;
          }

          if (mode === "layout") {
            const cur = dragRef.current;
            if (cur) { moveCircle(cur.id, cur.x, cur.y); setDrag(null); sound.play("pop", 1.1); }
            return;
          }

          if (mode === "upgrade") {
            const start = tapStartRef.current;
            tapStartRef.current = null;
            if (!start) return;
            const x = evt.nativeEvent.locationX;
            const y = evt.nativeEvent.locationY;
            const hit = findCircleAt(x, y);
            if (!hit || hit.id !== start.circleId) return;

            if (hit.corrupted) {
              // Tapping a corrupted circle cleanses it
              const ok = cleanseCircle(hit.id);
              if (ok) {
                triggerHaptic("success");
                sound.play("chime", 1.1);
                popCircle(hit.id);
                if (hit.x !== undefined && hit.y !== undefined)
                  spawnParticles(hit.x, hit.y, "#22d3ee", 14);
              } else {
                triggerHaptic("warn");
                sound.play("buzz", 1.0);
              }
            } else {
              const ok = reRollCircle(hit.id);
              if (ok) {
                triggerHaptic("heavy");
                sound.play("whoosh", 1.0);
                popCircle(hit.id);
                if (hit.x !== undefined && hit.y !== undefined)
                  spawnParticles(hit.x, hit.y, colorForType(hit.type), 10);
              } else {
                triggerHaptic("warn");
                sound.play("buzz", 1.0);
              }
            }
            return;
          }

          // play mode release
          const cur = chainRef.current;
          if (cur.length >= 2) {
            const info = releaseChain(cur);
            if (info.earned > 0) {
              flashEarning(info.earned, info.crit);
              triggerHaptic(info.crit ? "success" : "heavy");
              sound.play("pop", 0.9);
              const pitch = clamp(0.8 + Math.log10(info.earned + 1) * 0.12, 0.8, 1.8);
              setTimeout(() => sound.play("chaching", pitch), 80);
              if (info.crit) setTimeout(() => sound.play("chime", 1.2), 200);

              // Exp AOE flash
              if (info.expAOE) {
                triggerExpFlash();
                setTimeout(() => sound.play("chime", 0.8), 50);
              }

              // Chain reaction banner
              if (info.chainReaction) {
                triggerChainReact(info.chainReactionBonus);
                setTimeout(() => sound.play("chime", 1.4), 200);
              }

              cur.forEach((c) => {
                if (c.x !== undefined && c.y !== undefined) {
                  spawnParticles(
                    c.x,
                    c.y,
                    info.crit ? "#facc15" : info.expAOE && c.type === "add" ? "#f97316" : colorForType(c.type),
                    info.crit ? 18 : info.expAOE && c.type === "add" ? 22 : 10,
                  );
                }
              });

              if (info.comboCount > 1) {
                comboBumpAnim.setValue(0);
                Animated.spring(comboBumpAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
              }
            }
          }
          setPointer(null);
          setChain([]);
        },

        onPanResponderTerminate: () => {
          setPointer(null);
          setChain([]);
          setDrag(null);
          tapStartRef.current = null;
          isPinchingRef.current = false;
          pinchInit.current = null;
        },
      }),
    [
      mode,
      findCircleAt,
      findRemoveTargetAt,
      boardSize,
      moveCircle,
      reRollCircle,
      cleanseCircle,
      removeCircle,
      releaseChain,
      flashEarning,
      triggerExpFlash,
      triggerChainReact,
      sound,
      handlePinch,
      popCircle,
      spawnParticles,
      comboBumpAnim,
      scaleRef,
    ],
  );

  useEffect(() => {
    setChain([]);
    setPointer(null);
    setDrag(null);
    tapStartRef.current = null;
  }, [mode]);

  const liveRate = chain.length >= 2 ? computeRelease(chain) : 0;
  const stepwise = chain.length >= 2 ? computeReleaseStepwise(chain) : [];

  const formulaPreview = useMemo(() => {
    if (chain.length < 2) return "";
    const parts: string[] = [String(chain[0].value)];
    for (let i = 1; i < chain.length; i++) {
      const c = chain[i];
      parts.push(c.corrupted ? `⚠${opLabel(c)}` : opLabel(c));
    }
    return parts.join(" ");
  }, [chain]);

  const renderPos = useCallback(
    (c: CircleNode): { x: number; y: number } | null => {
      if (drag && drag.id === c.id) return { x: drag.x, y: drag.y };
      if (c.x === undefined || c.y === undefined) return null;
      return { x: c.x, y: c.y };
    },
    [drag],
  );

  const w = boardSize?.w ?? 0;
  const h = boardSize?.h ?? 0;
  const now = Date.now(); // stable within a render frame

  return (
    <View style={[styles.boardWrap, { backgroundColor: colors.boardBg }]} onLayout={onBoardLayout}>
      {boardSize ? (
        <View {...panResponder.panHandlers} style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}>
          <Animated.View
            style={[{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: [{ scale }] }]}
          >
            <Svg width={w} height={h}>
              {/* Chain lines */}
              {chain.map((c, i) => {
                if (i === 0) return null;
                const prev = chain[i - 1];
                const a = renderPos(prev);
                const b = renderPos(c);
                if (!a || !b) return null;
                return (
                  <Line
                    key={`line-${i}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={colors.chainLine}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray="8,6"
                  />
                );
              })}

              {/* Live pointer line */}
              {pointer && chain.length > 0 ? (() => {
                const last = chain[chain.length - 1];
                const a = renderPos(last);
                if (!a) return null;
                const sV = scaleRef.current;
                const px = (pointer.x - w / 2) / sV + w / 2;
                const py = (pointer.y - h / 2) / sV + h / 2;
                return (
                  <Line
                    x1={a.x} y1={a.y} x2={px} y2={py}
                    stroke={colors.chainLine}
                    strokeWidth={3}
                    strokeOpacity={0.4}
                    strokeLinecap="round"
                    strokeDasharray="4,5"
                  />
                );
              })() : null}

              {/* Circles */}
              {state.circles.map((c) => {
                const pos = renderPos(c);
                if (!pos) return null;
                const inChain = chain.some((cc) => cc.id === c.id);
                const exhausted = isExhausted(c);
                const stroke = c.corrupted ? corruptedColorForType(c.type) : colorForType(c.type);
                const isDragging = drag?.id === c.id;
                const masteryStroke = Math.min(3, c.reRollCount * 0.15);

                // Expiry arc
                let expiryArc: React.ReactNode = null;
                if (c.expiresAt !== null) {
                  const remaining = Math.max(0, c.expiresAt - now);
                  const pct = remaining / CIRCLE_TTL_MS;
                  const circumference = 2 * Math.PI * CIRCLE_RADIUS;
                  const arcColor =
                    pct < 0.2 ? "#ef4444" : pct < 0.45 ? "#f97316" : "#facc15";
                  expiryArc = (
                    <SvgCircle
                      key={`exp-${c.id}`}
                      cx={pos.x}
                      cy={pos.y}
                      r={CIRCLE_RADIUS + 6}
                      fill="none"
                      stroke={arcColor}
                      strokeWidth={3}
                      strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
                      strokeLinecap="round"
                      transform={`rotate(-90, ${pos.x}, ${pos.y})`}
                      opacity={pct < 0.35 ? 1 : 0.6}
                    />
                  );
                }

                return (
                  <React.Fragment key={c.id}>
                    {expiryArc}

                    {/* In-chain halo */}
                    {(inChain || isDragging) ? (
                      <SvgCircle
                        cx={pos.x} cy={pos.y} r={CIRCLE_RADIUS + 10}
                        fill={stroke} fillOpacity={0.18}
                      />
                    ) : null}

                    {/* Main circle */}
                    <SvgCircle
                      cx={pos.x} cy={pos.y} r={CIRCLE_RADIUS}
                      fill={
                        exhausted
                          ? colors.muted
                          : inChain
                            ? stroke
                            : c.corrupted
                              ? `${stroke}33`
                              : colors.circleFill
                      }
                      stroke={exhausted ? colors.border : stroke}
                      strokeWidth={(inChain ? 4 : 3) + masteryStroke}
                      strokeDasharray={c.corrupted && !inChain ? "5,3" : undefined}
                      opacity={exhausted ? 0.55 : 1}
                    />

                    {/* Particles (rendered elsewhere) */}
                  </React.Fragment>
                );
              })}

              {/* Particles */}
              {particles.map((p) => (
                <ParticleDot key={p.id} p={p} />
              ))}
            </Svg>

            {/* ── Labels overlay ─────────────────────────────────────────────── */}
            {state.circles.map((c) => {
              const pos = renderPos(c);
              if (!pos) return null;
              const inChain = chain.some((cc) => cc.id === c.id);
              const exhausted = isExhausted(c);
              const popVal = popAnims.current.get(c.id);
              const popScale = popVal
                ? popVal.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] })
                : 1;
              const stepIndex = chain.findIndex((cc) => cc.id === c.id);
              const runningTotal =
                stepIndex >= 0 && stepIndex < stepwise.length
                  ? Math.floor(stepwise[stepIndex])
                  : null;
              const stroke = c.corrupted ? corruptedColorForType(c.type) : colorForType(c.type);

              // Exhaustion countdown (seconds remaining)
              const exhaustLeft =
                exhausted && c.exhaustedUntil !== null
                  ? Math.ceil((c.exhaustedUntil - now) / 1000)
                  : null;

              return (
                <React.Fragment key={`lbl-${c.id}`}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.labelWrap,
                      { left: pos.x - 32, top: pos.y - 13, transform: [{ scale: popScale }] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.circleLabel,
                        { color: exhausted ? colors.mutedForeground : inChain ? "#ffffff" : stroke },
                      ]}
                    >
                      {exhausted ? "💤" : labelFor(c)}
                    </Text>
                  </Animated.View>

                  {/* Reroll badge */}
                  {c.reRollCount > 0 && mode === "upgrade" && !c.corrupted ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.reRollBadge,
                        { left: pos.x + 18, top: pos.y - CIRCLE_RADIUS - 6, backgroundColor: colors.foreground },
                      ]}
                    >
                      <Text style={[styles.reRollBadgeText, { color: colors.background }]}>
                        {c.reRollCount}
                      </Text>
                    </View>
                  ) : null}

                  {/* Corruption badge */}
                  {c.corrupted ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.reRollBadge,
                        { left: pos.x + 18, top: pos.y - CIRCLE_RADIUS - 6, backgroundColor: "#dc2626" },
                      ]}
                    >
                      <Text style={[styles.reRollBadgeText, { color: "#ffffff" }]}>!</Text>
                    </View>
                  ) : null}

                  {/* Running total during chain */}
                  {inChain && runningTotal !== null && stepIndex > 0 ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.runningTotal,
                        { left: pos.x - 36, top: pos.y + CIRCLE_RADIUS + 6, backgroundColor: colors.foreground },
                      ]}
                    >
                      <Text style={[styles.runningTotalText, { color: colors.background }]}>
                        ={formatNum(runningTotal)}
                      </Text>
                    </View>
                  ) : null}

                  {/* Exhaustion countdown */}
                  {exhaustLeft !== null ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.runningTotal,
                        { left: pos.x - 24, top: pos.y + CIRCLE_RADIUS + 6, backgroundColor: colors.muted, width: 48 },
                      ]}
                    >
                      <Text style={[styles.runningTotalText, { color: colors.mutedForeground }]}>
                        {exhaustLeft}s
                      </Text>
                    </View>
                  ) : null}

                  {/* Remove "×" button in layout mode */}
                  {mode === "layout" ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.removeBtn,
                        {
                          left: pos.x + CIRCLE_RADIUS * 0.75 - 9,
                          top: pos.y - CIRCLE_RADIUS * 0.75 - 9,
                          backgroundColor: "#dc2626",
                        },
                      ]}
                    >
                      <Text style={styles.removeBtnText}>×</Text>
                    </View>
                  ) : null}
                </React.Fragment>
              );
            })}
          </Animated.View>

          {/* ── Upgrade mode cost badges (screen space) ──────────────────────── */}
          {mode === "upgrade"
            ? state.circles.map((c) => {
                const pos = renderPos(c);
                if (!pos) return null;
                const sV = scaleRef.current;
                const sx = (pos.x - w / 2) * sV + w / 2;
                const sy = (pos.y - h / 2) * sV + h / 2;
                const cost = c.corrupted ? cleanseCostFor(c) : reRollCostFor(c);
                const affordable = state.points >= cost;
                const isCleanse = c.corrupted;
                return (
                  <View
                    key={`cost-${c.id}`}
                    pointerEvents="none"
                    style={[
                      styles.costBadge,
                      {
                        left: sx - 36,
                        top: sy - CIRCLE_RADIUS * sV - 28,
                        backgroundColor: isCleanse
                          ? affordable ? "#dc2626" : colors.muted
                          : affordable ? colors.foreground : colors.muted,
                        borderColor: isCleanse ? "#dc2626" : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.costBadgeText,
                        { color: affordable ? (isCleanse ? "#ffffff" : colors.background) : colors.mutedForeground },
                      ]}
                    >
                      {isCleanse ? `cleanse` : formatNum(cost)}
                    </Text>
                  </View>
                );
              })
            : null}

          {/* ── Exp AOE flash ─────────────────────────────────────────────────── */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#f97316",
                opacity: expFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
              },
            ]}
          />

          {/* ── Critical flash ────────────────────────────────────────────────── */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#facc15",
                opacity: critFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
              },
            ]}
          />

          {/* ── Chain reaction banner ─────────────────────────────────────────── */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.chainReactBanner,
              {
                opacity: chainReactAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  {
                    scale: chainReactAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.7, 1.05, 1] }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.chainReactText}>⚡ CHAIN REACTION!</Text>
            {chainReactBonus > 0 ? (
              <Text style={styles.chainReactSub}>+{formatNum(chainReactBonus)} bonus</Text>
            ) : null}
          </Animated.View>

          {/* ── Live release preview ──────────────────────────────────────────── */}
          {mode === "play" && liveRate > 0 ? (
            <View pointerEvents="none" style={styles.liveBadge}>
              <View style={[styles.liveBadgeInner, { backgroundColor: colors.foreground }]}>
                <Text style={[styles.formulaText, { color: colors.background }]}>
                  {formulaPreview} = {formatNum(liveRate)}
                  {chain.some((c) => c.type === "exp") ? " 💥" : ""}
                  {chain.some((c) => c.corrupted) ? " ⚠" : ""}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── Earned float text ─────────────────────────────────────────────── */}
          {earnState ? (
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.earnText,
                {
                  color: earnState.crit ? "#facc15" : "#16a34a",
                  opacity: earnAnim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [
                    { translateY: earnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
                    { scale: earnAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.1, 1] }) },
                  ],
                  top: h / 2 - 20,
                  width: w,
                },
              ]}
            >
              {earnState.crit ? "CRIT! " : ""}+{formatNum(earnState.amount)}
            </Animated.Text>
          ) : null}
        </View>
      ) : null}

      {/* ── Mode hint ─────────────────────────────────────────────────────────── */}
      <View pointerEvents="none" style={styles.modeHintWrap}>
        <View style={[styles.modeHint, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.modeHintText, { color: colors.mutedForeground }]}>
            {mode === "layout"
              ? "Drag to move • Tap × to remove • Pinch to zoom"
              : mode === "upgrade"
                ? "Tap to re-roll • Tap ⚠ circles to cleanse"
                : "Swipe to chain, release to earn • Exp💥 destroys adds"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ParticleDot({ p }: { p: Particle }) {
  return <SvgCircle cx={p.x} cy={p.y} r={4} fill={p.color} />;
}

const styles = StyleSheet.create({
  boardWrap: { flex: 1, overflow: "hidden" },
  labelWrap: { position: "absolute", width: 64, alignItems: "center" },
  circleLabel: { fontSize: 17, lineHeight: 24, textAlign: "center", fontFamily: "Inter_700Bold", width: 64 },
  runningTotal: {
    position: "absolute",
    width: 72,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  runningTotalText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.3 },
  reRollBadge: {
    position: "absolute",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  reRollBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  removeBtn: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#ffffff", lineHeight: 16 },
  costBadge: {
    position: "absolute",
    width: 72,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  costBadgeText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.3 },
  liveBadge: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  liveBadgeInner: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, maxWidth: "100%" },
  formulaText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  earnText: {
    position: "absolute",
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chainReactBanner: {
    position: "absolute",
    top: "30%",
    left: 20,
    right: 20,
    alignItems: "center",
    gap: 4,
  },
  chainReactText: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#facc15",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  chainReactSub: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fef08a",
    textAlign: "center",
  },
  modeHintWrap: { position: "absolute", bottom: 12, left: 0, right: 0, alignItems: "center" },
  modeHint: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  modeHintText: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
