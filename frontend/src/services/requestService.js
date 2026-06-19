import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  getTrustAdjustmentForCondition,
  returnIssueConditions,
} from "../utils/returnInspection";
import {
  activeBorrowLimitStatuses,
  closedRequestStatuses,
} from "../utils/requestStatus";
import {
  calculateAggregateTrustRating,
  getBorrowLimitForRating,
  getBorrowLimitMessage,
  getTrustRating,
  normalizeTrustStats,
} from "../utils/trust";

const getActiveCommunityName = ({ activeCommunity, activeCommunityObject }) =>
  activeCommunityObject?.name || activeCommunity || "";

const matchesActiveCommunity = (
  record,
  { activeCommunity, activeCommunityId }
) => {
  if (activeCommunityId) {
    return (
      record.communityId === activeCommunityId ||
      (!record.communityId && record.community === activeCommunity)
    );
  }

  return record.community === activeCommunity;
};

export const getFreshRequest = async (requestId) => {
  const requestRef = doc(db, "requests", requestId);
  const requestSnapshot = await getDoc(requestRef);

  if (!requestSnapshot.exists()) {
    throw new Error("This request no longer exists.");
  }

  return {
    requestRef,
    request: {
      id: requestSnapshot.id,
      ...requestSnapshot.data(),
    },
  };
};

export const subscribeToRequestMessages = (requestId, onMessages, onError) => {
  if (!requestId) {
    throw new Error("Request not found.");
  }

  const messagesQuery = query(
    collection(db, "requests", requestId, "messages"),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs
        .map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data(),
        }))
        .reverse();

      onMessages(messages);
    },
    (error) => {
      onError?.(error);
    }
  );
};

export const sendRequestMessage = async ({
  currentUser,
  request,
  text,
  userProfile,
}) => {
  if (!currentUser) {
    throw new Error("Please log in to send messages.");
  }

  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Please enter a message.");
  }

  if (trimmedText.length > 1000) {
    throw new Error("Messages must be 1000 characters or fewer.");
  }

  const { request: freshRequest } = await getFreshRequest(request.id);
  const senderRole =
    freshRequest.ownerId === currentUser.uid
      ? "owner"
      : freshRequest.borrowerId === currentUser.uid
        ? "borrower"
        : "";

  if (!senderRole) {
    throw new Error("You can only chat on your own requests.");
  }

  if (closedRequestStatuses.includes(freshRequest.status)) {
    throw new Error("This conversation is closed.");
  }

  const senderUsername =
    userProfile?.username ||
    currentUser.displayName ||
    currentUser.email ||
    "User";

  const recipientUid =
    currentUser.uid === freshRequest.ownerId
      ? freshRequest.borrowerId
      : freshRequest.ownerId;

  if (!recipientUid) {
    throw new Error("Could not find the chat recipient.");
  }

  const batch = writeBatch(db);
  const messageRef = doc(collection(db, "requests", freshRequest.id, "messages"));
  const requestRef = doc(db, "requests", freshRequest.id);

  batch.set(messageRef, {
    text: trimmedText,
    senderId: currentUser.uid,
    senderUsername,
    senderRole,
    createdAt: serverTimestamp(),
  });

  batch.update(requestRef, {
    chatLastMessageAt: serverTimestamp(),
    chatLastMessageText: trimmedText.slice(0, 120),
    chatLastMessageSenderId: currentUser.uid,
    chatUnreadFor: arrayUnion(recipientUid),
  });

  await batch.commit();
};

export const markRequestChatRead = async ({ requestId, userId }) => {
  if (!requestId || !userId) {
    return;
  }

  const { requestRef, request: freshRequest } = await getFreshRequest(requestId);

  if (
    freshRequest.ownerId !== userId &&
    freshRequest.borrowerId !== userId
  ) {
    throw new Error("You can only read chats on your own requests.");
  }

  await updateDoc(requestRef, {
    chatUnreadFor: arrayRemove(userId),
  });
};

export const createRequest = async ({
  activeCommunity,
  activeCommunityId,
  activeCommunityObject,
  item,
  user,
  userProfile,
}) => {
  const itemSnapshot = await getDoc(doc(db, "items", item.id));

  if (!itemSnapshot.exists()) {
    throw new Error("This item no longer exists.");
  }

  const freshItem = {
    id: itemSnapshot.id,
    ...itemSnapshot.data(),
  };

  if (freshItem.ownerId === user.uid) {
    throw new Error("You cannot request your own item.");
  }

  if (
    !matchesActiveCommunity(freshItem, { activeCommunity, activeCommunityId }) ||
    !freshItem.available
  ) {
    throw new Error("This item is no longer available.");
  }

  const [borrowerSnapshot, borrowerRequestsSnapshot] = await Promise.all([
    getDoc(doc(db, "users", user.uid)),
    getDocs(
      query(
        collection(db, "requests"),
        where("borrowerId", "==", user.uid)
      )
    ),
  ]);
  const borrowerProfile = borrowerSnapshot.exists()
    ? borrowerSnapshot.data()
    : userProfile;
  const trustRating = getTrustRating(borrowerProfile);
  const borrowLimit = getBorrowLimitForRating(trustRating);
  const activeBorrowCount = borrowerRequestsSnapshot.docs.filter((requestDoc) =>
    activeBorrowLimitStatuses.includes(requestDoc.data().status)
  ).length;

  if (borrowLimit !== null && activeBorrowCount >= borrowLimit) {
    throw new Error(getBorrowLimitMessage(trustRating));
  }

  const duplicateRequestQuery = activeCommunityId
    ? query(
        collection(db, "requests"),
        where("borrowerId", "==", user.uid),
        where("communityId", "==", activeCommunityId),
        where("itemId", "==", freshItem.id),
        where("status", "==", "pending"),
        limit(1)
      )
    : query(
        collection(db, "requests"),
        where("borrowerId", "==", user.uid),
        where("community", "==", activeCommunity),
        where("itemId", "==", freshItem.id),
        where("status", "==", "pending"),
        limit(1)
      );
  const duplicateRequest = await getDocs(duplicateRequestQuery);

  if (!duplicateRequest.empty) {
    throw new Error("You have already requested this item.");
  }

  const communityName = getActiveCommunityName({
    activeCommunity,
    activeCommunityObject,
  });

  await addDoc(collection(db, "requests"), {
    itemId: freshItem.id,
    itemName: freshItem.name,
    itemCategory: freshItem.category || "",
    itemImageBase64: freshItem.imageBase64 || "",
    preferredPickupLocation: freshItem.preferredPickupLocation || "",
    ownerId: freshItem.ownerId,
    ownerUsername: freshItem.ownerUsername || "",
    ownerEmail: freshItem.ownerEmail || "",
    borrowerId: user.uid,
    borrowerUsername: userProfile.username,
    borrowerEmail: user.email,
    communityId: activeCommunityId || freshItem.communityId || "",
    communityName,
    community: communityName,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return freshItem.id;
};

export const withdrawRequest = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only withdraw your own requests.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "pending"
  ) {
    throw new Error("Only pending requests in this community can be withdrawn.");
  }

  await updateDoc(requestRef, {
    status: "withdrawn",
    withdrawnAt: serverTimestamp(),
  });
};

export const rejectRequest = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only reject requests for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "pending"
  ) {
    throw new Error("Only pending requests in this community can be rejected.");
  }

  await updateDoc(requestRef, {
    status: "rejected",
    rejectedAt: serverTimestamp(),
  });
};

export const acceptRequest = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  if (!user || !(activeCommunityId || activeCommunity)) {
    throw new Error("User or community not found.");
  }

  if (request.ownerId !== user.uid) {
    throw new Error("You can only accept requests for your own items.");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending requests can be accepted.");
  }

  const requestRef = doc(db, "requests", request.id);
  const itemRef = doc(db, "items", request.itemId);
  const { request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only accept requests for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "pending"
  ) {
    throw new Error("Only pending requests in this community can be accepted.");
  }

  const itemSnapshot = await getDoc(itemRef);

  if (!itemSnapshot.exists()) {
    throw new Error("The related item no longer exists.");
  }

  const item = itemSnapshot.data();

  if (item.ownerId !== user.uid) {
    throw new Error("You can only accept requests for your own items.");
  }

  if (item.available === false) {
    throw new Error("This item is no longer available.");
  }

  const competingRequestsQuery = activeCommunityId
    ? query(
        collection(db, "requests"),
        where("itemId", "==", request.itemId),
        where("ownerId", "==", user.uid),
        where("communityId", "==", activeCommunityId),
        where("status", "==", "pending")
      )
    : query(
        collection(db, "requests"),
        where("itemId", "==", request.itemId),
        where("ownerId", "==", user.uid),
        where("community", "==", activeCommunity),
        where("status", "==", "pending")
      );
  const competingRequestsSnapshot = await getDocs(competingRequestsQuery);
  const batch = writeBatch(db);

  batch.update(requestRef, {
    status: "approved",
    approvedAt: serverTimestamp(),
  });

  batch.update(itemRef, {
    available: false,
  });

  competingRequestsSnapshot.docs.forEach((docSnap) => {
    if (docSnap.id !== request.id) {
      batch.update(docSnap.ref, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: "Another request was approved",
      });
    }
  });

  await batch.commit();
};

export const savePickupDetails = async ({
  activeCommunity,
  activeCommunityId,
  pickupDate,
  pickupLocation,
  pickupNote,
  pickupTime,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only set pickup details for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    !["approved", "pickup_scheduled", "pickup_change_requested"].includes(
      freshRequest.status
    )
  ) {
    throw new Error(
      "Pickup details can only be set for active approved requests in this community."
    );
  }

  await updateDoc(requestRef, {
    pickupLocation: pickupLocation.trim(),
    pickupDate,
    pickupTime,
    pickupNote: pickupNote.trim(),
    pickupSetAt: serverTimestamp(),
    status: "pickup_scheduled",
  });
};

export const confirmPickup = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only confirm pickup for your own requests.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "pickup_scheduled"
  ) {
    throw new Error("Only scheduled pickups can be confirmed.");
  }

  await updateDoc(requestRef, {
    status: "pickup_confirmed",
    pickupConfirmedAt: serverTimestamp(),
  });
};

export const requestPickupChange = async ({
  activeCommunity,
  activeCommunityId,
  message,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only request changes for your own requests.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "pickup_scheduled"
  ) {
    throw new Error("Only scheduled pickups can be changed.");
  }

  await updateDoc(requestRef, {
    status: "pickup_change_requested",
    pickupChangeMessage: message.trim(),
    pickupChangeRequestedAt: serverTimestamp(),
  });
};

export const confirmHandover = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only confirm handover for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "pickup_confirmed"
  ) {
    throw new Error("Only confirmed pickups can be marked as handed over.");
  }

  await updateDoc(requestRef, {
    status: "borrowed",
    borrowedAt: serverTimestamp(),
    handoverConfirmedBy: user.uid,
  });
};

export const markReturned = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only mark your own borrowed item as returned.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "borrowed"
  ) {
    throw new Error("Only borrowed items can be marked as returned.");
  }

  await updateDoc(requestRef, {
    status: "return_pending",
    returnedAt: serverTimestamp(),
  });
};

export const confirmReturn = async ({
  activeCommunity,
  activeCommunityId,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only confirm returns for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "return_pending"
  ) {
    throw new Error("Only pending returns can be confirmed.");
  }

  const itemRef = doc(db, "items", freshRequest.itemId);
  const itemSnapshot = await getDoc(itemRef);

  if (!itemSnapshot.exists()) {
    throw new Error("The related item no longer exists.");
  }

  const item = itemSnapshot.data();

  if (item.ownerId !== user.uid) {
    throw new Error("You can only confirm returns for your own items.");
  }

  const batch = writeBatch(db);

  batch.update(requestRef, {
    status: "completed",
    completedAt: serverTimestamp(),
    returnConfirmedBy: user.uid,
  });

  batch.update(itemRef, {
    available: true,
    availableSince: serverTimestamp(),
  });

  await batch.commit();
};

export const inspectReturn = async ({
  activeCommunity,
  activeCommunityId,
  condition,
  note,
  request,
  user,
}) => {
  const adjustment = getTrustAdjustmentForCondition(condition);

  if (!adjustment) {
    throw new Error("Please choose a valid return condition.");
  }

  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only inspect returns for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "return_pending"
  ) {
    throw new Error("Only pending returns in this community can be inspected.");
  }

  const itemRef = doc(db, "items", freshRequest.itemId);
  const itemSnapshot = await getDoc(itemRef);

  if (!itemSnapshot.exists()) {
    throw new Error("The related item no longer exists.");
  }

  const item = itemSnapshot.data();

  if (item.ownerId !== user.uid) {
    throw new Error("You can only inspect returns for your own items.");
  }

  const inspectionNote = note.trim();
  const hasReturnIssue = returnIssueConditions.includes(condition);
  const shouldProcessTrustRating =
    freshRequest.trustScoreProcessed !== true &&
    freshRequest.trustRatingProcessed !== true;
  const batch = writeBatch(db);
  const trustProcessingFields = shouldProcessTrustRating
    ? {
        trustRatingProcessed: true,
        trustRatingProcessedAt: serverTimestamp(),
        returnScore: adjustment.score,
        trustScoreProcessed: true,
        trustScoreProcessedAt: serverTimestamp(),
      }
    : {};

  if (!hasReturnIssue) {
    batch.update(requestRef, {
      status: "completed",
      returnCondition: condition,
      returnInspectionNote: inspectionNote,
      returnInspectedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      returnConfirmedBy: user.uid,
      ...trustProcessingFields,
    });

    batch.update(itemRef, {
      available: true,
      availableSince: serverTimestamp(),
    });
  } else {
    const issueType = hasReturnIssue ? condition : "other";

    batch.update(requestRef, {
      status: "return_issue",
      returnCondition: condition,
      returnInspectionNote: inspectionNote,
      returnInspectedAt: serverTimestamp(),
      returnIssueType: issueType,
      returnIssueNote: inspectionNote,
      returnIssueReportedAt: serverTimestamp(),
      returnIssueReportedBy: user.uid,
      ...trustProcessingFields,
    });

    batch.update(itemRef, {
      available: false,
    });
  }

  if (shouldProcessTrustRating) {
    const borrowerRef = doc(db, "users", freshRequest.borrowerId);
    const borrowerSnapshot = await getDoc(borrowerRef);
    const borrowerProfile = borrowerSnapshot.exists()
      ? borrowerSnapshot.data()
      : {};
    const currentStats = normalizeTrustStats(borrowerProfile.trustStats);
    const nextStats = {
      ...currentStats,
      completedBorrows: currentStats.completedBorrows + 1,
      totalReturnScore: currentStats.totalReturnScore + adjustment.score,
      [adjustment.statKey]: (currentStats[adjustment.statKey] || 0) + 1,
      lastUpdatedAt: serverTimestamp(),
    };

    if (hasReturnIssue) {
      nextStats.returnIssues = (currentStats.returnIssues || 0) + 1;
    }

    const nextRating = calculateAggregateTrustRating(nextStats);

    // TODO: For production, move trust rating calculation/update to Firebase
    // Cloud Functions. This frontend implementation is used for the FYP
    // prototype because the Firebase Spark plan cannot deploy Functions.
    batch.set(
      borrowerRef,
      {
        trustRating: nextRating,
        trustStats: nextStats,
      },
      { merge: true }
    );
  }

  await batch.commit();
};

export const resolveReturnIssue = async ({
  activeCommunity,
  activeCommunityId,
  makeItemAvailable,
  note,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only resolve issues for your own items.");
  }

  if (
    !matchesActiveCommunity(freshRequest, { activeCommunity, activeCommunityId }) ||
    freshRequest.status !== "return_issue"
  ) {
    throw new Error("Only open return issues in this community can be resolved.");
  }

  const itemRef = doc(db, "items", freshRequest.itemId);
  const itemSnapshot = await getDoc(itemRef);

  if (!itemSnapshot.exists()) {
    throw new Error("The related item no longer exists.");
  }

  const item = itemSnapshot.data();

  if (item.ownerId !== user.uid) {
    throw new Error("You can only resolve issues for your own items.");
  }

  const batch = writeBatch(db);

  batch.update(requestRef, {
    status: "completed",
    issueResolvedAt: serverTimestamp(),
    issueResolutionNote: note.trim(),
    issueResolvedBy: user.uid,
    completedAt: serverTimestamp(),
  });

  batch.update(itemRef, {
    available: Boolean(makeItemAvailable),
    ...(makeItemAvailable ? { availableSince: serverTimestamp() } : {}),
  });

  await batch.commit();
};
