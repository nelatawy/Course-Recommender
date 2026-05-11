import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolateColor,
  Easing,
  FadeIn,
  withSequence,
} from "react-native-reanimated";
import { ChevronRight } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  ANIMATION,
} from "../constants/theme";

const { width, height } = Dimensions.get("window");

type OnboardingNav = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNav>();

  /* Shared animation values */
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);
  
  // Interaction values
  const hoverProgress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    /* Staggered entrance sequence */
    cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    cardOpacity.value = withTiming(1, { duration: ANIMATION.slow });

    titleY.value = withDelay(300, withSpring(0, { damping: 14 }));
    titleOpacity.value = withDelay(300, withTiming(1, { duration: ANIMATION.slow }));

    taglineY.value = withDelay(500, withSpring(0, { damping: 14 }));
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: ANIMATION.slow }));

    buttonScale.value = withDelay(700, withSpring(1, { damping: 10, stiffness: 80 }));
    buttonOpacity.value = withDelay(700, withTiming(1, { duration: ANIMATION.slow }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: taglineY.value }],
    opacity: taglineOpacity.value,
  }));

  const buttonEntranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  const animatedButtonContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      hoverProgress.value,
      [0, 1],
      [COLORS.midnight.DEFAULT, COLORS.text.primary]
    );
    const borderColor = interpolateColor(
      hoverProgress.value,
      [0, 1],
      ["rgba(0,0,0,0)", COLORS.midnight.DEFAULT]
    );
    return {
      backgroundColor,
      borderColor,
      borderWidth: 2,
      transform: [{ scale: pressScale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      hoverProgress.value,
      [0, 1],
      [COLORS.text.primary, COLORS.midnight.DEFAULT]
    );
    return { color };
  });

  const iconOpacityWhite = useAnimatedStyle(() => ({
    opacity: 1 - hoverProgress.value,
  }));

  const iconOpacityBlack = useAnimatedStyle(() => ({
    opacity: hoverProgress.value,
  }));

  const handleHoverIn = () => {
    hoverProgress.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  };

  const handleHoverOut = () => {
    hoverProgress.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  };

  const handlePressIn = () => {
    pressScale.value = withTiming(0.95, { duration: 150 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 150 });
  };

  const handleGetStarted = () => {
    pressScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 }, () => {
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      })
    );
  };

  return (
    <View style={styles.container}>
      {/* Decorative grid pattern (subtle) */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, styles.gridHorizontal, { top: `${(i + 1) * 14}%` }]} />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLine, styles.gridVertical, { left: `${(i + 1) * 20}%` }]} />
        ))}
      </View>

      <Animated.View style={[styles.card, cardStyle]}>
        {/* Title */}
        <Animated.Text style={[styles.title, titleStyle]}>Smart Advisor</Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Your intelligent course companion.{"\n"}Plan smarter, graduate faster.
        </Animated.Text>

        {/* Get Started button */}
        <Animated.View style={[styles.buttonWrapper, buttonEntranceStyle]}>
          <Pressable
            onPress={handleGetStarted}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={[styles.buttonContainer, animatedButtonContainerStyle]}>
              <Animated.Text style={[styles.buttonText, animatedTextStyle]}>
                Get Started
              </Animated.Text>
              
              <View style={{ width: 24, height: 24 }}>
                <Animated.View style={[StyleSheet.absoluteFill, iconOpacityWhite]}>
                  <ChevronRight color={COLORS.text.primary} size={24} strokeWidth={2.5} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, iconOpacityBlack]}>
                  <ChevronRight color={COLORS.midnight.DEFAULT} size={24} strokeWidth={2.5} />
                </Animated.View>
              </View>

            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Version tag */}
      <Animated.Text
        entering={FadeIn.delay(1200).duration(600)}
        style={styles.versionText}
      >
        v1.0.0
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.midnight.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING["2xl"],
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: COLORS.text.muted,
  },
  gridHorizontal: {
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  gridVertical: {
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  card: {
    backgroundColor: COLORS.text.primary, // White card
    borderRadius: BORDER_RADIUS["2xl"],
    padding: SPACING["3xl"],
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 20,
  },
  title: {
    fontFamily: FONTS.title,
    fontWeight: "bold",
    fontSize: FONT_SIZES["4xl"],
    color: COLORS.midnight.DEFAULT, // Bold black font
    letterSpacing: -1.5,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: SPACING["3xl"],
  },
  buttonWrapper: {
    width: "100%",
    marginTop: SPACING.md,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
  },
  versionText: {
    position: "absolute",
    bottom: SPACING["3xl"],
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.muted,
  },
});
