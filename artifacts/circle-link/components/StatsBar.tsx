import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COMBO_WINDOW_MS } from "@/constants/game";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";

export function StatsBar({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const colors = useColors();
  const { state } = useGame();
  const insets = useSafeAreaInsets();

  // Combo timer ring
  const [comboPct, setComboPct] = React.useState(0);
  useEffect(() => {
    if (state.comboCount <= 1 || !state.lastReleaseAt) {
      setComboPct(0);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - state.lastReleaseAt;
      const pct = Math.max(0, 1 - elapsed / COMBO_WINDOW_MS);
      setComboPct(pct);
    };
    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [state.lastReleaseAt, state.comboCount]);

  // Bump animation when points change
  const bump = useRef(new Animated.Value(1)).current;
  const lastPoints = useRef(state.points);
  useEffect(() => {
    if (state.points !== lastPoints.current) {
      const inc = state.points > lastPoints.current;
      lastPoints.current = state.points;
      if (inc) {
        Animated.sequence([
          Animated.timing(bump, {
            toValue: 1.12,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(bump, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [state.points, bump]);

  const handleSettings = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onOpenSettings?.();
  };

  const showCombo = state.comboCount > 1 && comboPct > 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 12,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.pointsBlock}>
          <Animated.Text
            style={[
              styles.pointsValue,
              {
                color: colors.foreground,
                transform: [{ scale: bump }],
              },
            ]}
          >
            {formatNum(state.points)}
          </Animated.Text>
          <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>
            points
          </Text>
        </View>

        <View style={styles.metaRow}>
          {showCombo ? (
            <View
              style={[
                styles.comboPill,
                { backgroundColor: "#facc15", borderColor: "#eab308" },
              ]}
            >
              <Feather name="zap" size={12} color="#1a1714" />
              <Text style={styles.comboText}>×{state.comboCount}</Text>
              <View style={styles.comboBarBg}>
                <View
                  style={[
                    styles.comboBarFill,
                    {
                      width: `${Math.round(comboPct * 100)}%`,
                      backgroundColor: "#1a1714",
                    },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.metaPill,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="zap" size={12} color={colors.accent} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>
              {formatNum(state.circlePoints)}
            </Text>
          </View>

          <Pressable
            onPress={handleSettings}
            style={({ pressed }) => [
              styles.settingsBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="settings" size={16} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pointsBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  pointsValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  pointsLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  comboPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  comboText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#1a1714",
    marginRight: 4,
  },
  comboBarBg: {
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  comboBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
