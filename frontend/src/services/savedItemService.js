import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const getSavedItemsCollection = (userId) =>
  collection(db, "users", userId, "savedItems");

const getSavedItemRef = ({ itemId, userId }) =>
  doc(db, "users", userId, "savedItems", itemId);

export const subscribeToSavedItems = ({
  onError,
  onSavedItems,
  user,
}) => {
  if (!user) {
    onSavedItems([]);
    return () => {};
  }

  return onSnapshot(
    getSavedItemsCollection(user.uid),
    (snapshot) => {
      onSavedItems(
        snapshot.docs.map((savedItemDoc) => ({
          id: savedItemDoc.id,
          ...savedItemDoc.data(),
        }))
      );
    },
    (error) => {
      onError?.(error);
      onSavedItems([]);
    }
  );
};

export const saveItem = async ({ activeCommunity, activeCommunityId, item, user }) => {
  if (!user) {
    throw new Error("Please log in to save items.");
  }

  if (item.ownerId === user.uid) {
    throw new Error("You cannot save your own listing.");
  }

  await setDoc(getSavedItemRef({ itemId: item.id, userId: user.uid }), {
    itemId: item.id,
    itemName: item.name || "",
    itemImage: item.imageBase64 || "",
    ownerId: item.ownerId || "",
    communityId: activeCommunityId || item.communityId || "",
    communityName: item.communityName || item.community || activeCommunity || "",
    savedAt: serverTimestamp(),
  });
};

export const removeSavedItem = ({ itemId, user }) => {
  if (!user) {
    throw new Error("Please log in to update saved items.");
  }

  return deleteDoc(getSavedItemRef({ itemId, userId: user.uid }));
};

export const toggleSavedItem = ({ activeCommunity, activeCommunityId, item, saved, user }) =>
  saved
    ? removeSavedItem({ itemId: item.id, user })
    : saveItem({ activeCommunity, activeCommunityId, item, user });
