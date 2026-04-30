import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { StatsBar } from "@/components/StatsBar";
import { UpgradeRow } from "@/components/UpgradeRow";
import { MAX_ADD, MAX_EXP, MAX_MULT } from "@/constants/game";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function UpgradesScreen() {
  const colors = useColors();
  const { state, costs, applyDiscount, buyEnergy, addCircle } = useGame();

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
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Each new circle gets a random value between 1 and 10. Use the
            Upgrade button on the play board to re-roll its value.
          </Text>
          <UpgradeRow
            iconName="plus"
            iconColor="#16a34a"
            title="Addition Circle"
            description="Adds its value to the chain's base before multipliers."
            level={`${addCount} / ${MAX_ADD}`}
            costLabel="pts"
            costValue={addCost}
            currency="points"
            affordable={addCost !== null && state.points >= addCost}
            maxed={costs.add === null}
            onBuy={() => addCircle("add")}
          />
          <UpgradeRow
            iconName="x"
            iconColor="#9333ea"
            title="Multiplication Circle"
            description="Multiplies the chain's running total by its value."
            level={`${multCount} / ${MAX_MULT}`}
            costLabel="pts"
            costValue={multCost}
            currency="points"
            affordable={multCost !== null && state.points >= multCost}
            maxed={costs.mult === null}
            onBuy={() => addCircle("mult")}
          />
          <UpgradeRow
            iconName="trending-up"
            iconColor="#ea580c"
            title="Exponential Circle"
            description="Raises the chain's running total to a power based on its value."
            level={`${expCount} / ${MAX_EXP}`}
            costLabel="pts"
            costValue={expCost}
            currency="points"
            affordable={expCost !== null && state.points >= expCost}
            maxed={costs.exp === null}
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
});
