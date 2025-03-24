import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../store";
import { setUsers, type User } from "../../../store/slices/userSlice";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../contexts/AuthContext";
import { TextInput } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";

const UsersScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const users = useSelector((state: RootState) =>
    Object.values(state.user.users).filter((u) => u.id !== user?.uid)
  );

  useEffect(() => {
    if (!user) return;

    const usersQuery = query(collection(db, "users"));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersList: User[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          usersList.push({
            id: doc.id,
            email: data.email || "",
            displayName: data.displayName || "",
            photoURL: data.photoURL || undefined,
            status: data.status || "offline",
            lastSeen: data.lastSeen?.toMillis() || undefined,
          });
        });

        dispatch(setUsers(usersList));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dispatch, user]);

  const startChat = async (selectedUser: User) => {
    if (!user) return;

    // Create a unique chat ID using both user IDs (sorted to ensure consistency)
    const chatId = [user.uid, selectedUser.id].sort().join("_");

    try {
      // Check if chat already exists
      const chatDoc = await getDoc(doc(db, "chats", chatId));

      if (!chatDoc.exists()) {
        // Create a new chat document
        await setDoc(doc(db, "chats", chatId), {
          participants: [user.uid, selectedUser.id],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Navigate to chat screen
      router.push({
        pathname: "/chat",
        params: {
          chatId,
          userId: selectedUser.id,
          userName: selectedUser.displayName,
        },
      });
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const renderUserItem = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-gray-200"
        onPress={() => startChat(item)}
      >
        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
          <Text className="text-blue-600 font-bold text-lg">
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 ml-4">
          <Text className="font-semibold text-lg">{item.displayName}</Text>
          <Text className="text-gray-600 text-sm">{item.email}</Text>
        </View>

        <View
          className={`w-3 h-3 rounded-full ${
            item.status === "online" ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Feather name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default UsersScreen;
