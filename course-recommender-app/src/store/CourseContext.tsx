import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import * as api from "../services/api";

/* ------------------------------------------------------------------ */
/*  Data Models                                                        */
/* ------------------------------------------------------------------ */

export type CourseDifficulty = "Easy" | "Medium" | "Hard";

export interface Course {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4; // Backend uses 1-4
  credits?: number;
  course_department?: string;
  
  // Frontend-only
  difficulty: CourseDifficulty;
  taken?: boolean;
}

export interface PrerequisiteEdge {
  from: string;
  to: string;
}

export interface CourseGroup {
  id: string;
  name: string;
  courseIds: string[];
}

export interface Student {
  id: string;
  name: string;
  student_id: string;
  completed_courses: string[]; // Course IDs
}

/* ------------------------------------------------------------------ */
/*  State Shape                                                        */
/* ------------------------------------------------------------------ */

export interface CourseState {
  courses: Course[];
  edges: PrerequisiteEdge[];
  groups: CourseGroup[];
  
  // Auth state
  role: 'admin' | 'student' | null;
  currentStudent: Student | null;
  adminKey: string | null;

  // Local-only state to persist difficulty since backend doesn't support it
  localDifficulties: Record<string, CourseDifficulty>;
  preferredCourses: string[]; // Frontend-only for now

  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  edges: [],
  groups: [],
  role: null,
  currentStudent: null,
  adminKey: null,
  localDifficulties: {},
  preferredCourses: [],
  loading: false,
  error: null,
};

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

type CourseAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_AUTH_STUDENT"; payload: Student }
  | { type: "SET_AUTH_ADMIN"; payload: string }
  | { type: "LOGOUT" }
  | { type: "LOAD_DATA"; payload: { courses: Course[], edges: PrerequisiteEdge[] } }
  | { type: "ADD_COURSE"; payload: Course }
  | { type: "UPDATE_COURSE"; payload: Course }
  | { type: "REMOVE_COURSE"; payload: string }
  | { type: "SET_COMPLETED_COURSES"; payload: string[] }
  | { type: "ADD_EDGE"; payload: PrerequisiteEdge }
  | { type: "REMOVE_EDGE"; payload: PrerequisiteEdge }
  | { type: "ADD_GROUP"; payload: CourseGroup }
  | { type: "REMOVE_GROUP"; payload: string }
  | { type: "UPDATE_GROUP"; payload: CourseGroup }
  | { type: "SET_COURSE_DIFFICULTY"; payload: { id: string, difficulty: CourseDifficulty } }
  | { type: "TOGGLE_PREFERRED_COURSE"; payload: string }
  | { type: "TOGGLE_GROUP_PREFERRED"; payload: { courseIds: string[], makePreferred: boolean } };

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    
    case "SET_AUTH_STUDENT":
      return { ...state, role: "student", currentStudent: action.payload, adminKey: null };
    case "SET_AUTH_ADMIN":
      return { ...state, role: "admin", adminKey: action.payload, currentStudent: null };
    case "LOGOUT":
      return initialState;

    case "LOAD_DATA":
      // Re-apply local difficulties to loaded courses
      const loadedCourses = action.payload.courses.map(c => ({
        ...c,
        difficulty: state.localDifficulties[c.id] || "Medium"
      }));
      return { ...state, courses: loadedCourses, edges: action.payload.edges };

    case "ADD_COURSE":
      return { 
        ...state, 
        courses: [...state.courses, { ...action.payload, difficulty: state.localDifficulties[action.payload.id] || action.payload.difficulty }],
        localDifficulties: { ...state.localDifficulties, [action.payload.id]: action.payload.difficulty }
      };

    case "UPDATE_COURSE":
      return {
        ...state,
        courses: state.courses.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
        localDifficulties: { ...state.localDifficulties, [action.payload.id]: action.payload.difficulty }
      };

    case "REMOVE_COURSE": {
      const courseId = action.payload;
      return {
        ...state,
        courses: state.courses.filter((c) => c.id !== courseId),
        edges: state.edges.filter((e) => e.from !== courseId && e.to !== courseId),
        groups: state.groups.map((g) => ({
          ...g,
          courseIds: g.courseIds.filter((id) => id !== courseId),
        })),
      };
    }

    case "SET_COMPLETED_COURSES":
      if (!state.currentStudent) return state;
      return {
        ...state,
        currentStudent: {
          ...state.currentStudent,
          completed_courses: action.payload
        }
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
          (e) => !(e.from === action.payload.from && e.to === action.payload.to)
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
      
    case "SET_COURSE_DIFFICULTY":
      return {
        ...state,
        localDifficulties: { ...state.localDifficulties, [action.payload.id]: action.payload.difficulty },
        courses: state.courses.map(c => c.id === action.payload.id ? { ...c, difficulty: action.payload.difficulty } : c)
      };

    case "TOGGLE_PREFERRED_COURSE": {
      const courseId = action.payload;
      const isPreferred = state.preferredCourses.includes(courseId);
      return {
        ...state,
        preferredCourses: isPreferred
          ? state.preferredCourses.filter(id => id !== courseId)
          : [...state.preferredCourses, courseId]
      };
    }

    case "TOGGLE_GROUP_PREFERRED": {
      const { courseIds, makePreferred } = action.payload;
      if (makePreferred) {
        // Add all courseIds that aren't already in preferredCourses
        const toAdd = courseIds.filter(id => !state.preferredCourses.includes(id));
        return {
          ...state,
          preferredCourses: [...state.preferredCourses, ...toAdd]
        };
      } else {
        // Remove all courseIds from preferredCourses
        return {
          ...state,
          preferredCourses: state.preferredCourses.filter(id => !courseIds.includes(id))
        };
      }
    }

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
  fetchData: () => Promise<void>;
  isCourseTaken: (id: string) => boolean;
}

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  const fetchData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const [coursesRes, edgesRes] = await Promise.all([
        api.getCourses(),
        api.getPrerequisites()
      ]);
      
      if (coursesRes.status === "success" && edgesRes.status === "success") {
        dispatch({ 
          type: "LOAD_DATA", 
          payload: { 
            courses: coursesRes.courses.map((c: any) => ({
              ...c,
              id: String(c.id),
              difficulty: "Medium" // Default, overridden in reducer if local exists
            })),
            edges: edgesRes.edges.map((e: any) => ({
              from: String(e.from),
              to: String(e.to)
            }))
          } 
        });
      }
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Helper to check if course taken
  const isCourseTaken = (id: string) => {
    if (state.role === "student" && state.currentStudent) {
      return state.currentStudent.completed_courses.includes(String(id));
    }
    return false;
  };

  return (
    <CourseContext.Provider value={{ state, dispatch, fetchData, isCourseTaken }}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourseStore(): CourseContextValue {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseStore must be used within a CourseProvider");
  }
  return context;
}
