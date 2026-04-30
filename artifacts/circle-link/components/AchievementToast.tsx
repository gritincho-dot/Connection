import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ACHIEVEMENTS } from "@/constants/game";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { useSound } from "@/lib/sound";

export function AchievementToast() {
  const colors = useColors();
  const sound = useSound();
  const insets = useSafeAreaInsets();
  const { pendingAchievement, acknowledgeAchievement } = useGame();
  const slide = useRef(new Animated.Value(0)).current;
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingAchievement) return;
    if (pendingAchievement === lastShown.current) return;
    lastShown.current = pendingAchievement;

    sound.play("chime", 1.05);

    Animated.sequence([
      Animated.timing(slide, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.delay(2400),
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      acknowledgeAchievement(pendingAchievement);
      lastShown.current = null;
    });
  }, [pendingAchievement, slide, sound, acknowledgeAchievement]);

  if (!pendingAchievement) return null;

  const a = ACHIEVEMENTS.find((x) => x.id === pendingAchievement);
  if (!a) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + 60,
          backgroundColor: colors.foreground,
          borderColor: colors.border,
          opacity: slide,
          transform: [
            {
              translateY: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Feather name="award" size={18} color="#facc15" />
      <Text style={[styles.label, { color: colors.background }]}>
        {a.label}
      </Text>
      <Text style={[styles.sub, { color: colors.background, opacity: 0.7 }]}>
        {a.description}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 10,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
  },
});
