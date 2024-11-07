"use client";
import React, { useState } from "react";
import styles from "./register.module.css";
import { IoIosArrowBack } from "react-icons/io";
import { collection, addDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  updateProfile,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../helpers/firebase";
import { db } from "../../helpers/firebase";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [registerInput, setRegisterInput] = useState({
    nameOfUser: "",
    username: "",
    email: "",
    pass: "",
  });

  async function registerUser(e) {
    if (
      !registerInput.nameOfUser ||
      !registerInput.username ||
      !registerInput.email ||
      !registerInput.pass
    ) {
      toast.error("Enter all Fields Please");
      return;
    }
    e.preventDefault();
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(
        auth,
        registerInput.email,
        registerInput.pass
      );

      const user = auth.currentUser;
      const userId = user.uid;
      await updateProfile(user, {
        displayName: registerInput.nameOfUser,
      });
      user.displayName = registerInput.nameOfUser;

      await addDoc(collection(db, "users"), {
        name: registerInput.nameOfUser,
        username: registerInput.username,
        email: registerInput.email,
        userId: userId,
      });

      await signInWithEmailAndPassword(
        auth,
        registerInput.email,
        registerInput.pass
      );

      setRegisterInput({
        nameOfUser: "",
        username: "",
        email: "",
        pass: "",
      });
      router.push("/main");
    } catch (error) {
      toast.error("error creating user");
      console.log(error);
    }
    setLoading(false);
  }

  const handleRegisterInput = (e) => {
    const { name, value } = e.target;
    setRegisterInput({
      ...registerInput,
      [name]: value,
    });
  };

  return (
    <form
      className={styles.registerContainer}
      onSubmit={(e) => registerUser(e)}
    >
      <Toaster />
      <div className={styles.registerWrapper}>
        <IoIosArrowBack
          className={styles.backIcon}
          onClick={() => router.push("/")}
        />
        <h1 className={styles.appName}>Chatify</h1>
        <p className={styles.registerHeader}>Register An Account</p>
        <div className={styles.registerInputsWrapper}>
          <p className={styles.registerInputHeader}>
            Name<span className={styles.red}>*</span>
          </p>
          <input
            type="text"
            placeholder="John Doe"
            className={styles.registerInput}
            name="nameOfUser"
            value={registerInput.nameOfUser}
            onChange={(e) => handleRegisterInput(e)}
          />
        </div>
        <div className={styles.registerInputsWrapper}>
          <p className={styles.registerInputHeader}>
            Username<span className={styles.red}>*</span>
          </p>
          <input
            type="text"
            placeholder="JohnDoe"
            className={styles.registerInput}
            name="username"
            value={registerInput.username}
            onChange={(e) => handleRegisterInput(e)}
          />
        </div>
        <div className={styles.registerInputsWrapper}>
          <p className={styles.registerInputHeader}>
            Email<span className={styles.red}>*</span>
          </p>
          <input
            type="email"
            placeholder="youremail@-mail.com"
            className={styles.registerInput}
            name="email"
            value={registerInput.email}
            onChange={(e) => handleRegisterInput(e)}
          />
        </div>
        <div className={styles.registerInputsWrapper}>
          <p className={styles.registerInputHeader}>
            Password<span className={styles.red}>*</span>
          </p>
          <input
            type="password"
            placeholder="●●●●●●●●●●●●"
            className={styles.registerInput}
            name="pass"
            value={registerInput.pass}
            onChange={(e) => handleRegisterInput(e)}
          />
        </div>
        {!loading ? (
          <button
            className={styles.registerButton}
            onClick={(e) => registerUser(e)}
          >
            Register
          </button>
        ) : (
          <div className="spinner-container">
            <div className="spinner">
              <div className="spinner-shape"></div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
