import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";

const { width } = Dimensions.get("window");

export function AdvisorScreen() {
  const [activeMode, setActiveMode] = useState<"Suggested" | "Next">("Suggested");
  const tabPosition = useSharedValue(0);

  const handleModeChange = (mode: "Suggested" | "Next") => {
    setActiveMode(mode);
    tabPosition.value = withSpring(mode === "Suggested" ? 0 : 1, {
      damping: 20,
      stiffness: 200,
    });
  };

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: tabPosition.value * ((width - SPACING.xl * 2 - 8) / 2),
        },
      ],
    };
  });

  const suggestedTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(tabPosition.value, [0, 1], [COLORS.midnight.DEFAULT, COLORS.text.primary]),
    };
  });

  const nextTextStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(tabPosition.value, [0, 1], [COLORS.text.primary, COLORS.midnight.DEFAULT]),
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Smart Advisor</Text>
          <Text style={styles.headerSubtitle}>Get personalized recommendations.</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.toggleContainer}>
          <Animated.View style={[styles.toggleIndicator, indicatorStyle]} />
          
          <Pressable style={styles.toggleButton} onPress={() => handleModeChange("Suggested")}>
            <Animated.Text style={[styles.toggleText, suggestedTextStyle]}>Suggested Order</Animated.Text>
          </Pressable>

          <Pressable style={styles.toggleButton} onPress={() => handleModeChange("Next")}>
            <Animated.Text style={[styles.toggleText, nextTextStyle]}>Recommend Next</Animated.Text>
          </Pressable>
        </View>
        
        <View style={styles.content}>
          <Text style={{ color: COLORS.text.secondary }}>
            {activeMode === "Suggested" 
              ? "Full course sequence will be displayed here." 
              : "Next course recommendation will be displayed here."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.midnight.DEFAULT,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  header: {
    marginBottom: SPACING["2xl"],
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontWeight: "bold",
    fontSize: FONT_SIZES["3xl"],
    color: COLORS.text.primary,
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface.dark,
    borderRadius: BORDER_RADIUS.xl,
    padding: 4,
    position: "relative",
    marginBottom: SPACING["2xl"],
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  toggleIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    width: "50%",
    backgroundColor: COLORS.text.primary,
    borderRadius: BORDER_RADIUS.lg - 2,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  toggleText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100, // Space for bottom tab bar
  },
});
