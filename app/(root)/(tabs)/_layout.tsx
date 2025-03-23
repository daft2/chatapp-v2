import { View, Text } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Slot } from "expo-router";

const MainLayout = () => {
  return (
    <SafeAreaView className="flex h-full">
      <Slot />
    </SafeAreaView>
  );
};

export default MainLayout;
