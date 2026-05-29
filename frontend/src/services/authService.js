import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const registerWithEmail = async ({ email, password, username }) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );

  await updateProfile(userCredential.user, {
    displayName: username.trim(),
  });

  return userCredential;
};

export const loginWithGooglePopup = async () => {
  const provider = new GoogleAuthProvider();

  return signInWithPopup(auth, provider);
};

export const sendResetEmail = (email) =>
  sendPasswordResetEmail(auth, email.trim());

export const logoutUser = () => signOut(auth);
