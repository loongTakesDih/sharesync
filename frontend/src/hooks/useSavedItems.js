import { useEffect, useMemo, useState } from "react";
import { subscribeToSavedItems } from "../services/savedItemService";

export const useSavedItems = ({ activeCommunity, activeCommunityId, user }) => {
  const [savedItemsState, setSavedItemsState] = useState({
    communityKey: "",
    savedItems: [],
    userId: "",
  });

  useEffect(() => {
    const communityKey = activeCommunityId || activeCommunity;

    if (!user || !communityKey) {
      return undefined;
    }

    const unsubscribe = subscribeToSavedItems({
      onError: (error) => {
        alert(error.message);
      },
      onSavedItems: (nextSavedItems) => {
        setSavedItemsState({
          communityKey,
          savedItems: nextSavedItems,
          userId: user.uid,
        });
      },
      user,
    });

    return () => unsubscribe();
  }, [activeCommunity, activeCommunityId, user]);

  const communityKey = activeCommunityId || activeCommunity;
  const savedItems = useMemo(() => {
    if (
      savedItemsState.communityKey !== communityKey ||
      savedItemsState.userId !== user?.uid
    ) {
      return [];
    }

    if (activeCommunityId) {
      return savedItemsState.savedItems.filter(
        (savedItem) => savedItem.communityId === activeCommunityId
      );
    }

    return savedItemsState.savedItems.filter(
      (savedItem) => savedItem.communityName === activeCommunity
    );
  }, [
    activeCommunity,
    activeCommunityId,
    communityKey,
    savedItemsState,
    user?.uid,
  ]);
  const loading =
    communityKey &&
    user &&
    (savedItemsState.communityKey !== communityKey ||
      savedItemsState.userId !== user.uid);
  const savedItemIds = useMemo(
    () => new Set(savedItems.map((savedItem) => savedItem.itemId)),
    [savedItems]
  );

  return {
    loading,
    savedItemIds,
    savedItems,
  };
};
