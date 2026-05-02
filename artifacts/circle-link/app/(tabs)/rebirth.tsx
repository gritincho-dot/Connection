import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { StatsBar } from "@/components/StatsBar";
import { UpgradeRow } from "@/components/UpgradeRow";
import { ACHIEVEMENTS, REBIRTH_REWARDS } from "@/constants/game";
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
    generateProgressCode,
    restoreFromCode,
  } = useGame();

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [restoreInput, setRestoreInput] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "ok" | "err">("idle");

  const handleGenerate = () => {
    const code = generateProgressCode();
    setGeneratedCode(code);
    setCopyStatus("idle");
    setRestoreStatus("idle");
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      // fallback: select the text manually
    }
  };

  const handleRestore = () => {
    if (!restoreInput.trim()) return;
    const doRestore = () => {
      const ok = restoreFromCode(restoreInput.trim());
      setRestoreStatus(ok ? "ok" : "err");
      if (ok) {
        setRestoreInput("");
        setGeneratedCode(null);
        setTimeout(() => setRestoreStatus("idle"), 3000);
      } else {
        setTimeout(() => setRestoreStatus("idle"), 3000);
      }
    };
    if (Platform.OS === "web") {
      const ok = window.confirm(
        "Restore progress from code? This will overwrite your current save.",
      );
      if (ok) doRestore();
    } else {
      Alert.alert(
        "Restore Progress?",
        "This will overwrite your current save with the progress from the code.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Restore", style: "destructive", onPress: doRestore },
        ],
      );
    }
  };

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
            affordable={state.circlePoints >= costs.permPower}
            maxed={false}
            enableHold
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
            affordable={state.circlePoints >= costs.permMult}
            maxed={false}
            enableHold
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
            enableHold
            onBuy={buyPermDiscount}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Rebirth Milestones
          </Text>
          {state.rebirthCount > 0 && state.rebirthCount <= REBIRTH_REWARDS.length ? (
            <View
              style={[
                styles.rewardCard,
                { backgroundColor: colors.card, borderColor: "#facc15" },
              ]}
            >
              <View style={styles.rewardRow}>
                <Feather name="star" size={14} color="#facc15" />
                <Text style={[styles.rewardTitle, { color: "#facc15" }]}>
                  Rebirth {state.rebirthCount} Reward Unlocked
                </Text>
              </View>
              <Text style={[styles.rewardLabel, { color: colors.foreground }]}>
                {REBIRTH_REWARDS[state.rebirthCount - 1].label}
              </Text>
              <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]}>
                {REBIRTH_REWARDS[state.rebirthCount - 1].description}
              </Text>
            </View>
          ) : null}
          {state.rebirthCount < REBIRTH_REWARDS.length ? (
            <View
              style={[
                styles.rewardCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.rewardRow}>
                <Feather name="lock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.rewardTitle, { color: colors.mutedForeground }]}>
                  Rebirth {state.rebirthCount + 1} Reward
                </Text>
              </View>
              <Text style={[styles.rewardLabel, { color: colors.foreground }]}>
                {REBIRTH_REWARDS[state.rebirthCount].label}
              </Text>
              <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]}>
                {REBIRTH_REWARDS[state.rebirthCount].description}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.rewardCard,
                { backgroundColor: colors.card, borderColor: "#facc15" },
              ]}
            >
              <View style={styles.rewardRow}>
                <Feather name="award" size={14} color="#facc15" />
                <Text style={[styles.rewardTitle, { color: "#facc15" }]}>
                  All 100 Rewards Unlocked
                </Text>
              </View>
              <Text style={[styles.rewardDesc, { color: colors.mutedForeground }]}>
                You have reached divine ascension. All milestone bonuses are active.
              </Text>
            </View>
          )}
          <Text style={[styles.rewardNote, { color: colors.mutedForeground }]}>
            {state.rebirthCount} / 100 milestones unlocked
          </Text>
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

        {/* ── Progress Code ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Progress Backup
          </Text>
          <View
            style={[
              styles.codeCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.codeDesc, { color: colors.mutedForeground }]}>
              Generate a code to save your progress. If your save is ever lost, paste it back here to recover.
            </Text>

            {/* Generate row */}
            <View style={styles.codeRow}>
              <Pressable
                onPress={handleGenerate}
                style={[styles.codeBtn, { backgroundColor: colors.accent }]}
              >
                <Feather name="download" size={14} color="#fff" />
                <Text style={styles.codeBtnText}>Generate Code</Text>
              </Pressable>
            </View>

            {/* Generated code display */}
            {generatedCode ? (
              <View style={styles.codeOutputWrap}>
                <TextInput
                  style={[
                    styles.codeOutput,
                    { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  value={generatedCode}
                  editable={false}
                  multiline
                  selectTextOnFocus
                />
                <Pressable
                  onPress={handleCopy}
                  style={[
                    styles.copyBtn,
                    { backgroundColor: copyStatus === "copied" ? "#16a34a" : colors.border },
                  ]}
                >
                  <Feather
                    name={copyStatus === "copied" ? "check" : "copy"}
                    size={14}
                    color={copyStatus === "copied" ? "#fff" : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      { color: copyStatus === "copied" ? "#fff" : colors.foreground },
                    ]}
                  >
                    {copyStatus === "copied" ? "Copied!" : "Copy"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Divider */}
            <View style={[styles.codeDivider, { backgroundColor: colors.border }]} />

            {/* Restore row */}
            <Text style={[styles.restoreLabel, { color: colors.mutedForeground }]}>
              Restore from code
            </Text>
            <TextInput
              style={[
                styles.restoreInput,
                {
                  color: colors.foreground,
                  borderColor:
                    restoreStatus === "err"
                      ? "#ef4444"
                      : restoreStatus === "ok"
                        ? "#16a34a"
                        : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Paste your CL-... code here"
              placeholderTextColor={colors.mutedForeground}
              value={restoreInput}
              onChangeText={(t) => { setRestoreInput(t); setRestoreStatus("idle"); }}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
            />
            {restoreStatus !== "idle" ? (
              <Text
                style={[
                  styles.restoreFeedback,
                  { color: restoreStatus === "ok" ? "#16a34a" : "#ef4444" },
                ]}
              >
                {restoreStatus === "ok"
                  ? "Progress restored successfully!"
                  : "Invalid or corrupted code. Please check and try again."}
              </Text>
            ) : null}
            <Pressable
              onPress={handleRestore}
              style={[
                styles.codeBtn,
                {
                  backgroundColor: restoreInput.trim()
                    ? "#dc2626"
                    : colors.border,
                  opacity: restoreInput.trim() ? 1 : 0.5,
                },
              ]}
              disabled={!restoreInput.trim()}
            >
              <Feather name="upload" size={14} color="#fff" />
              <Text style={styles.codeBtnText}>Restore Progress</Text>
            </Pressable>
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
  rewardCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  rewardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  rewardLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  rewardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  rewardNote: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
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
  codeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  codeDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  codeRow: {
    flexDirection: "row",
  },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  codeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#fff",
  },
  codeOutputWrap: {
    gap: 8,
  },
  codeOutput: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  copyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  codeDivider: {
    height: 1,
    marginVertical: 2,
  },
  restoreLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  restoreInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
  },
  restoreFeedback: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
