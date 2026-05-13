import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Plus, Trash2, Check, Star } from "lucide-react-native";
import LottieView from "lottie-react-native";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LEVEL_COLORS,
  DIFFICULTY_COLORS,
} from "../constants/theme";
import { useCourseStore, Course } from "../store/CourseContext";
import { AddCourseModal } from "./AddCourseModal";
import * as api from "../services/api";

const AnimatedStar = ({ isPreferred, onPress }: { isPreferred: boolean; onPress: () => void }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(1.4, { damping: 12, stiffness: 300 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View style={animatedStyle}>
        <Star
          color={isPreferred ? COLORS.accent.amber : COLORS.text.muted}
          fill={isPreferred ? COLORS.accent.amber : "transparent"}
          size={18}
          strokeWidth={isPreferred ? 2 : 1.5}
        />
      </Animated.View>
    </Pressable>
  );
};

const CourseRow = ({
  course,
  isPreferred,
  onEdit,
  onToggle,
  onTogglePreferred,
  onDelete,
  readOnly,
  showStar,
}: {
  course: Course;
  isPreferred: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onTogglePreferred: () => void;
  onDelete: () => void;
  readOnly?: boolean;
  showStar?: boolean;
}) => {
  const bgColor = useSharedValue<string>(COLORS.surface.DEFAULT);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={styles.rowPressable}>
        {/* 
          Use TouchableOpacity instead of Pressable — TouchableOpacity reliably fires
          inside ScrollViews on both iOS and Android, unlike nested Pressables.
        */}
        <TouchableOpacity
          onPress={onToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          style={[styles.checkbox, course.taken && styles.checkboxActive]}
        >
          {course.taken && <Check color={COLORS.text.inverse} size={14} strokeWidth={3} />}
        </TouchableOpacity>

        {/* Row content is pressable for editing (admin only) */}
        <Pressable
          style={styles.rowContent}
          onPress={readOnly ? undefined : onEdit}
          onHoverIn={() => {
            if (readOnly) return;
            bgColor.value = withTiming(COLORS.surface.light, { duration: 200 });
          }}
          onHoverOut={() => {
            if (readOnly) return;
            bgColor.value = withTiming(COLORS.surface.DEFAULT, { duration: 200 });
          }}
        >
          <View style={styles.info}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
              {showStar && <AnimatedStar isPreferred={isPreferred} onPress={onTogglePreferred} />}
              <Text style={styles.name}>{course.name}</Text>
            </View>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: LEVEL_COLORS[course.level] }]}>
                <Text style={styles.badgeText}>L{course.level}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: DIFFICULTY_COLORS[course.difficulty] }]}>
                <Text style={styles.badgeText}>{course.difficulty}</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {!readOnly && (
          <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
            <Trash2 color={COLORS.accent.rose} size={18} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

export function CourseTable({ readOnly = false }: { readOnly?: boolean }) {
  const { state, dispatch, isCourseTaken } = useCourseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleAddCourse = async (name: string, level: Course["level"], difficulty: Course["difficulty"]) => {
    try {
      if (editingCourse) {
        const res = await api.updateCourse(editingCourse.id, {
    name,
    level,
    difficulty: difficulty.toLowerCase().replace(" ", "_")
}, state.adminKey!);
        if (res.status === "success") {
          dispatch({
            type: "UPDATE_COURSE",
            payload: { ...editingCourse, name, level, difficulty: res.course.difficulty || difficulty },
          });
        }
      } else {
        const res = await api.createCourse({
    name,
    level,
    difficulty: difficulty.toLowerCase().replace(" ", "_")
}, state.adminKey!);
        if (res.status === "success") {
          const newCourse: Course = {
            id: String(res.course.id),
            name: res.course.name,
            level: res.course.level as Course["level"],
            difficulty: res.course.difficulty || difficulty,
            taken: false,
          };
          dispatch({ type: "ADD_COURSE", payload: newCourse });
        }
      }
      setModalVisible(false);
      setEditingCourse(null);
    } catch (e) {
      console.error("Failed to save course:", e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        {!readOnly && (
          <Pressable
            style={styles.addBtn}
            onPress={() => { setEditingCourse(null); setModalVisible(true); }}
          >
            <Plus color={COLORS.text.inverse} size={16} strokeWidth={3} />
            <Text style={styles.addBtnText}>Add Course</Text>
          </Pressable>
        )}
      </View>

      {state.courses.length === 0 ? (
        <View style={styles.emptyState}>
          <LottieView
            source={require("../../assets/lottie/empty-box.json")}
            autoPlay
            loop
            style={{ width: 150, height: 150 }}
          />
          <Text style={styles.emptyText}>No courses added yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {state.courses.map((course, index) => (
            <Animated.View key={course.id} entering={FadeIn.delay(index * 50)}>
              <CourseRow
                course={{ ...course, taken: isCourseTaken(course.id) }}
                isPreferred={(state.currentStudent?.preferred_subjects || []).includes(course.name.toLowerCase())}
                readOnly={readOnly}
                showStar={state.role === "student"}
                onEdit={() => {
                  setEditingCourse(course);
                  setModalVisible(true);
                }}
                onToggle={async () => {
                  if (!state.currentStudent) return;
                  try {
                    const updated = await api.toggleCompletedCourse(state.currentStudent.id, course.id);
                    if (updated && updated.status === "success") {
                      // Backend returns integer IDs, frontend uses string IDs — convert!
                      const strIds = (updated.completed_courses || []).map((id: any) => String(id));
                      dispatch({ type: "SET_COMPLETED_COURSES", payload: strIds });
                    }
                  } catch (e) {
                    console.error("Failed to toggle course:", e);
                  }
                }}
                onTogglePreferred={async () => {
                  if (!state.currentStudent) return;
                  // Optimistic UI update
                  dispatch({ type: "TOGGLE_PREFERRED_COURSE", payload: course.name.toLowerCase() });
                  try {
                    const res = await api.togglePreferredCourse(state.currentStudent.id, course.id);
                    if (res && res.status === "success") {
                      // Sync with server response
                      dispatch({
                        type: "UPDATE_STUDENT",
                        payload: { preferred_subjects: res.preferred_subjects || [] },
                      });
                    }
                  } catch (e) {
                    // Revert optimistic update on failure
                    dispatch({ type: "TOGGLE_PREFERRED_COURSE", payload: course.name.toLowerCase() });
                    console.error("Failed to toggle preferred:", e);
                  }
                }}
                onDelete={async () => {
                  await api.deleteCourse(course.id, state.adminKey!);
                  dispatch({ type: "REMOVE_COURSE", payload: course.id });
                }}
              />
            </Animated.View>
          ))}
        </View>
      )}

      <AddCourseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddCourse}
        initialCourse={editingCourse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.xl, marginBottom: SPACING["2xl"] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  title: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.text.primary },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.accent.cyan, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, gap: 4 },
  addBtnText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.xs, color: COLORS.text.inverse },
  emptyState: { backgroundColor: COLORS.surface.dark, padding: SPACING.xl, borderRadius: BORDER_RADIUS.md, alignItems: "center", borderWidth: 1, borderColor: COLORS.border.DEFAULT },
  emptyText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.text.muted, marginTop: -20 },
  list: { gap: SPACING.sm },
  row: { borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border.DEFAULT, overflow: "hidden" },
  rowPressable: { flexDirection: "row", alignItems: "center", padding: SPACING.md, gap: SPACING.md },
  rowContent: { flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border.light, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: COLORS.accent.cyan, borderColor: COLORS.accent.cyan },
  info: { flex: 1 },
  name: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.base, color: COLORS.text.primary, marginBottom: 4 },
  badges: { flexDirection: "row", gap: SPACING.xs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  badgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.text.inverse },
  deleteBtn: { padding: SPACING.xs },
});
