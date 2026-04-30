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

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;

export type Mode = "play" | "layout" | "upgrade";

type Props = {
  mode: Mode;
  onShuffle?: () => void;
  scale: Animated.Value;
  scaleRef: React.MutableRefObject<number>;
};

const colorForType = (type: CircleType): string => {
  if (type === "add") return "#16a34a";
  if (type === "mult") return "#9333ea";
  return "#ea580c";
};

const labelFor = (c: CircleNode): string => {
  if (c.type === "add") return `+${c.value}`;
  if (c.type === "mult") return `×${c.value}`;
  return `^${c.value}`;
};

const opLabel = (c: CircleNode): string => {
  if (c.type === "add") return `+${c.value}`;
  if (c.type === "mult") return `×${c.value}`;
  return `^${(1 + c.value / 10).toFixed(1)}`;
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
  else if (style === "success")
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
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
    reRollCostFor,
  } = useGame();

  const [boardSize, setBoardSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const initializedIds = useRef<Set<string>>(new Set());

  // Auto-place new circles randomly, and reposition any that fall outside current bounds
  useEffect(() => {
    if (!boardSize) return;
    const { w, h } = boardSize;
    for (const c of state.circles) {
      const unplaced = c.x === undefined || c.y === undefined;
      const outOfBounds =
        !unplaced &&
        (c.x! < MARGIN ||
          c.x! > w - MARGIN ||
          c.y! < MARGIN ||
          c.y! > h - MARGIN);
      if (unplaced && initializedIds.current.has(c.id)) continue;
      if (!unplaced && !outOfBounds) continue;
      initializedIds.current.add(c.id);
      const pos = randomSpot(w, h);
      moveCircle(c.id, pos.x, pos.y);
    }
  }, [state.circles, boardSize, moveCircle]);

  // Cleanup ids when circles disappear
  useEffect(() => {
    const live = new Set(state.circles.map((c) => c.id));
    initializedIds.current.forEach((id) => {
      if (!live.has(id)) initializedIds.current.delete(id);
    });
  }, [state.circles]);

  const onBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize((cur) =>
      cur && cur.w === width && cur.h === height
        ? cur
        : { w: width, h: height },
    );
  }, []);

  // Chain state
  const [chain, setChain] = useState<CircleNode[]>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );
  const chainRef = useRef(chain);
  chainRef.current = chain;
  const circlesRef = useRef(state.circles);
  circlesRef.current = state.circles;

  // Drag in layout mode
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // Tap tracking for upgrade mode
  const tapStartRef = useRef<{
    x: number;
    y: number;
    circleId: string;
  } | null>(null);

  // Pinch tracking
  const pinchInit = useRef<{
    dist: number;
    startScale: number;
  } | null>(null);
  const isPinchingRef = useRef(false);

  // Earn animation
  const earnAnim = useRef(new Animated.Value(0)).current;
  const [earnState, setEarnState] = useState<{
    amount: number;
    crit: boolean;
  } | null>(null);

  // Crit flash
  const critFlash = useRef(new Animated.Value(0)).current;

  // Combo display animation
  const comboBumpAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          setParticles((prev) => prev.filter((x) => x.id !== p.id));
        });
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
    Animated.spring(v, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const flashEarning = useCallback(
    (amount: number, crit: boolean) => {
      setEarnState({ amount, crit });
      earnAnim.setValue(0);
      Animated.timing(earnAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start();
      if (crit) {
        critFlash.setValue(0);
        Animated.sequence([
          Animated.timing(critFlash, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(critFlash, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
    [earnAnim, critFlash],
  );

  const findCircleAt = useCallback(
    (x: number, y: number): CircleNode | null => {
      // Convert touch coords (in screen space relative to outer view)
      // to logical board coords accounting for center-origin scale.
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

  const handlePinch = useCallback(
    (
      touches: { pageX: number; pageY: number }[],
    ): boolean => {
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
      const newScale = clamp(
        pinchInit.current.startScale * ratio,
        MIN_SCALE,
        MAX_SCALE,
      );
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
          if (touches.length >= 2) {
            handlePinch(touches);
            return;
          }
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;
          if (mode === "layout") {
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
            if (hit) {
              tapStartRef.current = { x, y, circleId: hit.id };
            }
            return;
          }
          // play
          setPointer({ x, y });
          const hit = findCircleAt(x, y);
          if (hit) {
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
          if (touches.length >= 2) {
            handlePinch(touches);
            return;
          }
          if (isPinchingRef.current) {
            // Wait until both fingers fully release
            return;
          }
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
            setDrag({
              id: cur.id,
              x: clamp(lx, MARGIN, w - MARGIN),
              y: clamp(ly, MARGIN, h - MARGIN),
            });
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
          // play
          setPointer({ x, y });
          const hit = findCircleAt(x, y);
          if (!hit) return;
          const current = chainRef.current;
          if (current.length === 0) {
            setChain([hit]);
            popCircle(hit.id);
            triggerHaptic("light");
            sound.play("tick", 1.0);
            return;
          }
          const last = current[current.length - 1];
          if (last.id === hit.id) return;
          if (
            current.length >= 2 &&
            current[current.length - 2].id === hit.id
          ) {
            setChain(current.slice(0, -1));
            triggerHaptic("select");
            sound.play("tick", 0.85);
            return;
          }
          if (current.some((c) => c.id === hit.id)) return;
          const next = [...current, hit];
          setChain(next);
          popCircle(hit.id);
          triggerHaptic("light");
          // Pitch climbs with chain length
          const pitch = 0.9 + Math.min(0.8, (next.length - 1) * 0.12);
          sound.play("tick", pitch);
        },
        onPanResponderRelease: (evt) => {
          if (isPinchingRef.current) {
            // End pinch if remaining touches < 2
            const touches = evt.nativeEvent.touches;
            if (touches.length < 2) {
              isPinchingRef.current = false;
              pinchInit.current = null;
            }
            return;
          }
          if (mode === "layout") {
            const cur = dragRef.current;
            if (cur) {
              moveCircle(cur.id, cur.x, cur.y);
              setDrag(null);
              sound.play("pop", 1.1);
            }
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
            const ok = reRollCircle(hit.id);
            if (ok) {
              triggerHaptic("heavy");
              sound.play("whoosh", 1.0);
              popCircle(hit.id);
              if (hit.x !== undefined && hit.y !== undefined) {
                spawnParticles(hit.x, hit.y, colorForType(hit.type), 10);
              }
            } else {
              triggerHaptic("warn");
              sound.play("buzz", 1.0);
            }
            return;
          }
          // play release
          const cur = chainRef.current;
          if (cur.length >= 2) {
            const info = releaseChain(cur);
            if (info.earned > 0) {
              flashEarning(info.earned, info.crit);
              triggerHaptic(info.crit ? "success" : "heavy");
              sound.play("pop", 0.9);
              // pitch by magnitude (log-scaled)
              const pitch = clamp(
                0.8 + Math.log10(info.earned + 1) * 0.12,
                0.8,
                1.8,
              );
              setTimeout(() => sound.play("chaching", pitch), 80);
              if (info.crit) {
                setTimeout(() => sound.play("chime", 1.2), 200);
              }
              // particle burst from each chain circle
              cur.forEach((c) => {
                if (c.x !== undefined && c.y !== undefined) {
                  spawnParticles(
                    c.x,
                    c.y,
                    info.crit ? "#facc15" : colorForType(c.type),
                    info.crit ? 18 : 10,
                  );
                }
              });
              // combo bump
              if (info.comboCount > 1) {
                comboBumpAnim.setValue(0);
                Animated.spring(comboBumpAnim, {
                  toValue: 1,
                  friction: 4,
                  useNativeDriver: true,
                }).start();
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
      boardSize,
      moveCircle,
      reRollCircle,
      releaseChain,
      flashEarning,
      sound,
      handlePinch,
      popCircle,
      spawnParticles,
      comboBumpAnim,
      scaleRef,
    ],
  );

  // Reset transient state on mode change
  useEffect(() => {
    setChain([]);
    setPointer(null);
    setDrag(null);
    tapStartRef.current = null;
  }, [mode]);

  const liveRate = chain.length >= 2 ? computeRelease(chain) : 0;
  const stepwise =
    chain.length >= 2 ? computeReleaseStepwise(chain) : [];

  const formulaPreview = useMemo(() => {
    if (chain.length < 2) return "";
    const parts: string[] = [String(chain[0].value)];
    for (let i = 1; i < chain.length; i++) {
      parts.push(opLabel(chain[i]));
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

  return (
    <View
      style={[styles.boardWrap, { backgroundColor: colors.boardBg }]}
      onLayout={onBoardLayout}
    >
      {boardSize ? (
        <View
          {...panResponder.panHandlers}
          style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
        >
          <Animated.View
            style={[
              { position: "absolute", left: 0, top: 0, width: w, height: h, transform: [{ scale }] },
            ]}
          >
            <Svg width={w} height={h}>
              {/* chain lines (dashed) */}
              {chain.map((c, i) => {
                if (i === 0) return null;
                const prev = chain[i - 1];
                const a = renderPos(prev);
                const b = renderPos(c);
                if (!a || !b) return null;
                return (
                  <Line
                    key={`line-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={colors.chainLine}
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray="8,6"
                  />
                );
              })}
              {pointer && chain.length > 0
                ? (() => {
                    const last = chain[chain.length - 1];
                    const a = renderPos(last);
                    if (!a) return null;
                    const sV = scaleRef.current;
                    // pointer is in screen coords; convert to logical
                    const px = (pointer.x - w / 2) / sV + w / 2;
                    const py = (pointer.y - h / 2) / sV + h / 2;
                    return (
                      <Line
                        x1={a.x}
                        y1={a.y}
                        x2={px}
                        y2={py}
                        stroke={colors.chainLine}
                        strokeWidth={3}
                        strokeOpacity={0.4}
                        strokeLinecap="round"
                        strokeDasharray="4,5"
                      />
                    );
                  })()
                : null}

              {/* circles */}
              {state.circles.map((c) => {
                const pos = renderPos(c);
                if (!pos) return null;
                const inChain = chain.some((cc) => cc.id === c.id);
                const stroke = colorForType(c.type);
                const isDragging = drag?.id === c.id;
                const masteryStroke = Math.min(3, c.reRollCount * 0.15);
                return (
                  <React.Fragment key={c.id}>
                    {inChain || isDragging ? (
                      <SvgCircle
                        cx={pos.x}
                        cy={pos.y}
                        r={CIRCLE_RADIUS + 10}
                        fill={stroke}
                        fillOpacity={0.18}
                      />
                    ) : null}
                    <SvgCircle
                      cx={pos.x}
                      cy={pos.y}
                      r={CIRCLE_RADIUS}
                      fill={inChain ? stroke : colors.circleFill}
                      stroke={stroke}
                      strokeWidth={(inChain ? 4 : 3) + masteryStroke}
                    />
                  </React.Fragment>
                );
              })}

              {/* particles */}
              {particles.map((p) => (
                <ParticleDot key={p.id} p={p} />
              ))}
            </Svg>

            {/* Labels overlay (also scaled) */}
            {state.circles.map((c) => {
              const pos = renderPos(c);
              if (!pos) return null;
              const inChain = chain.some((cc) => cc.id === c.id);
              const popVal = popAnims.current.get(c.id);
              const popScale = popVal
                ? popVal.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.3, 1],
                  })
                : 1;
              const stepIndex = chain.findIndex((cc) => cc.id === c.id);
              const runningTotal =
                stepIndex >= 0 && stepIndex < stepwise.length
                  ? Math.floor(stepwise[stepIndex])
                  : null;
              return (
                <React.Fragment key={`lbl-${c.id}`}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.labelWrap,
                      {
                        left: pos.x - 32,
                        top: pos.y - 13,
                        transform: [{ scale: popScale }],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.circleLabel,
                        {
                          color: inChain ? "#ffffff" : colorForType(c.type),
                        },
                      ]}
                    >
                      {labelFor(c)}
                    </Text>
                  </Animated.View>
                  {c.reRollCount > 0 && mode === "upgrade" ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.reRollBadge,
                        {
                          left: pos.x + 18,
                          top: pos.y - CIRCLE_RADIUS - 6,
                          backgroundColor: colors.foreground,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.reRollBadgeText, { color: colors.background }]}
                      >
                        {c.reRollCount}
                      </Text>
                    </View>
                  ) : null}
                  {inChain && runningTotal !== null && stepIndex > 0 ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.runningTotal,
                        {
                          left: pos.x - 36,
                          top: pos.y + CIRCLE_RADIUS + 6,
                          backgroundColor: colors.foreground,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.runningTotalText,
                          { color: colors.background },
                        ]}
                      >
                        ={formatNum(runningTotal)}
                      </Text>
                    </View>
                  ) : null}
                </React.Fragment>
              );
            })}
          </Animated.View>

          {/* Upgrade mode cost badges (NOT scaled — overlay in screen coords for legibility) */}
          {mode === "upgrade"
            ? state.circles.map((c) => {
                const pos = renderPos(c);
                if (!pos) return null;
                const sV = scaleRef.current;
                const sx = (pos.x - w / 2) * sV + w / 2;
                const sy = (pos.y - h / 2) * sV + h / 2;
                const cost = reRollCostFor(c);
                const affordable = state.points >= cost;
                return (
                  <View
                    key={`cost-${c.id}`}
                    pointerEvents="none"
                    style={[
                      styles.costBadge,
                      {
                        left: sx - 36,
                        top: sy - CIRCLE_RADIUS * sV - 28,
                        backgroundColor: affordable
                          ? colors.foreground
                          : colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.costBadgeText,
                        {
                          color: affordable
                            ? colors.background
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {formatNum(cost)}
                    </Text>
                  </View>
                );
              })
            : null}

          {/* Critical flash overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: "#facc15",
                opacity: critFlash.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.35],
                }),
              },
            ]}
          />

          {/* Live release preview badge */}
          {mode === "play" && liveRate > 0 ? (
            <View pointerEvents="none" style={styles.liveBadge}>
              <View
                style={[
                  styles.liveBadgeInner,
                  { backgroundColor: colors.foreground },
                ]}
              >
                <Text
                  style={[
                    styles.formulaText,
                    { color: colors.background },
                  ]}
                >
                  {formulaPreview} = {formatNum(liveRate)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Earned float text */}
          {earnState ? (
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.earnText,
                {
                  color: earnState.crit ? "#facc15" : "#16a34a",
                  opacity: earnAnim.interpolate({
                    inputRange: [0, 0.15, 0.85, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: earnAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -60],
                      }),
                    },
                    {
                      scale: earnAnim.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0.6, 1.1, 1],
                      }),
                    },
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

      {/* Mode hint */}
      <View pointerEvents="none" style={styles.modeHintWrap}>
        <View
          style={[
            styles.modeHint,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.modeHintText, { color: colors.mutedForeground }]}>
            {mode === "layout"
              ? "Drag a circle to move • Pinch to zoom"
              : mode === "upgrade"
                ? "Tap a circle to re-roll its value"
                : "Swipe to chain, release to earn • Pinch to zoom"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ParticleDot({ p }: { p: Particle }) {
  return (
    <SvgCircle
      cx={p.x}
      cy={p.y}
      r={4}
      fill={p.color}
      // Note: react-native-svg doesn't animate via useNativeDriver,
      // but we render a static at given pos; visual fade handled by lifecycle removal.
    />
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    flex: 1,
    overflow: "hidden",
  },
  labelWrap: {
    position: "absolute",
    width: 64,
    alignItems: "center",
  },
  circleLabel: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    width: 64,
  },
  runningTotal: {
    position: "absolute",
    width: 72,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  runningTotalText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  reRollBadge: {
    position: "absolute",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  reRollBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
  costBadge: {
    position: "absolute",
    width: 72,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  costBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  liveBadge: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  liveBadgeInner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: "100%",
  },
  formulaText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  earnText: {
    position: "absolute",
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modeHintWrap: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  modeHint: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeHintText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
