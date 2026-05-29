import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";

export const useItems = ({ activeCommunity, user }) => {
  const [itemsState, setItemsState] = useState({
    community: "",
    items: [],
  });

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const itemsQuery = query(
      collection(db, "items"),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setItemsState({
          community: activeCommunity,
          items,
        });
      },
      (error) => {
        alert(error.message);
        setItemsState({
          community: activeCommunity,
          items: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  return {
    items: itemsState.community === activeCommunity ? itemsState.items : [],
    loading: activeCommunity && itemsState.community !== activeCommunity,
  };
};
