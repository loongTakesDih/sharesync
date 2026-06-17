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
import {
  activeBorrowingStatuses,
  preHandoverStatuses,
} from "../utils/requestStatus";

const relatedOpenRequestStatuses = [
  "pending",
  ...preHandoverStatuses,
  ...activeBorrowingStatuses,
];

export const createItem = ({
  activeCommunity,
  activeCommunityObject,
  category,
  condition = "",
  description,
  imageBase64 = "",
  name,
  preferredPickupLocation = "",
  user,
  userProfile,
}) => {
  if (!isValidItemCategory(category)) {
    throw new Error("Please select a valid category.");
  }

  if (!activeCommunityObject?.communityId) {
    throw new Error("Please select or create your community first.");
  }

  return addDoc(collection(db, "items"), {
    name: name.trim(),
    description: description.trim(),
    category,
    condition: condition.trim(),
    imageBase64,
    ownerId: user.uid,
    ownerUsername: userProfile.username,
    ownerEmail: user.email,
    communityId: activeCommunityObject.communityId,
    communityName: activeCommunityObject.name,
    communityArea: activeCommunityObject.area || "",
    communityState: activeCommunityObject.state || "",
    communityType: activeCommunityObject.type || "",
    community: activeCommunityObject.name || activeCommunity,
    preferredPickupLocation: preferredPickupLocation.trim(),
    available: true,
    createdAt: serverTimestamp(),
  });
};

export const updateItem = (itemId, updates) =>
  updateDoc(doc(db, "items", itemId), updates);

export const deleteItem = async ({
  activeCommunity,
  activeCommunityId,
  itemId,
  user,
}) => {
  const relatedRequestsQuery = activeCommunityId
    ? query(
        collection(db, "requests"),
        where("itemId", "==", itemId),
        where("ownerId", "==", user.uid),
        where("communityId", "==", activeCommunityId),
        where("status", "in", relatedOpenRequestStatuses)
      )
    : query(
        collection(db, "requests"),
        where("itemId", "==", itemId),
        where("ownerId", "==", user.uid),
        where("community", "==", activeCommunity),
        where("status", "in", relatedOpenRequestStatuses)
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
