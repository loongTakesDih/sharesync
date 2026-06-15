import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { defaultTrustStats, getTrustRating } from "../utils/trust";

export const useAuthProfile = (navigate) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeCommunity, setActiveCommunity] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setUserProfile(null);
        setActiveCommunity("");
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
          setActiveCommunity("");
          setProfileLoading(false);
          navigate("/complete-profile");
          return;
        }

        const profile = profileSnapshot.data();
        const normalizedProfile = {
          ...profile,
          communities: Array.isArray(profile.communities)
            ? profile.communities
            : [],
          reputationScore: profile.reputationScore ?? 60,
          trustRating: getTrustRating(profile),
          trustStats: {
            ...defaultTrustStats,
            ...(profile.trustStats || {}),
          },
        };

        setUserProfile(normalizedProfile);
        setActiveCommunity((currentCommunity) =>
          normalizedProfile.communities.includes(currentCommunity)
            ? currentCommunity
            : normalizedProfile.communities[0] || ""
        );
        setProfileLoading(false);
      },
      (error) => {
        alert(error.message);
        setUserProfile(null);
        setActiveCommunity("");
        setProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [navigate, user]);

  const applyUserProfile = (profile) => {
    setUserProfile(profile);
    setActiveCommunity(profile.communities[0] || "");
  };

  return {
    activeCommunity,
    applyUserProfile,
    authReady,
    profileLoading,
    setActiveCommunity,
    user,
    userProfile,
  };
};
