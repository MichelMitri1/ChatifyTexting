"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ChatLogs from "../../../components/ChatLogs/ChatLogs";
import { auth, db } from "@/helpers/firebase";
import People from "../../../components/People/People";
import styles from "../main.module.css";
import toast, { Toaster } from "react-hot-toast";

export default function MainPage() {
  const [friendRequests, setFriendRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [clickedUser, setClickedUser] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  
  const getAllFriendRequests = async (userId) => {
    if (!userId) {
      toast.error("User ID is undefined or invalid.");
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

  const getAllUsers = () => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(result);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);

        const unsubscribeFriends = getAllFriendRequests(user.uid);
        const unsubscribeUsers = getAllUsers();

        return () => {
          unsubscribeFriends();
          unsubscribeUsers();
        };
      }
    });

    return () => unsubscribeAuth();
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
        setIsChatOpen={setIsChatOpen}
        isChatOpen={isChatOpen}
        handleOpen={handleOpen}
      />
      <ChatLogs
        currentUser={user}
        users={users}
        setFriendRequests={setFriendRequests}
        chats={chats}
        setChats={setChats}
        clickedUser={clickedUser}
        setIsChatOpen={setIsChatOpen}
        isChatOpen={isChatOpen}
        handleOpen={handleOpen}
        setOpen={setOpen}
        open={open}
      />
    </div>
  );
}
