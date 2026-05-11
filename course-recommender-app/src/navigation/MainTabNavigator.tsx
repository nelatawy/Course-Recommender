import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { BookOpen, BrainCircuit } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CourseSetupScreen } from "../screens/CourseSetupScreen";
import { AdvisorScreen } from "../screens/AdvisorScreen";
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";

export type MainTabParamList = {
  CourseSetup: undefined;
  Advisor: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main bottom tab navigator with two tabs: Course Setup and Advisor.
 * Features a custom floating tab bar with glass-morphism styling.
 */
export function MainTabNavigator() {
  const insets = useSafeAreaInsets();

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
          backgroundColor: "rgba(18, 18, 18, 0.95)",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: COLORS.border.DEFAULT,
          paddingBottom: 0,
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
      <Tab.Screen
        name="CourseSetup"
        component={CourseSetupScreen}
        options={{
          tabBarLabel: "Courses",
          tabBarIcon: ({ color, size, focused }) => (
            <BookOpen color={focused ? COLORS.accent.cyan : color} size={size} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
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
    </Tab.Navigator>
  );
}
