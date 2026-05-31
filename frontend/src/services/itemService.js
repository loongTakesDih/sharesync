import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { isValidItemCategory } from "../utils/itemCategories";

export const createItem = ({
  activeCommunity,
  category,
  description,
  imageBase64 = "",
  name,
  user,
  userProfile,
}) => {
  if (!isValidItemCategory(category)) {
    throw new Error("Please select a valid category.");
  }

  return addDoc(collection(db, "items"), {
    name: name.trim(),
    description: description.trim(),
    category,
    imageBase64,
    ownerId: user.uid,
    ownerUsername: userProfile.username,
    ownerEmail: user.email,
    community: activeCommunity,
    available: true,
    createdAt: serverTimestamp(),
  });
};

export const updateItem = (itemId, updates) =>
  updateDoc(doc(db, "items", itemId), updates);

export const deleteItem = async ({ activeCommunity, itemId, user }) => {
  const relatedRequestsQuery = query(
    collection(db, "requests"),
    where("itemId", "==", itemId),
    where("ownerId", "==", user.uid),
    where("community", "==", activeCommunity),
    where("status", "in", ["pending", "approved"])
  );
  const relatedRequestsSnapshot = await getDocs(relatedRequestsQuery);
  const batch = writeBatch(db);

  batch.delete(doc(db, "items", itemId));

  relatedRequestsSnapshot.docs.forEach((requestDoc) => {
    batch.update(requestDoc.ref, {
      status: "item_deleted",
      itemDeletedAt: serverTimestamp(),
      itemDeletedReason: "owner_deleted_item",
    });
  });

  await batch.commit();
};

export const toggleItemAvailability = (itemId, available) =>
  updateItem(itemId, { available });
