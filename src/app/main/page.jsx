"use client";
import React, { useState, useEffect } from "react";
import { addDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ChatLogs from "../../components/ChatLogs/ChatLogs";
import { auth, db } from "@/helpers/firebase";
import toast, { Toaster } from "react-hot-toast";
import People from "../../components/People/People";
import styles from "./main.module.css";
import ChatLoadingPage from "@/components/ChatLoadingPage/ChatLoadingPage";
import { Box, Modal, Typography } from "@mui/material";

export default function MainPage() {
  const [friendRequests, setFriendRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState({});
  const [users, setUsers] = useState([]);
  const [clickedUser, setClickedUser] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [loading, setLoading] = useState(false);

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

  const addFriend = async () => {
    setLoading(true);
    try {
      if (!addFriendInput) {
        toast.error("Enter the name of a friend please.");
        setLoading(false);
        return;
      }
      const foundUser = users.find((user) =>
        user.username.includes(addFriendInput)
      );

      if (!foundUser) {
        toast.error("User not found");
        return;
      } else if (foundUser.userId === user.uid) {
        toast.error("adding yourself? that's a new low");
        return;
      }

      const requestCollection = collection(
        db,
        "allRequests",
        foundUser.userId,
        "friendRequests"
      );

      await addDoc(requestCollection, {
        friends: false,
        idOfUserSent: user.uid,
        idOfuser: foundUser.userId,
        nameOfUserReceived: foundUser.name,
        nameOfUserSent: user.displayName,
      });

      const userRequestCollection = collection(
        db,
        "allRequests",
        user.uid,
        "friendRequests"
      );

      const unsubscribe = onSnapshot(userRequestCollection, (snapshot) => {
        const updatedRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendRequests(updatedRequests);
      });

      setAddFriendInput("");
      setLoading(false);
      setOpen(false);
      toast.success("Friend Request Sent!");
      return () => unsubscribe();
    } catch (error) {
      toast.error("Error adding friend:", error);
      setLoading(false);
      throw error;
    }
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
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box className={styles.modalWrapper}>
          <Typography variant="h3" sx={{ textAlign: "center" }}>
            Add a Friend
          </Typography>
          <Typography sx={{ mt: 2, textAlign: "center" }}>
            Search For the Username of the Person You Want to Add
          </Typography>
          <input
            type="text"
            className={styles.addFriendInput}
            placeholder="Type Username Here..."
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
          />
          {!loading ? (
            <button className={styles.addButton} onClick={() => addFriend()}>
              Add Friend
            </button>
          ) : (
            <div className="spinnerContainer">
              <div className="📦"></div>
              <div className="📦"></div>
              <div className="📦"></div>
              <div className="📦"></div>
              <div className="📦"></div>
            </div>
          )}
        </Box>
      </Modal>
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
      {Object.keys(clickedUser).length !== 0 ? (
        <ChatLogs
          open={open}
          users={users}
          chats={chats}
          setOpen={setOpen}
          setChats={setChats}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          currentUser={user}
          clickedUser={clickedUser}
          setFriendRequests={setFriendRequests}
        />
      ) : (
        <ChatLoadingPage />
      )}
    </div>
  );
}
