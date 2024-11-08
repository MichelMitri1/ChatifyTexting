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
import { db, storage } from "../../helpers/firebase";
import { FaMicrophone, FaVideo } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { MdAddPhotoAlternate } from "react-icons/md";
import { IoCameraOutline, IoSend } from "react-icons/io5";
import { FaPause } from "react-icons/fa6";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import toast, { Toaster } from "react-hot-toast";
import { formatTime, parseToUnixTimestamp, formatDate } from "@/helpers/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaPlay } from "react-icons/fa";

export default function ChatLogs({
  users,
  currentUser,
  setFriendRequests,
  chats,
  setChats,
  clickedUser,
}) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [currentTime, setCurrentTime] = useState({});
  const [isPlaying, setIsPlaying] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const messageEndRef = useRef(null);
  const audioRef = useRef(null);
  const counterRef = useRef(0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const formatVoiceTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    const intervalId = setInterval(() => {
      counterRef.current += 1;
      setCounter(counterRef.current);
    }, 1000);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      audioChunksRef.current = [];
      uploadAudio(audioBlob);

      clearInterval(intervalId);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (audioBlob) => {
    const audioRef = ref(storage, `audioMessages/${Date.now()}.webm`);
    try {
      await uploadBytes(audioRef, audioBlob);
      const audioURL = await getDownloadURL(audioRef);
      sendAudioMessage(audioURL);
    } catch (error) {
      toast.error("Failed to upload audio message");
    }
  };

  const sendAudioMessage = async (audioURL) => {
    const senderId = currentUser.uid;
    const sentToId = clickedUser.idOfUserSent;
    const newMessage = {
      audioURL,
      senderId,
      sentAt: serverTimestamp(),
      type: "audio",
      duration: counterRef.current,
    };

    try {
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
      counterRef.current = 0;
    } catch (error) {
      toast.error("Failed to send audio message");
    }
  };

  const addFriend = async () => {
    setLoading(true);
    try {
      const foundUser = users.find((user) =>
        user.username.includes(addFriendInput)
      );

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

      const userRequestCollection = collection(
        db,
        "allRequests",
        currentUser.uid,
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

  const playAudio = (chat) => {
    if (audioRef.current && audioRef.current.src === chat.audioURL) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying((prev) => ({ ...prev, [chat.id]: true }));
      } else {
        audioRef.current.pause();
        setIsPlaying((prev) => ({ ...prev, [chat.id]: false }));
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    audioRef.current = new Audio(chat.audioURL);
    setIsPlaying((prev) => ({ ...prev, [chat.id]: true }));

    audioRef.current.ontimeupdate = () => {
      setCurrentTime((prevTimes) => ({
        ...prevTimes,
        [chat.id]: Math.floor(audioRef.current.currentTime),
        [chat.sentAt]: audioRef.current.currentTime,
      }));
    };

    audioRef.current.onended = () => {
      setIsPlaying((prev) => ({ ...prev, [chat.id]: false }));
      setCurrentTime((prevTimes) => ({
        ...prevTimes,
        [chat.id]: 0,
        [chat.sentAt]: 0,
      }));
    };

    audioRef.current
      .play()
      .catch((error) => console.error("Error playing audio:", error));
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
    const initialTimeState = {};
    chats.forEach((chat) => {
      initialTimeState[chat.id] = 0;
    });
    setCurrentTime(initialTimeState);
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
        <div className={styles.callWrapper}>
          <FaVideo className={styles.icon} />
          <FaPhone className={styles.icon} />
          <button className={styles.addFriendButton} onClick={handleOpen}>
            Add
          </button>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {chats.map((chat, index) => {
          const chatDate = formatDate(parseToUnixTimestamp(chat.sentAt));
          const showDate =
            index === 0 ||
            chatDate !==
              formatDate(parseToUnixTimestamp(chats[index - 1].sentAt));
          return (
            <>
              {showDate && (
                <div className={styles.dateHeader}>
                  <p>{chatDate}</p>
                </div>
              )}
              <div
                key={chat.id}
                className={
                  chat.senderId === currentUser.uid
                    ? styles.messageWrapperSent
                    : styles.messageWrapperReceived
                }
              >
                {chat.type === "audio" ? (
                  <div
                    className={
                      chat.senderId === currentUser.uid
                        ? styles.audioPlayerContainerSent
                        : styles.audioPlayerContainerReceived
                    }
                  >
                    <div className={styles.audioPlayer}>
                      <div className={styles.audioControls}>
                        {isPlaying[chat.id] ? (
                          <button
                            className={
                              chat.senderId === currentUser.uid
                                ? styles.playButtonSent
                                : styles.playButtonReceived
                            }
                            onClick={() => playAudio(chat)}
                          >
                            <FaPause />
                          </button>
                        ) : (
                          <button
                            className={
                              chat.senderId === currentUser.uid
                                ? styles.playButtonSent
                                : styles.playButtonReceived
                            }
                            onClick={() => playAudio(chat)}
                          >
                            <FaPlay />
                          </button>
                        )}

                        <span
                          className={
                            chat.senderId === currentUser.uid
                              ? styles.timeDisplaySent
                              : styles.timeDisplayReceived
                          }
                        >
                          {formatVoiceTime(currentTime[chat.id]) || 0}
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={
                            chat.senderId === currentUser.uid
                              ? styles.progressSent
                              : styles.progressReceived
                          }
                        ></div>
                        {isPlaying[chat.id] && (
                          <div
                            className={styles.progressMoving}
                            style={{
                              width: `${
                                (currentTime[chat.sentAt] / chat.duration ||
                                  1) * 100
                              }%`,
                            }}
                          ></div>
                        )}
                      </div>
                      <span
                        className={
                          chat.senderId === currentUser.uid
                            ? styles.timeDisplaySent
                            : styles.timeDisplayReceived
                        }
                      >
                        {formatVoiceTime(chat.duration)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p
                    className={
                      chat.senderId === currentUser.uid
                        ? styles.messageSent
                        : styles.messageReceived
                    }
                  >
                    {chat.message}
                  </p>
                )}
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
            </>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {!isRecording ? (
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
            <FaMicrophone className={styles.icon} onClick={startRecording} />
            <IoSend className={styles.icon} onClick={sendMessage} />
          </div>
        </div>
      ) : (
        <div className={styles.messageSendingContainer}>
          <div className={styles.recorder}>
            <h3>{formatVoiceTime(counter)}</h3>
          </div>
          <div className={styles.iconsWrapper}>
            <IoSend
              className={`${styles.icon} ${styles.sendVoiceIcon}`}
              onClick={stopRecording}
            />
          </div>
        </div>
      )}
    </div>
  );
}
