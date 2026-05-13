import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import Animated, { SlideInDown } from "react-native-reanimated";
import { X, ChevronDown, ArrowRight } from "lucide-react-native";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LEVEL_COLORS,
} from "../constants/theme";
import type { Course } from "../store/CourseContext";

interface AddEdgeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fromId: string, toId: string) => void;
  courses: Course[];
}

/**
 * Modal for creating a prerequisite edge between two courses.
 * Provides two dropdown selectors with self-loop prevention.
 */
export function AddEdgeModal({ visible, onClose, onSave, courses }: AddEdgeModalProps) {
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<"from" | "to" | null>(null);

  const handleSave = () => {
    if (!fromId || !toId || fromId === toId) return;
    onSave(fromId, toId);
    setFromId(null);
    setToId(null);
    setExpanded(null);
  };

  const handleClose = () => {
    setFromId(null);
    setToId(null);
    setExpanded(null);
    onClose();
  };

  const canSave = fromId && toId && fromId !== toId;

  const renderPicker = (
    label: string,
    selectedId: string | null,
    key: "from" | "to",
    onSelect: (id: string) => void
  ) => {
    const selected = courses.find((c) => c.id === selectedId);
    const isOpen = expanded === key;
    const otherId = key === "from" ? toId : fromId;
    const filtered = courses.filter((c) => c.id !== fromId && c.id !== toId);

    return (
      <View style={styles.pickerWrap}>
        <Text style={styles.label}>{label}</Text>
        <Pressable style={styles.pickerBtn} onPress={() => setExpanded(isOpen ? null : key)}>
          <Text style={[styles.pickerText, !selected && { color: COLORS.text.muted }]}>
            {selected ? selected.name : "Select a course..."}
          </Text>
          <ChevronDown color={COLORS.text.muted} size={16} style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }} />
        </Pressable>
        {isOpen && (
          <ScrollView style={styles.dropdown} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No courses available</Text>
            ) : (
              filtered.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.dropItem, c.id === selectedId && styles.dropItemActive]}
                  onPress={() => { onSelect(c.id); setExpanded(null); }}
                >
                  <View style={[styles.dot, { backgroundColor: LEVEL_COLORS[c.level] }]} />
                  <Text style={styles.dropText}>{c.name}</Text>
                  <Text style={styles.dropLevel}>L{c.level}</Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={SlideInDown.springify().damping(18).stiffness(140)} style={styles.sheet}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Add Prerequisite</Text>
              <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
                <X color={COLORS.text.muted} size={20} />
              </Pressable>
            </View>
            <View style={styles.infoBar}>
              <Text style={styles.infoText}>An edge from A → B means A is a prerequisite of B</Text>
            </View>
            {renderPicker("From (prerequisite)", fromId, "from", setFromId)}
            <View style={styles.arrowRow}>
              <ArrowRight color={COLORS.text.muted} size={20} />
            </View>
            {renderPicker("To (depends on)", toId, "to", setToId)}
            <View style={styles.actions}>
              <Pressable onPress={handleClose} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={[styles.saveBtn, !canSave && { opacity: 0.4 }]} disabled={!canSave}>
                <Text style={styles.saveText}>Add Edge</Text>
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
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.base },
  title: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.text.primary, letterSpacing: -0.5 },
  closeBtn: { width: 32, height: 32, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface.light, alignItems: "center", justifyContent: "center" },
  infoBar: { backgroundColor: "rgba(59,130,246,0.1)", borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, marginBottom: SPACING.lg, borderWidth: 1, borderColor: "rgba(59,130,246,0.2)" },
  infoText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.xs, color: COLORS.accent.blue },
  label: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.text.secondary, marginBottom: SPACING.sm },
  pickerWrap: { marginBottom: SPACING.sm },
  pickerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.surface.DEFAULT, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.border.DEFAULT },
  pickerText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.base, color: COLORS.text.primary },
  dropdown: { maxHeight: 160, backgroundColor: COLORS.surface.DEFAULT, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.xs, borderWidth: 1, borderColor: COLORS.border.DEFAULT },
  dropItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, gap: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border.subtle },
  dropItemActive: { backgroundColor: COLORS.surface.light },
  dropText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.text.primary, flex: 1 },
  dropLevel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.xs, color: COLORS.text.muted },
  dot: { width: 8, height: 8, borderRadius: 4 },
  arrowRow: { alignItems: "center", paddingVertical: SPACING.xs },
  emptyText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.text.muted, padding: SPACING.base, textAlign: "center" },
  actions: { flexDirection: "row", gap: SPACING.md, marginTop: SPACING.xl },
  cancelBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border.light, alignItems: "center" },
  cancelText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.base, color: COLORS.text.secondary },
  saveBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.accent.cyan, alignItems: "center" },
  saveText: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.base, color: COLORS.text.inverse },
});
