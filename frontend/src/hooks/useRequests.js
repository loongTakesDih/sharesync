import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

const getTimestampMillis = (timestamp) =>
  timestamp?.toDate ? timestamp.toDate().getTime() : 0;

const newestFirst = (first, second) =>
  getTimestampMillis(second.createdAt) - getTimestampMillis(first.createdAt);

export const useRequests = ({ activeCommunity, activeCommunityId, user }) => {
  const [outgoingState, setOutgoingState] = useState({
    communityKey: "",
    userId: "",
    requests: [],
  });
  const [incomingState, setIncomingState] = useState({
    communityKey: "",
    userId: "",
    requests: [],
  });

  useEffect(() => {
    const communityKey = activeCommunityId || activeCommunity;

    if (!user || !communityKey) {
      return undefined;
    }

    const outgoingQuery = activeCommunityId
      ? query(
          collection(db, "requests"),
          where("borrowerId", "==", user.uid),
          where("communityId", "==", activeCommunityId)
        )
      : query(
          collection(db, "requests"),
          where("borrowerId", "==", user.uid),
          where("community", "==", activeCommunity)
        );

    const unsubscribe = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        })).sort(newestFirst);

        setOutgoingState({
          communityKey,
          userId: user.uid,
          requests,
        });
      },
      (error) => {
        alert(error.message);
        setOutgoingState({
          communityKey,
          userId: user.uid,
          requests: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, activeCommunityId, user]);

  useEffect(() => {
    const communityKey = activeCommunityId || activeCommunity;

    if (!user || !communityKey) {
      return undefined;
    }

    const incomingQuery = activeCommunityId
      ? query(
          collection(db, "requests"),
          where("ownerId", "==", user.uid),
          where("communityId", "==", activeCommunityId)
        )
      : query(
          collection(db, "requests"),
          where("ownerId", "==", user.uid),
          where("community", "==", activeCommunity)
        );

    const unsubscribe = onSnapshot(
      incomingQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        })).sort(newestFirst);

        setIncomingState({
          communityKey,
          userId: user.uid,
          requests,
        });
      },
      (error) => {
        alert(error.message);
        setIncomingState({
          communityKey,
          userId: user.uid,
          requests: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, activeCommunityId, user]);

  const communityKey = activeCommunityId || activeCommunity;
  const outgoingLoading =
    communityKey &&
    user &&
    (outgoingState.communityKey !== communityKey ||
      outgoingState.userId !== user.uid);
  const incomingLoading =
    communityKey &&
    user &&
    (incomingState.communityKey !== communityKey ||
      incomingState.userId !== user.uid);
  const outgoingRequests =
    outgoingState.communityKey === communityKey && outgoingState.userId === user?.uid
      ? outgoingState.requests
      : [];
  const incomingRequests =
    incomingState.communityKey === communityKey && incomingState.userId === user?.uid
      ? incomingState.requests
      : [];

  return {
    incomingLoading,
    incomingRequests,
    outgoingLoading,
    outgoingRequests,
    requestsLoading: outgoingLoading || incomingLoading,
  };
};
