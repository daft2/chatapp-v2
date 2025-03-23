import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useAuth } from "../../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Video,
  Users,
  User as UserIcon,
} from "lucide-react-native";
import type { Chat } from "../../../store/slices/chatSlice";
import type { User } from "../../../store/slices/userSlice";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const allUsers = useSelector((state: RootState) => state.user.users);

  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentData = async () => {
    if (!user) return;

    try {
      // Fetch recent chats
      const chatsQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid),
        orderBy("updatedAt", "desc"),
        limit(5)
      );

      const chatsSnapshot = await getDocs(chatsQuery);
      const recentChatsList: Chat[] = [];

      chatsSnapshot.forEach((doc) => {
        const data = doc.data();
        recentChatsList.push({
          id: doc.id,
          participants: data.participants,
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount || 0,
        });
      });

      setRecentChats(recentChatsList);

      // Get online users
      const onlineUsersList = Object.values(allUsers)
        .filter((u) => u.id !== user.uid && u.status === "online")
        .slice(0, 5);

      setOnlineUsers(onlineUsersList);
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecentData();
  }, [user, allUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentData();
  };

  const getOtherUser = (chat: Chat): User | undefined => {
    if (!user) return undefined;

    const otherUserId = chat.participants.find((id) => id !== user.uid);
    return otherUserId ? allUsers[otherUserId] : undefined;
  };

  const navigateToChat = (chatId: string, userId: string, userName: string) => {
    router.push({
      pathname: "/chat",
      params: { chatId, userId, userName },
    });
  };

  const navigateToUsers = () => {
    router.push("/users");
  };

  const navigateToChats = () => {
    router.push("/chats");
  };

  const navigateToProfile = () => {
    router.push("/profile");
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;
    console.log(otherUser);
    return (
      <TouchableOpacity
        className="flex-row items-center p-4 bg-white rounded-xl shadow-sm mb-2"
        onPress={() =>
          navigateToChat(item.id, otherUser.id, otherUser.displayName)
        }
      >
        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
          <Text className="font-bold text-lg text-black">
            {otherUser.email.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 ml-3">
          <View className="flex-row justify-between">
            <Text className="font-semibold text-base">
              {otherUser.displayName}
            </Text>
            {item.lastMessage && (
              <Text className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(item.lastMessage.timestamp), {
                  addSuffix: true,
                })}
              </Text>
            )}
          </View>

          <Text className="text-gray-600 text-sm" numberOfLines={1}>
            {item.lastMessage ? item.lastMessage.text : "No messages yet"}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center ml-2">
            <Text className="text-white text-xs font-bold">
              {item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderOnlineUser = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity
        className="items-center mr-4"
        onPress={() => {
          // Create a unique chat ID using both user IDs (sorted to ensure consistency)
          const chatId = [user?.uid, item.id].sort().join("_");
          navigateToChat(chatId, item.id, item.displayName);
        }}
      >
        <View className="relative">
          <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center">
            <Text className="text-blue-600 font-bold text-xl">
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
        </View>
        <Text className="text-center mt-1 text-sm font-medium">
          {item.displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-blue-500 pt-6 pb-8 px-4">
        <Text className="text-white text-2xl font-bold">
          Welcome, {currentUser?.displayName?.split(" ")[0] || "User"}
        </Text>
        <Text className="text-blue-100 mt-1">
          Stay connected with friends and family
        </Text>
      </View>

      {/* Quick Actions */}
      <View className="px-4 -mt-5">
        <View className="bg-white rounded-xl shadow-md p-4 flex-row justify-around">
          <TouchableOpacity className="items-center" onPress={navigateToChats}>
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-1">
              <MessageCircle size={24} color="#3b82f6" />
            </View>
            <Text className="text-gray-800 text-xs">Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center" onPress={navigateToUsers}>
            <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mb-1">
              <Users size={24} color="#8b5cf6" />
            </View>
            <Text className="text-gray-800 text-xs">Users</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center">
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-1">
              <Video size={24} color="#10b981" />
            </View>
            <Text className="text-gray-800 text-xs">Video Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center"
            onPress={navigateToProfile}
          >
            <View className="w-12 h-12 rounded-full bg-orange-100 items-center justify-center mb-1">
              <UserIcon size={24} color="#f59e0b" />
            </View>
            <Text className="text-gray-800 text-xs">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Online Users */}
      <View className="mt-6 px-4">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Online Now
        </Text>
        {onlineUsers.length > 0 ? (
          <FlatList
            data={onlineUsers}
            renderItem={renderOnlineUser}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        ) : (
          <View className="bg-white rounded-xl p-4 items-center justify-center">
            <Text className="text-gray-500">No users online at the moment</Text>
          </View>
        )}
      </View>

      {/* Recent Chats */}
      <View className="mt-6 px-4 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-gray-800">
            Recent Chats
          </Text>
          <TouchableOpacity onPress={navigateToChats}>
            <Text className="text-blue-500">See All</Text>
          </TouchableOpacity>
        </View>

        {recentChats.length > 0 ? (
          recentChats.map((chat) => (
            <View key={chat.id}>{renderChatItem({ item: chat })}</View>
          ))
        ) : (
          <View className="bg-white rounded-xl p-6 items-center justify-center">
            <MessageCircle size={40} color="#d1d5db" />
            <Text className="text-gray-500 mt-2 text-center">
              No recent chats
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Start a conversation by visiting the Users tab
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
              onPress={navigateToUsers}
            >
              <Text className="text-white font-medium">Find Users</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
