"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./chatlogs.module.css";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../helpers/firebase";
import { FaMicrophone } from "react-icons/fa";
import { MdAddPhotoAlternate } from "react-icons/md";
import { IoCameraOutline, IoSend } from "react-icons/io5";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import toast, { Toaster } from "react-hot-toast";
import { formatTime } from "../../helpers/utils";
import { parseToUnixTimestamp } from "@/helpers/utils";

export default function ChatLogs({
  users,
  currentUser,
  setFriendRequests,
  chats,
  setChats,
  clickedUser,
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [addFriendInput, setAddFriendInput] = useState("");
  const messageEndRef = useRef(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const addFriend = async () => {
    try {
      const foundUser = users.find((user) =>
        user.username.includes(addFriendInput)
      );

      console.log(users);

      console.log(foundUser);

      if (!foundUser) {
        toast.error("User not found");
        return;
      } else if (foundUser.userId === currentUser.uid) {
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
        idOfUserSent: currentUser.uid,
        idOfCurrentUser: foundUser.userId,
        nameOfUserReceived: foundUser.name,
        nameOfUserSent: currentUser.displayName,
      });

      const unsubscribe = onSnapshot(requestCollection, (snapshot) => {
        const updatedRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendRequests(updatedRequests);
      });

      setAddFriendInput("");
      setOpen(false);
      toast.success("Friend Request Sent!");
      return () => unsubscribe();
    } catch (error) {
      toast.error("Error adding friend:", error);
      throw error;
    }
  };

  const sendMessage = async () => {
    const senderId = currentUser.uid;
    const sentToId = clickedUser.idOfUserSent;
    const newMessage = {
      message,
      senderId,
      sentAt: serverTimestamp(),
    };

    try {
      setMessage("");

      let chatId = `${senderId}${sentToId}`;
      let chatCollection = collection(db, "chats", chatId, "messages");

      let collectionSnapshot = await getDocs(chatCollection);
      if (collectionSnapshot.empty) {
        chatId = `${sentToId}${senderId}`;
        chatCollection = collection(db, "chats", chatId, "messages");
        collectionSnapshot = await getDocs(chatCollection);
        if (collectionSnapshot.empty) return;
      }

      await addDoc(chatCollection, newMessage);
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      let chatId = `${currentUser.uid}${clickedUser.idOfUserSent}`;
      let chatCollection = collection(db, "chats", chatId, "messages");

      try {
        let collectionSnapshot = await getDocs(chatCollection);

        if (collectionSnapshot.empty) {
          chatId = `${clickedUser.idOfUserSent}${currentUser.uid}`;
          chatCollection = collection(db, "chats", chatId, "messages");
          collectionSnapshot = await getDocs(chatCollection);
          if (collectionSnapshot.empty) return;
        }

        const q = query(chatCollection, orderBy("sentAt"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const newMessages = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setChats(newMessages);
        });

        return () => unsubscribe();
      } catch (error) {
        toast.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser.uid, clickedUser.idOfUserSent, setChats]);

  useEffect(() => {
    if (messageEndRef.current)
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  return (
    <div className={styles.chatLogContainer}>
      <Toaster />
      <Modal open={open} onClose={handleClose}>
        <Box className={styles.modalWrapper}>
          <Typography variant="h3">Add a Friend</Typography>
          <Typography sx={{ mt: 2 }}>
            Search For the Username of the Person You Want to Add
          </Typography>
          <input
            type="text"
            className={styles.addFriendInput}
            placeholder="Type Username Here..."
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
          />
          <button className={styles.addButton} onClick={addFriend}>
            Add Friend
          </button>
        </Box>
      </Modal>

      <div className={styles.chatLogHeader}>
        <h2 className={styles.name}>{clickedUser.nameOfUserSent || "Name"}</h2>
        <button className={styles.addFriendButton} onClick={handleOpen}>
          Add
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={
              chat.senderId === currentUser.uid
                ? styles.messageWrapperSent
                : styles.messageWrapperReceived
            }
          >
            <p
              className={
                chat.senderId === currentUser.uid
                  ? styles.messageSent
                  : styles.messageReceived
              }
            >
              {chat.message}
            </p>
            <div
              className={
                chat.senderId === currentUser.uid
                  ? styles.dateOfMessageWrapperSent
                  : styles.dateOfMessageWrapperReceived
              }
            >
              <p className={styles.dateOfMessage}>
                {formatTime(parseToUnixTimestamp(chat.sentAt))}
              </p>
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <div className={styles.messageSendingContainer}>
        <MdAddPhotoAlternate className={styles.icon} />
        <input
          type="text"
          className={styles.messageInput}
          placeholder="Type message here..."
          value={message}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.iconsWrapper}>
          <IoCameraOutline className={styles.icon} />
          <FaMicrophone className={styles.icon} />
          <IoSend className={styles.icon} onClick={sendMessage} />
        </div>
      </div>
    </div>
  );
}
