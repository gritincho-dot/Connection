import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { GameBoard } from "@/components/GameBoard";
import { StatsBar } from "@/components/StatsBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";

export default function GameScreen() {
  const colors = useColors();
  const { state, costs, canRebirth } = useGame();

  const rebirthProgress = Math.min(
    1,
    state.totalEarnedThisRun / costs.rebirthThreshold,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatsBar />
      <View style={styles.content}>
        <GameBoard />

        <View style={styles.footer}>
          <View
            style={[
              styles.progressCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text
                style={[
                  styles.progressLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                Rebirth progress
              </Text>
              <Text
                style={[
                  styles.progressValue,
                  {
                    color: canRebirth ? colors.accent : colors.foreground,
                  },
                ]}
              >
                {formatNum(state.totalEarnedThisRun)} /{" "}
                {formatNum(costs.rebirthThreshold)}
              </Text>
            </View>
            <View
              style={[styles.progressTrack, { backgroundColor: colors.muted }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${rebirthProgress * 100}%`,
                    backgroundColor: canRebirth
                      ? colors.accent
                      : colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 24,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 4,
  },
  progressCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  progressValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});
