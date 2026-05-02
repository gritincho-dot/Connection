import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { StatsBar } from "@/components/StatsBar";
import { UpgradeRow } from "@/components/UpgradeRow";
import { CORRUPT_CHANCE, MAX_ADD, MAX_EXP, MAX_MULT, MAX_TOTAL_CIRCLES } from "@/constants/game";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function UpgradesScreen() {
  const colors = useColors();
  const { state, costs, applyDiscount, buyEnergy, addCircle, boardFull } = useGame();

  const energyCost = applyDiscount(costs.energy);
  const addCost = costs.add !== null ? applyDiscount(costs.add) : null;
  const multCost = costs.mult !== null ? applyDiscount(costs.mult) : null;
  const expCost = costs.exp !== null ? applyDiscount(costs.exp) : null;

  const addCount = state.circles.filter((c) => c.type === "add").length;
  const multCount = state.circles.filter((c) => c.type === "mult").length;
  const expCount = state.circles.filter((c) => c.type === "exp").length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatsBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Upgrades
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Spend points to grow your network
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Boost
          </Text>
          <UpgradeRow
            iconName="zap"
            iconColor={colors.primary}
            title="Connection Energy"
            description={`+20% earnings on release per level. Currently +${state.energyLevel * 20}%.`}
            level={`Lv ${state.energyLevel}`}
            costLabel="pts"
            costValue={energyCost}
            currency="points"
            affordable={state.points >= energyCost}
            onBuy={buyEnergy}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Add new circles
          </Text>
          <View style={[styles.capacityRow, { borderColor: boardFull ? "#ef4444" : colors.border, backgroundColor: boardFull ? "#ef444422" : colors.card }]}>
            <Text style={[styles.capacityText, { color: boardFull ? "#ef4444" : colors.mutedForeground }]}>
              Board: {state.circles.length} / {MAX_TOTAL_CIRCLES} circles
              {boardFull ? "  —  Remove circles before buying more" : ""}
            </Text>
          </View>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            New circles stay permanently. They may spawn corrupted ({Math.round(CORRUPT_CHANCE * 100)}% chance) — tap them in Upgrade mode to cleanse. Use the delete button in Upgrade mode to remove unwanted circles.
          </Text>
          <UpgradeRow
            iconName="plus"
            iconColor="#16a34a"
            title="Addition Circle"
            description="Cheapest circle. Adds its value to the chain total. Build a stack before multiplying for best results."
            level={`${addCount} / ${MAX_ADD}`}
            costLabel="pts"
            costValue={boardFull ? null : addCost}
            currency="points"
            affordable={!boardFull && addCost !== null && state.points >= addCost}
            maxed={costs.add === null || boardFull}
            onBuy={() => addCircle("add")}
          />
          <UpgradeRow
            iconName="x"
            iconColor="#9333ea"
            title="Multiplication Circle"
            description="Multiplies the running total by its value. Place after additions to amplify gains."
            level={`${multCount} / ${MAX_MULT}`}
            costLabel="pts"
            costValue={boardFull ? null : multCost}
            currency="points"
            affordable={!boardFull && multCost !== null && state.points >= multCost}
            maxed={costs.mult === null || boardFull}
            onBuy={() => addCircle("mult")}
          />
          <UpgradeRow
            iconName="trending-up"
            iconColor="#ea580c"
            title="Exponential Circle"
            description="Raises the total to a fractional power. Extraordinary scaling — chain wisely."
            level={`${expCount} / ${MAX_EXP}`}
            costLabel="pts"
            costValue={boardFull ? null : expCost}
            currency="points"
            affordable={!boardFull && expCost !== null && state.points >= expCost}
            maxed={costs.exp === null || boardFull}
            onBuy={() => addCircle("exp")}
          />
        </View>

        {state.permDiscount > 0 ? (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Discount applied: {state.permDiscount * 10}% off all costs
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
    gap: 24,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  note: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  capacityRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  capacityText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textAlign: "center",
  },
});
