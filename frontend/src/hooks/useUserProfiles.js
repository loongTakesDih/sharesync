import { useEffect, useMemo, useState } from "react";
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { normalizeUserProfile } from "../services/userService";

const PROFILE_QUERY_SIZE = 10;

const chunkUserIds = (userIds) => {
  const chunks = [];

  for (let index = 0; index < userIds.length; index += PROFILE_QUERY_SIZE) {
    chunks.push(userIds.slice(index, index + PROFILE_QUERY_SIZE));
  }

  return chunks;
};

export const useUserProfiles = (userIds = []) => {
  const userIdsKey = [...new Set(userIds.filter(Boolean))].sort().join("|");
  const normalizedUserIds = useMemo(
    () => (userIdsKey ? userIdsKey.split("|") : []),
    [userIdsKey]
  );
  const [profileState, setProfileState] = useState({
    key: "",
    profilesById: {},
  });

  useEffect(() => {
    if (normalizedUserIds.length === 0) {
      return undefined;
    }

    const unsubscribes = chunkUserIds(normalizedUserIds).map((ownerIds) => {
      const profilesQuery = query(
        collection(db, "users"),
        where(documentId(), "in", ownerIds)
      );

      return onSnapshot(
        profilesQuery,
        (snapshot) => {
          setProfileState((current) => {
            const profilesById =
              current.key === userIdsKey ? { ...current.profilesById } : {};

            ownerIds.forEach((uid) => {
              delete profilesById[uid];
            });
            snapshot.docs.forEach((profileDoc) => {
              profilesById[profileDoc.id] = {
                uid: profileDoc.id,
                ...normalizeUserProfile(profileDoc.data()),
              };
            });

            return { key: userIdsKey, profilesById };
          });
        },
        () => {
          setProfileState((current) =>
            current.key === userIdsKey
              ? current
              : { key: userIdsKey, profilesById: {} }
          );
        }
      );
    });

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [normalizedUserIds, userIdsKey]);

  return profileState.key === userIdsKey ? profileState.profilesById : {};
};
