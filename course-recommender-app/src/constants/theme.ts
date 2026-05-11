/**
 * Smart Advisor -- Design System Constants
 *
 * Centralised design tokens for the entire application.
 * All colour, typography, spacing, and API values should be referenced
 * from this file to avoid magic values scattered across components.
 */

/* ------------------------------------------------------------------ */
/*  Colour Palette                                                     */
/* ------------------------------------------------------------------ */

export const COLORS = {
  /* Background layers (darkest to lightest) */
  midnight: {
    DEFAULT: "#000000",
    50: "#1A1A1A",
    100: "#141414",
    200: "#0F0F0F",
    300: "#0A0A0A",
    400: "#050505",
    500: "#000000",
  },

  /* Surface layers for cards, modals, etc. */
  navy: {
    DEFAULT: "#121212",
    50: "#2A2A2A",
    100: "#242424",
    200: "#1F1F1F",
    300: "#181818",
    400: "#121212",
  },

  surface: {
    DEFAULT: "#1C1C1C",
    light: "#282828",
    dark: "#121212",
  },

  /* Accent colours (Uber/Spotify style: crisp white and vibrant accents like Spotify green or pure white) */
  accent: {
    blue: "#3B82F6",
    cyan: "#1ED760", // Spotify Green
    violet: "#FFFFFF", // Pure white for primary accents
    emerald: "#10B981",
    amber: "#F59E0B",
    rose: "#F43F5E",
  },

  /* Text hierarchy */
  text: {
    primary: "#FFFFFF",
    secondary: "#B3B3B3",
    muted: "#535353",
    inverse: "#000000",
  },

  /* Borders and dividers */
  border: {
    DEFAULT: "#282828",
    light: "#333333",
    subtle: "#181818",
  },

  /* Semantic */
  success: "#10B981",
  warning: "#F59E0B",
  error: "#F43F5E",
  info: "#3B82F6",
} as const;

/* ------------------------------------------------------------------ */
/*  Typography                                                         */
/* ------------------------------------------------------------------ */

export const FONTS = {
  light: "Inter_300Light",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  title: "PlusJakartaSans_800ExtraBold",
} as const;

export const FONT_SIZES = {
  xs: 13,
  sm: 15,
  base: 17,
  md: 19,
  lg: 22,
  xl: 26,
  "2xl": 32,
  "3xl": 38,
  "4xl": 44,
} as const;

/* ------------------------------------------------------------------ */
/*  Spacing & Layout                                                   */
/* ------------------------------------------------------------------ */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

/* ------------------------------------------------------------------ */
/*  Shadows (platform-specific via StyleSheet)                         */
/* ------------------------------------------------------------------ */

export const SHADOWS = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Animation Timing                                                   */
/* ------------------------------------------------------------------ */

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: { damping: 15, stiffness: 120, mass: 1 },
} as const;

/* ------------------------------------------------------------------ */
/*  API Endpoints (stubs for backend wiring)                           */
/* ------------------------------------------------------------------ */

/** Base URL for the Django smart_advisor backend. */
export const API_BASE_URL = "http://localhost:8000/api";

export const API_ENDPOINTS = {
  /** Prolog-based recommendation engine. */
  prologRecommend: `${API_BASE_URL}/recommend/prolog`,
  /** Gemini AI recommendation engine. */
  aiRecommend: `${API_BASE_URL}/recommend/ai`,
} as const;
