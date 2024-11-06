"use client";
import React, { useState, useEffect } from "react";
import { IoIosArrowBack } from "react-icons/io";
import styles from "./settings.module.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../helpers/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../../helpers/firebase";

export default function Settings() {
  const router = useRouter();
  const [foundCurrentUser, setFoundCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getFoundUser = async (uid) => {
    const users = collection(db, "users");
    const userSnapshot = await getDocs(users);
    const result = userSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const foundUser = result.find((user) => user.userId === uid);
    setFoundCurrentUser(foundUser);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        getFoundUser(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.settingsContainer}>
      <nav className={styles.userInfoNav}>
        <div className={styles.userInfoHeader}>
          <IoIosArrowBack
            onClick={() => router.push("/main")}
            className={styles.icon}
          />
          <h1>User Info</h1>
        </div>
        <button
          className={styles.logoutButton}
          onClick={async () => {
            await signOut(auth);
            router.push("/");
          }}
        >
          Log Out
        </button>
      </nav>
      <div className={styles.settingsWrapper}>
        <div className={styles.userInfoContainer}>
          <div className={styles.userInfoWrapper}>
            <h2 className={styles.userInfoHeader}>Username</h2>
            <p className={styles.userInfo}>{foundCurrentUser?.username}</p>
          </div>
          <div className={styles.userInfoWrapper}>
            <h2 className={styles.userInfoHeader}>Email</h2>
            <p className={styles.userInfo}>{foundCurrentUser?.email}</p>
          </div>
          <div className={styles.userInfoWrapper}>
            <h2 className={styles.userInfoHeader}>Name</h2>
            <p className={styles.userInfo}>{foundCurrentUser?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
