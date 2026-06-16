import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

const getTimestampMillis = (timestamp) =>
  timestamp?.toDate ? timestamp.toDate().getTime() : 0;

const newestFirst = (first, second) =>
  getTimestampMillis(second.createdAt) - getTimestampMillis(first.createdAt);

export const useMyItems = ({ activeCommunity, activeCommunityId, user }) => {
  const [itemsState, setItemsState] = useState({
    communityKey: "",
    ownerId: "",
    items: [],
  });

  useEffect(() => {
    const communityKey = activeCommunityId || activeCommunity;

    if (!user || !communityKey) {
      return undefined;
    }

    const myItemsQuery = activeCommunityId
      ? query(
          collection(db, "items"),
          where("ownerId", "==", user.uid),
          where("communityId", "==", activeCommunityId)
        )
      : query(
          collection(db, "items"),
          where("ownerId", "==", user.uid),
          where("community", "==", activeCommunity)
        );

    const unsubscribe = onSnapshot(
      myItemsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        })).sort(newestFirst);

        setItemsState({
          communityKey,
          ownerId: user.uid,
          items,
        });
      },
      (error) => {
        alert(error.message);
        setItemsState({
          communityKey,
          ownerId: user.uid,
          items: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, activeCommunityId, user]);

  const communityKey = activeCommunityId || activeCommunity;
  const loading =
    communityKey &&
    user &&
    (itemsState.communityKey !== communityKey || itemsState.ownerId !== user.uid);
  const items =
    itemsState.communityKey === communityKey && itemsState.ownerId === user?.uid
      ? itemsState.items
      : [];

  return { items, loading };
};
