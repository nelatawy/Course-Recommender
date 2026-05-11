import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen } from "lucide-react-native";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "../constants/theme";

/**
 * Course Setup screen -- container for the course table,
 * dependency graph, and course grouping sections.
 * Placeholder implementation for Phase 2 checkpoint.
 */
export function CourseSetupScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Setup</Text>
        <Text style={styles.headerSubtitle}>
          Add your courses, define prerequisites, and organise groups.
        </Text>
      </View>
      <View style={styles.placeholderContainer}>
        <BookOpen color={COLORS.text.muted} size={48} strokeWidth={1.2} />
        <Text style={styles.placeholderText}>
          Course management coming in Phase 3
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.midnight.DEFAULT,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.base,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontWeight: "bold",
    fontSize: FONT_SIZES["3xl"],
    color: COLORS.text.primary,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.base,
    paddingBottom: 100,
  },
  placeholderText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.muted,
  },
});
