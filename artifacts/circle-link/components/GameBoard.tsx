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
  Defs,
  Line,
  Pattern,
  Rect,
} from "react-native-svg";

import {
  type CircleNode,
  type CircleType,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";

const CIRCLE_RADIUS = 32;
const HIT_RADIUS = 42;
const MARGIN = 44;

export type Mode = "play" | "layout" | "upgrade";

type Props = { mode: Mode };

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

const triggerHaptic = (
  style: "light" | "select" | "heavy" | "warn" = "light",
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
  else Haptics.selectionAsync().catch(() => {});
};

function findOpenSpot(
  existing: CircleNode[],
  w: number,
  h: number,
): { x: number; y: number } {
  const placed = existing.filter(
    (c) => c.x !== undefined && c.y !== undefined,
  );
  let best = { x: w / 2, y: h / 2 };
  let bestDist = -1;
  for (let i = 0; i < 30; i++) {
    const x = MARGIN + Math.random() * (w - MARGIN * 2);
    const y = MARGIN + Math.random() * (h - MARGIN * 2);
    let minDist = Infinity;
    for (const o of placed) {
      const d = Math.hypot(x - (o.x as number), y - (o.y as number));
      if (d < minDist) minDist = d;
    }
    if (minDist > bestDist) {
      bestDist = minDist;
      best = { x, y };
    }
  }
  return best;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function GameBoard({ mode }: Props) {
  const colors = useColors();
  const {
    state,
    computeRelease,
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

  // Auto-place circles without positions
  useEffect(() => {
    if (!boardSize) return;
    const need = state.circles.filter(
      (c) =>
        (c.x === undefined || c.y === undefined) &&
        !initializedIds.current.has(c.id),
    );
    for (const c of need) {
      initializedIds.current.add(c.id);
      const pos = findOpenSpot(state.circles, boardSize.w, boardSize.h);
      moveCircle(c.id, pos.x, pos.y);
    }
  }, [state.circles, boardSize, moveCircle]);

  // Drop ids from initializedIds when circles are removed (e.g., rebirth)
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

  // Play mode chain
  const [chain, setChain] = useState<CircleNode[]>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );
  const chainRef = useRef(chain);
  chainRef.current = chain;
  const circlesRef = useRef(state.circles);
  circlesRef.current = state.circles;

  // Layout mode drag
  const [drag, setDrag] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // Upgrade mode tap tracking
  const tapStartRef = useRef<{
    x: number;
    y: number;
    circleId: string;
  } | null>(null);

  // Earn animation
  const earnAnim = useRef(new Animated.Value(0)).current;
  const [earnAmount, setEarnAmount] = useState<number>(0);
  const flashEarning = useCallback(
    (amount: number) => {
      setEarnAmount(amount);
      earnAnim.setValue(0);
      Animated.timing(earnAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }).start();
    },
    [earnAnim],
  );

  const findCircleAt = useCallback(
    (x: number, y: number): CircleNode | null => {
      for (const c of circlesRef.current) {
        if (c.x === undefined || c.y === undefined) continue;
        const dx = x - c.x;
        const dy = y - c.y;
        if (dx * dx + dy * dy <= HIT_RADIUS * HIT_RADIUS) return c;
      }
      return null;
    },
    [],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;
          if (mode === "layout") {
            const hit = findCircleAt(x, y);
            if (hit && hit.x !== undefined && hit.y !== undefined) {
              setDrag({ id: hit.id, x: hit.x, y: hit.y });
              triggerHaptic("light");
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
            triggerHaptic("light");
          } else {
            setChain([]);
          }
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;
          if (mode === "layout") {
            const cur = dragRef.current;
            if (!cur || !boardSize) return;
            setDrag({
              id: cur.id,
              x: clamp(x, MARGIN, boardSize.w - MARGIN),
              y: clamp(y, MARGIN, boardSize.h - MARGIN),
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
            triggerHaptic("light");
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
            return;
          }
          if (current.some((c) => c.id === hit.id)) return;
          setChain([...current, hit]);
          triggerHaptic("light");
        },
        onPanResponderRelease: (evt) => {
          if (mode === "layout") {
            const cur = dragRef.current;
            if (cur) {
              moveCircle(cur.id, cur.x, cur.y);
              setDrag(null);
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
            triggerHaptic(ok ? "heavy" : "warn");
            return;
          }
          // play release
          const cur = chainRef.current;
          if (cur.length >= 2) {
            const earned = releaseChain(cur);
            if (earned > 0) {
              flashEarning(earned);
              triggerHaptic("heavy");
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

  // Resolve render position (with drag override)
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
      style={[styles.boardWrap, { backgroundColor: colors.background }]}
      onLayout={onBoardLayout}
    >
      {boardSize ? (
        <View
          {...panResponder.panHandlers}
          style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
        >
          <Svg width={w} height={h}>
            <Defs>
              <Pattern
                id="dots"
                x="0"
                y="0"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <SvgCircle cx="11" cy="11" r="1.1" fill="#cdc4a4" />
              </Pattern>
            </Defs>
            <Rect width={w} height={h} fill="url(#dots)" />

            {/* chain lines */}
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
                  stroke="#3a3528"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              );
            })}
            {pointer && chain.length > 0
              ? (() => {
                  const last = chain[chain.length - 1];
                  const a = renderPos(last);
                  if (!a) return null;
                  return (
                    <Line
                      x1={a.x}
                      y1={a.y}
                      x2={pointer.x}
                      y2={pointer.y}
                      stroke="#3a3528"
                      strokeWidth={3}
                      strokeOpacity={0.4}
                      strokeLinecap="round"
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
              return (
                <React.Fragment key={c.id}>
                  {inChain || isDragging ? (
                    <SvgCircle
                      cx={pos.x}
                      cy={pos.y}
                      r={CIRCLE_RADIUS + 8}
                      fill={stroke}
                      fillOpacity={0.18}
                    />
                  ) : null}
                  <SvgCircle
                    cx={pos.x}
                    cy={pos.y}
                    r={CIRCLE_RADIUS}
                    fill={inChain ? stroke : "#fffdf6"}
                    stroke={stroke}
                    strokeWidth={inChain ? 4 : 3}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Labels overlay */}
          {state.circles.map((c) => {
            const pos = renderPos(c);
            if (!pos) return null;
            const inChain = chain.some((cc) => cc.id === c.id);
            return (
              <Text
                key={`lbl-${c.id}`}
                pointerEvents="none"
                style={[
                  styles.circleLabel,
                  {
                    left: pos.x - 32,
                    top: pos.y - 13,
                    color: inChain ? "#ffffff" : colorForType(c.type),
                  },
                ]}
              >
                {labelFor(c)}
              </Text>
            );
          })}

          {/* Upgrade mode cost badges */}
          {mode === "upgrade"
            ? state.circles.map((c) => {
                const pos = renderPos(c);
                if (!pos) return null;
                const cost = reRollCostFor(c);
                const affordable = state.points >= cost;
                return (
                  <View
                    key={`cost-${c.id}`}
                    pointerEvents="none"
                    style={[
                      styles.costBadge,
                      {
                        left: pos.x - 32,
                        top: pos.y - CIRCLE_RADIUS - 28,
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

          {/* Live rate hint */}
          {mode === "play" && liveRate > 0 ? (
            <View pointerEvents="none" style={styles.liveBadge}>
              <View
                style={[
                  styles.liveBadgeInner,
                  {
                    backgroundColor: colors.foreground,
                  },
                ]}
              >
                <Text style={[styles.liveBadgeText, { color: colors.background }]}>
                  Release for +{formatNum(liveRate)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Earn animation */}
          {earnAmount > 0 ? (
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.earnText,
                {
                  color: "#16a34a",
                  opacity: earnAnim.interpolate({
                    inputRange: [0, 0.15, 0.85, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: earnAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -50],
                      }),
                    },
                  ],
                  top: h / 2 - 20,
                  width: w,
                },
              ]}
            >
              +{formatNum(earnAmount)}
            </Animated.Text>
          ) : null}
        </View>
      ) : null}

      {/* Mode hint at bottom */}
      <View pointerEvents="none" style={styles.modeHintWrap}>
        <View
          style={[
            styles.modeHint,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.modeHintText, { color: colors.mutedForeground }]}>
            {mode === "layout"
              ? "Drag a circle to move it"
              : mode === "upgrade"
                ? "Tap a circle to re-roll its value"
                : "Swipe between circles, release to earn"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    flex: 1,
    overflow: "hidden",
  },
  circleLabel: {
    position: "absolute",
    width: 64,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  costBadge: {
    position: "absolute",
    width: 64,
    paddingVertical: 3,
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
  },
  liveBadgeInner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  earnText: {
    position: "absolute",
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    textAlign: "center",
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
