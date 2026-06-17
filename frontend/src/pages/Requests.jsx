import { useEffect, useMemo, useState } from "react";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import PageHeader from "../components/ui/PageHeader";
import PickupModal from "../components/requests/PickupModal";
import RequestCard from "../components/requests/RequestCard";
import RequestSection from "../components/requests/RequestSection";
import ResolveIssueModal from "../components/requests/ResolveIssueModal";
import ReturnInspectionModal from "../components/requests/ReturnInspectionModal";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useRequests } from "../hooks/useRequests";
import {
  acceptRequest as acceptRequestDocument,
  confirmHandover as confirmHandoverDocument,
  confirmPickup as confirmPickupDocument,
  inspectReturn as inspectReturnDocument,
  markReturned as markReturnedDocument,
  rejectRequest as rejectRequestDocument,
  requestPickupChange as requestPickupChangeDocument,
  resolveReturnIssue as resolveReturnIssueDocument,
  savePickupDetails as savePickupDetailsDocument,
  withdrawRequest as withdrawRequestDocument,
} from "../services/requestService";
import { fetchUserProfile } from "../services/userService";
import { formatFirestoreDate } from "../utils/formatDate";
import {
  activeBorrowingStatuses,
  ownerNeedsActionStatuses,
  pendingBorrowerRequestStatuses,
} from "../utils/requestStatus";

function Requests({ activeCommunity, activeCommunityId, user }) {
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");
  const [pickupModal, setPickupModal] = useState(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [pickupChangeMessage, setPickupChangeMessage] = useState("");
  const [pickupSaving, setPickupSaving] = useState(false);
  const [inspectionModal, setInspectionModal] = useState(null);
  const [returnCondition, setReturnCondition] = useState("good");
  const [returnInspectionNote, setReturnInspectionNote] = useState("");
  const [returnInspectionError, setReturnInspectionError] = useState("");
  const [resolveModal, setResolveModal] = useState(null);
  const [issueResolutionNote, setIssueResolutionNote] = useState("");
  const [makeItemAvailable, setMakeItemAvailable] = useState(true);
  const [returnSaving, setReturnSaving] = useState(false);
  const [profileMap, setProfileMap] = useState({});
  const {
    closeUserProfile,
    openUserProfile,
    profile,
    profileLoading,
  } = usePublicProfileModal();
  const {
    incomingRequests,
    outgoingRequests,
    requestsLoading,
  } = useRequests({ activeCommunity, activeCommunityId, user });

  const relatedUserKey = useMemo(
    () =>
      [
        ...new Set(
          [...incomingRequests, ...outgoingRequests]
            .flatMap((request) => [request.borrowerId, request.ownerId])
            .filter(Boolean)
        ),
      ]
        .sort()
        .join("|"),
    [incomingRequests, outgoingRequests]
  );

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
      const profiles = {};
      const relatedUserIds = relatedUserKey ? relatedUserKey.split("|") : [];

      if (relatedUserIds.length === 0) {
        return;
      }

      await Promise.all(
        relatedUserIds.map(async (uid) => {
          const profile = await fetchUserProfile(uid).catch(() => null);

          if (profile) {
            profiles[uid] = profile;
          }
        })
      );

      if (active) {
        setProfileMap(profiles);
      }
    };

    loadProfiles();

    return () => {
      active = false;
    };
  }, [relatedUserKey]);

  const formatCreatedAt = (createdAt) =>
    formatFirestoreDate(createdAt, "Saving timestamp...");

  const withdrawRequest = async (request) => {
    const confirmed = window.confirm("Withdraw this request?");

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      await withdrawRequestDocument({
        activeCommunity,
        activeCommunityId,
        request,
        user,
      });
      setMessage("Request withdrawn.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
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
      await rejectRequestDocument({
        activeCommunity,
        activeCommunityId,
        request,
        user,
      });
      setMessage("Request rejected.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
    }
  };

  const acceptRequest = async (request) => {
    const confirmed = window.confirm(
      "Approve this request? Item will become unavailable while pickup is arranged."
    );

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      await acceptRequestDocument({
        activeCommunity,
        activeCommunityId,
        request,
        user,
      });
      setMessage("Request approved. Add pickup details next.");
      openPickupEditor(request);
    } catch (error) {
      console.error("Error accepting request:", error);
      setMessage(error.message || "Failed to accept request.");
    } finally {
      setActionId("");
    }
  };

  const openPickupEditor = (request) => {
    const presetPickupLocation =
      request.preferredPickupLocation || request.pickupLocation || "";

    setPickupModal({
      mode: "edit",
      request,
    });
    setPickupLocation(presetPickupLocation);
    setPickupDate(request.pickupDate || "");
    setPickupTime(request.pickupTime || "");
    setPickupNote(request.pickupNote || "");
    setMessage("");
  };

  const openPickupChangeRequest = (request) => {
    setPickupModal({
      mode: "change",
      request,
    });
    setPickupChangeMessage("");
    setMessage("");
  };

  const closePickupModal = () => {
    setPickupModal(null);
    setPickupLocation("");
    setPickupDate("");
    setPickupTime("");
    setPickupNote("");
    setPickupChangeMessage("");
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
      await savePickupDetailsDocument({
        activeCommunity,
        activeCommunityId,
        pickupDate,
        pickupLocation,
        pickupNote,
        pickupTime,
        request: pickupModal.request,
        user,
      });

      closePickupModal();
      setMessage("Pickup details saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPickupSaving(false);
    }
  };

  const submitPickupChangeRequest = async (event) => {
    event.preventDefault();

    if (!pickupModal || pickupModal.mode !== "change") {
      return;
    }

    if (!pickupChangeMessage.trim()) {
      setMessage("Please enter a short message for the owner.");
      return;
    }

    setPickupSaving(true);
    setMessage("");

    try {
      await requestPickupChangeDocument({
        activeCommunity,
        activeCommunityId,
        message: pickupChangeMessage,
        request: pickupModal.request,
        user,
      });

      closePickupModal();
      setMessage("Pickup change request sent.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPickupSaving(false);
    }
  };

  const confirmPickup = async (request) => {
    const confirmed = window.confirm("Confirm this pickup time?");

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      await confirmPickupDocument({
        activeCommunity,
        activeCommunityId,
        request,
        user,
      });
      setMessage("Pickup confirmed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
    }
  };

  const confirmHandover = async (request) => {
    const confirmed = window.confirm("Confirm this item has been handed over?");

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      await confirmHandoverDocument({
        activeCommunity,
        activeCommunityId,
        request,
        user,
      });
      setMessage("Item marked as borrowed.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
    }
  };

  const markReturned = async (request) => {
    const confirmed = window.confirm("Mark this item as returned?");

    if (!confirmed) {
      return;
    }

    setActionId(request.id);
    setMessage("");

    try {
      await markReturnedDocument({
        activeCommunity,
        activeCommunityId,
        request,
        user,
      });
      setMessage("Return marked. Waiting for owner confirmation.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
    }
  };

  const openInspectionModal = (request) => {
    setInspectionModal({ request });
    setReturnCondition("good");
    setReturnInspectionNote("");
    setReturnInspectionError("");
    setMessage("");
  };

  const closeInspectionModal = () => {
    setInspectionModal(null);
    setReturnCondition("good");
    setReturnInspectionNote("");
    setReturnInspectionError("");
  };

  const submitReturnInspection = async (event) => {
    event.preventDefault();

    if (!inspectionModal) {
      return;
    }

    setReturnSaving(true);
    setActionId(inspectionModal.request.id);
    setReturnInspectionError("");
    setMessage("");

    try {
      await inspectReturnDocument({
        activeCommunity,
        activeCommunityId,
        condition: returnCondition,
        note: returnInspectionNote,
        request: inspectionModal.request,
        user,
      });
      closeInspectionModal();
      setMessage(
        ["good", "minor_wear"].includes(returnCondition)
          ? "Return inspected. Request completed."
          : "Return issue reported."
      );
    } catch (error) {
      setReturnInspectionError(error.message || "Failed to submit inspection.");
    } finally {
      setActionId("");
      setReturnSaving(false);
    }
  };

  const openResolveIssueModal = (request) => {
    setResolveModal({ request });
    setIssueResolutionNote("");
    setMakeItemAvailable(true);
    setMessage("");
  };

  const closeResolveIssueModal = () => {
    setResolveModal(null);
    setIssueResolutionNote("");
    setMakeItemAvailable(true);
  };

  const submitResolveIssue = async (event) => {
    event.preventDefault();

    if (!resolveModal) {
      return;
    }

    setReturnSaving(true);
    setActionId(resolveModal.request.id);
    setMessage("");

    try {
      await resolveReturnIssueDocument({
        activeCommunity,
        activeCommunityId,
        makeItemAvailable,
        note: issueResolutionNote,
        request: resolveModal.request,
        user,
      });
      closeResolveIssueModal();
      setMessage("Return issue resolved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionId("");
      setReturnSaving(false);
    }
  };

  const needsActionRequests = incomingRequests
    .filter(
      (request) =>
        ownerNeedsActionStatuses.includes(request.status) &&
        request.ownerId === user.uid
    )
    .map((request) => ({ direction: "incoming", request }));
  const activeRequests = [
    ...incomingRequests
      .filter(
        (request) =>
          activeBorrowingStatuses.includes(request.status) &&
          request.ownerId === user.uid
      )
      .map((request) => ({ direction: "incoming", request })),
    ...outgoingRequests
      .filter(
        (request) =>
          activeBorrowingStatuses.includes(request.status) &&
          request.borrowerId === user.uid
      )
      .map((request) => ({ direction: "outgoing", request })),
  ];
  const pendingRequests = outgoingRequests
    .filter(
      (request) =>
        pendingBorrowerRequestStatuses.includes(request.status) &&
        request.borrowerId === user.uid
    )
    .map((request) => ({ direction: "outgoing", request }));

  const renderRequestCard = ({ direction, request }) => (
    <RequestCard
      actionId={actionId}
      direction={direction}
      formatCreatedAt={formatCreatedAt}
      getPastTimestamp={() => ""}
      key={`${direction}-${request.id}`}
      onAccept={acceptRequest}
      onConfirmHandover={confirmHandover}
      onConfirmPickup={confirmPickup}
      onEditPickup={openPickupEditor}
      onInspectReturn={openInspectionModal}
      onMarkReturned={markReturned}
      onOpenUserProfile={openUserProfile}
      onReject={rejectRequest}
      onRequestPickupChange={openPickupChangeRequest}
      onResolveIssue={openResolveIssueModal}
      onWithdraw={withdrawRequest}
      request={request}
      trustProfile={
        direction === "incoming"
          ? profileMap[request.borrowerId]
          : profileMap[request.ownerId]
      }
      user={user}
    />
  );

  return (
    <section className="grid gap-6">
      <PageHeader
        eyebrow="🤝 Borrowing workflow"
        meta={
          <div className="grid w-full grid-cols-3 gap-2">
            <MiniStat label="Action" value={needsActionRequests.length} />
            <MiniStat label="Active" value={activeRequests.length} />
            <MiniStat label="Pending" value={pendingRequests.length} />
          </div>
        }
        subtitle={`Track requests, pickup coordination, active borrowing, and return steps in ${activeCommunity}.`}
        title="Requests"
      >
        {message && (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {message}
          </p>
        )}
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
        <RequestSection
          className="bg-emerald-50/50"
          emptyMessage="No urgent actions right now."
          loading={requestsLoading}
          renderRequestCard={renderRequestCard}
          requests={needsActionRequests}
          title="Needs Action"
        />
        <RequestSection
          emptyMessage="No active borrowing records right now."
          loading={requestsLoading}
          renderRequestCard={renderRequestCard}
          requests={activeRequests}
          title="Active Borrowing"
        />
        <RequestSection
          emptyMessage="No pending requests right now."
          loading={requestsLoading}
          renderRequestCard={renderRequestCard}
          requests={pendingRequests}
          title="Pending Requests"
        />
      </div>
      <PickupModal
        modal={pickupModal}
        onClose={closePickupModal}
        onDateChange={setPickupDate}
        onLocationChange={setPickupLocation}
        onNoteChange={setPickupNote}
        onSave={savePickupDetails}
        onChangeMessageChange={setPickupChangeMessage}
        onSubmitChangeRequest={submitPickupChangeRequest}
        onTimeChange={setPickupTime}
        pickupChangeMessage={pickupChangeMessage}
        pickupDate={pickupDate}
        pickupLocation={pickupLocation}
        pickupNote={pickupNote}
        pickupSaving={pickupSaving}
        pickupTime={pickupTime}
      />
      <ReturnInspectionModal
        condition={returnCondition}
        errorMessage={returnInspectionError}
        modal={inspectionModal}
        note={returnInspectionNote}
        onClose={closeInspectionModal}
        onConditionChange={setReturnCondition}
        onNoteChange={setReturnInspectionNote}
        onSubmit={submitReturnInspection}
        saving={returnSaving}
      />
      <ResolveIssueModal
        makeItemAvailable={makeItemAvailable}
        modal={resolveModal}
        note={issueResolutionNote}
        onClose={closeResolveIssueModal}
        onMakeItemAvailableChange={setMakeItemAvailable}
        onNoteChange={setIssueResolutionNote}
        onSubmit={submitResolveIssue}
        saving={returnSaving}
      />
      <PublicProfileModal
        loading={profileLoading}
        onClose={closeUserProfile}
        profile={profile}
      />
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-center shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export default Requests;
