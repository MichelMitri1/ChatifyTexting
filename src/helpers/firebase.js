import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyADD501uxvf9JjBrINoYdK_OO9Hx6LefyI",
  authDomain: "chatify-f26a8.firebaseapp.com",
  projectId: "chatify-f26a8",
  storageBucket: "chatify-f26a8.firebasestorage.app",
  messagingSenderId: "53582935298",
  appId: "1:53582935298:web:cb872d92aae7fb3650be1b",
  measurementId: "G-7L670404BK",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
