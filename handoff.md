# Project Handoff: Course Recommender App

This document provides a comprehensive overview of the current state of the Course Recommender application to facilitate continued development by another AI agent.

## 1. Tech Stack & Architecture
- **Framework**: Expo (React Native) with TypeScript.
- **Styling**: NativeWind (Tailwind CSS for React Native) + Vanilla CSS (`global.css`).
- **State Management**: React Context API (`CourseContext.tsx`) with `useReducer` and a custom hook `useCourseStore`.
- **Navigation**: React Navigation (Bottom Tab Navigator with a custom glassmorphism floating bar).
- **Animations**: React Native Reanimated (v3), Lottie (`lottie-react-native`).
- **UI Icons**: Lucide React Native.
- **Components**: Custom SVG-based graph implementation using `react-native-svg`.

## 2. Completed Features

### Course Setup Screen (`src/screens/CourseSetupScreen.tsx`)
This is the primary data entry screen, split into three main sections:

1.  **Course Table (`src/components/CourseTable.tsx`)**:
    *   **CRUD**: Add, Edit, Delete courses.
    *   **Fields**: Name, Level (0-4), Difficulty (Easy, Medium, Hard), and "Taken" status.
    *   **UI**: Smooth hover animations on rows and buttons using Reanimated. Lottie integration for the empty state (`assets/lottie/empty-box.json`).

2.  **Prerequisite Graph (`src/components/PrerequisiteGraph.tsx`)**:
    *   **SVG Rendering**: A custom-built dependency graph showing `PrerequisiteEdge` relationships.
    *   **Interactive**: Nodes (courses) are meant to be draggable.
    *   **Add Edge**: A dedicated modal (`AddEdgeModal.tsx`) to link courses with prerequisite logic (prevents self-loops).

3.  **Course Grouping (`src/components/CourseGrouping.tsx`)**:
    *   **Logic**: Courses can belong to multiple groups; groups can contain multiple courses.
    *   **Management**: Create and delete groups via `AddGroupModal.tsx`.

### Data Model (`src/store/CourseContext.tsx`)
- `Course`: `id`, `name`, `level` (0-4), `difficulty` (Easy/Medium/Hard), `taken` (boolean).
- `PrerequisiteEdge`: `from` (source ID), `to` (target ID).
- `CourseGroup`: `id`, `name`, `courseIds` (array of IDs).

### Theme & Styling (`src/constants/theme.ts`)
- **Aesthetic**: Premium dark mode ("Midnight Black").
- **Tokens**: Centralized `COLORS`, `FONTS` (Inter, Plus Jakarta Sans), and `LEVEL_COLORS` mapping.

## 3. Status Update & Recent Fixes

### Fixed: Prerequisite Graph Crash
- **Fix**: Migrated `DraggableNode` from the deprecated `useAnimatedGestureHandler` to the new Reanimated v3 `GestureDetector` API.
- **Improved**: Added `zIndex` management and `runOnJS` to ensure the drag state updates correctly in the parent component for real-time edge rendering.

### Fixed: Course Table Animation
- **Fix**: Replaced the bouncy `FadeInDown.springify()` animation with a minimalist `FadeIn` transition to match the desired premium aesthetic.

## 4. Remaining Requirements (Roadmap)

1.  **Advisor Screen Logic**:
    *   The `AdvisorScreen.tsx` is currently a UI shell.
    *   **Suggested Order Mode**: Needs to implement a topological sort based on prerequisites.
    *   **Recommend Next Course**: Needs to suggest the best course based on level, group preference, and completed courses.
    *   **AI Mode**: Integration with Gemini API (placeholder logic exists in `theme.ts` API endpoints).

2.  **Backend Integration**:
    *   The app is designed to eventually talk to a Django/Prolog backend (`smart_advisor`).
    *   Current data is strictly local (React state). Persistence (AsyncStorage) is not yet implemented.

## 5. File Structure Reference
- `src/components/`: UI building blocks (Modals, Tables, Graph).
- `src/constants/`: Theme, API endpoints.
- `src/navigation/`: Root and Main Tab navigators.
- `src/screens/`: Top-level page containers.
- `src/store/`: Global state and types.
- `assets/lottie/`: Animation JSON files.

---
**Handoff Complete.** Please address the `PrerequisiteGraph` crash first to restore functionality.
