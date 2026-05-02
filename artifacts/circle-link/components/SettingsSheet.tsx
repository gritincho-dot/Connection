import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useGame } from "@/context/GameContext";
import { useSave } from "@/context/SaveContext";
import { useColors } from "@/hooks/useColors";
import { type BgVariant } from "@/lib/theme";
import { useSound } from "@/lib/sound";

type Props = {
  visible: boolean;
  onClose: () => void;
  onResetView: () => void;
  onShuffleLayout: () => void;
};

const VARIANTS: { key: BgVariant; label: string; sample: string }[] = [
  { key: "white", label: "White", sample: "#fafaf7" },
  { key: "gray", label: "Gray", sample: "#cdc8b8" },
  { key: "black", label: "Black", sample: "#15120e" },
];

export function SettingsSheet({
  visible,
  onClose,
  onResetView,
  onShuffleLayout,
}: Props) {
  const colors = useColors();
  const sound = useSound();
  const { state, setSoundEnabled, setBgVariant } = useGame();
  const { exitToMenu } = useSave();
  const router = useRouter();

  const tapSound = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    sound.play("tick", 1.1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Settings
            </Text>
            <Pressable
              onPress={() => {
                tapSound();
                onClose();
              }}
              hitSlop={10}
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Sound effects
                </Text>
                <Text
                  style={[styles.rowSub, { color: colors.mutedForeground }]}
                >
                  Clicks, releases, and chimes
                </Text>
              </View>
              <Switch
                value={state.settings.soundEnabled}
                onValueChange={(v) => {
                  setSoundEnabled(v);
                  if (Platform.OS !== "web")
                    Haptics.selectionAsync().catch(() => {});
                }}
                trackColor={{
                  false: colors.muted,
                  true: colors.primary,
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Background color
            </Text>
            <View style={styles.bgRow}>
              {VARIANTS.map((v) => {
                const active = state.settings.bgVariant === v.key;
                return (
                  <Pressable
                    key={v.key}
                    onPress={() => {
                      tapSound();
                      setBgVariant(v.key);
                    }}
                    style={[
                      styles.bgOption,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        borderWidth: active ? 2 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.bgSample,
                        { backgroundColor: v.sample },
                      ]}
                    />
                    <Text
                      style={[
                        styles.bgLabel,
                        { color: colors.foreground },
                      ]}
                    >
                      {v.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Board
            </Text>
            <Pressable
              onPress={() => {
                tapSound();
                onResetView();
                onClose();
              }}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather name="maximize-2" size={16} color={colors.foreground} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Reset zoom
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                sound.play("whoosh", 1.0);
                if (Platform.OS !== "web")
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Medium,
                  ).catch(() => {});
                onShuffleLayout();
                onClose();
              }}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather name="shuffle" size={16} color={colors.foreground} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>
                Re-arrange circles
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Pressable
              onPress={() => {
                onClose();
                router.replace("/");
                setTimeout(() => exitToMenu(), 80);
              }}
              style={[styles.mainMenuBtn]}
            >
              <Feather name="home" size={16} color="#fff" />
              <Text style={styles.mainMenuText}>Main Menu</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  rowSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  bgRow: {
    flexDirection: "row",
    gap: 10,
  },
  bgOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
    borderRadius: 12,
  },
  bgSample: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.15)",
  },
  bgLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  mainMenuBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
  },
  mainMenuText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#fff",
    letterSpacing: 0.2,
  },
});
