import "./global.css";
import React, { useState, useCallback, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { CourseProvider } from "./src/store/CourseContext";
import { COLORS } from "./src/constants/theme";

/**
 * Application root component.
 * Handles font loading, global providers, and navigation bootstrap.
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.midnight.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.accent.cyan} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CourseProvider>
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: COLORS.accent.blue,
                background: COLORS.midnight.DEFAULT,
                card: COLORS.navy.DEFAULT,
                text: COLORS.text.primary,
                border: COLORS.border.DEFAULT,
                notification: COLORS.accent.rose,
              },
              fonts: {
                regular: {
                  fontFamily: "Inter_400Regular",
                  fontWeight: "400" as const,
                },
                medium: {
                  fontFamily: "Inter_500Medium",
                  fontWeight: "500" as const,
                },
                bold: {
                  fontFamily: "Inter_700Bold",
                  fontWeight: "700" as const,
                },
                heavy: {
                  fontFamily: "Inter_700Bold",
                  fontWeight: "900" as const,
                },
              },
            }}
          >
            <RootNavigator />
          </NavigationContainer>
        </CourseProvider>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
