import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Mode } from "@/components/GameBoard";
import { useColors } from "@/hooks/useColors";

type Props = {
  mode: Mode;
  onChangeMode: (mode: Mode) => void;
};

const tap = () => {
  if (Platform.OS !== "web") {
    Haptics.selectionAsync().catch(() => {});
  }
};

function ModeButton({
  active,
  label,
  iconName,
  accent,
  onPress,
}: {
  active: boolean;
  label: string;
  iconName: React.ComponentProps<typeof Feather>["name"];
  accent: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: active ? accent : colors.card,
          borderColor: active ? accent : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather
        name={iconName}
        size={15}
        color={active ? "#ffffff" : colors.foreground}
      />
      <Text
        style={[
          styles.btnText,
          { color: active ? "#ffffff" : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ModeToolbar({ mode, onChangeMode }: Props) {
  return (
    <View style={styles.row}>
      <ModeButton
        active={mode === "layout"}
        label="Layout"
        iconName="move"
        accent="#0f766e"
        onPress={() => onChangeMode(mode === "layout" ? "play" : "layout")}
      />
      <ModeButton
        active={mode === "upgrade"}
        label="Upgrade"
        iconName="zap"
        accent="#9333ea"
        onPress={() => onChangeMode(mode === "upgrade" ? "play" : "upgrade")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
