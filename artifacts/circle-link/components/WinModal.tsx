import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSave } from "@/context/SaveContext";
import { useGame } from "@/context/GameContext";
import { getDifficulty } from "@/constants/game";
import { formatNum } from "@/lib/format";

const PRIMARY = "#0f766e";
const FG = "#1a1714";
const MUTED = "#7a7159";

export function WinModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const { activeSlot, recordWin, exitToMenu } = useSave();
  const router = useRouter();
  const winRecorded = useRef(false);
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      winRecorded.current = false;
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  useEffect(() => {
    if (visible && !winRecorded.current && activeSlot !== null) {
      winRecorded.current = true;
      recordWin({
        slot: activeSlot,
        date: new Date().toISOString(),
        totalLifetime: state.totalLifetime,
        rebirthCount: state.rebirthCount,
      });
    }
  }, [visible, activeSlot, recordWin, state.totalLifetime, state.rebirthCount]);

  const handleReturnToMenu = () => {
    onClose();
    exitToMenu();
    router.replace("/");
  };

  const diff = getDifficulty(state.difficultyKey ?? "easy");

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              paddingBottom: insets.bottom + 24,
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>You Win!</Text>
          <Text style={styles.subtitle}>
            You reached {diff.subLabel} — {diff.description}!
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNum(state.totalLifetime)}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.rebirthCount}</Text>
              <Text style={styles.statLabel}>Rebirths</Text>
            </View>
          </View>

          <Text style={styles.note}>
            This win has been recorded in your Stats.
          </Text>

          <TouchableOpacity onPress={handleReturnToMenu} style={styles.menuBtn} activeOpacity={0.85}>
            <Text style={styles.menuBtnText}>Return to Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(26,23,20,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: FG,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: MUTED,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#d1fae5",
    marginHorizontal: 8,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: MUTED,
  },
  note: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    marginBottom: 24,
  },
  menuBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
  },
  menuBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#fff",
  },
});
