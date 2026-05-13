import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";
import { useCourseStore, CourseDifficulty } from "../store/CourseContext";
import * as api from "../services/api";

const DIFFICULTIES: CourseDifficulty[] = ["Easy", "Medium", "Hard", "Very Hard"];
const DIFF_MAPPING: Record<CourseDifficulty, string> = {
  "Easy": "easy",
  "Medium": "medium",
  "Hard": "hard",
  "Very Hard": "very_hard"
};
const BACKEND_TO_FRONTEND: Record<string, CourseDifficulty> = {
  "easy": "Easy",
  "medium": "Medium",
  "hard": "Hard",
  "very_hard": "Very Hard"
};

const { width } = Dimensions.get("window");

export function AdvisorScreen() {
  const { state, dispatch } = useCourseStore();
  const student = state.currentStudent;
  const [activeMode, setActiveMode] = useState<"Suggested" | "Next">("Suggested");
  const tabPosition = useSharedValue(0);
  const diffPosition = useSharedValue(0);
  const [updatingDiff, setUpdatingDiff] = useState(false);

  const [aiRecs, setAiRecs] = useState<string[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [advisorEngine, setAdvisorEngine] = useState<"AI" | "Prolog">("AI");

  const [nextCourse, setNextCourse] = useState<{ course: string; reason: string } | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [nextError, setNextError] = useState<string | null>(null);

  const currentDiff = student?.preferred_difficulty
    ? (BACKEND_TO_FRONTEND[student.preferred_difficulty as unknown as string] || student.preferred_difficulty)
    : "Medium";

  useEffect(() => {
    diffPosition.value = withSpring(DIFFICULTIES.indexOf(currentDiff), {
      damping: 60,
      stiffness: 300,
    });
  }, [currentDiff]);

  const diffIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: diffPosition.value * ((width - SPACING.xl * 2 - 8) / 4),
        },
      ],
    };
  });

  const handleDifficultyChange = async (diff: CourseDifficulty) => {
    if (!student || updatingDiff || currentDiff === diff) return;
    setUpdatingDiff(true);
    try {
      const backendVal = DIFF_MAPPING[diff];
      await api.updateStudentPreferences(student.id, { preferred_difficulty: backendVal });
      // Update local state
      dispatch({ type: "UPDATE_STUDENT", payload: { preferred_difficulty: backendVal as any } });
      // Triggering recommendation change can be simulated or handled by data refetch
    } catch (err) {
      console.error("Failed to update difficulty preference", err);
    } finally {
      setUpdatingDiff(false);
    }
  };

  const handleModeChange = (mode: "Suggested" | "Next") => {
    setActiveMode(mode);
    tabPosition.value = withSpring(mode === "Suggested" ? 0 : 1, {
      damping: 45,
      stiffness: 300,
    });
  };

  const fetchPlan = async () => {
    if (!student) return;
    setLoadingRecs(true);
    setRecError(null);
    try {
      const res = advisorEngine === "AI" 
        ? await api.getAIRecommendations(student.id)
        : await api.getPrologRecommendations(student.id);

      if (res.status === "success") {
        setAiRecs(res.recommendations);
      } else {
        setRecError(res.message || "Failed to generate plan");
      }
    } catch (err:any) {
      setRecError(err.message || "Network error. Please try again.");
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchNextCourse = async () => {
    if (!student) return;
    setLoadingNext(true);
    setNextError(null);
    try {
      const res = await api.getAINextCourse(student.id);
      if (res.status === "success") {
        if (res.next_course) {
          setNextCourse({ course: res.next_course, reason: res.reason });
        } else {
          setNextCourse(null);
          setNextError(res.message || "No courses available.");
        }
      } else {
        setNextError(res.message || "Failed to get recommendation.");
      }
    } catch (err) {
      setNextError("Network error. Please try again.");
    } finally {
      setLoadingNext(false);
    }
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

        {/* Difficulty Preferences */}
        <View style={styles.prefsContainer}>
          <Text style={styles.prefsLabel}>Preferred Difficulty</Text>
          <View style={styles.toggleContainer}>
            <Animated.View style={[styles.diffIndicator, diffIndicatorStyle]} />
            {DIFFICULTIES.map((d) => {
              const isActive = currentDiff === d;
              return (
                <Pressable
                  key={d}
                  style={styles.toggleButton}
                  onPress={() => handleDifficultyChange(d)}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: isActive ? COLORS.midnight.DEFAULT : COLORS.text.primary }
                  ]}>
                    {d === "Very Hard" ? "V. Hard" : d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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

        {/* Engine Selector (Only for Suggested Plan) */}
        {activeMode === "Suggested" && (
          <View style={styles.engineContainer}>
            {["AI", "Prolog"].map((engine) => (
              <Pressable
                key={engine}
                style={[
                  styles.engineButton,
                  advisorEngine === engine && styles.engineButtonActive,
                ]}
                onPress={() => {
                  setAdvisorEngine(engine as any);
                  setAiRecs([]); // Clear current plan to force refetch
                }}
              >
                <Text
                  style={[
                    styles.engineButtonText,
                    advisorEngine === engine && styles.engineButtonTextActive,
                  ]}
                >
                  {engine}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={[
          styles.content, 
          (activeMode === "Suggested" && aiRecs.length > 0) || (activeMode === "Next" && nextCourse)
            ? { alignItems: "stretch", justifyContent: "flex-start" } 
            : {}
        ]}>
          {activeMode === "Suggested" ? (
            <View style={{ flex: 1, width: '100%' }}>
              {aiRecs.length === 0 && !loadingRecs && !recError && (
                <View style={styles.emptyState}>
                  <Text style={{ color: COLORS.text.secondary, marginBottom: SPACING.md }}>
                    Full course sequence will be displayed here.
                  </Text>
                  <Pressable style={styles.primaryButton} onPress={fetchPlan}>
                    <Text style={styles.primaryButtonText}>Get {advisorEngine} Plan</Text>
                  </Pressable>
                </View>
              )}
              {loadingRecs && (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={COLORS.accent.cyan} style={{ marginBottom: SPACING.md }} />
                  <Text style={{ color: COLORS.text.primary, fontFamily: FONTS.medium }}>
                    {advisorEngine === "AI" ? "Analyzing with AI..." : "Consulting Prolog..."}
                  </Text>
                </View>
              )}
{recError && (
    <View style={styles.errorCard}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>
            {recError.includes("Cycle") ? "Prerequisite Cycle Detected" : "Something went wrong"}
        </Text>
        <Text style={styles.errorMessage}>
            {recError.includes("Cycle")
                ? "Your course prerequisites form a circular dependency. Please ask your admin to fix it."
                : recError}
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => fetchPlan()}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
    </View>
)}
              {aiRecs.length > 0 && !loadingRecs && (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                    <Text style={styles.prefsLabel}>Your {advisorEngine} Plan</Text>
                    <Pressable onPress={fetchPlan}>
                      <Text style={{ color: COLORS.accent.cyan, fontSize: FONT_SIZES.xs, fontFamily: FONTS.semiBold }}>Regenerate</Text>
                    </Pressable>
                  </View>
                  {aiRecs.map((courseName, index) => (
                    <View key={`${courseName}-${index}`} style={styles.courseCard}>
                      <Text style={styles.courseNumber}>{index + 1}</Text>
                      <Text style={styles.courseName}>{courseName}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={{ flex: 1, width: '100%' }}>
              {!nextCourse && !loadingNext && !nextError && (
                <View style={styles.emptyState}>
                  <Text style={{ color: COLORS.text.secondary, marginBottom: SPACING.md, textAlign: 'center' }}>
                    AI will pick the single best course for you right now.
                  </Text>
                  <Pressable style={styles.primaryButton} onPress={fetchNextCourse}>
                    <Text style={styles.primaryButtonText}>What Should I Take Next?</Text>
                  </Pressable>
                </View>
              )}
              {loadingNext && (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={COLORS.accent.cyan} style={{ marginBottom: SPACING.md }} />
                  <Text style={{ color: COLORS.text.primary, fontFamily: FONTS.medium }}>Picking the best course...</Text>
                </View>
              )}
              {nextError && (
                <View style={styles.emptyState}>
                  <Text style={{ color: COLORS.accent.rose, fontFamily: FONTS.medium, marginBottom: SPACING.md }}>{nextError}</Text>
                  <Pressable style={styles.primaryButton} onPress={fetchNextCourse}>
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </Pressable>
                </View>
              )}
              {nextCourse && !loadingNext && (
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                    <Text style={styles.prefsLabel}>Your Next Course</Text>
                    <Pressable onPress={fetchNextCourse}>
                      <Text style={{ color: COLORS.accent.cyan, fontSize: FONT_SIZES.xs, fontFamily: FONTS.semiBold }}>Regenerate</Text>
                    </Pressable>
                  </View>
                  <View style={[styles.courseCard, { borderColor: COLORS.accent.cyan, borderWidth: 2 }]}>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: FONT_SIZES['2xl'], color: COLORS.accent.cyan, marginRight: SPACING.md }}>→</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courseName, { fontSize: FONT_SIZES.lg, marginBottom: 4 }]}>{nextCourse.course}</Text>
                      <Text style={{ color: COLORS.text.secondary, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm }}>{nextCourse.reason}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
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
  diffIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    width: "25%",
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
  prefsContainer: {
    marginBottom: SPACING.xl,
  },
  prefsLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.accent.cyan,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  primaryButtonText: {
    color: COLORS.midnight.DEFAULT,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.sm,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.dark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  courseNumber: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.accent.cyan,
    marginRight: SPACING.md,
    width: 24,
  },
  courseName: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    flex: 1,
  },
  engineContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface.dark,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  engineButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  engineButtonActive: {
    backgroundColor: COLORS.accent.cyan,
  },
  engineButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  engineButtonTextActive: {
    color: COLORS.midnight.DEFAULT,
  },
  errorCard: {
    backgroundColor: COLORS.surface.dark,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.accent.rose,
    width: "100%",
},
errorIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
},
errorTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.accent.rose,
    marginBottom: SPACING.sm,
    textAlign: "center",
},
errorMessage: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
},
});
