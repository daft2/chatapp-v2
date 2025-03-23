"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../store/slices/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          dispatch(
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || undefined,
              status: "online",
              lastSeen: Date.now(),
            })
          );

          // Update user status to online
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              status: "online",
              lastSeen: serverTimestamp(),
            },
            { merge: true }
          );
        }

        // Store auth state in AsyncStorage for persistence
        await AsyncStorage.setItem("user", JSON.stringify(firebaseUser));
      } else {
        dispatch(setCurrentUser(null));
        await AsyncStorage.removeItem("user");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  const register = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        displayName,
        createdAt: serverTimestamp(),
        status: "online",
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Update user status to offline before signing out
      if (user) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            status: "offline",
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
      }

      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
