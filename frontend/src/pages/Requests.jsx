import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const acceptButtonClass =
  "rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60";
const mutedButtonClass =
  "rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60";

function Requests({ activeCommunity, user }) {
  const [outgoingState, setOutgoingState] = useState({
    community: "",
    userId: "",
    requests: [],
  });
  const [incomingState, setIncomingState] = useState({
    community: "",
    userId: "",
    requests: [],
  });
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");
  const [pickupModal, setPickupModal] = useState(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [pickupSaving, setPickupSaving] = useState(false);

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const outgoingQuery = query(
      collection(db, "requests"),
      where("borrowerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      outgoingQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }));

        setOutgoingState({
          community: activeCommunity,
          userId: user.uid,
          requests,
        });
      },
      (error) => {
        alert(error.message);
        setOutgoingState({
          community: activeCommunity,
          userId: user.uid,
          requests: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  useEffect(() => {
    if (!user || !activeCommunity) {
      return undefined;
    }

    const incomingQuery = query(
      collection(db, "requests"),
      where("ownerId", "==", user.uid),
      where("community", "==", activeCommunity),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      incomingQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((requestDoc) => ({
          id: requestDoc.id,
          ...requestDoc.data(),
        }));

        setIncomingState({
          community: activeCommunity,
          userId: user.uid,
          requests,
        });
      },
      (error) => {
        alert(error.message);
        setIncomingState({
          community: activeCommunity,
          userId: user.uid,
          requests: [],
        });
      }
    );

    return () => unsubscribe();
  }, [activeCommunity, user]);

  const formatCreatedAt = (createdAt) => {
    if (!createdAt?.toDate) {
      return "Saving timestamp...";
    }

    return createdAt.toDate().toLocaleString();
  };

  const getOwnerLabel = (request) =>
    request.ownerUsername || request.ownerEmail || request.ownerId;
  const getBorrowerLabel = (request) =>
    request.borrowerUsername || request.borrowerEmail || request.borrowerId;
  const hasPickupDetails = (request) =>
    request.pickupLocation && request.pickupDate && request.pickupTime;

  const getFreshRequest = async (requestId) => {
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

  const withdrawRequest = async (request) => {
    const confirmed = window.confirm("Withdraw this request?");

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      const { requestRef, request: freshRequest } = await getFreshRequest(
        request.id
      );

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

      setMessage("Request withdrawn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
    }
  };

  const openPickupEditor = (request) => {
    setPickupModal({
      mode: "edit",
      request,
    });
    setPickupLocation(request.pickupLocation || "");
    setPickupDate(request.pickupDate || "");
    setPickupTime(request.pickupTime || "");
    setPickupNote(request.pickupNote || "");
    setMessage("");
  };

  const openPickupViewer = (request) => {
    setPickupModal({
      mode: "view",
      request,
    });
    setMessage("");
  };

  const closePickupModal = () => {
    setPickupModal(null);
    setPickupLocation("");
    setPickupDate("");
    setPickupTime("");
    setPickupNote("");
  };

  const savePickupDetails = async (event) => {
    event.preventDefault();

    if (!pickupModal || pickupModal.mode !== "edit") {
      return;
    }

    if (!pickupLocation.trim() || !pickupDate || !pickupTime) {
      setMessage("Please enter pickup location, date, and time.");
      return;
    }

    setPickupSaving(true);
    setMessage("");

    try {
      const { requestRef, request } = await getFreshRequest(
        pickupModal.request.id
      );

      if (request.ownerId !== user.uid) {
        throw new Error("You can only set pickup details for your own items.");
      }

      if (
        request.community !== activeCommunity ||
        request.status !== "approved"
      ) {
        throw new Error(
          "Pickup details can only be set for approved requests in this community."
        );
      }

      await updateDoc(requestRef, {
        pickupLocation: pickupLocation.trim(),
        pickupDate,
        pickupTime,
        pickupNote: pickupNote.trim(),
        pickupSetAt: serverTimestamp(),
      });

      closePickupModal();
      setMessage("Pickup details saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPickupSaving(false);
    }
  };

  const rejectRequest = async (request) => {
    const confirmed = window.confirm("Reject this request?");

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      const { requestRef, request: freshRequest } = await getFreshRequest(
        request.id
      );

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

      setMessage("Request rejected.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
    }
  };

  const acceptRequest = async (request) => {
    if (!user || !activeCommunity) {
      setMessage("User or community not found.");
      return;
    }

    if (request.ownerId !== user.uid) {
      setMessage("You can only accept requests for your own items.");
      return;
    }

    if (request.status !== "pending") {
      setMessage("Only pending requests can be accepted.");
      return;
    }

    const confirmed = window.confirm(
      "Accept this request? Item will become unavailable."
    );

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
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

      setMessage("Request accepted successfully.");
    } catch (error) {
      console.error("Error accepting request:", error);
      setMessage(error.message || "Failed to accept request.");
    } finally {
      setActionId("");
    }
  };

  const outgoingLoading =
    activeCommunity &&
    user &&
    (outgoingState.community !== activeCommunity ||
      outgoingState.userId !== user.uid);
  const incomingLoading =
    activeCommunity &&
    user &&
    (incomingState.community !== activeCommunity ||
      incomingState.userId !== user.uid);
  const outgoingRequests =
    outgoingState.community === activeCommunity && outgoingState.userId === user?.uid
      ? outgoingState.requests
      : [];
  const incomingRequests =
    incomingState.community === activeCommunity && incomingState.userId === user?.uid
      ? incomingState.requests
      : [];
  const needsActionRequests = [
    ...incomingRequests
      .filter(
        (request) =>
          request.status === "pending" && request.ownerId === user.uid
      )
      .map((request) => ({ direction: "incoming", request })),
    ...incomingRequests
      .filter(
        (request) =>
          request.status === "approved" &&
          request.ownerId === user.uid &&
          !hasPickupDetails(request)
      )
      .map((request) => ({ direction: "incoming", request })),
  ];
  const activeRequests = [
    ...incomingRequests
      .filter(
        (request) =>
          request.status === "approved" &&
          request.ownerId === user.uid &&
          hasPickupDetails(request)
      )
      .map((request) => ({ direction: "incoming", request })),
    ...outgoingRequests
      .filter(
        (request) =>
          request.status === "approved" && request.borrowerId === user.uid
      )
      .map((request) => ({ direction: "outgoing", request })),
  ];
  const pendingRequests = outgoingRequests
    .filter(
      (request) => request.status === "pending" && request.borrowerId === user.uid
    )
    .map((request) => ({ direction: "outgoing", request }));
  const pastRequestMap = new Map();

  [...incomingRequests, ...outgoingRequests]
    .filter(
      (request) => request.status === "rejected" || request.status === "withdrawn"
    )
    .forEach((request) => {
      const direction = request.ownerId === user?.uid ? "incoming" : "outgoing";
      pastRequestMap.set(request.id, { direction, request });
    });

  const pastRequests = Array.from(pastRequestMap.values());
  const requestsLoading = outgoingLoading || incomingLoading;

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) {
      return "";
    }

    return timestamp.toDate().toLocaleString();
  };

  const getPastTimestamp = (request) => {
    if (request.status === "withdrawn") {
      return formatTimestamp(request.withdrawnAt);
    }

    if (request.status === "rejected") {
      return formatTimestamp(request.rejectedAt);
    }

    return "";
  };

  const renderPickupSummary = (request) => {
    if (!hasPickupDetails(request)) {
      return <small>Pickup details not set</small>;
    }

    return (
      <small className="mt-2 block rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-emerald-100">
        Pickup: {request.pickupDate} at {request.pickupTime} -{" "}
        {request.pickupLocation}
      </small>
    );
  };

  const renderRequestCard = ({ direction, request }) => {
    const isIncoming = direction === "incoming";
    const relatedUserLabel = isIncoming
      ? `Borrower: ${getBorrowerLabel(request)}`
      : `Owner: ${getOwnerLabel(request)}`;
    const pastTimestamp = getPastTimestamp(request);

    return (
      <article
        className={`flex flex-col gap-5 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between ${
          request.status === "rejected" || request.status === "withdrawn"
            ? "border-stone-200 opacity-80"
            : "border-stone-200"
        }`}
        key={`${direction}-${request.id}`}
      >
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900">
            {request.itemName}
          </h3>
          <StatusBadge status={request.status} />
          <small className="mt-2 block text-sm font-medium text-slate-600">
            {relatedUserLabel}
          </small>
          {(request.status === "pending" ||
            request.status === "rejected" ||
            request.status === "withdrawn") && (
            <small className="mt-1 block text-sm text-slate-500">
              {pastTimestamp
                ? `Updated: ${pastTimestamp}`
                : `Created: ${formatCreatedAt(request.createdAt)}`}
            </small>
          )}
          {request.status === "approved" &&
            isIncoming &&
            renderPickupSummary(request)}
          {request.rejectionReason && (
            <small className="mt-1 block text-sm text-slate-500">
              Reason: {request.rejectionReason}
            </small>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:items-end">
          {request.status === "pending" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <div className="flex flex-wrap gap-2">
                <button
                  className={acceptButtonClass}
                  disabled={actionId === request.id}
                  type="button"
                  onClick={() => acceptRequest(request)}
                >
                  {actionId === request.id ? "Working..." : "Accept"}
                </button>
                <button
                  className={dangerButtonClass}
                  disabled={actionId === request.id}
                  type="button"
                  onClick={() => rejectRequest(request)}
                >
                  Reject
                </button>
              </div>
            )}

          {request.status === "pending" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <button
                className={mutedButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => withdrawRequest(request)}
              >
                {actionId === request.id ? "Withdrawing..." : "Withdraw"}
              </button>
            )}

          {request.status === "approved" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <button
                className={mutedButtonClass}
                type="button"
                onClick={() => openPickupEditor(request)}
              >
                {hasPickupDetails(request)
                  ? "Edit Pickup Details"
                  : "Set Pickup Details"}
              </button>
            )}

          {request.status === "approved" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <button
                className={mutedButtonClass}
                type="button"
                onClick={() => openPickupViewer(request)}
              >
                View Pickup Details
              </button>
            )}
        </div>
      </article>
    );
  };

  const renderRequestSection = (title, emptyMessage, entries, className = "") => (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-slate-700">
          {entries.length}
        </span>
      </div>
      <div className="mt-4 grid gap-4">
        {requestsLoading && <p className="text-slate-600">Loading requests...</p>}
        {!requestsLoading && entries.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-slate-600">
            {emptyMessage}
          </p>
        )}
        {!requestsLoading && entries.map(renderRequestCard)}
      </div>
    </section>
  );

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Requests
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Request dashboard
        </h2>
        <p className="mt-2 text-slate-600">
          Showing requests in{" "}
          <span className="font-semibold text-emerald-800">
            {activeCommunity}
          </span>
        </p>
        {message && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        )}
      </div>

      {renderRequestSection(
        "Needs Action",
        "Nothing needs your action right now.",
        needsActionRequests,
        "bg-emerald-50/50"
      )}
      {renderRequestSection(
        "Active Requests",
        "No approved requests are active right now.",
        activeRequests
      )}
      {renderRequestSection(
        "Pending Requests",
        "You do not have outgoing requests waiting for a response.",
        pendingRequests
      )}
      {renderRequestSection(
        "Past Requests",
        "No withdrawn or rejected requests yet.",
        pastRequests,
        "opacity-90"
      )}

      {pickupModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div
            className="max-h-[calc(100svh-3rem)] w-full max-w-xl overflow-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            {pickupModal.mode === "edit" ? (
              <form className="grid gap-5" onSubmit={savePickupDetails}>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {hasPickupDetails(pickupModal.request)
                      ? "Edit Pickup Details"
                      : "Set Pickup Details"}
                  </h3>
                  <p className="mt-1 text-slate-600">
                    {pickupModal.request.itemName}
                  </p>
                  <small className="mt-2 block text-sm font-medium text-slate-500">
                    Borrower: {getBorrowerLabel(pickupModal.request)}
                  </small>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Pickup Location
                  <input
                    className={inputClass}
                    type="text"
                    value={pickupLocation}
                    onChange={(event) => setPickupLocation(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Pickup Date
                  <input
                    className={inputClass}
                    type="date"
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Pickup Time
                  <input
                    className={inputClass}
                    type="time"
                    value={pickupTime}
                    onChange={(event) => setPickupTime(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Pickup Note
                  <textarea
                    className={inputClass}
                    value={pickupNote}
                    onChange={(event) => setPickupNote(event.target.value)}
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    className={acceptButtonClass}
                    disabled={pickupSaving}
                    type="submit"
                  >
                    {pickupSaving ? "Saving..." : "Save Details"}
                  </button>
                  <button
                    className={mutedButtonClass}
                    type="button"
                    onClick={closePickupModal}
                    disabled={pickupSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Pickup Details
                  </h3>
                  <p className="mt-1 text-slate-600">
                    {pickupModal.request.itemName}
                  </p>
                  <small className="mt-2 block text-sm font-medium text-slate-500">
                    Owner: {getOwnerLabel(pickupModal.request)}
                  </small>
                </div>

                {hasPickupDetails(pickupModal.request) ? (
                  <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-slate-700">
                    <p>
                      <strong>Location:</strong>{" "}
                      {pickupModal.request.pickupLocation}
                    </p>
                    <p>
                      <strong>Date:</strong> {pickupModal.request.pickupDate}
                    </p>
                    <p>
                      <strong>Time:</strong> {pickupModal.request.pickupTime}
                    </p>
                    {pickupModal.request.pickupNote && (
                      <p>
                        <strong>Note:</strong> {pickupModal.request.pickupNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-slate-600">
                    Pickup details have not been set by the owner yet. Please
                    check again later.
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    className={mutedButtonClass}
                    type="button"
                    onClick={closePickupModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = status || "pending";
  const statusClass =
    {
      pending: "bg-amber-50 text-amber-800 ring-amber-200",
      approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      rejected: "bg-red-50 text-red-700 ring-red-200",
      withdrawn: "bg-stone-100 text-slate-600 ring-stone-200",
    }[normalizedStatus] || "bg-stone-100 text-slate-600 ring-stone-200";

  return (
    <span
      className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold capitalize ring-1 ${statusClass}`}
    >
      {normalizedStatus}
    </span>
  );
}

export default Requests;
