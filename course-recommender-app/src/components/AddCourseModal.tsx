import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LEVEL_COLORS,
  DIFFICULTY_COLORS,
} from "../constants/theme";
import type { Course, CourseDifficulty } from "../store/CourseContext";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LEVELS: Course["level"][] = [0, 1, 2, 3, 4];
const DIFFICULTIES: CourseDifficulty[] = ["Easy", "Medium", "Hard"];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface AddCourseModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, level: Course["level"], difficulty: CourseDifficulty) => void;
  /** When provided the modal operates in edit mode with pre-filled values. */
  initialCourse?: Course | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Slide-up modal for creating or editing a course.
 * Captures the course name, academic level (0-4), and difficulty grade.
 */
export function AddCourseModal({
  visible,
  onClose,
  onSave,
  initialCourse,
}: AddCourseModalProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Course["level"]>(0);
  const [difficulty, setDifficulty] = useState<CourseDifficulty>("Easy");

  /* Pre-fill fields when editing an existing course. */
  useEffect(() => {
    if (initialCourse) {
      setName(initialCourse.name);
      setLevel(initialCourse.level);
      setDifficulty(initialCourse.difficulty);
    } else {
      setName("");
      setLevel(0);
      setDifficulty("Easy");
    }
  }, [initialCourse, visible]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, level, difficulty);
    setName("");
    setLevel(0);
    setDifficulty("Easy");
  };

  const isEditing = !!initialCourse;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <Pressable
            /* Prevent tap-through to backdrop */
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View
              entering={SlideInDown.springify().damping(18).stiffness(140)}
              style={styles.sheet}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.title}>
                  {isEditing ? "Edit Course" : "New Course"}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  style={styles.closeButton}
                >
                  <X color={COLORS.text.muted} size={20} />
                </Pressable>
              </View>

              {/* Course Name Input */}
              <Text style={styles.label}>Course Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Data Structures"
                placeholderTextColor={COLORS.text.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {/* Level Picker */}
              <Text style={styles.label}>Level</Text>
              <View style={styles.segmentRow}>
                {LEVELS.map((l) => {
                  const active = l === level;
                  return (
                    <Pressable
                      key={l}
                      onPress={() => setLevel(l)}
                      style={[
                        styles.segmentButton,
                        active && {
                          backgroundColor: LEVEL_COLORS[l],
                          borderColor: LEVEL_COLORS[l],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && styles.segmentTextActive,
                        ]}
                      >
                        L{l}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Difficulty Picker */}
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.segmentRow}>
                {DIFFICULTIES.map((d) => {
                  const active = d === difficulty;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDifficulty(d)}
                      style={[
                        styles.segmentButton,
                        { flex: 1 },
                        active && {
                          backgroundColor: DIFFICULTY_COLORS[d],
                          borderColor: DIFFICULTY_COLORS[d],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && styles.segmentTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Pressable onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[
                    styles.saveButton,
                    !name.trim() && styles.saveButtonDisabled,
                  ]}
                  disabled={!name.trim()}
                >
                  <Text style={styles.saveText}>
                    {isEditing ? "Update" : "Add Course"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.navy.DEFAULT,
    borderTopLeftRadius: BORDER_RADIUS["2xl"],
    borderTopRightRadius: BORDER_RADIUS["2xl"],
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING["3xl"],
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface.light,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.base,
  },
  input: {
    backgroundColor: COLORS.surface.DEFAULT,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  segmentRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  segmentButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.surface.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
  },
  segmentText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  segmentTextActive: {
    color: COLORS.text.primary,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING["2xl"],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    alignItems: "center",
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent.cyan,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.inverse,
  },
});
