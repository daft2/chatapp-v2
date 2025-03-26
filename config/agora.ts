export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || "";

export const getAgoraToken = (channelName: string): string => {
  // For testing, this is a temporary token from Agora Console
  return process.env.EXPO_PUBLIC_AGORA_TOKEN || "";
};

// Helper function to generate a random user ID
export const generateUid = (): number => {
  return Math.floor(Math.random() * 100000);
};
