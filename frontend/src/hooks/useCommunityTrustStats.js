import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { computeTrustStatsFromRequests } from "../utils/trust";

// Builds a map of userId -> trust stats rebuilt from the active community's
// request records, so a user's rating can reflect the live database instead of
// the stored legacy score. If community-wide request reads aren't permitted it
// degrades gracefully (loaded stays false) and callers fall back to the stored
// rating rather than showing everyone as unrated.
export const useCommunityTrustStats = ({
  activeCommunity,
  activeCommunityId,
  user,
}) => {
  const communityKey = activeCommunityId || activeCommunity || "";
  const [state, setState] = useState({ key: "", loaded: false, requests: [] });

  useEffect(() => {
    if (!user || !communityKey) {
      return undefined;
    }

    const requestsQuery = activeCommunityId
      ? query(
          collection(db, "requests"),
          where("communityId", "==", activeCommunityId)
        )
      : query(
          collection(db, "requests"),
          where("community", "==", activeCommunity)
        );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setState({
          key: communityKey,
          loaded: true,
          requests: snapshot.docs.map((requestDoc) => ({
            id: requestDoc.id,
            ...requestDoc.data(),
          })),
        });
      },
      () => {
        setState({ key: communityKey, loaded: false, requests: [] });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, activeCommunityId, communityKey, user]);

  const trustStatsByUser = useMemo(() => {
    if (state.key !== communityKey) {
      return {};
    }

    const grouped = {};

    state.requests.forEach((request) => {
      const borrowerId = request?.borrowerId;

      if (!borrowerId) {
        return;
      }

      if (!grouped[borrowerId]) {
        grouped[borrowerId] = [];
      }

      grouped[borrowerId].push(request);
    });

    return Object.fromEntries(
      Object.entries(grouped).map(([borrowerId, requests]) => [
        borrowerId,
        computeTrustStatsFromRequests(requests),
      ])
    );
  }, [communityKey, state]);

  return {
    loaded: state.key === communityKey && state.loaded,
    trustStatsByUser,
  };
};
