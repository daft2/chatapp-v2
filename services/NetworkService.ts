import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

class NetworkService {
  private static instance: NetworkService;
  private isConnected = true;
  private userId: string | null = null;
  private unsubscribe: any = null;

  private constructor() {
    // Initialize network monitoring
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected !== null ? state.isConnected : false;

      // If connection state changed from offline to online
      if (!wasConnected && this.isConnected) {
        this.syncOfflineData();
      }

      // Update user status if connected and we have a userId
      if (this.isConnected && this.userId) {
        this.updateUserStatus("online");
      } else if (!this.isConnected && this.userId) {
        // Store last online timestamp locally when going offline
        AsyncStorage.setItem("lastOnlineTimestamp", Date.now().toString());
      }
    });
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  public setUserId(userId: string | null): void {
    this.userId = userId;

    // Update user status when setting userId
    if (this.isConnected && userId) {
      this.updateUserStatus("online");
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private async updateUserStatus(status: "online" | "offline"): Promise<void> {
    if (!this.userId) return;

    try {
      const userRef = doc(db, "users", this.userId);
      await updateDoc(userRef, {
        status,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  private async syncOfflineData(): Promise<void> {
    // Implement syncing of offline data here
    console.log("Syncing offline data...");

    // Example: Sync pending messages
    try {
      // Get all keys from AsyncStorage that start with 'chat_' and end with '_pending'
      const keys = await AsyncStorage.getAllKeys();
      const pendingMessageKeys = keys.filter(
        (key) => key.startsWith("chat_") && key.endsWith("_pending")
      );

      // Process each pending message key
      for (const key of pendingMessageKeys) {
        const pendingMessagesJson = await AsyncStorage.getItem(key);
        if (pendingMessagesJson) {
          // Extract chatId from key (format: 'chat_CHATID_pending')
          const chatId = key.replace("chat_", "").replace("_pending", "");

          // TODO: Send pending messages to Firestore
          // This would be implemented in the ChatScreen component
        }
      }
    } catch (error) {
      console.error("Error syncing offline data:", error);
    }
  }
}

export default NetworkService.getInstance();
