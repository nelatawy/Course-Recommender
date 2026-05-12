import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthScreen } from "../screens/AuthScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { COLORS } from "../constants/theme";
import { useCourseStore } from "../store/CourseContext";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root-level stack navigator.
 * Starts with the onboarding splash, then transitions to the main tab navigator.
 */
export function RootNavigator() {
  const { state } = useCourseStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.midnight.DEFAULT },
        animation: "fade",
      }}
    >
      {state.role === null ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
