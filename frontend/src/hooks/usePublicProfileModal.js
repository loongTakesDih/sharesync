import { useState } from "react";
import { fetchUserProfile } from "../services/userService";

export const usePublicProfileModal = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const openUserProfile = async (uid, fallbackProfile = {}) => {
    if (!uid && !fallbackProfile.username) {
      return;
    }

    setProfile({
      ...fallbackProfile,
      uid,
    });

    if (!uid) {
      return;
    }

    setLoading(true);

    try {
      const fetchedProfile = await fetchUserProfile(uid);

      setProfile({
        ...fallbackProfile,
        ...(fetchedProfile || {}),
        uid,
      });
    } catch {
      setProfile({
        ...fallbackProfile,
        uid,
      });
    } finally {
      setLoading(false);
    }
  };

  const closeUserProfile = () => {
    setProfile(null);
    setLoading(false);
  };

  return {
    closeUserProfile,
    openUserProfile,
    profile,
    profileLoading: loading,
  };
};
