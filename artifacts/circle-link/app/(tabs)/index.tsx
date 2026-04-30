import React, { useCallback, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AchievementToast } from "@/components/AchievementToast";
import { GameBoard, type Mode } from "@/components/GameBoard";
import { ModeToolbar } from "@/components/ModeToolbar";
import { SettingsSheet } from "@/components/SettingsSheet";
import { StatsBar } from "@/components/StatsBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const TAB_BAR_HEIGHT = 84;

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("play");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { shuffleLayout } = useGame();

  const scale = useRef(new Animated.Value(1)).current;
  const scaleRef = useRef(1);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatsBar onOpenSettings={() => setSettingsOpen(true)} />
      <View style={styles.toolbarWrap}>
        <ModeToolbar mode={mode} onChangeMode={setMode} onResetView={resetView} />
      </View>
      <View
        style={[
          styles.boardSlot,
          { marginBottom: insets.bottom + TAB_BAR_HEIGHT },
        ]}
      >
        <GameBoard mode={mode} scale={scale} scaleRef={scaleRef} />
      </View>
      <AchievementToast />
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onResetView={resetView}
        onShuffleLayout={shuffleLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  boardSlot: {
    flex: 1,
  },
});
