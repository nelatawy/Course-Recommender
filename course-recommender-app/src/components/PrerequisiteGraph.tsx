import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from "react-native";
import { Svg, Path, Defs, Marker } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
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
  containerWidth: number;
  containerHeight: number;
  onDrag: (id: string, x: number, y: number) => void;
  onRemoveNode: (id: string) => void;
  readOnly?: boolean;
}

function DraggableNode({
  id,
  name,
  level,
  initialX,
  initialY,
  containerWidth,
  containerHeight,
  onDrag,
  onRemoveNode,
  readOnly,
}: DraggableNodeProps) {
  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const maxX = containerWidth > 0 ? containerWidth - NODE_WIDTH : 200;
  const maxY = containerHeight > 0 ? containerHeight - NODE_HEIGHT : 350;

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = x.value;
      contextY.value = y.value;
    })
    .onUpdate((event) => {
      const newX = contextX.value + event.translationX;
      const newY = contextY.value + event.translationY;
      // Clamp to container bounds so nodes can never escape the box
      x.value = Math.max(0, Math.min(newX, maxX));
      y.value = Math.max(0, Math.min(newY, maxY));
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
          {!readOnly && (
            <Pressable
              style={styles.removeNodeBtn}
              onPress={() => onRemoveNode(id)}
              hitSlop={8}
            >
              <Trash2 color={COLORS.accent.rose} size={14} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function PrerequisiteGraph({ readOnly = false }: { readOnly?: boolean }) {
  const { state, dispatch } = useCourseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePos>>({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  // Initialize node positions when courses or container size change
  React.useEffect(() => {
    if (containerSize.width === 0) return; // Wait until we know the real width

    const newPos = { ...nodePositions };
    let changed = false;

    // Group courses by level
    const byLevel: Record<number, typeof state.courses> = {};
    state.courses.forEach((c) => {
      if (!byLevel[c.level]) byLevel[c.level] = [];
      byLevel[c.level].push(c);
    });

    // Available space per column (subtract padding)
    const usableWidth = containerSize.width - 20;
    const maxCols = Math.max(1, Math.floor(usableWidth / (NODE_WIDTH + 10)));

    Object.keys(byLevel).forEach((levelStr) => {
      const level = parseInt(levelStr, 10);
      const levelCourses = byLevel[level];

      levelCourses.forEach((c, index) => {
        if (!newPos[c.id]) {
          const col = index % maxCols;
          const row = Math.floor(index / maxCols);
          const xPos = 10 + col * (NODE_WIDTH + 10);
          const yPos = 10 + (level - 1) * 120 + row * (NODE_HEIGHT + 10);
          // Clamp to make sure the initial spawn is inside bounds
          newPos[c.id] = {
            x: Math.min(xPos, containerSize.width - NODE_WIDTH),
            y: Math.min(yPos, containerSize.height - NODE_HEIGHT),
          };
          changed = true;
        }
      });
    });

    if (changed) {
      setNodePositions(newPos);
    }
  }, [state.courses, containerSize]);

  const handleDrag = (id: string, x: number, y: number) => {
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

      const startX = fromPos.x + NODE_WIDTH / 2;
      const startY = fromPos.y + NODE_HEIGHT;
      const endX = toPos.x + NODE_WIDTH / 2;
      const endY = toPos.y;

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
        {!readOnly && (
          <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Plus color={COLORS.text.inverse} size={16} strokeWidth={3} />
            <Text style={styles.addBtnText}>Add Edge</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.subtitle}>
        Drag nodes to rearrange. An edge A → B means A is a prerequisite of B.
      </Text>

      {/* onLayout tells us the real pixel width/height so we can clamp nodes */}
      <View style={styles.graphContainer} onLayout={handleLayout}>
        {state.courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Add courses first to build a graph.</Text>
          </View>
        ) : (
          <>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
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
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  onDrag={handleDrag}
                  readOnly={readOnly}
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
