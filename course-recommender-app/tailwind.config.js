/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: "#000000",
          50: "#1A1A1A",
          100: "#141414",
          200: "#0F0F0F",
          300: "#0A0A0A",
          400: "#050505",
          500: "#000000",
        },
        navy: {
          DEFAULT: "#121212",
          50: "#2A2A2A",
          100: "#242424",
          200: "#1F1F1F",
          300: "#181818",
          400: "#121212",
        },
        slate: {
          DEFAULT: "#535353",
          light: "#B3B3B3",
          muted: "#282828",
        },
        surface: {
          DEFAULT: "#1C1C1C",
          light: "#282828",
          dark: "#121212",
        },
        accent: {
          blue: "#3B82F6",
          cyan: "#1ED760", // Spotify Green
          violet: "#FFFFFF",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          muted: "#535353",
          inverse: "#000000",
        },
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
        "inter-light": ["Inter_300Light"],
        jakarta: ["PlusJakartaSans_800ExtraBold", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.3)",
        soft: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
