import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  status?: "online" | "offline"
  lastSeen?: number
}

interface UserState {
  currentUser: User | null
  users: Record<string, User>
}

const initialState: UserState = {
  currentUser: null,
  users: {},
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      const usersMap: Record<string, User> = {}
      action.payload.forEach((user) => {
        usersMap[user.id] = user
      })
      state.users = usersMap
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users[action.payload.id] = action.payload
    },
    updateUserStatus: (
      state,
      action: PayloadAction<{ userId: string; status: "online" | "offline"; lastSeen?: number }>,
    ) => {
      const { userId, status, lastSeen } = action.payload
      if (state.users[userId]) {
        state.users[userId].status = status
        if (lastSeen) {
          state.users[userId].lastSeen = lastSeen
        }
      }
    },
  },
})

export const { setCurrentUser, setUsers, addUser, updateUserStatus } = userSlice.actions

export default userSlice.reducer

