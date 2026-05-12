import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { X, Check } from "lucide-react-native";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LEVEL_COLORS,
} from "../constants/theme";
import type { Course, CourseGroup } from "../store/CourseContext";

interface AddGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, courseIds: string[]) => void;
  courses: Course[];
  /** When provided the modal operates in edit mode. */
  initialGroup?: CourseGroup | null;
}

/**
 * Modal for creating or editing a course group.
 * Provides a name input and a multi-select list of courses.
 */
export function AddGroupModal({
  visible,
  onClose,
  onSave,
  courses,
  initialGroup,
}: AddGroupModalProps) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialGroup) {
      setName(initialGroup.name);
      setSelectedIds(new Set(initialGroup.courseIds));
    } else {
      setName("");
      setSelectedIds(new Set());
    }
  }, [initialGroup, visible]);

  const toggleCourse = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, Array.from(selectedIds));
    setName("");
    setSelectedIds(new Set());
  };

  const isEditing = !!initialGroup;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={SlideInDown.springify().damping(18).stiffness(140)} style={styles.sheet}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{isEditing ? "Edit Group" : "New Group"}</Text>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <X color={COLORS.text.muted} size={20} />
              </Pressable>
            </View>

            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Core CS"
              placeholderTextColor={COLORS.text.muted}
              autoFocus
            />

            <Text style={[styles.label, { marginTop: SPACING.lg }]}>
              Courses ({selectedIds.size} selected)
            </Text>
            <ScrollView style={styles.courseList} nestedScrollEnabled>
              {courses.length === 0 ? (
                <Text style={styles.emptyText}>Add some courses first</Text>
              ) : (
                courses.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <Pressable key={c.id} style={styles.courseRow} onPress={() => toggleCourse(c.id)}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check color={COLORS.text.inverse} size={14} strokeWidth={3} />}
                      </View>
                      <View style={[styles.dot, { backgroundColor: LEVEL_COLORS[c.level] }]} />
                      <Text style={styles.courseName}>{c.name}</Text>
                      <Text style={styles.courseLevel}>L{c.level}</Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
                disabled={!name.trim()}
              >
                <Text style={styles.saveText}>{isEditing ? "Update" : "Create Group"}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.navy.DEFAULT,
    borderTopLeftRadius: BORDER_RADIUS["2xl"],
    borderTopRightRadius: BORDER_RADIUS["2xl"],
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING["3xl"],
    borderWidth: 1, borderColor: COLORS.border.DEFAULT, borderBottomWidth: 0,
    maxHeight: "90%",
    width: "100%",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xl },
  title: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.text.primary, letterSpacing: -0.5 },
  closeBtn: { width: 32, height: 32, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface.light, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.text.secondary, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.surface.DEFAULT, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    fontFamily: FONTS.regular, fontSize: FONT_SIZES.base, color: COLORS.text.primary,
    borderWidth: 1, borderColor: COLORS.border.DEFAULT,
  },
  courseList: { maxHeight: 450, minHeight: 200, marginBottom: SPACING.lg },
  courseRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border.subtle,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    borderColor: COLORS.border.light, alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: COLORS.accent.cyan, borderColor: COLORS.accent.cyan },
  dot: { width: 8, height: 8, borderRadius: 4 },
  courseName: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.text.primary, flex: 1 },
  courseLevel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.xs, color: COLORS.text.muted },
  emptyText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.text.muted, padding: SPACING.base, textAlign: "center" },
  actions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.base },
  cancelBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border.light, alignItems: "center" },
  cancelText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.base, color: COLORS.text.secondary },
  saveBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.accent.cyan, alignItems: "center" },
  saveText: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.base, color: COLORS.text.inverse },
});
