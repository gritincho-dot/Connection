import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { StatsBar } from "@/components/StatsBar";
import { UpgradeRow } from "@/components/UpgradeRow";
import { ACHIEVEMENTS } from "@/constants/game";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";
import { useSound } from "@/lib/sound";

export default function RebirthScreen() {
  const colors = useColors();
  const sound = useSound();
  const {
    state,
    costs,
    canRebirth,
    rebirth,
    buyPermPower,
    buyPermMult,
    buyPermDiscount,
  } = useGame();

  const onRebirth = () => {
    if (!canRebirth) return;
    if (Platform.OS === "web") {
      const ok = window.confirm(
        `Rebirth and gain ${costs.rebirthCpGain} circle points? Your run progress and shop upgrades will reset.`,
      );
      if (ok) {
        sound.play("chime", 1.0);
        rebirth();
      }
      return;
    }
    Alert.alert(
      "Rebirth?",
      `You will gain ${costs.rebirthCpGain} circle points. Run points and shop upgrades reset. Permanent upgrades are kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rebirth",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
            sound.play("chime", 1.0);
            rebirth();
          },
        },
      ],
    );
  };

  const earnedAchievements = ACHIEVEMENTS.filter((a) =>
    state.achievements.includes(a.id),
  );

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
            Rebirth
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Trade your run for permanent power
          </Text>
          {state.rebirthCount >= 1 ? (
            <Text style={[styles.subtitle, { color: "#facc15", marginTop: 4 }]}>
              ⚡ Chain Reactions unlocked — each release has a 28% chance to fire again for +50% bonus
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: colors.mutedForeground, marginTop: 4 }]}>
              First rebirth unlocks Chain Reactions — surprise 28% bonus triggers on release
            </Text>
          )}
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: canRebirth ? colors.accent : colors.border,
            },
          ]}
        >
          <View style={styles.heroRow}>
            <Feather
              name="refresh-cw"
              size={20}
              color={canRebirth ? colors.accent : colors.mutedForeground}
            />
            <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
              Next rebirth gives
            </Text>
          </View>
          <Text style={[styles.heroValue, { color: colors.foreground }]}>
            {formatNum(costs.rebirthCpGain)}{" "}
            <Text style={[styles.heroUnit, { color: colors.accent }]}>CP</Text>
          </Text>
          <View
            style={[styles.heroTrack, { backgroundColor: colors.muted }]}
          >
            <View
              style={[
                styles.heroFill,
                {
                  width: `${Math.min(
                    100,
                    (state.totalEarnedThisRun / costs.rebirthThreshold) * 100,
                  )}%`,
                  backgroundColor: canRebirth
                    ? colors.accent
                    : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.heroMeta, { color: colors.mutedForeground }]}>
            {formatNum(state.totalEarnedThisRun)} /{" "}
            {formatNum(costs.rebirthThreshold)} earned this run
          </Text>

          <Pressable
            onPress={onRebirth}
            disabled={!canRebirth}
            style={({ pressed }) => [
              styles.rebirthBtn,
              {
                backgroundColor: canRebirth ? colors.accent : colors.muted,
                opacity: pressed && canRebirth ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={
                canRebirth ? colors.accentForeground : colors.mutedForeground
              }
            />
            <Text
              style={[
                styles.rebirthBtnText,
                {
                  color: canRebirth
                    ? colors.accentForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {canRebirth ? "Rebirth now" : "Not enough yet"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Permanent upgrades
          </Text>
          <UpgradeRow
            iconName="zap"
            iconColor={colors.primary}
            title="Eternal Power"
            description={`+20% base release rate per level. Currently +${state.permPower * 20}%.`}
            level={`Lv ${state.permPower}`}
            costLabel="cp"
            costValue={costs.permPower}
            currency="cp"
            affordable={
              costs.permPower !== null && state.circlePoints >= costs.permPower
            }
            maxed={costs.permPower === null}
            onBuy={buyPermPower}
          />
          <UpgradeRow
            iconName="x"
            iconColor="#a855f7"
            title="Eternal Multiplier"
            description={`+20% to multiplier circle strength per level. Currently +${state.permMult * 20}%.`}
            level={`Lv ${state.permMult}`}
            costLabel="cp"
            costValue={costs.permMult}
            currency="cp"
            affordable={
              costs.permMult !== null && state.circlePoints >= costs.permMult
            }
            maxed={costs.permMult === null}
            onBuy={buyPermMult}
          />
          <UpgradeRow
            iconName="tag"
            iconColor="#10b981"
            title="Cheaper Upgrades"
            description={`-10% to all shop upgrade costs per level. Currently -${state.permDiscount * 10}%.`}
            level={`Lv ${state.permDiscount}`}
            costLabel="cp"
            costValue={costs.permDiscount}
            currency="cp"
            affordable={
              costs.permDiscount !== null &&
              state.circlePoints >= costs.permDiscount
            }
            maxed={costs.permDiscount === null}
            onBuy={buyPermDiscount}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Stats
          </Text>
          <View style={styles.statsGrid}>
            <StatCard label="Rebirths" value={String(state.rebirthCount)} />
            <StatCard label="Lifetime" value={formatNum(state.totalLifetime)} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="Best chain"
              value={String(state.bestChainLength)}
            />
            <StatCard
              label="Best release"
              value={formatNum(state.bestSingleEarning)}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="Releases"
              value={formatNum(state.totalReleases)}
            />
            <StatCard
              label="Achievements"
              value={`${earnedAchievements.length} / ${ACHIEVEMENTS.length}`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Achievements
          </Text>
          <View
            style={[
              styles.achievementsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {ACHIEVEMENTS.map((a) => {
              const earned = state.achievements.includes(a.id);
              return (
                <View key={a.id} style={styles.achievementRow}>
                  <Feather
                    name={earned ? "award" : "circle"}
                    size={16}
                    color={earned ? "#facc15" : colors.mutedForeground}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.achievementLabel,
                        {
                          color: earned
                            ? colors.foreground
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {a.label}
                    </Text>
                    <Text
                      style={[
                        styles.achievementSub,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {a.description}
                    </Text>
                  </View>
                  {earned ? (
                    <Text
                      style={[
                        styles.earnedTag,
                        { color: "#16a34a" },
                      ]}
                    >
                      Earned
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
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
    gap: 20,
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
  heroCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  heroValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 38,
    letterSpacing: -1,
  },
  heroUnit: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  heroTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  heroFill: {
    height: "100%",
    borderRadius: 4,
  },
  heroMeta: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  rebirthBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rebirthBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.3,
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
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  achievementsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  achievementLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  achievementSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 1,
  },
  earnedTag: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
