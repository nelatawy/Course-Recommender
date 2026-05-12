import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import * as api from "../services/api";

/* ------------------------------------------------------------------ */
/*  Data Models                                                        */
/* ------------------------------------------------------------------ */

export type CourseDifficulty = "Easy" | "Medium" | "Hard" | "Very Hard";

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

export interface Student {
  id: string;
  name: string;
  student_id: string;
  current_level: number;
  preferred_difficulty: CourseDifficulty;
  completed_courses: string[]; // Course IDs (stringified)
  preferred_subjects: string[]; // Course NAMES the student starred (lowercase)
}

/* ------------------------------------------------------------------ */
/*  State Shape                                                        */
/* ------------------------------------------------------------------ */

export interface CourseState {
  courses: Course[];
  edges: PrerequisiteEdge[];
  // Auth state
  role: 'admin' | 'student' | null;
  currentStudent: Student | null;
  adminKey: string | null;

  // Local-only state to persist difficulty since backend doesn't support it
  localDifficulties: Record<string, CourseDifficulty>;

  loading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  edges: [],
  role: null,
  currentStudent: null,
  adminKey: null,
  localDifficulties: {},
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
  | { type: "UPDATE_STUDENT"; payload: Partial<Student> }
  | { type: "LOAD_DATA"; payload: { courses: Course[], edges: PrerequisiteEdge[] } }
  | { type: "ADD_COURSE"; payload: Course }
  | { type: "UPDATE_COURSE"; payload: Course }
  | { type: "REMOVE_COURSE"; payload: string }
  | { type: "SET_COMPLETED_COURSES"; payload: string[] }
  | { type: "ADD_EDGE"; payload: PrerequisiteEdge }
  | { type: "REMOVE_EDGE"; payload: PrerequisiteEdge }
  | { type: "SET_COURSE_DIFFICULTY"; payload: { id: string, difficulty: CourseDifficulty } }
  | { type: "TOGGLE_PREFERRED_COURSE"; payload: string };

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    
    case "SET_AUTH_STUDENT": {
      const s = action.payload;
      return {
        ...state,
        role: "student",
        currentStudent: {
          ...s,
          id: String(s.id),
          completed_courses: (s.completed_courses || []).map((id: any) => String(id)),
          preferred_subjects: s.preferred_subjects || [],
        },
        adminKey: null,
      };
    }
    case "SET_AUTH_ADMIN":
      return { ...state, role: "admin", adminKey: action.payload, currentStudent: null };
    case "LOGOUT":
      return initialState;

    case "UPDATE_STUDENT":
      return {
        ...state,
        currentStudent: state.currentStudent 
          ? { ...state.currentStudent, ...action.payload } 
          : null
      };

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


    case "SET_COURSE_DIFFICULTY":
      return {
        ...state,
        localDifficulties: { ...state.localDifficulties, [action.payload.id]: action.payload.difficulty },
        courses: state.courses.map(c => c.id === action.payload.id ? { ...c, difficulty: action.payload.difficulty } : c)
      };

    case "TOGGLE_PREFERRED_COURSE": {
      if (!state.currentStudent) return state;
      const courseName = action.payload;
      const current = state.currentStudent.preferred_subjects || [];
      const isPreferred = current.includes(courseName);
      return {
        ...state,
        currentStudent: {
          ...state.currentStudent,
          preferred_subjects: isPreferred
            ? current.filter(name => name !== courseName)
            : [...current, courseName],
        },
      };
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
