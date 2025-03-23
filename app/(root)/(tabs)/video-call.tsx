// import { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   Platform,
//   PermissionsAndroid,
// } from "react-native";
// import { useAuth } from "../../../contexts/AuthContext";
// import {
//   RTCPeerConnection,
//   RTCIceCandidate,
//   RTCSessionDescription,
//   RTCView,
//   mediaDevices,
// } from "react-native-webrtc";
// import {
//   doc,
//   onSnapshot,
//   setDoc,
//   updateDoc,
//   collection,
//   addDoc,
//   getDoc,
// } from "firebase/firestore";
// import { db } from "../../../config/firebase";
// import {
//   Mic,
//   MicOff,
//   Phone,
//   Video as VideoIcon,
//   VideoOff,
// } from "lucide-react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";

// const configuration = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//   ],
// };

// const VideoCallScreen = () => {
//   const router = useRouter();
//   const { user } = useAuth();
//   const {
//     chatId,
//     userId,
//     userName,
//     isIncoming = false,
//   } = useLocalSearchParams();

//   const [localStream, setLocalStream] = useState<any>(null);
//   const [remoteStream, setRemoteStream] = useState<any>(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [callStatus, setCallStatus] = useState<
//     "connecting" | "connected" | "ended"
//   >("connecting");

//   const peerConnection = useRef<RTCPeerConnection | null>(null);
//   const callDocRef = useRef<any>(null);

//   useEffect(() => {
//     const setupCall = async () => {
//       // Request permissions
//       if (Platform.OS === "android") {
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.CAMERA,
//           PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//         ]);

//         if (
//           granted[PermissionsAndroid.PERMISSIONS.CAMERA] !==
//             PermissionsAndroid.RESULTS.GRANTED ||
//           granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !==
//             PermissionsAndroid.RESULTS.GRANTED
//         ) {
//           Alert.alert(
//             "Permissions required",
//             "Camera and microphone permissions are required for video calls"
//           );
//           router.back();
//           return;
//         }
//       }

//       try {
//         // Get local stream
//         const stream = await mediaDevices.getUserMedia({
//           audio: true,
//           video: {
//             width: 640,
//             height: 480,
//             frameRate: 30,
//             facingMode: "user",
//           },
//         });

//         setLocalStream(stream);

//         // Create peer connection
//         const pc = new RTCPeerConnection(configuration);
//         peerConnection.current = pc;

//         // Add local tracks to peer connection
//         stream.getTracks().forEach((track) => {
//           pc.addTrack(track, stream);
//         });

//         // Set up remote stream
//         pc.ontrack = (event) => {
//           if (event.streams && event.streams[0]) {
//             setRemoteStream(event.streams[0]);
//           }
//         };

//         // Create or join call
//         const callId = `call_${chatId}`;
//         callDocRef.current = doc(db, "calls", callId);

//         if (!isIncoming) {
//           // Create offer (outgoing call)
//           const offerDescription = await pc.createOffer();
//           await pc.setLocalDescription(offerDescription);

//           const callData = {
//             offer: {
//               type: offerDescription.type,
//               sdp: offerDescription.sdp,
//             },
//             callerUid: user?.uid,
//             calleeUid: userId,
//             createdAt: new Date().toISOString(),
//             status: "pending",
//           };

//           await setDoc(callDocRef.current, callData);

//           // Listen for answer
//           const unsubscribe = onSnapshot(
//             callDocRef.current,
//             async (snapshot) => {
//               const data = snapshot.data();

//               if (!pc.currentRemoteDescription && data?.answer) {
//                 const answerDescription = new RTCSessionDescription(
//                   data.answer
//                 );
//                 await pc.setRemoteDescription(answerDescription);
//               }

//               if (data?.status === "accepted") {
//                 setCallStatus("connected");
//               } else if (
//                 data?.status === "rejected" ||
//                 data?.status === "ended"
//               ) {
//                 endCall();
//               }
//             }
//           );

//           // Create candidates collection
//           const callerCandidatesCollection = collection(
//             callDocRef.current,
//             "callerCandidates"
//           );

//           // Listen for ICE candidates
//           pc.onicecandidate = (event) => {
//             if (event.candidate) {
//               addDoc(callerCandidatesCollection, event.candidate.toJSON());
//             }
//           };

//           // Listen for remote ICE candidates
//           const calleeCandidatesCollection = collection(
//             callDocRef.current,
//             "calleeCandidates"
//           );
//           onSnapshot(calleeCandidatesCollection, (snapshot) => {
//             snapshot.docChanges().forEach((change) => {
//               if (change.type === "added") {
//                 const data = change.doc.data();
//                 pc.addIceCandidate(new RTCIceCandidate(data));
//               }
//             });
//           });

//           return () => unsubscribe();
//         } else {
//           // Answer call (incoming call)
//           const callDoc = await getDoc(callDocRef.current);

//           if (callDoc.exists()) {
//             const data = callDoc.data();

//             if (data.status === "pending") {
//               const offerDescription = new RTCSessionDescription(data.offer);
//               await pc.setRemoteDescription(offerDescription);

//               // Create answer
//               const answerDescription = await pc.createAnswer();
//               await pc.setLocalDescription(answerDescription);

//               // Update call document with answer
//               await updateDoc(callDocRef.current, {
//                 answer: {
//                   type: answerDescription.type,
//                   sdp: answerDescription.sdp,
//                 },
//                 status: "accepted",
//               });

//               setCallStatus("connected");

//               // Create candidates collection
//               const calleeCandidatesCollection = collection(
//                 callDocRef.current,
//                 "calleeCandidates"
//               );

//               // Listen for ICE candidates
//               pc.onicecandidate = (event) => {
//                 if (event.candidate) {
//                   addDoc(calleeCandidatesCollection, event.candidate.toJSON());
//                 }
//               };

//               // Listen for remote ICE candidates
//               const callerCandidatesCollection = collection(
//                 callDocRef.current,
//                 "callerCandidates"
//               );
//               onSnapshot(callerCandidatesCollection, (snapshot) => {
//                 snapshot.docChanges().forEach((change) => {
//                   if (change.type === "added") {
//                     const data = change.doc.data();
//                     pc.addIceCandidate(new RTCIceCandidate(data));
//                   }
//                 });
//               });

//               // Listen for call status changes
//               const unsubscribe = onSnapshot(callDocRef.current, (snapshot) => {
//                 const data = snapshot.data();
//                 if (data?.status === "ended") {
//                   endCall();
//                 }
//               });

//               return () => unsubscribe();
//             } else {
//               // Call was already answered or rejected
//               router.back();
//             }
//           } else {
//             // Call document doesn't exist
//             Alert.alert("Call ended", "The call is no longer available");
//             router.back();
//           }
//         }
//       } catch (error) {
//         console.error("Error setting up call:", error);
//         Alert.alert("Error", "Failed to set up call. Please try again.");
//         router.back();
//       }
//     };

//     setupCall();

//     return () => {
//       // Clean up when component unmounts
//       if (localStream) {
//         localStream.getTracks().forEach((track: any) => track.stop());
//       }

//       if (peerConnection.current) {
//         peerConnection.current.close();
//       }

//       // Update call status if user just closes the screen
//       if (callDocRef.current) {
//         updateDoc(callDocRef.current, { status: "ended" }).catch(console.error);
//       }
//     };
//   }, [chatId, isIncoming, router, userId, user]);

//   const endCall = async () => {
//     try {
//       // Stop all tracks
//       if (localStream) {
//         localStream.getTracks().forEach((track: any) => track.stop());
//       }

//       // Close peer connection
//       if (peerConnection.current) {
//         peerConnection.current.close();
//       }

//       // Update call status in Firestore
//       if (callDocRef.current) {
//         await updateDoc(callDocRef.current, { status: "ended" });
//       }

//       setCallStatus("ended");
//       router.back();
//     } catch (error) {
//       console.error("Error ending call:", error);
//     }
//   };

//   const toggleMute = () => {
//     if (localStream) {
//       const audioTracks = localStream.getAudioTracks();
//       audioTracks.forEach((track: any) => {
//         track.enabled = !track.enabled;
//       });
//       setIsMuted(!isMuted);
//     }
//   };

//   const toggleVideo = () => {
//     if (localStream) {
//       const videoTracks = localStream.getVideoTracks();
//       videoTracks.forEach((track: any) => {
//         track.enabled = !track.enabled;
//       });
//       setIsVideoEnabled(!isVideoEnabled);
//     }
//   };

//   return (
//     <View className="flex-1 bg-black">
//       {remoteStream ? (
//         <RTCView
//           streamURL={remoteStream.toURL()}
//           style={{ flex: 1 }}
//           objectFit="cover"
//         />
//       ) : (
//         <View className="flex-1 items-center justify-center">
//           <Text className="text-white text-xl">
//             {callStatus === "connecting" ? "Connecting..." : "No remote stream"}
//           </Text>
//         </View>
//       )}

//       {localStream && (
//         <View className="absolute top-5 right-5 w-1/3 h-1/4 bg-gray-800 rounded-lg overflow-hidden">
//           <RTCView
//             streamURL={localStream.toURL()}
//             style={{ flex: 1 }}
//             objectFit="cover"
//             zOrder={1}
//           />
//         </View>
//       )}

//       <View className="absolute bottom-10 left-0 right-0 flex-row justify-center space-x-6">
//         <TouchableOpacity
//           className={`w-14 h-14 rounded-full items-center justify-center ${
//             isMuted ? "bg-red-500" : "bg-gray-700"
//           }`}
//           onPress={toggleMute}
//         >
//           {isMuted ? (
//             <MicOff size={24} color="#ffffff" />
//           ) : (
//             <Mic size={24} color="#ffffff" />
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           className="w-14 h-14 rounded-full bg-red-600 items-center justify-center"
//           onPress={endCall}
//         >
//           <Phone size={24} color="#ffffff" />
//         </TouchableOpacity>

//         <TouchableOpacity
//           className={`w-14 h-14 rounded-full items-center justify-center ${
//             isVideoEnabled ? "bg-gray-700" : "bg-red-500"
//           }`}
//           onPress={toggleVideo}
//         >
//           {isVideoEnabled ? (
//             <VideoIcon size={24} color="#ffffff" />
//           ) : (
//             <VideoOff size={24} color="#ffffff" />
//           )}
//         </TouchableOpacity>
//       </View>

//       <View className="absolute top-10 left-0 right-0 items-center">
//         <Text className="text-white text-xl font-semibold">
//           {callStatus === "connecting" ? "Connecting to " : "In call with "}
//           {userName}
//         </Text>
//         <Text className="text-gray-300 mt-1">
//           {callStatus === "connected"
//             ? "Call connected"
//             : callStatus === "connecting"
//             ? "Establishing connection..."
//             : "Call ended"}
//         </Text>
//       </View>
//     </View>
//   );
// };

// export default VideoCallScreen;
