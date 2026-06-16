import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  normalizeUserProfile,
  updateUserActiveCommunity,
} from "../services/userService";

export const useAuthProfile = (navigate) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeCommunityId, setActiveCommunityId] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setUserProfile(null);
        setActiveCommunityId("");
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (profileSnapshot) => {
        if (!profileSnapshot.exists()) {
          setUserProfile(null);
          setActiveCommunityId("");
          setProfileLoading(false);
          navigate("/complete-profile");
          return;
        }

        const profile = profileSnapshot.data();
        const normalizedProfile = normalizeUserProfile(profile);

        setUserProfile(normalizedProfile);
        setActiveCommunityId((currentCommunityId) =>
          normalizedProfile.communities.some(
            (community) => community.communityId === currentCommunityId
          )
            ? currentCommunityId
            : normalizedProfile.activeCommunityId
        );
        setProfileLoading(false);
      },
      (error) => {
        alert(error.message);
        setUserProfile(null);
        setActiveCommunityId("");
        setProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [navigate, user]);

  const applyUserProfile = (profile) => {
    const normalizedProfile = normalizeUserProfile(profile);

    setUserProfile(normalizedProfile);
    setActiveCommunityId(normalizedProfile.activeCommunityId);
  };

  const changeActiveCommunity = (communityId) => {
    const selectedCommunity =
      userProfile?.communities.find(
        (community) => community.communityId === communityId
      ) || null;

    if (!selectedCommunity) {
      return;
    }

    setActiveCommunityId(communityId);

    if (user?.uid) {
      updateUserActiveCommunity({
        community: selectedCommunity,
        uid: user.uid,
      }).catch((error) => alert(error.message));
    }
  };

  const activeCommunityObject =
    userProfile?.communities.find(
      (community) =>
        community.communityId && community.communityId === activeCommunityId
    ) ||
    userProfile?.communities.find(
      (community) => community.name === userProfile.activeCommunity
    ) ||
    null;
  const activeCommunity =
    activeCommunityObject?.name || userProfile?.activeCommunity || "";

  return {
    activeCommunity,
    activeCommunityId,
    activeCommunityObject,
    applyUserProfile,
    authReady,
    changeActiveCommunity,
    profileLoading,
    user,
    userProfile,
  };
};
