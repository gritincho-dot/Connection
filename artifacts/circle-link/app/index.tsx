import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DIFFICULTIES, type Difficulty, type DifficultyKey } from "@/constants/game";
import { useSave, type SaveSlotMeta } from "@/context/SaveContext";
import { formatDate, formatNum } from "@/lib/format";

const BG = "#fafaf7";
const FG = "#1a1714";
const MUTED = "#7a7159";
const BORDER = "#e5e2d6";
const CARD = "#ffffff";
const PRIMARY = "#0f766e";
const ACCENT = "#9333ea";
const DESTRUCTIVE = "#dc2626";

function timeSince(ts: number): string {
  if (!ts) return "Never played";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DecorativeCircle({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    />
  );
}

type DeleteConfirmProps = {
  slot: SaveSlotMeta;
  onConfirm: () => void;
  onCancel: () => void;
};

function DeleteConfirmModal({ slot, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.confirmCard}>
        <View style={styles.confirmIconRow}>
          <View style={[styles.confirmIcon, { backgroundColor: "#fee2e2" }]}>
            <Feather name="trash-2" size={22} color={DESTRUCTIVE} />
          </View>
        </View>
        <Text style={styles.confirmTitle}>Delete Save {slot.slot + 1}?</Text>
        <Text style={styles.confirmBody}>
          This will permanently delete all progress on Save {slot.slot + 1}. This
          cannot be undone.
        </Text>
        <View style={styles.confirmButtons}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type SlotCardProps = {
  meta: SaveSlotMeta;
  onPress: () => void;
  onLongPress: () => void;
};

function SlotCard({ meta, onPress, onLongPress }: SlotCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={600}
      activeOpacity={0.75}
      style={[styles.slotCard, meta.hasWon && { borderColor: "#fbbf24", borderWidth: 2 }]}
    >
      <View style={styles.slotLeft}>
        <View style={[styles.slotBadge, { backgroundColor: meta.exists ? (meta.hasWon ? "#fef3c7" : "#f0fdf4") : "#f0ede4" }]}>
          <Text style={[styles.slotBadgeText, { color: meta.exists ? (meta.hasWon ? "#92400e" : PRIMARY) : MUTED }]}>
            {meta.exists ? (meta.hasWon ? "👑" : "●") : "○"}
          </Text>
        </View>
        <View style={styles.slotInfo}>
          <Text style={styles.slotTitle}>Save {meta.slot + 1}</Text>
          {meta.exists ? (
            <>
              <Text style={styles.slotSub}>
                {meta.hasWon ? "🏆 Completed · " : ""}{meta.rebirthCount} rebirth{meta.rebirthCount !== 1 ? "s" : ""} · {formatNum(meta.totalLifetime)} earned
              </Text>
              <Text style={styles.slotTime}>{timeSince(meta.lastPlayed)}</Text>
            </>
          ) : (
            <Text style={styles.slotSub}>Empty — start a new game</Text>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={MUTED} />
    </TouchableOpacity>
  );
}

type DifficultyPickerProps = {
  slot: 0 | 1 | 2;
  currentDifficulty?: DifficultyKey;
  onSelect: (slot: 0 | 1 | 2, difficulty: DifficultyKey) => void;
  onBack: () => void;
};

function DifficultyPicker({ slot, currentDifficulty, onSelect, onBack }: DifficultyPickerProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<DifficultyKey>(currentDifficulty ?? "easy");

  return (
    <View style={[styles.sheetCard, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.sheetHandle} />
      <View style={styles.difficultyHeader}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={MUTED} />
        </Pressable>
        <Text style={styles.sheetTitle}>Choose Difficulty</Text>
      </View>
      <Text style={styles.sheetSub}>Save {slot + 1} — pick your challenge</Text>

      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          {DIFFICULTIES.map((d: Difficulty) => {
            const active = selected === d.key;
            return (
              <Pressable
                key={d.key}
                onPress={() => setSelected(d.key)}
                style={[
                  styles.diffCard,
                  {
                    borderColor: active ? d.color : BORDER,
                    borderWidth: active ? 2 : 1,
                    backgroundColor: active ? d.color + "11" : CARD,
                  },
                ]}
              >
                <View style={styles.diffLeft}>
                  <Text style={styles.diffEmoji}>{d.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.diffTitleRow}>
                      <Text style={[styles.diffLabel, { color: FG }]}>{d.label}</Text>
                      <Text style={[styles.diffSubLabel, { color: d.color }]}>{d.subLabel}</Text>
                    </View>
                    <Text style={[styles.diffDesc, { color: MUTED }]}>{d.description}</Text>
                  </View>
                </View>
                {active ? (
                  <Feather name="check-circle" size={20} color={d.color} />
                ) : (
                  <Feather name="circle" size={20} color={BORDER} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => onSelect(slot, selected)}
        style={[styles.primaryBtn, { marginTop: 16 }]}
        activeOpacity={0.85}
      >
        <Feather name="play" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

function PlayModal({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { slots, selectSlot, deleteSlot } = useSave();
  const router = useRouter();
  const [deletingSlot, setDeletingSlot] = useState<SaveSlotMeta | null>(null);
  const [pickingDifficultyForSlot, setPickingDifficultyForSlot] = useState<SaveSlotMeta | null>(null);

  const handleSelect = (meta: SaveSlotMeta) => {
    setPickingDifficultyForSlot(meta);
  };

  const handleDifficultySelect = (slot: 0 | 1 | 2, difficulty: DifficultyKey) => {
    selectSlot(slot, difficulty);
    onClose();
    router.replace("/(tabs)");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSlot) return;
    await deleteSlot(deletingSlot.slot as 0 | 1 | 2);
    setDeletingSlot(null);
  };

  if (pickingDifficultyForSlot) {
    return (
      <View style={styles.modalOverlay}>
        <DifficultyPicker
          slot={pickingDifficultyForSlot.slot as 0 | 1 | 2}
          currentDifficulty={pickingDifficultyForSlot.difficultyKey}
          onSelect={handleDifficultySelect}
          onBack={() => setPickingDifficultyForSlot(null)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.modalOverlay]}>
      <View style={[styles.sheetCard, { paddingBottom: insets.bottom + 24 }]}>
        {deletingSlot ? (
          <DeleteConfirmModal
            slot={deletingSlot}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingSlot(null)}
          />
        ) : null}
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Choose Save File</Text>
        <Text style={styles.sheetSub}>Long-press a save to delete it</Text>
        <View style={styles.slotList}>
          {slots.map((meta) => (
            <SlotCard
              key={meta.slot}
              meta={meta}
              onPress={() => handleSelect(meta)}
              onLongPress={() => {
                if (meta.exists) setDeletingSlot(meta);
              }}
            />
          ))}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatsModal({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { globalStats } = useSave();
  const wins = globalStats.wins;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.sheetCard, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Stats</Text>
        <Text style={styles.sheetSub}>Your achievements across all saves</Text>

        <View style={[styles.statRow, { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 16, marginBottom: 16 }]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wins.length}</Text>
            <Text style={styles.statLabel}>Total Wins</Text>
          </View>
          <View style={[styles.statDivider]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wins.reduce((a, w) => a + w.rebirthCount, 0)}</Text>
            <Text style={styles.statLabel}>Total Rebirths</Text>
          </View>
        </View>

        {wins.length === 0 ? (
          <View style={styles.emptyWins}>
            <Text style={styles.emptyWinsIcon}>🏆</Text>
            <Text style={styles.emptyWinsTitle}>No wins yet</Text>
            <Text style={styles.emptyWinsSub}>
              Reach your goal to earn a win!
            </Text>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.winListTitle}>Win History</Text>
            {[...wins].reverse().map((w, i) => (
              <View key={i} style={styles.winCard}>
                <View style={styles.winCardLeft}>
                  <Text style={styles.winCardSlot}>{w.slotLabel}</Text>
                  <Text style={styles.winCardDate}>{formatDate(w.date)}</Text>
                </View>
                <View style={styles.winCardRight}>
                  <Text style={styles.winCardRb}>{w.rebirthCount} rb</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { marginTop: 8 }]}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [showPlay, setShowPlay] = useState(false);
  const [showStats, setShowStats] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Modal visible={showPlay} transparent animationType="slide" onRequestClose={() => setShowPlay(false)}>
        <PlayModal onClose={() => setShowPlay(false)} />
      </Modal>
      <Modal visible={showStats} transparent animationType="slide" onRequestClose={() => setShowStats(false)}>
        <StatsModal onClose={() => setShowStats(false)} />
      </Modal>

      <View style={styles.heroSection}>
        <View style={styles.circleCluster}>
          <DecorativeCircle size={90} color={PRIMARY} style={{ position: "absolute", top: 0, left: 20 }} />
          <DecorativeCircle size={56} color={ACCENT} style={{ position: "absolute", top: 30, left: 90 }} />
          <DecorativeCircle size={40} color="#f59e0b" style={{ position: "absolute", top: 60, left: 10 }} />
        </View>
        <Text style={styles.title}>Circle Link</Text>
        <Text style={styles.subtitle}>Chain · Multiply · Ascend</Text>
        <Text style={styles.goal}>Choose your difficulty after picking a save</Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity onPress={() => setShowPlay(true)} style={styles.primaryBtn} activeOpacity={0.85}>
          <Feather name="play" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Play</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowStats(true)} style={styles.secondaryBtn} activeOpacity={0.85}>
          <Feather name="bar-chart-2" size={20} color={FG} />
          <Text style={styles.secondaryBtnText}>Stats</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Long-press a save slot to delete it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 32,
  },
  circleCluster: {
    width: 160,
    height: 110,
    position: "relative",
    marginBottom: 32,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: FG,
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 8,
  },
  goal: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: MUTED,
    marginTop: 12,
    backgroundColor: "#f0ede4",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
    textAlign: "center",
  },
  menuSection: {
    width: "100%",
    paddingHorizontal: 32,
    gap: 12,
    paddingBottom: 32,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  secondaryBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: FG,
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: MUTED,
    paddingBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,23,20,0.5)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: FG,
    marginBottom: 4,
  },
  sheetSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: MUTED,
    marginBottom: 20,
  },
  slotList: {
    gap: 10,
    marginBottom: 16,
  },
  slotCard: {
    backgroundColor: "#fafaf7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  slotBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  slotBadgeText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  slotInfo: {
    flex: 1,
  },
  slotTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: FG,
  },
  slotSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  slotTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  closeBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f0ede4",
  },
  closeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: FG,
  },
  confirmCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  confirmIconRow: {
    marginBottom: 16,
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: FG,
    marginBottom: 10,
  },
  confirmBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#f0ede4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: FG,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: DESTRUCTIVE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: BORDER,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: PRIMARY,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  emptyWins: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyWinsIcon: {
    fontSize: 40,
  },
  emptyWinsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: FG,
  },
  emptyWinsSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
  },
  winListTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  winCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafaf7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  winCardLeft: {
    gap: 2,
  },
  winCardSlot: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: FG,
  },
  winCardDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  winCardRight: {
    alignItems: "flex-end",
  },
  winCardRb: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: PRIMARY,
  },
  difficultyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    padding: 4,
  },
  diffCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
  },
  diffLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  diffEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  diffTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 2,
  },
  diffLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  diffSubLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  diffDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
});
