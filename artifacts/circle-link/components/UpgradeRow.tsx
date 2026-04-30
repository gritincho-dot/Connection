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

import { useColors } from "@/hooks/useColors";
import { formatNum } from "@/lib/format";

type Props = {
  iconName: React.ComponentProps<typeof Feather>["name"];
  iconColor?: string;
  title: string;
  description: string;
  level?: string;
  costLabel: string;
  costValue: number | null;
  currency: "points" | "cp";
  affordable: boolean;
  maxed?: boolean;
  onBuy: () => void;
};

export function UpgradeRow({
  iconName,
  iconColor,
  title,
  description,
  level,
  costLabel,
  costValue,
  currency,
  affordable,
  maxed,
  onBuy,
}: Props) {
  const colors = useColors();
  const accent = iconColor ?? colors.primary;
  const disabled = maxed || costValue === null || !affordable;

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onBuy();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: pressed && !disabled ? accent : colors.border,
          opacity: disabled ? 0.55 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: accent + "22", borderColor: accent + "55" },
        ]}
      >
        <Feather name={iconName} size={18} color={accent} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {level ? (
            <Text style={[styles.level, { color: colors.mutedForeground }]}>
              {level}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          {description}
        </Text>
      </View>
      <View style={styles.costBlock}>
        {maxed || costValue === null ? (
          <Text style={[styles.maxed, { color: colors.mutedForeground }]}>
            MAX
          </Text>
        ) : (
          <>
            <Text
              style={[
                styles.costValue,
                {
                  color: affordable ? colors.foreground : colors.mutedForeground,
                },
              ]}
            >
              {formatNum(costValue)}
            </Text>
            <Text
              style={[
                styles.costLabel,
                {
                  color:
                    currency === "cp" ? colors.accent : colors.mutedForeground,
                },
              ]}
            >
              {costLabel}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  level: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  costBlock: {
    alignItems: "flex-end",
    minWidth: 56,
  },
  costValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  costLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 1,
  },
  maxed: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
});
