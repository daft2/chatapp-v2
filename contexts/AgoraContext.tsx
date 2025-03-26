"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { Platform, PermissionsAndroid, Alert } from "react-native";
import {
  createAgoraRtcEngine,
  type IRtcEngine,
  type IRtcEngineEventHandler,
  type RtcConnection,
  ChannelProfileType,
  ClientRoleType,
} from "react-native-agora";
import { AGORA_APP_ID, getAgoraToken } from "../config/agora";

interface AgoraContextType {
  engine: IRtcEngine | null;
  joinChannel: (channelName: string) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMic: () => Promise<void>;
  switchCamera: () => Promise<void>;
  localUid: number | null;
  remoteUids: number[];
  currentChannelName: string | null;
  isJoined: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
}

const AgoraContext = createContext<AgoraContextType | undefined>(undefined);

export const useAgora = () => {
  const context = useContext(AgoraContext);
  if (context === undefined) {
    throw new Error("useAgora must be used within an AgoraProvider");
  }
  return context;
};

export const AgoraProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const agoraEngineRef = useRef<IRtcEngine>();
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [remoteUids, setRemoteUids] = useState<number[]>([]);
  const [currentChannelName, setCurrentChannelName] = useState<string | null>(
    null
  );
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const eventHandlerRef = useRef<IRtcEngineEventHandler>();

  // Initialize Agora engine
  useEffect(() => {
    const setupVideoSDKEngine = async () => {
      try {
        // Request permissions if on Android
        await getPermissions();

        // Create and initialize the Agora engine
        agoraEngineRef.current = createAgoraRtcEngine();
        await agoraEngineRef.current.initialize({ appId: AGORA_APP_ID });

        // Set up event handlers
        setupEventHandlers();
      } catch (error) {
        console.error("Error setting up Agora engine:", error);
        Alert.alert("Error", "Failed to initialize video call engine");
      }
    };

    setupVideoSDKEngine();

    // Cleanup when component unmounts
    return () => {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.unregisterEventHandler(eventHandlerRef.current!);
        agoraEngineRef.current.release();
      }
    };
  }, []);

  const getPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  };

  const setupEventHandlers = () => {
    eventHandlerRef.current = {
      onJoinChannelSuccess: (_connection: RtcConnection, uid: number) => {
        console.log("Local user joined channel successfully:", uid);
        setLocalUid(uid);
        setIsJoined(true);
      },
      onUserJoined: (
        _connection: RtcConnection,
        uid: number,
        _elapsed: number
      ) => {
        console.log("Remote user joined:", uid);
        setRemoteUids((prevUids) => {
          if (prevUids.includes(uid)) {
            return prevUids;
          }
          return [...prevUids, uid];
        });
      },
      onUserOffline: (
        _connection: RtcConnection,
        uid: number,
        _reason: number
      ) => {
        console.log("Remote user left:", uid);
        setRemoteUids((prevUids) => prevUids.filter((id) => id !== uid));
      },
      onLeaveChannel: () => {
        console.log("Local user left channel");
        setIsJoined(false);
        setRemoteUids([]);
        setCurrentChannelName(null);
      },
      onError: (err, msg) => {
        console.error("Agora Error:", err, msg);
      },
    };

    agoraEngineRef.current?.registerEventHandler(eventHandlerRef.current);
  };

  const setupLocalVideo = () => {
    if (!agoraEngineRef.current) return;

    // Enable video module
    agoraEngineRef.current.enableVideo();
    // Start local preview
    agoraEngineRef.current.startPreview();
  };

  const joinChannel = async (channelName: string) => {
    if (!agoraEngineRef.current) {
      Alert.alert("Error", "Agora engine is not initialized");
      return;
    }

    if (isJoined) {
      console.log("Already joined a channel");
      return;
    }

    try {
      // Get token for the channel
      const token = getAgoraToken(channelName);

      // Setup local video before joining
      setupLocalVideo();

      // Join channel as broadcaster (active participant)
      await agoraEngineRef.current.joinChannel(token, channelName, 0, {
        // Set channel profile to communication (like a regular video call)
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        // Set user role to broadcaster (can send and receive streams)
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        // Enable microphone and camera
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        // Auto subscribe to remote streams
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      setCurrentChannelName(channelName);
    } catch (error) {
      console.error("Error joining channel:", error);
      Alert.alert("Error", "Failed to join the video call");
    }
  };

  const leaveChannel = async () => {
    if (!agoraEngineRef.current || !isJoined) {
      return;
    }

    try {
      await agoraEngineRef.current.leaveChannel();
      // Reset state
      setIsMuted(false);
      setIsCameraOff(false);
    } catch (error) {
      console.error("Error leaving channel:", error);
    }
  };

  const toggleMic = async () => {
    if (!agoraEngineRef.current || !isJoined) {
      return;
    }

    try {
      await agoraEngineRef.current.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling mic:", error);
    }
  };

  const toggleCamera = async () => {
    if (!agoraEngineRef.current || !isJoined) {
      return;
    }

    try {
      await agoraEngineRef.current.muteLocalVideoStream(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  const switchCamera = async () => {
    if (!agoraEngineRef.current || !isJoined) {
      return;
    }

    try {
      await agoraEngineRef.current.switchCamera();
    } catch (error) {
      console.error("Error switching camera:", error);
    }
  };

  const value = {
    engine: agoraEngineRef.current || null,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMic,
    switchCamera,
    localUid,
    remoteUids,
    currentChannelName,
    isJoined,
    isMuted,
    isCameraOff,
  };

  return (
    <AgoraContext.Provider value={value}>{children}</AgoraContext.Provider>
  );
};
