import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAuth } from "../../../contexts/AuthContext";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { LogOut, User as UserIcon, Settings, Info } from "lucide-react-native";
import { Redirect } from "expo-router";

const ProfileScreen = () => {
  const { logout, user } = useAuth();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  if (!currentUser || !user) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="items-center pt-10 pb-6 bg-blue-500">
        <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-4">
          <UserIcon size={48} color="#3b82f6" />
        </View>
        <Text className="text-white text-xl font-bold">
          {currentUser.displayName}
        </Text>
        <Text className="text-blue-100">{currentUser.email}</Text>
      </View>

      <View className="p-4">
        <View className="bg-white rounded-lg shadow-sm overflow-hidden">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Settings size={24} color="#3b82f6" />
            <Text className="ml-3 text-gray-800 font-medium">
              Account Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <Info size={24} color="#3b82f6" />
            <Text className="ml-3 text-gray-800 font-medium">About</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4"
            onPress={handleLogout}
          >
            <LogOut size={24} color="#ef4444" />
            <Text className="ml-3 text-red-500 font-medium">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <Text className="text-gray-500 text-center text-sm">
            App Version 1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
