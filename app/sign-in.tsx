import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      router.push("/");
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "Please check your credentials and try again"
      );
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Redirect href="/" />;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="flex-grow">
        <View className="flex-1 justify-center p-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-center text-blue-600">
              Chat App
            </Text>
            <Text className="text-center text-gray-500 mt-2">
              Sign in to continue
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
              <TextInput
                className="bg-gray-100 p-4 rounded-lg text-gray-800"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-2 font-medium">Password</Text>
              <TextInput
                className="bg-gray-100 p-4 rounded-lg text-gray-800"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`py-4 rounded-lg ${
                loading ? "bg-blue-400" : "bg-blue-600"
              }`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/sign-up")}>
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
