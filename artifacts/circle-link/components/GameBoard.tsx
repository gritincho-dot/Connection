import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
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
  RadialGradient,
  Stop,
} from "react-native-svg";

import { NORMAL_COUNT } from "@/constants/game";
import {
  type CircleNode,
  type CircleType,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";

const SCREEN = Dimensions.get("window");
const BOARD_SIZE = Math.min(SCREEN.width - 32, 380);
const CENTER = BOARD_SIZE / 2;
const ORBIT_RADIUS = BOARD_SIZE / 2 - 48;
const CIRCLE_RADIUS = 28;
const HIT_RADIUS = 40;

const COLOR_NORMAL = "#22d3ee";
const COLOR_MULT = "#a855f7";
const COLOR_EXP = "#f59e0b";

function colorForType(type: CircleType): string {
  if (type === "multiplier") return COLOR_MULT;
  if (type === "exponential") return COLOR_EXP;
  return COLOR_NORMAL;
}

function buildCircles(
  multCount: number,
  expCount: number,
): CircleNode[] {
  const types: CircleType[] = [];
  for (let i = 0; i < NORMAL_COUNT; i++) types.push("normal");
  for (let i = 0; i < multCount; i++) types.push("multiplier");
  for (let i = 0; i < expCount; i++) types.push("exponential");

  const n = types.length;
  return types.map((type, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      id: `c-${i}-${type}`,
      type,
      x: CENTER + Math.cos(angle) * ORBIT_RADIUS,
      y: CENTER + Math.sin(angle) * ORBIT_RADIUS,
    };
  });
}

const haptic = (style: "light" | "select" | "heavy" = "light") => {
  if (Platform.OS === "web") return;
  if (style === "light")
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else if (style === "heavy")
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
};

export function GameBoard() {
  const colors = useColors();
  const { state, addPoints, computeRate } = useGame();

  const circles = useMemo(
    () => buildCircles(state.multiplierCount, state.exponentialCount),
    [state.multiplierCount, state.exponentialCount],
  );

  const [chain, setChain] = useState<CircleNode[]>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );

  const chainRef = useRef(chain);
  chainRef.current = chain;
  const circlesRef = useRef(circles);
  circlesRef.current = circles;

  const findCircleAt = useCallback(
    (x: number, y: number): CircleNode | null => {
      for (const c of circlesRef.current) {
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
          setPointer({ x, y });
          const hit = findCircleAt(x, y);
          if (hit) {
            setChain([hit]);
            haptic("light");
          } else {
            setChain([]);
          }
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          const y = evt.nativeEvent.locationY;
          setPointer({ x, y });
          const hit = findCircleAt(x, y);
          if (!hit) return;
          const current = chainRef.current;
          if (current.length === 0) {
            setChain([hit]);
            haptic("light");
            return;
          }
          const last = current[current.length - 1];
          if (last.id === hit.id) return;
          if (
            current.length >= 2 &&
            current[current.length - 2].id === hit.id
          ) {
            setChain(current.slice(0, -1));
            haptic("select");
            return;
          }
          if (current.some((c) => c.id === hit.id)) return;
          setChain([...current, hit]);
          haptic("light");
        },
        onPanResponderRelease: () => {
          if (chainRef.current.length >= 2) haptic("heavy");
          setPointer(null);
          setChain([]);
        },
        onPanResponderTerminate: () => {
          setPointer(null);
          setChain([]);
        },
      }),
    [findCircleAt],
  );

  // Live earning while chain is held
  useEffect(() => {
    if (chain.length < 2) return;
    const rate = computeRate(chain);
    const id = setInterval(() => {
      addPoints(rate / 10);
    }, 100);
    return () => clearInterval(id);
  }, [chain, computeRate, addPoints]);

  const liveRate = chain.length >= 2 ? computeRate(chain) : 0;
  const multInChain = chain.filter((c) => c.type === "multiplier").length;
  const expInChain = chain.filter((c) => c.type === "exponential").length;

  return (
    <View style={styles.wrapper}>
      <View style={styles.rateBar}>
        <Text
          style={[
            styles.rateText,
            {
              color:
                liveRate > 0 ? colors.primary : colors.mutedForeground,
            },
          ]}
        >
          {liveRate > 0
            ? `+${formatNum(liveRate)} / sec`
            : "Swipe between circles"}
        </Text>
        {liveRate > 0 ? (
          <View style={styles.chainInfo}>
            <Text style={[styles.chainBadge, { color: COLOR_NORMAL }]}>
              {chain.length}× link
            </Text>
            {multInChain > 0 ? (
              <Text style={[styles.chainBadge, { color: COLOR_MULT }]}>
                {multInChain}× mult
              </Text>
            ) : null}
            {expInChain > 0 ? (
              <Text style={[styles.chainBadge, { color: COLOR_EXP }]}>
                {expInChain}× exp
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Hold to earn · Release to keep
          </Text>
        )}
      </View>

      <View
        {...panResponder.panHandlers}
        style={[
          styles.board,
          {
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: BOARD_SIZE / 2,
          },
        ]}
      >
        <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
          <Defs>
            <RadialGradient id="boardGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <SvgCircle
            cx={CENTER}
            cy={CENTER}
            r={CENTER - 4}
            fill="url(#boardGlow)"
          />

          {/* Connection lines between chain nodes */}
          {chain.map((c, i) => {
            if (i === 0) return null;
            const prev = chain[i - 1];
            return (
              <Line
                key={`line-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={c.x}
                y2={c.y}
                stroke={COLOR_NORMAL}
                strokeWidth={5}
                strokeLinecap="round"
                strokeOpacity={0.95}
              />
            );
          })}

          {/* Live line from last circle to finger */}
          {pointer && chain.length > 0
            ? (() => {
                const last = chain[chain.length - 1];
                return (
                  <Line
                    x1={last.x}
                    y1={last.y}
                    x2={pointer.x}
                    y2={pointer.y}
                    stroke={COLOR_NORMAL}
                    strokeWidth={3}
                    strokeOpacity={0.45}
                    strokeLinecap="round"
                  />
                );
              })()
            : null}

          {/* Circle nodes */}
          {circles.map((c) => {
            const inChain = chain.some((cc) => cc.id === c.id);
            const stroke = colorForType(c.type);
            return (
              <React.Fragment key={c.id}>
                {inChain ? (
                  <SvgCircle
                    cx={c.x}
                    cy={c.y}
                    r={CIRCLE_RADIUS + 8}
                    fill={stroke}
                    fillOpacity={0.18}
                  />
                ) : null}
                <SvgCircle
                  cx={c.x}
                  cy={c.y}
                  r={CIRCLE_RADIUS}
                  fill={inChain ? stroke : "#0b1220"}
                  stroke={stroke}
                  strokeWidth={inChain ? 4 : 3}
                />
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Circle labels overlay */}
        {circles.map((c) => {
          const inChain = chain.some((cc) => cc.id === c.id);
          let label = "";
          if (c.type === "multiplier") label = "×";
          else if (c.type === "exponential") label = "^";
          else label = "";
          if (!label) return null;
          return (
            <Text
              key={`lbl-${c.id}`}
              style={[
                styles.circleLabel,
                {
                  left: c.x - 16,
                  top: c.y - 18,
                  color: inChain ? "#0b1220" : colorForType(c.type),
                },
              ]}
            >
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 16,
  },
  rateBar: {
    alignItems: "center",
    gap: 6,
    minHeight: 56,
    justifyContent: "center",
  },
  rateText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: 0.3,
  },
  hint: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  chainInfo: {
    flexDirection: "row",
    gap: 10,
  },
  chainBadge: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  board: {
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  circleLabel: {
    position: "absolute",
    width: 32,
    height: 32,
    fontSize: 26,
    lineHeight: 32,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
});
