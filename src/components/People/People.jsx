"use client";
import React, { useEffect, useState, useRef } from "react";
import { IoSettingsOutline, IoPersonSharp } from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../helpers/firebase";
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import styles from "./people.module.css";
import toast, { Toaster } from "react-hot-toast";

export default function People({
  currentUser,
  users,
  friendRequests,
  setFriendRequests,
  setChats,
  setClickedUser,
}) {
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchForFriend = (e) => {
    const name = e.target.value.toLowerCase();
    if (!name) {
      return;
    }

    setFriendRequests((prevRequests) =>
      prevRequests.filter(
        (user) =>
          user.nameOfUserSent.toLowerCase().includes(name) && user.friends
      )
    );
  };

  const openChat = async (user) => {
    setClickedUser(user);
    let chatId = currentUser.uid + user.idOfUserSent;
    const chatCollection = collection(db, "chats", chatId, "messages");
    const chatQuery = query(chatCollection, orderBy("sentAt"));
    let collectionSnapshot = await getDocs(chatQuery);

    if (collectionSnapshot.empty) {
      const halfIndex = Math.floor(chatId.length / 2);
      const userId1 = chatId.slice(0, halfIndex);
      const userId2 = chatId.slice(halfIndex);

      const newChatId = `${userId2}${userId1}`;

      const newChatCollection = collection(db, "chats", newChatId, "messages");
      collectionSnapshot = await getDocs(newChatCollection);

      if (collectionSnapshot.empty) {
        return [];
      }
    }

    const chat = collectionSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setChats(chat);
  };

  const handleAcceptRequest = async (idOfUserSent) => {
    try {
      const foundUser = users.find((user) => user.userId === idOfUserSent);
      const requestCollection = collection(
        db,
        "allRequests",
        currentUser.uid,
        "friendRequests"
      );

      const requestQuery = query(
        requestCollection,
        where("idOfUserSent", "==", idOfUserSent)
      );
      const querySnapshot = await getDocs(requestQuery);

      if (querySnapshot.empty) {
        throw new Error("Friend request not found");
      }

      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { friends: true })
      );

      await Promise.all(updatePromises);

      const requestForFoundUser = collection(
        db,
        "allRequests",
        foundUser.userId,
        "friendRequests"
      );

      await addDoc(requestForFoundUser, {
        idOfUserSent: currentUser.uid,
        friends: true,
        nameOfUserReceived: foundUser.name,
        nameOfUserSent: currentUser.displayName,
      });

      const createNewChatCollection = collection(
        db,
        "chats",
        currentUser.uid + idOfUserSent,
        "messages"
      );

      await addDoc(createNewChatCollection, {
        message: "Chat started",
        sentAt: serverTimestamp(),
        senderId: foundUser.userId,
      });

      toast.success("Friend Request Accepted!");
    } catch (error) {
      toast.error("Error accepting friend request:", error.message);
      throw error;
    }
  };

  const handleDeclineRequest = async (idOfUserSent) => {
    try {
      const requestCollection = collection(
        db,
        "allRequests",
        currentUser.uid,
        "friendRequests"
      );

      const requestQuery = query(
        requestCollection,
        where("idOfUserSent", "==", idOfUserSent)
      );
      const querySnapshot = await getDocs(requestQuery);

      if (querySnapshot.empty) {
        toast.error("Friend request not found");
        return;
      }

      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      toast.success("Friend request declined successfully");
    } catch (error) {
      toast.error("Error declining friend request:", error.message);
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) return;

    const requestCollection = collection(
      db,
      "allRequests",
      currentUser.uid,
      "friendRequests"
    );

    const unsubscribeRequests = onSnapshot(requestCollection, (snapshot) => {
      const updatedRequests = snapshot.docs.map((doc) => doc.data());
      setFriendRequests(updatedRequests);
    });

    return () => unsubscribeRequests();
  }, [currentUser.uid, setFriendRequests]);

  return (
    <div className={styles.peopleContainer}>
      <Toaster />
      <div className={styles.peopleNavContainer}>
        <div className="">
          <h2 className={styles.chatsHeader}>Chats</h2>
        </div>
        <div className={styles.iconsContainer}>
          <IoSettingsOutline
            className={styles.icon}
            onClick={() => router.push("/settings")}
          />
          <IoPersonSharp className={styles.icon} />
          <IoIosSearch
            className={styles.icon}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          />
          {isSearchOpen ? (
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search Friend"
              onChange={(e) => searchForFriend(e)}
            />
          ) : null}
        </div>
      </div>
      <div className={styles.peopleWrapper}>
        {friendRequests.length > 0 ? (
          friendRequests
            .filter(
              (request) =>
                !request.friends && request.idOfCurrentUser === currentUser.uid
            )
            .map((request) => (
              <div className={styles.friendRequestWrapper}>
                <h3 key={request.id} className={styles.nameOfUserSent}>
                  {request.nameOfUserSent}
                </h3>
                <div className={styles.reqButtons}>
                  <button
                    className={styles.acceptReqButton}
                    onClick={() => handleAcceptRequest(request.idOfUserSent)}
                  >
                    <FaCheck className={styles.iconSmall} />
                  </button>
                  <button className={styles.declineReqButton}>
                    <IoClose
                      className={styles.iconSmall}
                      onClick={() => handleDeclineRequest(request.idOfUserSent)}
                    />
                  </button>
                </div>
              </div>
            ))
        ) : (
          <div className={styles.noFriendMessageContainer}>
            <h2 className={styles.notFoundMessage}>
              {isSearchOpen ? "Could Not Find User" : "Add Friend To Chat"}
            </h2>
          </div>
        )}
        {friendRequests.length > 0
          ? friendRequests
              .filter(
                (user) => user.userId !== currentUser?.uid && user.friends
              )
              .map((user) => (
                <div
                  className={styles.chatWrapper}
                  key={user.id}
                  onClick={() => openChat(user)}
                >
                  <h2 className={styles.username}>{user.nameOfUserSent}</h2>
                </div>
              ))
          : null}
      </div>
    </div>
  );
}
