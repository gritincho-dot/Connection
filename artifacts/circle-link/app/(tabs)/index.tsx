import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AchievementToast } from "@/components/AchievementToast";
import { GameBoard, type Mode } from "@/components/GameBoard";
import { ModeToolbar } from "@/components/ModeToolbar";
import { SettingsSheet } from "@/components/SettingsSheet";
import { StatsBar } from "@/components/StatsBar";
import { WinModal } from "@/components/WinModal";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const TAB_BAR_HEIGHT = 84;

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("play");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { shuffleLayout, state } = useGame();

  const scale = useRef(new Animated.Value(1)).current;
  const scaleRef = useRef(1);
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panXRef = useRef(0);
  const panYRef = useRef(0);

  // Track win as a false→true transition this session only.
  // Saves start with hasWon=true if already won; we must NOT show the modal on load.
  const prevHasWon = useRef(state.hasWon);
  const [freshWin, setFreshWin] = useState(false);
  useEffect(() => {
    if (state.hasWon && !prevHasWon.current) {
      setFreshWin(true);
    }
    prevHasWon.current = state.hasWon;
  }, [state.hasWon]);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    panXRef.current = 0;
    panYRef.current = 0;
    Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    Animated.spring(panAnim, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: true }).start();
  }, [scale, panAnim]);

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
        <GameBoard
          mode={mode}
          onResetView={resetView}
          scale={scale}
          scaleRef={scaleRef}
          panAnim={panAnim}
          panXRef={panXRef}
          panYRef={panYRef}
        />
      </View>
      <WinModal visible={freshWin} onClose={() => setFreshWin(false)} />
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
