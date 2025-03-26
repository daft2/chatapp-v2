import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";
import { AuthProvider } from "../contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./global.css";
import { AgoraProvider } from "@/contexts/AgoraContext";

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AgoraProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
            </AgoraProvider>
          </AuthProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
