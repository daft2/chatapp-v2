import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot, Stack, useRouter } from "expo-router";
import "react-native-gesture-handler";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";

const MainLayout = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to sign-in if not authenticated
        router.replace("/sign-in");
      }
    }
  }, [user, loading, router]); // Run when user or loading state changes

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Only render the content if the user is authenticated
  if (!user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <SafeAreaView className="flex h-full">
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
};

export default MainLayout;
