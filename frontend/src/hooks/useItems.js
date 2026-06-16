import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

const getTimestampMillis = (timestamp) =>
  timestamp?.toDate ? timestamp.toDate().getTime() : 0;

const newestFirst = (first, second) =>
  getTimestampMillis(second.createdAt) - getTimestampMillis(first.createdAt);

export const useItems = ({ activeCommunity, activeCommunityId, user }) => {
  const [itemsState, setItemsState] = useState({
    communityKey: "",
    items: [],
  });

  useEffect(() => {
    const communityKey = activeCommunityId || activeCommunity;

    if (!user || !communityKey) {
      return undefined;
    }

    const itemsQuery = activeCommunityId
      ? query(collection(db, "items"), where("communityId", "==", activeCommunityId))
      : query(collection(db, "items"), where("community", "==", activeCommunity));

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })).sort(newestFirst);

        setItemsState({
          communityKey,
          items,
        });
      },
      (error) => {
        alert(error.message);
        setItemsState({
          communityKey,
          items: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, activeCommunityId, user]);

  const communityKey = activeCommunityId || activeCommunity;

  return {
    items: itemsState.communityKey === communityKey ? itemsState.items : [],
    loading: communityKey && itemsState.communityKey !== communityKey,
  };
};
