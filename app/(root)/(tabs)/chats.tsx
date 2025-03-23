import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../store";
import { setChats, type Chat } from "../../../store/slices/chatSlice";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import type { User } from "../../../store/slices/userSlice";
import { MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";

const ChatsScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const chats = useSelector((state: RootState) =>
    Object.values(state.chat.chats)
  );
  const users = useSelector((state: RootState) => state.user.users);

  useEffect(() => {
    if (!user) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chatsList: Chat[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          chatsList.push({
            id: doc.id,
            participants: data.participants,
            lastMessage: data.lastMessage,
            unreadCount: data.unreadCount || 0,
          });
        });

        dispatch(setChats(chatsList));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dispatch, user]);

  const getOtherUser = (chat: Chat): User | undefined => {
    if (!user) return undefined;

    const otherUserId = chat.participants.find((id) => id !== user.uid);
    return otherUserId ? users[otherUserId] : undefined;
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherUser = getOtherUser(item);

    if (!otherUser) return null;

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-gray-200"
        onPress={() =>
          router.push({
            pathname: "/chat",
            params: {
              chatId: item.id,
              userId: otherUser.id,
              userName: otherUser.displayName,
            },
          })
        }
      >
        <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
          <Text className="text-blue-600 font-bold text-lg">
            {otherUser.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between">
            <Text className="font-semibold text-lg">
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

          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-gray-600 text-sm" numberOfLines={1}>
              {item.lastMessage ? item.lastMessage.text : "No messages yet"}
            </Text>

            {item.unreadCount > 0 && (
              <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyComponent = () => (
    <View className="flex-1 items-center justify-center p-8">
      <MessageCircle size={48} color="#3b82f6" />
      <Text className="text-lg text-gray-600 text-center mt-4">
        No chats yet
      </Text>
      <Text className="text-sm text-gray-500 text-center mt-2">
        Start a conversation by visiting the Users tab
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        ListEmptyComponent={EmptyComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
};

export default ChatsScreen;
