import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWS8vNRZZ9q4c1q1zJIoYV7nlAfRQJ5S8",
  authDomain: "sharesync-60c1e.firebaseapp.com",
  projectId: "sharesync-60c1e",
  storageBucket: "sharesync-60c1e.firebasestorage.app",
  messagingSenderId: "739287610378",
  appId: "1:739287610378:web:1084082f294d090683dbf3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("Firebase initialized");

export default app;