import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";

export function StatsBar() {
  const colors = useColors();
  const { state } = useGame();
  const insets = useSafeAreaInsets();

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
          <Text style={[styles.pointsValue, { color: colors.foreground }]}>
            {formatNum(state.points)}
          </Text>
          <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>
            points
          </Text>
        </View>

        <View style={styles.metaRow}>
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
          <View
            style={[
              styles.metaPill,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="refresh-cw" size={12} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>
              {state.rebirthCount}
            </Text>
          </View>
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
});
