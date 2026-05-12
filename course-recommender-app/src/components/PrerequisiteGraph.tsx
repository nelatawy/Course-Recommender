import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Svg, Rect, Path, Text as SvgText, Defs, Marker } from "react-native-svg";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Plus, Trash2 } from "lucide-react-native";
import {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  LEVEL_COLORS,
} from "../constants/theme";
import { useCourseStore } from "../store/CourseContext";
import { AddEdgeModal } from "./AddEdgeModal";

// Constants for node rendering
const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;

interface NodePos {
  x: number;
  y: number;
}

interface DraggableNodeProps {
  id: string;
  name: string;
  level: number;
  initialX: number;
  initialY: number;
  onDrag: (id: string, x: number, y: number) => void;
  onRemoveNode: (id: string) => void;
}

function DraggableNode({
  id,
  name,
  level,
  initialX,
  initialY,
  onDrag,
  onRemoveNode,
}: DraggableNodeProps) {
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = x.value;
      contextY.value = y.value;
    })
    .onUpdate((event) => {
      x.value = contextX.value + event.translationX;
      y.value = contextY.value + event.translationY;
      runOnJS(onDrag)(id, x.value, y.value);
    })
    .onEnd(() => {
      x.value = withSpring(x.value);
      y.value = withSpring(y.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    transform: [{ translateX: x.value }, { translateY: y.value }],
    zIndex: 10,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[animatedStyle, styles.nodeContainer]}>
        <View style={[styles.node, { borderColor: LEVEL_COLORS[level] || COLORS.border.DEFAULT }]}>
          <Text style={styles.nodeText} numberOfLines={1}>
            {name}
          </Text>
          <Pressable
            style={styles.removeNodeBtn}
            onPress={() => onRemoveNode(id)}
            hitSlop={8}
          >
            <Trash2 color={COLORS.accent.rose} size={14} />
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function PrerequisiteGraph() {
  const { state, dispatch } = useCourseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePos>>({});

  // Initialize node positions based on levels if they don't exist
  React.useEffect(() => {
    const newPos = { ...nodePositions };
    let changed = false;

    // Group by level
    const byLevel: Record<number, typeof state.courses> = {};
    state.courses.forEach((c) => {
      if (!byLevel[c.level]) byLevel[c.level] = [];
      byLevel[c.level].push(c);
    });

    Object.keys(byLevel).forEach((levelStr) => {
      const level = parseInt(levelStr, 10);
      const levelCourses = byLevel[level];
      const startX = 20;
      const y = 20 + level * 100; // 100px vertical gap between levels

      levelCourses.forEach((c, index) => {
        if (!newPos[c.id]) {
          newPos[c.id] = { x: startX + index * (NODE_WIDTH + 20), y };
          changed = true;
        }
      });
    });

    if (changed) {
      setNodePositions(newPos);
    }
  }, [state.courses]);

  const handleDrag = (id: string, x: number, y: number) => {
    // In a real app we might debounce this or use Reanimated to update edges continuously
    setNodePositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const handleAddEdge = (from: string, to: string) => {
    dispatch({ type: "ADD_EDGE", payload: { from, to } });
    setModalVisible(false);
  };

  const renderEdges = () => {
    return state.edges.map((edge) => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];
      if (!fromPos || !toPos) return null;

      // Draw path from bottom of 'from' node to top of 'to' node
      const startX = fromPos.x + NODE_WIDTH / 2;
      const startY = fromPos.y + NODE_HEIGHT;
      const endX = toPos.x + NODE_WIDTH / 2;
      const endY = toPos.y;

      // Cubic bezier for a nice curve
      const path = `M ${startX} ${startY} C ${startX} ${startY + 40}, ${endX} ${endY - 40}, ${endX} ${endY}`;

      return (
        <React.Fragment key={`${edge.from}-${edge.to}`}>
          <Path
            d={path}
            stroke={COLORS.text.muted}
            strokeWidth={2}
            fill="none"
            markerEnd="url(#arrow)"
          />
        </React.Fragment>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prerequisites</Text>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Plus color={COLORS.text.inverse} size={16} strokeWidth={3} />
          <Text style={styles.addBtnText}>Add Edge</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Drag nodes to rearrange. An edge from A → B means A is a prerequisite of B.
      </Text>

      <View style={styles.graphContainer}>
        {state.courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Add courses first to build a graph.</Text>
          </View>
        ) : (
          <>
            <Svg style={StyleSheet.absoluteFill}>
              <Defs>
                <Marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <Path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.text.muted} />
                </Marker>
              </Defs>
              {renderEdges()}
            </Svg>

            {state.courses.map((course) => {
              const pos = nodePositions[course.id];
              if (!pos) return null;
              return (
                <DraggableNode
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  level={course.level}
                  initialX={pos.x}
                  initialY={pos.y}
                  onDrag={handleDrag}
                  onRemoveNode={(id) => dispatch({ type: "REMOVE_COURSE", payload: id })}
                />
              );
            })}
          </>
        )}
      </View>

      <AddEdgeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddEdge}
        courses={state.courses}
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
    marginBottom: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.muted,
    marginBottom: SPACING.md,
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
  graphContainer: {
    height: 400,
    backgroundColor: COLORS.surface.dark,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    overflow: "hidden",
    position: "relative",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.muted,
  },
  nodeContainer: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  node: {
    flex: 1,
    backgroundColor: COLORS.surface.DEFAULT,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  nodeText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.primary,
    flex: 1,
  },
  removeNodeBtn: {
    padding: 4,
  },
});
