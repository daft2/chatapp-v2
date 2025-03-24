import React, { useEffect, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import AgoraUIKit from "agora-rn-uikit";
import { Pressable, Text, View } from "react-native";

const VideoCall = () => {
  const [videoCall, setVideoCall] = useState(true);
  const { chatId } = useLocalSearchParams<{
    chatId: string;
  }>();
  const router = useRouter();

  const connectionData = {
    appId: process.env.EXPO_PUBLIC_AGORA_APP_ID!,
    channel: chatId,
  };
  ``;

  const rtcCallbacks = {
    EndCall: () => {
      setVideoCall(false);
    },
  };

  return videoCall ? (
    <AgoraUIKit connectionData={connectionData} rtcCallbacks={rtcCallbacks} />
  ) : (
    <View className="flex h-full justify-center items-center">
      <Pressable onPress={() => router.back()}>
        <Text>Back to Home</Text>
      </Pressable>
    </View>
  );
};

export default VideoCall;
