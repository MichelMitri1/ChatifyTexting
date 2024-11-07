"use client";
import React, { useState } from "react";
import styles from "./loginPage.module.css";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { auth } from "../../helpers/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [loginInfo, setLoginInfo] = useState({
    email: "",
    pass: "",
  });

  const [loading, setLoading] = useState(false);

  const loginUserAux = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await signInWithEmailAndPassword(
        auth,
        loginInfo.email,
        loginInfo.pass
      );

      if (user) {
        toast.success("User logged in!");
        router.push("/main");
      } else {
        toast.error("Login failed!");
      }
    } catch (error) {
      toast.error("Cannot login user!");
    }
    setLoading(false);
  };

  const handleLoginInfo = (e) => {
    const { name, value } = e.target;
    setLoginInfo({
      ...loginInfo,
      [name]: value,
    });
  };

  return (
    <form
      className={styles.loginpageContainer}
      onSubmit={(e) => loginUserAux(e)}
    >
      <Toaster />
      <div className={styles.loginpageWrapper}>
        <h1 className={styles.appName}>Chatify</h1>
        <p className={styles.loginHeader}>Sign in To Use the App Now</p>
        <div className={styles.loginInputsWrapper}>
          <p className={styles.loginInputHeader}>
            Email<span className={styles.red}>*</span>
          </p>
          <input
            type="email"
            placeholder="youremail@-mail.com"
            className={styles.loginInput}
            name="email"
            onChange={(e) => handleLoginInfo(e)}
          />
        </div>
        <div className={styles.loginInputsWrapper}>
          <p className={styles.loginInputHeader}>
            Password<span className={styles.red}>*</span>
          </p>
          <input
            type="password"
            name="pass"
            placeholder="●●●●●●●●●●●●"
            className={styles.loginInput}
            onChange={(e) => handleLoginInfo(e)}
          />
        </div>
        {!loading ? (
          <button
            className={styles.loginButton}
            onClick={(e) => loginUserAux(e)}
          >
            Login
          </button>
        ) : (
          <div className="spinner-container">
            <div className="spinner">
              <div className="spinner-shape"></div>
            </div>
          </div>
        )}

        <a href="/register" className={styles.registerLink}>
          Don't Have an Account?
        </a>
      </div>
    </form>
  );
}
