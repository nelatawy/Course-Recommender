import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "../constants/theme";
import { CourseTable } from "../components/CourseTable";
import { PrerequisiteGraph } from "../components/PrerequisiteGraph";
import { CourseGrouping } from "../components/CourseGrouping";

/**
 * Course Setup screen -- container for the course table,
 * dependency graph, and course grouping sections.
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CourseTable />
        <PrerequisiteGraph />
        <CourseGrouping />
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 120, // Extra space for the bottom tab bar
  },
});

