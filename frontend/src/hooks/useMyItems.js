import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";

export const useMyItems = ({ activeCommunity, user }) => {
  const [itemsState, setItemsState] = useState({
    community: "",
    ownerId: "",
    items: [],
  });

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const myItemsQuery = query(
      collection(db, "items"),
      where("ownerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      myItemsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        }));

        setItemsState({
          community: activeCommunity,
          ownerId: user.uid,
          items,
        });
      },
      (error) => {
        alert(error.message);
        setItemsState({
          community: activeCommunity,
          ownerId: user.uid,
          items: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  const loading =
    activeCommunity &&
    user &&
    (itemsState.community !== activeCommunity || itemsState.ownerId !== user.uid);
  const items =
    itemsState.community === activeCommunity && itemsState.ownerId === user?.uid
      ? itemsState.items
      : [];

  return { items, loading };
};
