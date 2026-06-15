import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { defaultTrustStats, getTrustRating } from "../utils/trust";
import { getUsernameLower } from "../utils/validators";

export const fetchUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return null;
  }

  const profile = userDoc.data();

  return {
    ...profile,
    communities: Array.isArray(profile.communities) ? profile.communities : [],
    reputationScore: profile.reputationScore ?? 60,
    trustRating: getTrustRating(profile),
    trustStats: {
      ...defaultTrustStats,
      ...(profile.trustStats || {}),
    },
  };
};

export const isUsernameTaken = async (usernameLower) => {
  const usernameQuery = query(
    collection(db, "users"),
    where("usernameLower", "==", usernameLower),
    limit(1)
  );
  const usernameSnapshot = await getDocs(usernameQuery);

  return !usernameSnapshot.empty;
};

export const createUserProfile = async ({
  authProvider,
  community,
  firebaseUser,
  username,
}) => {
  const profile = {
    username: username.trim(),
    usernameLower: getUsernameLower(username),
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
    communities: [community.trim()],
    createdAt: serverTimestamp(),
    reputationScore: 60,
    trustRating: 3,
    trustStats: {
      ...defaultTrustStats,
      lastUpdatedAt: serverTimestamp(),
    },
    authProvider,
  };

  await setDoc(doc(db, "users", firebaseUser.uid), profile);

  return {
    ...profile,
    createdAt: null,
    trustRating: 3,
  };
};
