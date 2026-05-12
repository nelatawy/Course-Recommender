import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Dimensions, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { User, ShieldAlert } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from "../constants/theme";
import { useCourseStore } from "../store/CourseContext";
import * as api from "../services/api";

type AuthNav = NativeStackNavigationProp<RootStackParamList, "Auth">;

export function AuthScreen() {
  const navigation = useNavigation<AuthNav>();
  const { dispatch, fetchData } = useCourseStore();
  
  const [activeTab, setActiveTab] = useState<"student" | "admin">("student");
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [adminKey, setAdminKey] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStudentAuth = async () => {
    if (!studentId.trim() || (isSignUp && !name.trim())) {
      setError("Please fill all fields.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      if (isSignUp) {
        const res = await api.signUp(name, studentId);
        dispatch({ type: "SET_AUTH_STUDENT", payload: res.student });
      } else {
        const res = await api.signIn(studentId);
        dispatch({ type: "SET_AUTH_STUDENT", payload: res.student });
      }
      
      // Load global data (courses, edges)
      await fetchData();
      
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async () => {
    if (!adminKey.trim()) {
      setError("Please enter the admin key.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await api.adminLogin(adminKey);
      if (res.status === "success") {
        dispatch({ type: "SET_AUTH_ADMIN", payload: adminKey });
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Invalid admin key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Smart Advisor</Text>
          <Text style={styles.subtitle}>Log in to continue</Text>
        </View>

        {/* Tab selector */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, activeTab === "student" && styles.activeTab]}
            onPress={() => { setActiveTab("student"); setError(""); }}
          >
            <User color={activeTab === "student" ? COLORS.text.primary : COLORS.text.muted} size={18} />
            <Text style={[styles.tabText, activeTab === "student" && styles.activeTabText]}>Student</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === "admin" && styles.activeTab]}
            onPress={() => { setActiveTab("admin"); setError(""); }}
          >
            <ShieldAlert color={activeTab === "admin" ? COLORS.text.primary : COLORS.text.muted} size={18} />
            <Text style={[styles.tabText, activeTab === "admin" && styles.activeTabText]}>Admin</Text>
          </Pressable>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {activeTab === "student" ? (
            <>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={COLORS.text.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Student ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 123456"
                  placeholderTextColor={COLORS.text.muted}
                  value={studentId}
                  onChangeText={setStudentId}
                  keyboardType="number-pad"
                />
              </View>

              <Pressable 
                style={[styles.primaryButton, loading && styles.disabledButton]} 
                onPress={handleStudentAuth}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.midnight.DEFAULT} /> : <Text style={styles.primaryButtonText}>{isSignUp ? "Sign Up" : "Sign In"}</Text>}
              </Pressable>

              <Pressable style={styles.toggleAuthMode} onPress={() => { setIsSignUp(!isSignUp); setError(""); }}>
                <Text style={styles.toggleAuthModeText}>
                  {isSignUp ? "Already have an account? Sign In" : "New student? Sign Up"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admin Secret Key</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter secret key..."
                  placeholderTextColor={COLORS.text.muted}
                  value={adminKey}
                  onChangeText={setAdminKey}
                  secureTextEntry
                />
              </View>

              <Pressable 
                style={[styles.primaryButton, loading && styles.disabledButton]} 
                onPress={handleAdminAuth}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.midnight.DEFAULT} /> : <Text style={styles.primaryButtonText}>Access Dashboard</Text>}
              </Pressable>
            </>
          )}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.midnight.DEFAULT,
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface.dark,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS["2xl"],
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES["3xl"],
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.midnight.DEFAULT,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  activeTab: {
    backgroundColor: COLORS.surface.light,
  },
  tabText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.muted,
  },
  activeTabText: {
    color: COLORS.text.primary,
  },
  formContainer: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  input: {
    backgroundColor: COLORS.midnight.DEFAULT,
    borderWidth: 1,
    borderColor: COLORS.border.DEFAULT,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text.primary,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
  },
  primaryButton: {
    backgroundColor: COLORS.text.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    color: COLORS.midnight.DEFAULT,
  },
  toggleAuthMode: {
    alignItems: "center",
    paddingTop: SPACING.sm,
  },
  toggleAuthModeText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent.cyan,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent.rose,
    textAlign: "center",
  },
});
