import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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
import { clampTrustScore, defaultTrustStats } from "../utils/trust";

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

export const createRequest = async ({ activeCommunity, item, user, userProfile }) => {
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

  if (freshItem.community !== activeCommunity || !freshItem.available) {
    throw new Error("This item is no longer available.");
  }

  const duplicateRequestQuery = query(
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

  await addDoc(collection(db, "requests"), {
    itemId: freshItem.id,
    itemName: freshItem.name,
    itemCategory: freshItem.category || "",
    itemImageBase64: freshItem.imageBase64 || "",
    ownerId: freshItem.ownerId,
    ownerUsername: freshItem.ownerUsername || "",
    ownerEmail: freshItem.ownerEmail || "",
    borrowerId: user.uid,
    borrowerUsername: userProfile.username,
    borrowerEmail: user.email,
    community: activeCommunity,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return freshItem.id;
};

export const withdrawRequest = async ({ activeCommunity, request, user }) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only withdraw your own requests.");
  }

  if (
    freshRequest.community !== activeCommunity ||
    freshRequest.status !== "pending"
  ) {
    throw new Error("Only pending requests in this community can be withdrawn.");
  }

  await updateDoc(requestRef, {
    status: "withdrawn",
    withdrawnAt: serverTimestamp(),
  });
};

export const rejectRequest = async ({ activeCommunity, request, user }) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only reject requests for your own items.");
  }

  if (
    freshRequest.community !== activeCommunity ||
    freshRequest.status !== "pending"
  ) {
    throw new Error("Only pending requests in this community can be rejected.");
  }

  await updateDoc(requestRef, {
    status: "rejected",
    rejectedAt: serverTimestamp(),
  });
};

export const acceptRequest = async ({ activeCommunity, request, user }) => {
  if (!user || !activeCommunity) {
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
    freshRequest.community !== activeCommunity ||
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

  const competingRequestsQuery = query(
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
    freshRequest.community !== activeCommunity ||
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

export const confirmPickup = async ({ activeCommunity, request, user }) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only confirm pickup for your own requests.");
  }

  if (
    freshRequest.community !== activeCommunity ||
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
  message,
  request,
  user,
}) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only request changes for your own requests.");
  }

  if (
    freshRequest.community !== activeCommunity ||
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

export const confirmHandover = async ({ activeCommunity, request, user }) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only confirm handover for your own items.");
  }

  if (
    freshRequest.community !== activeCommunity ||
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

export const markReturned = async ({ activeCommunity, request, user }) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.borrowerId !== user.uid) {
    throw new Error("You can only mark your own borrowed item as returned.");
  }

  if (
    freshRequest.community !== activeCommunity ||
    freshRequest.status !== "borrowed"
  ) {
    throw new Error("Only borrowed items can be marked as returned.");
  }

  await updateDoc(requestRef, {
    status: "return_pending",
    returnedAt: serverTimestamp(),
  });
};

export const confirmReturn = async ({ activeCommunity, request, user }) => {
  const { requestRef, request: freshRequest } = await getFreshRequest(request.id);

  if (freshRequest.ownerId !== user.uid) {
    throw new Error("You can only confirm returns for your own items.");
  }

  if (
    freshRequest.community !== activeCommunity ||
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
  });

  await batch.commit();
};

export const inspectReturn = async ({
  activeCommunity,
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
    freshRequest.community !== activeCommunity ||
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
  const shouldProcessTrustScore = freshRequest.trustScoreProcessed !== true;
  const batch = writeBatch(db);
  const trustProcessingFields = shouldProcessTrustScore
    ? {
        trustScoreProcessed: true,
        trustScoreProcessedAt: serverTimestamp(),
        trustScoreDelta: adjustment.scoreDelta,
      }
    : {};

  if (adjustment.completed) {
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
    });
  } else {
    const issueType = returnIssueConditions.includes(condition)
      ? condition
      : "other";

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

  if (shouldProcessTrustScore) {
    const borrowerRef = doc(db, "users", freshRequest.borrowerId);
    const borrowerSnapshot = await getDoc(borrowerRef);
    const borrowerProfile = borrowerSnapshot.exists()
      ? borrowerSnapshot.data()
      : {};
    const currentScore = Number(borrowerProfile.reputationScore ?? 100);
    const currentStats = {
      ...defaultTrustStats,
      ...(borrowerProfile.trustStats || {}),
    };
    const nextStats = {
      ...currentStats,
      [adjustment.statKey]: (currentStats[adjustment.statKey] || 0) + 1,
      lastUpdatedAt: serverTimestamp(),
    };

    if (adjustment.completed) {
      nextStats.completedBorrows = (currentStats.completedBorrows || 0) + 1;
    } else {
      nextStats.returnIssues = (currentStats.returnIssues || 0) + 1;
    }

    // TODO: For production, move trust score calculation/update to Firebase
    // Cloud Functions. This frontend implementation is used for the FYP
    // prototype because the Firebase Spark plan cannot deploy Functions.
    batch.set(
      borrowerRef,
      {
        reputationScore: clampTrustScore(currentScore + adjustment.scoreDelta),
        trustStats: nextStats,
      },
      { merge: true }
    );
  }

  await batch.commit();
};

export const resolveReturnIssue = async ({
  activeCommunity,
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
    freshRequest.community !== activeCommunity ||
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
  });

  await batch.commit();
};
