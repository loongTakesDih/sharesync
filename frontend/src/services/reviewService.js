import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const getReviewReference = (itemId, requestId) =>
  doc(db, "items", itemId, "reviews", requestId);

export const fetchItemReviews = async (itemId) => {
  if (!itemId) {
    return [];
  }

  const snapshot = await getDocs(collection(db, "items", itemId, "reviews"));

  return snapshot.docs
    .map((reviewDoc) => ({ id: reviewDoc.id, ...reviewDoc.data() }))
    .sort((first, second) => {
      const firstTime = first.createdAt?.toMillis?.() || 0;
      const secondTime = second.createdAt?.toMillis?.() || 0;

      return secondTime - firstTime;
    });
};

export const fetchReviewForRequest = async ({ itemId, requestId }) => {
  if (!itemId || !requestId) {
    return null;
  }

  const snapshot = await getDoc(getReviewReference(itemId, requestId));

  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const saveItemReview = async ({
  comment,
  rating,
  request,
  user,
  userProfile,
}) => {
  if (
    !user?.uid ||
    !request?.id ||
    request?.status !== "completed" ||
    request?.borrowerId !== user.uid ||
    !request?.itemId ||
    request?.ownerId === user.uid
  ) {
    throw new Error("Only the borrower can review a completed borrow.");
  }

  const numericRating = Number(rating);
  const trimmedComment = comment.trim();

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error("Choose a rating from 1 to 5 stars.");
  }

  if (trimmedComment.length > 300) {
    throw new Error("Review comments must be 300 characters or fewer.");
  }

  const reviewReference = getReviewReference(request.itemId, request.id);
  const existingReview = await getDoc(reviewReference);

  if (existingReview.exists()) {
    await updateDoc(reviewReference, {
      rating: numericRating,
      comment: trimmedComment,
      updatedAt: serverTimestamp(),
    });
  } else {
    const borrowerUsername =
      userProfile?.username ||
      request.borrowerUsername ||
      user.displayName ||
      "Borrower";
    const profileImage = userProfile?.profileImageBase64 || user.photoURL || "";

    await setDoc(reviewReference, {
      requestId: request.id,
      itemId: request.itemId,
      ownerId: request.ownerId,
      borrowerId: user.uid,
      borrowerUsername,
      ...(profileImage && profileImage.length <= 700000
        ? { borrowerProfileImageBase64: profileImage }
        : {}),
      rating: numericRating,
      ...(trimmedComment ? { comment: trimmedComment } : {}),
      createdAt: serverTimestamp(),
    });
  }

  return fetchReviewForRequest({
    itemId: request.itemId,
    requestId: request.id,
  });
};
