import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { BookOpen, BrainCircuit } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseSetupScreen } from "../screens/CourseSetupScreen";
import { AdvisorScreen } from "../screens/AdvisorScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";
import { useCourseStore } from "../store/CourseContext";

export type MainTabParamList = {
  CourseSetup: undefined;
  Advisor: undefined;
  AdminDashboard: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main bottom tab navigator with two tabs: Course Setup and Advisor.
 * Features a custom floating tab bar with glass-morphism styling.
 */
export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const { state } = useCourseStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + SPACING.xl,
          left: SPACING.xl,
          right: SPACING.xl,
          height: 72,
          borderRadius: BORDER_RADIUS.xl,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: COLORS.border.DEFAULT,
          paddingBottom: 0,
          overflow: "hidden",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
            },
            android: {
              elevation: 16,
            },
          }),
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={80} 
            tint="dark" 
            style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS.xl }]} 
          />
        ),
        tabBarActiveTintColor: COLORS.text.primary,
        tabBarInactiveTintColor: COLORS.text.muted,
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: FONT_SIZES.sm,
          marginTop: -4,
        },
        tabBarItemStyle: {
          paddingTop: SPACING.md,
        },
      }}
    >
      {state.role === "admin" ? (
        <Tab.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            tabBarIcon: ({ color, size, focused }) => (
              <BookOpen color={focused ? COLORS.accent.cyan : color} size={size} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
      ) : (
        <Tab.Screen
          name="CourseSetup"
          component={CourseSetupScreen}
          options={{
            tabBarLabel: "Catalog",
            tabBarIcon: ({ color, size, focused }) => (
              <BookOpen color={focused ? COLORS.accent.cyan : color} size={size} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
      )}
      {state.role !== "admin" && (
        <Tab.Screen
          name="Advisor"
          component={AdvisorScreen}
          options={{
            tabBarLabel: "Advisor",
            tabBarIcon: ({ color, size, focused }) => (
              <BrainCircuit color={focused ? COLORS.accent.cyan : color} size={size} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}
