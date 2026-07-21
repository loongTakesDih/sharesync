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

  return toUserCommunitySummary({
    ...community,
    name: community?.name || community?.displayName || community?.area || "",
  });
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
    profile.activeCommunity?.displayName ||
    profile.activeCommunity?.area ||
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

const getTimestampMillis = (timestamp) => timestamp?.toMillis?.() || 0;
const getStoredCommunityName = (community) =>
  (typeof community === "string"
    ? community
    : community?.name || community?.displayName || community?.area || ""
  )
    .trim()
    .toLowerCase();

const isCommunityMatch = (profile, activeCommunityId, activeCommunity) => {
  const communities = Array.isArray(profile.communities)
    ? profile.communities
    : [];
  const matchesId =
    Boolean(activeCommunityId) &&
    (profile.activeCommunityId === activeCommunityId ||
      communities.some((community) =>
        typeof community === "string"
          ? community === activeCommunityId
          : community?.communityId === activeCommunityId
      ));

  if (matchesId) {
    return true;
  }

  // Community ids are unique, but display names are not. If we're viewing a
  // community that has an id and this profile references communities by id,
  // require an id match — otherwise a different community that happens to share
  // a name would leak into this community's neighbor list. Only fall back to
  // name matching for legacy profiles that store no community ids at all.
  const profileHasCommunityId =
    Boolean(profile.activeCommunityId) ||
    communities.some((community) =>
      typeof community === "string"
        ? Boolean(community)
        : Boolean(community?.communityId)
    );

  if (activeCommunityId && profileHasCommunityId) {
    return false;
  }

  const communityName = getStoredCommunityName(activeCommunity);

  return (
    Boolean(communityName) &&
    (getStoredCommunityName(profile.activeCommunity) === communityName ||
      communities.some(
        (community) => getStoredCommunityName(community) === communityName
      ))
  );
};

export const fetchCommunityNeighbors = async ({
  activeCommunity,
  activeCommunityId,
  currentUserId,
}) => {
  const buildQuery = (field, operator, value) =>
    query(collection(db, "users"), where(field, operator, value), limit(24));
  const queries = [];

  if (activeCommunityId) {
    queries.push(buildQuery("activeCommunityId", "==", activeCommunityId));
    queries.push(buildQuery("communities", "array-contains", activeCommunityId));
  }

  if (activeCommunity) {
    queries.push(buildQuery("activeCommunity", "==", activeCommunity));
    queries.push(buildQuery("communities", "array-contains", activeCommunity));
  }

  // Older profiles can store community objects that cannot be queried with a
  // partial array match, so inspect a bounded fallback set client-side.
  queries.push(query(collection(db, "users"), limit(48)));

  const snapshots = await Promise.allSettled(
    queries.map((communityQuery) => getDocs(communityQuery))
  );
  const matchingDocs = new Map();

  snapshots.forEach((result) => {
    if (result.status === "fulfilled") {
      result.value.docs.forEach((userDoc) =>
        matchingDocs.set(userDoc.id, userDoc)
      );
    }
  });

  return [...matchingDocs.values()]
    .filter(
      (userDoc) =>
        userDoc.id !== currentUserId &&
        isCommunityMatch(userDoc.data(), activeCommunityId, activeCommunity)
    )
    .map((userDoc) => ({
      uid: userDoc.id,
      ...normalizeUserProfile(userDoc.data()),
    }))
    .sort(
      (first, second) =>
        getTimestampMillis(second.createdAt) - getTimestampMillis(first.createdAt)
    )
    .slice(0, 24);
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

  let communities = userProfile?.communities || [];

  if (selectedCommunity) {
    const joinedCommunity = await ensureCommunityForUser({
      community: selectedCommunity,
      user,
    });
    const userCommunity = toUserCommunitySummary(joinedCommunity);

    if (!userCommunity?.name) {
      throw new Error(
        "This place could not be prepared as a community. Please choose another result."
      );
    }

    communities = mergeUserCommunities(communities, userCommunity);
  }

  const storedProfileDoc = await getDoc(doc(db, "users", user.uid));
  const storedProfile = storedProfileDoc.exists()
    ? storedProfileDoc.data()
    : userProfile || {};
  const oldUsername = String(storedProfile.username || "").trim();
  const usernameChanged = oldUsername !== trimmedUsername;

  const profileUpdates = {
    username: trimmedUsername,
    usernameLower,
    bio: bio.trim(),
    gender: gender.trim(),
    pronouns: pronouns.trim(),
    profileImageBase64,
    communities,
    updatedAt: serverTimestamp(),
  };

  if (usernameChanged && oldUsername) {
    const historyCandidates = [
      oldUsername,
      ...(Array.isArray(storedProfile.previousUsernames)
        ? storedProfile.previousUsernames
        : []),
      storedProfile.previousUsername,
    ];
    const seen = new Set([usernameLower]);

    profileUpdates.previousUsername = oldUsername;
    profileUpdates.previousUsernames = historyCandidates
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => name.trim())
      .filter((name) => {
        const key = name.toLowerCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 10);
    profileUpdates.usernameChangedAt = serverTimestamp();
  }

  await setDoc(
    doc(db, "users", user.uid),
    profileUpdates,
    { merge: true }
  );
};
