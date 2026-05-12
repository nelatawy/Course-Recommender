import React, { createContext, useContext, useReducer, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Data Models                                                        */
/* ------------------------------------------------------------------ */

export type CourseDifficulty = "Easy" | "Medium" | "Hard";

export interface Course {
  id: string;
  name: string;
  level: 0 | 1 | 2 | 3 | 4;
  difficulty: CourseDifficulty;
  taken: boolean;
}

export interface PrerequisiteEdge {
  /** The course that must be completed first. */
  from: string;
  /** The course that depends on the prerequisite. */
  to: string;
}

export interface CourseGroup {
  id: string;
  name: string;
  courseIds: string[];
}

/* ------------------------------------------------------------------ */
/*  State Shape                                                        */
/* ------------------------------------------------------------------ */

export interface CourseState {
  courses: Course[];
  edges: PrerequisiteEdge[];
  groups: CourseGroup[];
}

const initialState: CourseState = {
  courses: [],
  edges: [],
  groups: [],
};

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

type CourseAction =
  | { type: "ADD_COURSE"; payload: Course }
  | { type: "UPDATE_COURSE"; payload: Course }
  | { type: "REMOVE_COURSE"; payload: string }
  | { type: "TOGGLE_TAKEN"; payload: string }
  | { type: "ADD_EDGE"; payload: PrerequisiteEdge }
  | { type: "REMOVE_EDGE"; payload: PrerequisiteEdge }
  | { type: "ADD_GROUP"; payload: CourseGroup }
  | { type: "REMOVE_GROUP"; payload: string }
  | { type: "UPDATE_GROUP"; payload: CourseGroup };

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case "ADD_COURSE":
      return { ...state, courses: [...state.courses, action.payload] };

    case "UPDATE_COURSE":
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case "REMOVE_COURSE": {
      const courseId = action.payload;
      return {
        ...state,
        courses: state.courses.filter((c) => c.id !== courseId),
        /* Cascade-remove any edges referencing the deleted course. */
        edges: state.edges.filter(
          (e) => e.from !== courseId && e.to !== courseId
        ),
        /* Remove the course from any groups it belonged to. */
        groups: state.groups.map((g) => ({
          ...g,
          courseIds: g.courseIds.filter((id) => id !== courseId),
        })),
      };
    }

    case "TOGGLE_TAKEN":
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.payload ? { ...c, taken: !c.taken } : c
        ),
      };

    case "ADD_EDGE": {
      const exists = state.edges.some(
        (e) => e.from === action.payload.from && e.to === action.payload.to
      );
      if (exists) return state;
      return { ...state, edges: [...state.edges, action.payload] };
    }

    case "REMOVE_EDGE":
      return {
        ...state,
        edges: state.edges.filter(
          (e) =>
            !(e.from === action.payload.from && e.to === action.payload.to)
        ),
      };

    case "ADD_GROUP":
      return { ...state, groups: [...state.groups, action.payload] };

    case "REMOVE_GROUP":
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.payload),
      };

    case "UPDATE_GROUP":
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Context & Provider                                                 */
/* ------------------------------------------------------------------ */

interface CourseContextValue {
  state: CourseState;
  dispatch: React.Dispatch<CourseAction>;
}

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  return (
    <CourseContext.Provider value={{ state, dispatch }}>
      {children}
    </CourseContext.Provider>
  );
}

/**
 * Hook for consuming the course store.
 * Must be used within a CourseProvider.
 */
export function useCourseStore(): CourseContextValue {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseStore must be used within a CourseProvider");
  }
  return context;
}
