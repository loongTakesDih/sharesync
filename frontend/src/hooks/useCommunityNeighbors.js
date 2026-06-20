import { useEffect, useState } from "react";
import { fetchCommunityNeighbors } from "../services/userService";

export const useCommunityNeighbors = ({
  activeCommunity,
  activeCommunityId,
  user,
}) => {
  const [result, setResult] = useState({ key: "", neighbors: [] });
  const communityKey = activeCommunityId || activeCommunity || "";

  useEffect(() => {
    let cancelled = false;

    if (!user || !(activeCommunityId || activeCommunity)) {
      return undefined;
    }

    fetchCommunityNeighbors({
      activeCommunity,
      activeCommunityId,
      currentUserId: user.uid,
    })
      .then((nextNeighbors) => {
        if (!cancelled) {
          setResult({ key: communityKey, neighbors: nextNeighbors });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key: communityKey, neighbors: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCommunity, activeCommunityId, communityKey, user]);

  return {
    loading: Boolean(communityKey) && result.key !== communityKey,
    neighbors: result.key === communityKey ? result.neighbors : [],
  };
};
