"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ChatLogs from "../../components/ChatLogs/ChatLogs";
import { auth, db } from "@/helpers/firebase";
import toast, { Toaster } from "react-hot-toast";
import People from "../../components/People/People";
import styles from "./main.module.css";

export default function MainPage() {
  const [friendRequests, setFriendRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [clickedUser, setClickedUser] = useState({});

  const getAllFriendRequests = async (userId) => {
    if (!userId) {
      console.error("User ID is undefined or invalid.");
      return;
    }
    try {
      const friendRequestsRef = collection(
        db,
        "allRequests",
        userId,
        "friendRequests"
      );

      const querySnapshot = await getDocs(friendRequestsRef);

      const friendRequests = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setFriendRequests(friendRequests);
    } catch (error) {
      toast.error("Error fetching friend requests:", error);
    }
  };

  const getAllUsers = async () => {
    const users = collection(db, "users");
    const userSnapshot = await getDocs(users);
    const result = userSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(result);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      }
      getAllFriendRequests(user.uid);
      getAllUsers();
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.mainContainer}>
      <Toaster />
      <People
        currentUser={user}
        users={users}
        friendRequests={friendRequests}
        setFriendRequests={setFriendRequests}
        setChats={setChats}
        setClickedUser={setClickedUser}
      />
      <ChatLogs
        currentUser={user}
        users={users}
        setFriendRequests={setFriendRequests}
        chats={chats}
        setChats={setChats}
        clickedUser={clickedUser}
      />
    </div>
  );
}
