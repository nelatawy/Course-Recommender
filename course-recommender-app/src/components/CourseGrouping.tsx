import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Plus, Trash2, Users } from "lucide-react-native";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
} from "../constants/theme";
import { useCourseStore, CourseGroup } from "../store/CourseContext";
import { AddGroupModal } from "./AddGroupModal";

export function CourseGrouping() {
  const { state, dispatch } = useCourseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CourseGroup | null>(null);

  const handleAddGroup = (name: string, courseIds: string[]) => {
    if (editingGroup) {
      dispatch({
        type: "UPDATE_GROUP",
        payload: { ...editingGroup, name, courseIds },
      });
    } else {
      const newGroup: CourseGroup = {
        id: Date.now().toString(),
        name,
        courseIds,
      };
      dispatch({ type: "ADD_GROUP", payload: newGroup });
    }
    setModalVisible(false);
    setEditingGroup(null);
  };

  const openAddModal = () => {
    setEditingGroup(null);
    setModalVisible(true);
  };

  const openEditModal = (group: CourseGroup) => {
    setEditingGroup(group);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Course Groups</Text>
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Plus color={COLORS.text.inverse} size={16} strokeWidth={3} />
          <Text style={styles.addBtnText}>Add Group</Text>
        </Pressable>
      </View>

      {state.groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Users color={COLORS.text.muted} size={32} style={{ marginBottom: SPACING.sm }} />
          <Text style={styles.emptyText}>Create groups to organize courses.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {state.groups.map((group, index) => (
            <Animated.View
              key={group.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <Pressable style={styles.card} onPress={() => openEditModal(group)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "REMOVE_GROUP", payload: group.id });
                    }}
                    hitSlop={8}
                  >
                    <Trash2 color={COLORS.accent.rose} size={16} />
                  </Pressable>
                </View>
                <Text style={styles.courseCount}>
                  {group.courseIds.length} {group.courseIds.length === 1 ? "Course" : "Courses"}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      <AddGroupModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddGroup}
        courses={state.courses}
        initialGroup={editingGroup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING["2xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent.cyan,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  addBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.inverse,
  },
  emptyState: {
    backgroundColor: COLORS.surface.dark,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface.DEFAULT,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    minWidth: "48%",
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  groupName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.text.primary,
  },
  courseCount: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
  },
  deleteBtn: {
    padding: 2,
  },
});
