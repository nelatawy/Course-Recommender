import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, FONT_SIZES, SPACING } from "../constants/theme";
import { CourseTable } from "../components/CourseTable";
import { PrerequisiteGraph } from "../components/PrerequisiteGraph";
import { useCourseStore } from "../store/CourseContext";
import { Pressable } from "react-native";
import { LogOut } from "lucide-react-native";

/**
 * Course Setup screen -- container for the course table,
 * dependency graph, and course grouping sections.
 */
export function CourseSetupScreen() {
  const insets = useSafeAreaInsets();
  const { dispatch } = useCourseStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Course Catalog</Text>
            <Text style={styles.headerSubtitle}>
              View courses and prerequisites.
            </Text>
          </View>
          <Pressable 
            style={styles.logoutBtn} 
            onPress={() => dispatch({ type: "LOGOUT" })}
          >
            <LogOut color={COLORS.text.muted} size={20} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CourseTable readOnly={true} />
        <PrerequisiteGraph readOnly={true} />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface.light,
    borderRadius: 8,
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

