import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  activeBorrowingStatuses,
  preHandoverStatuses,
} from "../utils/requestStatus";

export const lendingFlowStatuses = [
  ...preHandoverStatuses,
  ...activeBorrowingStatuses,
];

export const activeLendingRequestStatuses = [
  "pending",
  ...lendingFlowStatuses,
];

export const useProfileSummary = (
  profileUserId,
  { includeBorrowerRequests = false, includeOwnerRequests = true } = {}
) => {
  const [ownedItems, setOwnedItems] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [borrowerRequests, setBorrowerRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profileUserId) {
      return undefined;
    }

    const handleError = (source) => (snapshotError) => {
      setError(
        `${source} could not be loaded. ${snapshotError.message || ""}`.trim()
      );
    };

    const unsubscribeItems = onSnapshot(
      query(collection(db, "items"), where("ownerId", "==", profileUserId)),
      (snapshot) => {
        setOwnedItems(
          snapshot.docs.map((itemDoc) => ({
            id: itemDoc.id,
            ...itemDoc.data(),
          }))
        );
      },
      handleError("Listed items")
    );

    const unsubscribeOwnerRequests = includeOwnerRequests
      ? onSnapshot(
          query(
            collection(db, "requests"),
            where("ownerId", "==", profileUserId)
          ),
          (snapshot) => {
            setOwnerRequests(
              snapshot.docs.map((requestDoc) => ({
                id: requestDoc.id,
                ...requestDoc.data(),
              }))
            );
          },
          handleError("Lending activity")
        )
      : undefined;

    const unsubscribeBorrowerRequests = includeBorrowerRequests
      ? onSnapshot(
          query(
            collection(db, "requests"),
            where("borrowerId", "==", profileUserId)
          ),
          (snapshot) => {
            setBorrowerRequests(
              snapshot.docs.map((requestDoc) => ({
                id: requestDoc.id,
                ...requestDoc.data(),
              }))
            );
          },
          handleError("Borrowing activity")
        )
      : undefined;

    return () => {
      unsubscribeItems();
      unsubscribeOwnerRequests?.();
      unsubscribeBorrowerRequests?.();
    };
  }, [includeBorrowerRequests, includeOwnerRequests, profileUserId]);

  const lendingStats = useMemo(() => {
    const currentlyLentItemIds = new Set(
      ownerRequests
        .filter((request) => activeBorrowingStatuses.includes(request.status))
        .map((request) => request.itemId)
        .filter(Boolean)
    );

    return {
      activeLendingRequests: ownerRequests.filter((request) =>
        activeLendingRequestStatuses.includes(request.status)
      ).length,
      availableItems: ownedItems.filter((item) => item.available === true).length,
      completedLends: ownerRequests.filter(
        (request) => request.status === "completed"
      ).length,
      currentlyLentOut: currentlyLentItemIds.size,
      listedItems: ownedItems.length,
      returnIssuesReported: ownerRequests.filter(
        (request) => request.status === "return_issue"
      ).length,
    };
  }, [ownedItems, ownerRequests]);

  const borrowingStats = useMemo(
    () => ({
      activeBorrowedItems: borrowerRequests.filter((request) =>
        activeBorrowingStatuses.includes(request.status)
      ),
      completedBorrowedItems: borrowerRequests.filter(
        (request) => request.status === "completed"
      ),
      returnIssueRecords: borrowerRequests.filter(
        (request) => request.status === "return_issue"
      ),
    }),
    [borrowerRequests]
  );

  return {
    borrowerRequests,
    borrowingStats,
    error,
    lendingStats,
    loading: false,
    ownedItems,
    ownerRequests,
  };
};
