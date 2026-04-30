import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  Text,
} from "react-native";

import type { Mode } from "@/components/GameBoard";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/lib/sound";

type Props = {
  mode: Mode;
  onChangeMode: (mode: Mode) => void;
  onResetView?: () => void;
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
      onPress={onPress}
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

export function ModeToolbar({ mode, onChangeMode, onResetView }: Props) {
  const colors = useColors();
  const sound = useSound();

  const tap = (name: "tick" | "pop" = "tick") => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    sound.play(name, 1.05);
  };

  return (
    <View style={styles.row}>
      <ModeButton
        active={mode === "layout"}
        label="Layout"
        iconName="move"
        accent="#0f766e"
        onPress={() => {
          tap("tick");
          onChangeMode(mode === "layout" ? "play" : "layout");
        }}
      />
      <ModeButton
        active={mode === "upgrade"}
        label="Upgrade"
        iconName="zap"
        accent="#9333ea"
        onPress={() => {
          tap("tick");
          onChangeMode(mode === "upgrade" ? "play" : "upgrade");
        }}
      />
      {onResetView ? (
        <Pressable
          onPress={() => {
            tap("pop");
            onResetView();
          }}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name="maximize-2"
            size={15}
            color={colors.foreground}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
});
