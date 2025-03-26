"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import { useAgora } from "../../../contexts/AgoraContext";
import { RtcSurfaceView, VideoSourceType } from "react-native-agora";
import Feather from "@expo/vector-icons/Feather";
import { v4 as uuidv4 } from "uuid";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const VideoCallScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Generate a channel name
  const [channelName] = useState(`call_${uuidv4()}`);

  const {
    joinChannel,
    leaveChannel,
    toggleMic,
    toggleCamera,
    switchCamera,
    localUid,
    remoteUids,
    isJoined,
    isMuted,
    isCameraOff,
  } = useAgora();

  const [callStatus, setCallStatus] = useState<
    "connecting" | "connected" | "ended"
  >("connecting");

  useEffect(() => {
    // Join the channel when component mounts
    const setupCall = async () => {
      try {
        await joinChannel(channelName);
      } catch (error) {
        console.error("Error joining channel:", error);
        Alert.alert("Error", "Failed to join the call. Please try again.");
        router.back();
      }
    };

    setupCall();

    // Leave the channel when component unmounts
    return () => {
      leaveChannel();
    };
  }, [channelName, joinChannel, leaveChannel, router]);

  // Update call status based on connection state
  useEffect(() => {
    if (isJoined) {
      setCallStatus("connected");
    }
  }, [isJoined]);

  // Handle remote users joining/leaving
  useEffect(() => {
    if (remoteUids.length > 0) {
      setCallStatus("connected");
    }
  }, [remoteUids]);

  const endCall = async () => {
    try {
      await leaveChannel();
      setCallStatus("ended");
      router.back();
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const renderRemoteUsers = () => {
    if (remoteUids.length === 0) {
      return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-xl">
            {callStatus === "connecting"
              ? "Connecting..."
              : "Waiting for others to join..."}
          </Text>
        </View>
      );
    }

    // For simplicity, we'll just show the first remote user in full screen
    // In a real app, you might want to handle multiple remote users with a grid layout
    return (
      <RtcSurfaceView
        canvas={{
          uid: remoteUids[0],
          sourceType: VideoSourceType.VideoSourceRemote,
          renderMode: 1, // FIT mode
        }}
        style={{ flex: 1 }}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Remote User Video */}
      <View className="flex-1">{renderRemoteUsers()}</View>

      {/* Local User Video (Picture-in-Picture) */}
      {localUid !== null && !isCameraOff && (
        <View className="absolute top-5 right-5 w-1/3 h-1/4 bg-gray-800 rounded-lg overflow-hidden">
          <RtcSurfaceView
            canvas={{
              uid: localUid,
              sourceType: VideoSourceType.VideoSourceCamera,
              renderMode: 1, // FIT mode
            }}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Call Controls */}
      <View className="absolute bottom-10 left-0 right-0 flex-row justify-center space-x-6">
        <TouchableOpacity
          className={`w-14 h-14 rounded-full items-center justify-center ${
            isMuted ? "bg-red-500" : "bg-gray-700"
          }`}
          onPress={toggleMic}
        >
          {isMuted ? (
            <Feather name="mic-off" size={24} color="#ffffff" />
          ) : (
            <Feather name="mic" size={24} color="#ffffff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-red-600 items-center justify-center"
          onPress={endCall}
        >
          <Feather name="phone" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-14 h-14 rounded-full items-center justify-center ${
            isCameraOff ? "bg-red-500" : "bg-gray-700"
          }`}
          onPress={toggleCamera}
        >
          {isCameraOff ? (
            <Feather name="video-off" size={24} color="#ffffff" />
          ) : (
            <Feather name="video" size={24} color="#ffffff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-gray-700 items-center justify-center"
          onPress={switchCamera}
        >
          <Feather name="refresh-cw" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Call Info */}
      <View className="absolute top-10 left-0 right-0 items-center">
        <Text className="text-white text-xl font-semibold">
          {callStatus === "connecting" ? "Connecting to " : "In call with "}
          {user?.displayName}
        </Text>
        <Text className="text-gray-300 mt-1">
          {callStatus === "connected"
            ? "Call connected"
            : callStatus === "connecting"
            ? "Establishing connection..."
            : "Call ended"}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default VideoCallScreen;
