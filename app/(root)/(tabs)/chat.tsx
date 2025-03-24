import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../store";
import {
  setMessages,
  addMessage,
  updateMessageStatus,
  type Message,
} from "../../../store/slices/chatSlice";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../contexts/AuthContext";
import { format } from "date-fns";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { useRouter, useLocalSearchParams } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const ChatScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { chatId, userId, userName } = useLocalSearchParams<{
    chatId: string;
    userId: string;
    userName: string;
  }>();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  const messages = useSelector(
    (state: RootState) => state.chat.messages[chatId] ?? []
  );
  const flatListRef = useRef<FlatList>(null);
  const appStateRef = useRef(AppState.currentState);

  // Set up real-time listener for messages
  useEffect(() => {
    if (!user || !chatId) return;

    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList: Message[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesList.push({
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            receiverId: data.receiverId,
            timestamp: data.timestamp?.toMillis() || Date.now(),
            status: data.status || "sent",
          });
        });

        dispatch(setMessages({ chatId, messages: messagesList }));
        setLoading(false);

        // Mark messages as seen if they are from the other user
        messagesList.forEach((message) => {
          if (message.senderId === userId && message.status !== "seen") {
            updateMessageStatusInFirestore(message.id, "seen");
          }
        });
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    );

    // Load cached messages from AsyncStorage
    loadCachedMessages();

    // Set up network listener
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== null ? state.isConnected : false);

      // If connection is restored, send pending messages
      if (state.isConnected && pendingMessages.length > 0) {
        sendPendingMessages();
      }
    });

    // Set up app state listener
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground, mark messages as seen
        messages.forEach((message) => {
          if (message.senderId === userId && message.status !== "seen") {
            updateMessageStatusInFirestore(message.id, "seen");
          }
        });
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      unsubscribe();
      unsubscribeNetInfo();
      subscription.remove();
    };
  }, [chatId, dispatch, user, userId, pendingMessages]);

  // Cache messages in AsyncStorage
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(`chat_${chatId}_messages`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  const loadCachedMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem(
        `chat_${chatId}_messages`
      );
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        dispatch(setMessages({ chatId, messages: parsedMessages }));
      }
    } catch (error) {
      console.error("Error loading cached messages:", error);
    }
  };

  const updateMessageStatusInFirestore = async (
    messageId: string,
    status: "sent" | "delivered" | "seen"
  ) => {
    try {
      const messageRef = doc(db, `chats/${chatId}/messages/${messageId}`);
      await updateDoc(messageRef, { status });
      dispatch(updateMessageStatus({ messageId, chatId, status }));
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !user) return;

    const trimmedText = text.trim();
    setText("");
    const newUUID = uuidv4();

    const newMessage: Message = {
      id: newUUID,
      text: trimmedText,
      senderId: user.uid,
      receiverId: userId,
      timestamp: Date.now(),
      status: "pending",
    };

    // Add to local state immediately
    dispatch(addMessage({ chatId, message: newMessage }));

    if (!isOnline) {
      // Store message locally if offline
      setPendingMessages([...pendingMessages, newMessage]);
      await AsyncStorage.setItem(
        `chat_${chatId}_pending`,
        JSON.stringify([...pendingMessages, newMessage])
      );
      return;
    }

    try {
      // Check if chat document exists
      const chatDoc = await getDoc(doc(db, "chats", chatId));

      if (!chatDoc.exists()) {
        await setDoc(doc(db, "chats", chatId), {
          participants: [user.uid, userId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Add message to Firestore
      const messageRef = await addDoc(
        collection(db, `chats/${chatId}/messages`),
        {
          text: trimmedText,
          senderId: user.uid,
          receiverId: userId,
          timestamp: serverTimestamp(),
          status: "sent",
        }
      );

      // Update chat document with last message
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: {
          text: trimmedText,
          senderId: user.uid,
          timestamp: Date.now(),
        },
        updatedAt: serverTimestamp(),
      });

      // Get Firestore-assigned ID
      const messageId = messageRef.id;

      // Update Redux store with correct message ID
      dispatch(updateMessageStatus({ messageId, chatId, status: "sent" }));
    } catch (error) {
      console.error("Error sending message:", error);

      // Store message locally if sending fails
      setPendingMessages([...pendingMessages, newMessage]);
      await AsyncStorage.setItem(
        `chat_${chatId}_pending`,
        JSON.stringify([...pendingMessages, newMessage])
      );
    }
  };

  const sendPendingMessages = async () => {
    if (!user || pendingMessages.length === 0) return;

    const messages = [...pendingMessages];
    setPendingMessages([]);
    await AsyncStorage.removeItem(`chat_${chatId}_pending`);

    for (const message of messages) {
      try {
        // Add message to Firestore
        const messageRef = await addDoc(
          collection(db, `chats/${chatId}/messages`),
          {
            text: message.text,
            senderId: user.uid,
            receiverId: userId,
            timestamp: serverTimestamp(),
            status: "sent",
          }
        );

        // Update chat document with last message
        await updateDoc(doc(db, "chats", chatId), {
          lastMessage: {
            text: message.text,
            senderId: user.uid,
            timestamp: Date.now(),
          },
          updatedAt: serverTimestamp(),
        });

        // Update local message status
        dispatch(
          updateMessageStatus({
            messageId: message.id,
            chatId,
            status: "sent",
          })
        );
      } catch (error) {
        console.error("Error sending pending message:", error);

        // Re-add to pending messages if sending fails
        setPendingMessages((prev) => [...prev, message]);
        await AsyncStorage.setItem(
          `chat_${chatId}_pending`,
          JSON.stringify([...pendingMessages, message])
        );
      }
    }
  };

  const startVideoCall = () => {
    router.push({
      pathname: "/video-call",
      params: {
        chatId,
      },
    });
  };

  const renderMessageItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMyMessage = item.senderId === user?.uid;

      return (
        <View
          className={`max-w-[80%] rounded-lg p-3 my-1 ${
            isMyMessage
              ? "bg-blue-500 self-end rounded-tr-none"
              : "bg-gray-200 self-start rounded-tl-none"
          }`}
        >
          <Text className={`${isMyMessage ? "text-white" : "text-gray-800"}`}>
            {item.text}
          </Text>
          <View className="flex-row justify-between items-center mt-1">
            <Text
              className={`text-xs ${
                isMyMessage ? "text-blue-100" : "text-gray-500"
              }`}
            >
              {format(new Date(item.timestamp), "HH:mm")}
            </Text>

            {isMyMessage && (
              <Text
                className={`text-xs ml-2 ${
                  isMyMessage ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {item.status === "pending"
                  ? "Sending..."
                  : item.status === "sent"
                  ? "Sent"
                  : item.status === "delivered"
                  ? "Delivered"
                  : "Seen"}
              </Text>
            )}
          </View>
        </View>
      );
    },
    [user?.uid]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="flex-1 bg-white">
        {!isOnline && (
          <View className="bg-yellow-500 p-2">
            <Text className="text-white text-center">
              You are offline. Messages will be sent when you're back online.
            </Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessageItem}
          contentContainerStyle={{ padding: 10 }}
          inverted={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS !== "ios"}
        />

        <View className="flex-row items-center p-2 border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            multiline
          />

          <TouchableOpacity
            className="p-2 bg-blue-500 rounded-full mr-2"
            onPress={startVideoCall}
          >
            <FontAwesome5 name="video" size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            className="p-2 bg-blue-500 rounded-full"
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <FontAwesome name="send" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
