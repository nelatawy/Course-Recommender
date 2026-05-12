import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
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

const HoverableButton = ({ onPress, children, style }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => (scale.value = withSpring(1.05, { damping: 15 }))}
        onHoverOut={() => (scale.value = withSpring(1))}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1.05))}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

const CourseRow = ({ course, isPreferred, onEdit, onToggle, onTogglePreferred, onDelete, readOnly }: { course: Course; isPreferred: boolean; onEdit: () => void; onToggle: () => void; onTogglePreferred: () => void; onDelete: () => void; readOnly?: boolean }) => {
  const scale = useSharedValue(1);
  const bgColor = useSharedValue<string>(COLORS.surface.DEFAULT);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bgColor.value,
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <Pressable
        style={styles.rowPressable}
        onPress={readOnly ? undefined : onEdit}
        onHoverIn={() => {
          if (readOnly) return;
          scale.value = withSpring(1.01, { damping: 20 });
          bgColor.value = withTiming(COLORS.surface.light, { duration: 200 });
        }}
        onHoverOut={() => {
          if (readOnly) return;
          scale.value = withSpring(1);
          bgColor.value = withTiming(COLORS.surface.DEFAULT, { duration: 200 });
        }}
      >
        <HoverableButton
          onPress={onToggle}
          style={[styles.checkbox, course.taken && styles.checkboxActive]}
        >
          {course.taken && <Check color={COLORS.text.inverse} size={14} strokeWidth={3} />}
        </HoverableButton>
        <View style={styles.info}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
            <AnimatedStar isPreferred={isPreferred} onPress={onTogglePreferred} />
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

        {!readOnly && (
          <HoverableButton onPress={onDelete} style={styles.deleteBtn}>
            <Trash2 color={COLORS.accent.rose} size={18} />
          </HoverableButton>
        )}
      </Pressable>
    </Animated.View>
  );
};

const AnimatedStar = ({ isPreferred, onPress }: { isPreferred: boolean; onPress: (e: any) => void }) => {
  const scale = useSharedValue(1);

  const handlePress = (e: any) => {
    e.stopPropagation();
    // Bouncy pop animation
    scale.value = withSpring(1.4, { damping: 12, stiffness: 300 }, () => {
      scale.value = withSpring(1);
    });
    onPress(e);
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

export function CourseTable({ readOnly = false }: { readOnly?: boolean }) {
  const { state, dispatch, isCourseTaken } = useCourseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleAddCourse = (name: string, level: Course["level"], difficulty: Course["difficulty"]) => {
    if (editingCourse) {
      dispatch({
        type: "UPDATE_COURSE",
        payload: { ...editingCourse, name, level, difficulty },
      });
    } else {
      const newCourse: Course = {
        id: Date.now().toString(),
        name,
        level,
        difficulty,
        taken: false,
      };
      dispatch({ type: "ADD_COURSE", payload: newCourse });
    }
    setModalVisible(false);
    setEditingCourse(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        {!readOnly && (
          <HoverableButton onPress={() => { setEditingCourse(null); setModalVisible(true); }}>
            <View style={styles.addBtn}>
              <Plus color={COLORS.text.inverse} size={16} strokeWidth={3} />
              <Text style={styles.addBtnText}>Add Course</Text>
            </View>
          </HoverableButton>
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
                isPreferred={state.preferredCourses.includes(course.id)}
                readOnly={readOnly}
                onEdit={() => {
                  setEditingCourse(course);
                  setModalVisible(true);
                }}
                onToggle={async () => {
                  if (state.currentStudent) {
                    await api.toggleCompletedCourse(state.currentStudent.id, course.id);
                    const updated = await api.toggleCompletedCourse(state.currentStudent.id, course.id);
                    dispatch({ type: "SET_COMPLETED_COURSES", payload: updated.completed_courses || [] });
                    const res = await api.signIn(state.currentStudent.student_id);
                    dispatch({ type: "SET_AUTH_STUDENT", payload: res.student });
                  }
                }}
                onTogglePreferred={() => {
                  dispatch({ type: "TOGGLE_PREFERRED_COURSE", payload: course.id });
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
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border.light, alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: COLORS.accent.cyan, borderColor: COLORS.accent.cyan },
  info: { flex: 1 },
  name: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.base, color: COLORS.text.primary, marginBottom: 4 },
  badges: { flexDirection: "row", gap: SPACING.xs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  badgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.text.inverse },
  deleteBtn: {
    padding: SPACING.xs,
  },
  starBtn: {
    padding: SPACING.xs,
  },
});
