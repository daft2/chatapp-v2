import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Message {
  id: string
  text: string
  senderId: string
  receiverId: string
  timestamp: number
  status: "sent" | "delivered" | "seen" | "pending"
}

export interface Chat {
  id: string
  participants: string[]
  lastMessage?: Message
  unreadCount: number
}

interface ChatState {
  chats: Record<string, Chat>
  messages: Record<string, Message[]>
  pendingMessages: Message[]
  activeChat: string | null
}

const initialState: ChatState = {
  chats: {},
  messages: {},
  pendingMessages: [],
  activeChat: null,
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      const chatsMap: Record<string, Chat> = {}
      action.payload.forEach((chat) => {
        chatsMap[chat.id] = chat
      })
      state.chats = chatsMap
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats[action.payload.id] = action.payload
    },
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      state.messages[action.payload.chatId] = action.payload.messages
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload
      if (!state.messages[chatId]) {
        state.messages[chatId] = []
      }
      state.messages[chatId].push(message)

      // Update last message in chat
      if (state.chats[chatId]) {
        state.chats[chatId].lastMessage = message
      }
    },
    updateMessageStatus: (
      state,
      action: PayloadAction<{ messageId: string; chatId: string; status: "sent" | "delivered" | "seen" }>,
    ) => {
      const { messageId, chatId, status } = action.payload
      const messageIndex = state.messages[chatId]?.findIndex((m) => m.id === messageId)

      if (messageIndex !== undefined && messageIndex !== -1) {
        state.messages[chatId][messageIndex].status = status
      }
    },
    addPendingMessage: (state, action: PayloadAction<Message>) => {
      state.pendingMessages.push(action.payload)
    },
    removePendingMessage: (state, action: PayloadAction<string>) => {
      state.pendingMessages = state.pendingMessages.filter((m) => m.id !== action.payload)
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChat = action.payload
    },
  },
})

export const {
  setChats,
  addChat,
  setMessages,
  addMessage,
  updateMessageStatus,
  addPendingMessage,
  removePendingMessage,
  setActiveChat,
} = chatSlice.actions

export default chatSlice.reducer

