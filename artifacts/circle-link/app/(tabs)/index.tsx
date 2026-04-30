import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameBoard, type Mode } from "@/components/GameBoard";
import { ModeToolbar } from "@/components/ModeToolbar";
import { StatsBar } from "@/components/StatsBar";
import { useColors } from "@/hooks/useColors";

const TAB_BAR_HEIGHT = 84;

export default function GameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("play");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatsBar />
      <View style={styles.toolbarWrap}>
        <ModeToolbar mode={mode} onChangeMode={setMode} />
      </View>
      <View
        style={[
          styles.boardSlot,
          { marginBottom: insets.bottom + TAB_BAR_HEIGHT },
        ]}
      >
        <GameBoard mode={mode} />
      </View>
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
