import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";

export const useRequests = ({ activeCommunity, user }) => {
  const [outgoingState, setOutgoingState] = useState({
    community: "",
    userId: "",
    requests: [],
  });
  const [incomingState, setIncomingState] = useState({
    community: "",
    userId: "",
    requests: [],
  });

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const outgoingQuery = query(
      collection(db, "requests"),
      where("borrowerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }));

        setOutgoingState({
          community: activeCommunity,
          userId: user.uid,
          requests,
        });
      },
      (error) => {
        alert(error.message);
        setOutgoingState({
          community: activeCommunity,
          userId: user.uid,
          requests: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const incomingQuery = query(
      collection(db, "requests"),
      where("ownerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      incomingQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }));

        setIncomingState({
          community: activeCommunity,
          userId: user.uid,
          requests,
        });
      },
      (error) => {
        alert(error.message);
        setIncomingState({
          community: activeCommunity,
          userId: user.uid,
          requests: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  const outgoingLoading =
    activeCommunity &&
    user &&
    (outgoingState.community !== activeCommunity ||
      outgoingState.userId !== user.uid);
  const incomingLoading =
    activeCommunity &&
    user &&
    (incomingState.community !== activeCommunity ||
      incomingState.userId !== user.uid);
  const outgoingRequests =
    outgoingState.community === activeCommunity && outgoingState.userId === user?.uid
      ? outgoingState.requests
      : [];
  const incomingRequests =
    incomingState.community === activeCommunity && incomingState.userId === user?.uid
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
