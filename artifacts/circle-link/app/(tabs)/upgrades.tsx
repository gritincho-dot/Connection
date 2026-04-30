import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { StatsBar } from "@/components/StatsBar";
import { UpgradeRow } from "@/components/UpgradeRow";
import { MAX_EXP, MAX_MULT } from "@/constants/game";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export default function UpgradesScreen() {
  const colors = useColors();
  const {
    state,
    costs,
    applyDiscount,
    buyPower,
    buyMultiplierCircle,
    buyExponentialCircle,
  } = useGame();

  const powerCost = applyDiscount(costs.power);
  const multCost = costs.multiplier !== null ? applyDiscount(costs.multiplier) : null;
  const expCost = costs.exponential !== null ? applyDiscount(costs.exponential) : null;

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
            Connection power
          </Text>
          <UpgradeRow
            iconName="zap"
            iconColor={colors.primary}
            title="Connection Power"
            description={`+20% rate per level. Currently +${state.powerLevel * 20}%.`}
            level={`Lv ${state.powerLevel}`}
            costLabel="pts"
            costValue={powerCost}
            currency="points"
            affordable={state.points >= powerCost}
            onBuy={buyPower}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Add circles to the board
          </Text>
          <UpgradeRow
            iconName="x"
            iconColor="#a855f7"
            title="Multiplier Circle"
            description={`Adds a × node. Each one in a chain doubles its earnings.`}
            level={`${state.multiplierCount} / ${MAX_MULT}`}
            costLabel="pts"
            costValue={multCost}
            currency="points"
            affordable={multCost !== null && state.points >= multCost}
            maxed={costs.multiplier === null}
            onBuy={buyMultiplierCircle}
          />
          <UpgradeRow
            iconName="trending-up"
            iconColor="#f59e0b"
            title="Exponential Circle"
            description={`Adds a ^ node. Each one in a chain multiplies earnings by 1.85×.`}
            level={`${state.exponentialCount} / ${MAX_EXP}`}
            costLabel="pts"
            costValue={expCost}
            currency="points"
            affordable={expCost !== null && state.points >= expCost}
            maxed={costs.exponential === null}
            onBuy={buyExponentialCircle}
          />
        </View>

        {state.permDiscount > 0 ? (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>
            Discount applied: {state.permDiscount * 10}% off all upgrades
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
    paddingBottom: 120,
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
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
