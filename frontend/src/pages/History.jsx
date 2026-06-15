import { useMemo } from "react";
import PublicProfileModal from "../components/profile/PublicProfileModal";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { usePublicProfileModal } from "../hooks/usePublicProfileModal";
import { useRequests } from "../hooks/useRequests";
import { formatFirestoreDate } from "../utils/formatDate";
import { getItemCategoryLabel } from "../utils/itemCategories";
import { getReturnConditionLabel } from "../utils/returnInspection";
import {
  closedRequestStatuses,
  getBorrowerLabel,
  getOwnerLabel,
  getStatusBadgeClass,
  getStatusBadgeLabel,
} from "../utils/requestStatus";

function getClosedTimestamp(request) {
  if (request.status === "completed") {
    return request.completedAt || request.issueResolvedAt || request.returnInspectedAt;
  }

  if (request.status === "withdrawn") {
    return request.withdrawnAt;
  }

  if (request.status === "rejected") {
    return request.rejectedAt;
  }

  if (request.status === "item_deleted") {
    return request.itemDeletedAt;
  }

  return request.createdAt;
}

function getClosedDateLabel(request) {
  const date = formatFirestoreDate(getClosedTimestamp(request), "Not recorded");

  if (request.status === "completed") {
    return { label: "Completed", value: date };
  }

  if (request.status === "withdrawn") {
    return { label: "Withdrawn", value: date };
  }

  if (request.status === "rejected") {
    return { label: "Rejected", value: date };
  }

  if (request.status === "item_deleted") {
    return { label: "Item deleted", value: date };
  }

  return { label: "Updated", value: date };
}

function getRoleLabel(direction, request) {
  if (request.status === "rejected") {
    return "Request rejected";
  }

  if (request.status === "withdrawn") {
    return "Request withdrawn";
  }

  if (request.status === "item_deleted") {
    return "Item no longer available";
  }

  return direction === "incoming" ? "You lent this item" : "You borrowed this item";
}

function getTimestampMillis(timestamp) {
  return timestamp?.toDate ? timestamp.toDate().getTime() : 0;
}

function History({ activeCommunity, user }) {
  const {
    closeUserProfile,
    openUserProfile,
    profile,
    profileLoading,
  } = usePublicProfileModal();
  const { incomingRequests, outgoingRequests, requestsLoading } = useRequests({
    activeCommunity,
    user,
  });

  const history = useMemo(() => {
    const historyMap = new Map();

    [...incomingRequests, ...outgoingRequests]
      .filter((request) => closedRequestStatuses.includes(request.status))
      .forEach((request) => {
        const direction = request.ownerId === user.uid ? "incoming" : "outgoing";
        historyMap.set(request.id, { direction, request });
      });

    return Array.from(historyMap.values()).sort(
      (first, second) =>
        getTimestampMillis(getClosedTimestamp(second.request)) -
        getTimestampMillis(getClosedTimestamp(first.request))
    );
  }, [incomingRequests, outgoingRequests, user.uid]);

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Profile Tools
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">
              History
            </h1>
            <p className="mt-2 text-slate-600">
              Completed and closed sharing records in{" "}
              <span className="font-bold text-emerald-800">
                {activeCommunity}
              </span>
              .
            </p>
          </div>
          <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-slate-600">
            {history.length} record{history.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {requestsLoading && (
        <p className="rounded-3xl border border-stone-200 bg-white p-6 text-slate-600 shadow-sm">
          Loading history...
        </p>
      )}

      {!requestsLoading && history.length === 0 && (
        <EmptyState>No closed records yet.</EmptyState>
      )}

      {!requestsLoading && history.length > 0 && (
        <div className="grid gap-5">
          {history.map(({ direction, request }) => (
            <HistoryCard
              direction={direction}
              key={`${direction}-${request.id}`}
              onOpenUserProfile={openUserProfile}
              request={request}
            />
          ))}
        </div>
      )}

      <PublicProfileModal
        loading={profileLoading}
        onClose={closeUserProfile}
        profile={profile}
      />
    </section>
  );
}

function HistoryCard({ direction, onOpenUserProfile, request }) {
  const ownerLabel = getOwnerLabel(request);
  const borrowerLabel = getBorrowerLabel(request);
  const closedDate = getClosedDateLabel(request);
  const categoryLabel = getItemCategoryLabel({
    category: request.itemCategory,
  });
  const returnCondition = request.returnCondition || request.returnIssueType;
  const hasReturnDetails =
    returnCondition ||
    request.returnInspectionNote ||
    request.trustRatingDelta !== undefined ||
    request.trustScoreDelta !== undefined ||
    request.issueResolutionNote;

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:border-emerald-100 hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-[12rem_1fr]">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100 md:aspect-auto">
          {request.itemImageBase64 ? (
            <img
              alt={request.itemName}
              className="absolute inset-0 h-full w-full object-contain"
              src={request.itemImageBase64}
            />
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 text-2xl font-black text-emerald-800 shadow-sm">
                {(request.itemName || "?").slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                {getRoleLabel(direction, request)}
              </p>
              <h2 className="mt-1 line-clamp-2 text-2xl font-black tracking-tight text-slate-950">
                {request.itemName || "Deleted item"}
              </h2>
            </div>
            <Badge className={`${getStatusBadgeClass(request.status)} shrink-0`}>
              {getStatusBadgeLabel(request.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-800 ring-1 ring-amber-100">
              {categoryLabel}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 font-bold text-slate-600">
              {request.community}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="Owner">
              <ProfileButton
                label={ownerLabel}
                onClick={() =>
                  onOpenUserProfile(request.ownerId, {
                    username: ownerLabel,
                  })
                }
              />
            </Info>
            <Info label="Borrower">
              <ProfileButton
                label={borrowerLabel}
                onClick={() =>
                  onOpenUserProfile(request.borrowerId, {
                    username: borrowerLabel,
                  })
                }
              />
            </Info>
            <Info label="Created">
              {formatFirestoreDate(request.createdAt, "Not recorded")}
            </Info>
            <Info label={closedDate.label}>{closedDate.value}</Info>
          </div>

          {hasReturnDetails && (
            <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-sm font-black text-slate-950">
                Return Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {returnCondition && (
                  <Info label="Return condition">
                    {getReturnConditionLabel(returnCondition)}
                  </Info>
                )}
                {request.trustRatingDelta !== undefined && (
                  <Info label="Trust rating delta">
                    {Number(request.trustRatingDelta) > 0 ? "+" : ""}
                    {Number(request.trustRatingDelta).toFixed(1)}
                  </Info>
                )}
                {request.trustRatingDelta === undefined &&
                  request.trustScoreDelta !== undefined && (
                  <Info label="Legacy trust score delta">
                    {Number(request.trustScoreDelta) > 0 ? "+" : ""}
                    {request.trustScoreDelta}
                  </Info>
                )}
                {request.returnInspectionNote && (
                  <Info label="Inspection note">
                    {request.returnInspectionNote}
                  </Info>
                )}
                {request.issueResolutionNote && (
                  <Info label="Issue resolution">
                    {request.issueResolutionNote}
                  </Info>
                )}
              </div>
            </div>
          )}

          {request.rejectionReason && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 ring-1 ring-red-100">
              {request.rejectionReason}
            </p>
          )}
          {request.itemDeletedReason && (
            <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-stone-200">
              This item was deleted by the owner.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function Info({ children, label }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-stone-200">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-1 break-words font-bold text-slate-800">{children}</div>
    </div>
  );
}

function ProfileButton({ label, onClick }) {
  return (
    <button
      className="break-words text-left font-black text-emerald-800 underline-offset-4 hover:underline"
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default History;
