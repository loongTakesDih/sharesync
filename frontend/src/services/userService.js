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
import {
  ensureCommunityForUser,
  getCommunityName,
  toCommunitySummary,
  toUserCommunitySummary,
} from "./communityService";
import {
  defaultTrustStats,
  getTrustRating,
  normalizeTrustStats,
} from "../utils/trust";
import { getUsernameLower } from "../utils/validators";

const normalizeProfileCommunity = (community) => {
  if (typeof community === "string") {
    const name = community.trim();

    return name
      ? {
          communityId: "",
          name,
          area: "",
          state: "",
          country: "",
          type: "",
        }
      : null;
  }

  return toUserCommunitySummary(community);
};

export const normalizeUserProfile = (profile = {}) => {
  const communities = Array.isArray(profile.communities)
    ? profile.communities.map(normalizeProfileCommunity).filter(Boolean)
    : [];
  const activeCommunityId =
    profile.activeCommunityId &&
    communities.some(
      (community) => community.communityId === profile.activeCommunityId
    )
      ? profile.activeCommunityId
      : communities.find((community) => community.communityId)?.communityId || "";
  const activeCommunityObject =
    communities.find(
      (community) =>
        community.communityId && community.communityId === activeCommunityId
    ) ||
    communities.find(
      (community) => community.name && community.name === profile.activeCommunity
    ) ||
    communities[0] ||
    null;
  const activeCommunityName =
    activeCommunityObject?.name ||
    getCommunityName(profile.activeCommunity) ||
    "";

  return {
    ...profile,
    communities,
    activeCommunityId,
    activeCommunity: activeCommunityName,
    reputationScore: profile.reputationScore ?? 60,
    trustRating: getTrustRating(profile),
    trustStats: normalizeTrustStats(profile.trustStats),
  };
};

export const fetchUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return null;
  }

  const profile = userDoc.data();

  return normalizeUserProfile(profile);
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

export const isUsernameTakenByAnotherUser = async (usernameLower, uid) => {
  const usernameQuery = query(
    collection(db, "users"),
    where("usernameLower", "==", usernameLower),
    limit(3)
  );
  const usernameSnapshot = await getDocs(usernameQuery);

  return usernameSnapshot.docs.some((userDoc) => userDoc.id !== uid);
};

export const createUserProfile = async ({
  authProvider,
  community,
  firebaseUser,
  username,
}) => {
  const selectedCommunity = await ensureCommunityForUser({
    community,
    user: firebaseUser,
  });
  const userCommunity = toUserCommunitySummary(selectedCommunity);
  const profile = {
    username: username.trim(),
    usernameLower: getUsernameLower(username),
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || "",
    photoURL: firebaseUser.photoURL || "",
    communities: [userCommunity],
    activeCommunityId: userCommunity.communityId,
    activeCommunity: userCommunity.name,
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

export const updateUserActiveCommunity = async ({ community, uid }) => {
  const selectedCommunity = toCommunitySummary(community);

  if (!selectedCommunity?.name) {
    throw new Error("Please select a community before continuing.");
  }

  await setDoc(
    doc(db, "users", uid),
    {
      activeCommunityId: selectedCommunity.communityId || "",
      activeCommunity: selectedCommunity.name,
    },
    { merge: true }
  );
};

const mergeUserCommunities = (communities, activeCommunity) => {
  const nextCommunities = [];
  const seen = new Set();

  [...communities, activeCommunity]
    .map(toUserCommunitySummary)
    .filter((community) => community?.name)
    .forEach((community) => {
      const key = community.communityId || community.name.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        nextCommunities.push(community);
      }
    });

  return nextCommunities;
};

export const updateEditableUserProfile = async ({
  bio = "",
  gender = "",
  profileImageBase64 = "",
  pronouns = "",
  selectedCommunity,
  user,
  userProfile,
  username,
}) => {
  if (!user?.uid) {
    throw new Error("Please log in before updating your profile.");
  }

  const trimmedUsername = username.trim();
  const usernameLower = getUsernameLower(trimmedUsername);

  if (!trimmedUsername) {
    throw new Error("Username is required.");
  }

  if (bio.length > 300) {
    throw new Error("Bio must be 300 characters or fewer.");
  }

  if (await isUsernameTakenByAnotherUser(usernameLower, user.uid)) {
    throw new Error("That username is already taken.");
  }

  const activeCommunity = await ensureCommunityForUser({
    community: selectedCommunity,
    user,
  });
  const userCommunity = toUserCommunitySummary(activeCommunity);

  if (!userCommunity?.name) {
    throw new Error(
      "This place could not be prepared as a community. Please choose another result."
    );
  }

  const communities = mergeUserCommunities(
    userProfile?.communities || [],
    userCommunity
  );

  await setDoc(
    doc(db, "users", user.uid),
    {
      username: trimmedUsername,
      usernameLower,
      bio: bio.trim(),
      gender: gender.trim(),
      pronouns: pronouns.trim(),
      profileImageBase64,
      communities,
      activeCommunityId: userCommunity.communityId || "",
      activeCommunity: userCommunity.name,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};
