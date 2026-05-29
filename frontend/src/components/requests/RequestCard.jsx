import Badge from "../ui/Badge";
import {
  closedRequestStatuses,
  getBorrowerLabel,
  getOwnerLabel,
  getStatusBadgeClass,
  getStatusBadgeLabel,
  hasPickupDetails,
} from "../../utils/requestStatus";
import { getReturnConditionLabel } from "../../utils/returnInspection";
import { getTrustLabel, getTrustScore, getTrustStats } from "../../utils/trust";

const acceptButtonClass =
  "rounded-2xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
  "rounded-2xl border border-red-200 bg-red-50 px-4 py-2 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60";
const mutedButtonClass =
  "rounded-2xl border border-stone-200 bg-white px-4 py-2 font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60";

function RequestCard({
  actionId,
  direction,
  formatCreatedAt,
  getPastTimestamp,
  onAccept,
  onConfirmHandover,
  onConfirmPickup,
  onEditPickup,
  onInspectReturn,
  onMarkReturned,
  onOpenUserProfile,
  onReject,
  onRequestPickupChange,
  onResolveIssue,
  onWithdraw,
  request,
  trustProfile,
  user,
}) {
  const isIncoming = direction === "incoming";
  const relatedUserLabel = isIncoming
    ? getBorrowerLabel(request)
    : getOwnerLabel(request);
  const relatedUserId = isIncoming ? request.borrowerId : request.ownerId;
  const pastTimestamp = getPastTimestamp(request);
  const trustScore = trustProfile ? getTrustScore(trustProfile) : null;
  const trustStats = trustProfile ? getTrustStats(trustProfile) : null;

  return (
    <article
      className={`flex flex-col gap-5 rounded-3xl border bg-white p-5 shadow-sm transition hover:border-emerald-100 hover:shadow-md md:flex-row md:items-start md:justify-between ${
        closedRequestStatuses.includes(request.status)
          ? "border-stone-200 opacity-80"
          : "border-stone-200"
      }`}
    >
      <div className="min-w-0">
        <h3 className="text-xl font-black text-slate-950">{request.itemName}</h3>
        <Badge
          className={`mt-3 ${getStatusBadgeClass(request.status)}`}
        >
          {getStatusBadgeLabel(request.status)}
        </Badge>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
          <span>{isIncoming ? "Borrower:" : "Owner:"}</span>
          <button
            className="font-bold text-emerald-800 underline-offset-4 hover:underline"
            type="button"
            onClick={() =>
              onOpenUserProfile?.(relatedUserId, {
                username: relatedUserLabel,
              })
            }
          >
            {relatedUserLabel}
          </button>
        </div>
        {isIncoming && request.status === "pending" && trustProfile && (
          <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-sm font-bold text-slate-700">
              Trust Score: {trustScore} - {getTrustLabel(trustScore)}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Completed Borrows: {trustStats.completedBorrows}
            </p>
            {trustScore < 50 && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-100">
                This borrower has a low trust score. Review carefully before
                accepting.
              </p>
            )}
          </div>
        )}
        {(request.status === "pending" ||
          closedRequestStatuses.includes(request.status)) && (
          <small className="mt-1 block text-sm text-slate-500">
            {pastTimestamp
              ? `Updated: ${pastTimestamp}`
              : `Created: ${formatCreatedAt(request.createdAt)}`}
          </small>
        )}
        {request.itemDeletedReason && (
          <small className="mt-1 block text-sm text-slate-500">
            This item was deleted by the owner.
          </small>
        )}
        {request.status === "approved" &&
          isIncoming &&
          renderPickupSummary(request)}
        {request.status === "approved" && !isIncoming && (
          <small className="mt-2 block text-sm text-slate-500">
            Waiting for owner to set pickup details.
          </small>
        )}
        {request.status === "pickup_scheduled" && renderPickupSummary(request)}
        {request.status === "pickup_change_requested" && (
          <small className="mt-2 block rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-100">
            Requested change: {request.pickupChangeMessage || "No message provided."}
          </small>
        )}
        {request.status === "pickup_confirmed" && (
          <>
            {renderPickupSummary(request)}
            <small className="mt-2 block text-sm text-slate-500">
              Waiting for owner to confirm handover.
            </small>
          </>
        )}
        {request.status === "borrowed" && isIncoming && (
          <small className="mt-2 block text-sm text-slate-500">
            Waiting for borrower to return item.
          </small>
        )}
        {request.status === "return_pending" && !isIncoming && (
          <small className="mt-2 block text-sm text-slate-500">
            Waiting for the owner to inspect and confirm the returned item.
          </small>
        )}
        {request.status === "return_pending" && isIncoming && (
          <small className="mt-2 block text-sm text-slate-500">
            The borrower marked this item as returned. Inspect it before
            completing the return.
          </small>
        )}
        {request.status === "return_issue" && (
          <div className="mt-2 grid gap-2 rounded-2xl bg-red-50 px-3 py-3 text-sm text-red-900 ring-1 ring-red-100">
            <p className="font-bold">
              Issue:{" "}
              {getReturnConditionLabel(
                request.returnIssueType || request.returnCondition
              )}
            </p>
            <p>
              {request.returnIssueNote ||
                request.returnInspectionNote ||
                "No issue note provided."}
            </p>
            <p className="text-xs font-semibold text-red-700">
              {isIncoming
                ? "Resolve it when the item situation is settled."
                : "The owner reported an issue with this return."}
            </p>
          </div>
        )}
        {request.status === "completed" && (
          <small className="mt-2 block text-sm text-slate-500">
            This borrowing record is completed.
          </small>
        )}
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
                onClick={() => onAccept(request)}
              >
                {actionId === request.id ? "Working..." : "Accept"}
              </button>
              <button
                className={dangerButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => onReject(request)}
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
              onClick={() => onWithdraw(request)}
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
              onClick={() => onEditPickup(request)}
            >
              {hasPickupDetails(request)
                ? "Edit Pickup Details"
                : "Set Pickup Details"}
            </button>
            )}

          {request.status === "pickup_scheduled" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <button
                className={mutedButtonClass}
                type="button"
                onClick={() => onEditPickup(request)}
              >
                Edit Pickup Details
              </button>
            )}

          {request.status === "pickup_scheduled" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <div className="flex flex-wrap gap-2">
                <button
                  className={acceptButtonClass}
                  disabled={actionId === request.id}
                  type="button"
                  onClick={() => onConfirmPickup(request)}
                >
                  {actionId === request.id ? "Working..." : "Confirm Pickup"}
                </button>
                <button
                  className={mutedButtonClass}
                  disabled={actionId === request.id}
                  type="button"
                  onClick={() => onRequestPickupChange(request)}
                >
                  Request Different Time
                </button>
              </div>
            )}

          {request.status === "pickup_change_requested" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <button
                className={mutedButtonClass}
                type="button"
                onClick={() => onEditPickup(request)}
              >
                Update Pickup Details
              </button>
            )}

          {request.status === "pickup_confirmed" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <button
                className={acceptButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => onConfirmHandover(request)}
              >
                {actionId === request.id
                  ? "Working..."
                  : "Confirm Item Handed Over"}
              </button>
            )}

          {request.status === "borrowed" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <button
                className={acceptButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => onMarkReturned(request)}
              >
                {actionId === request.id ? "Working..." : "Mark as Returned"}
              </button>
            )}

          {request.status === "return_pending" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <button
                className={acceptButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => onInspectReturn(request)}
              >
                {actionId === request.id ? "Working..." : "Inspect Return"}
              </button>
            )}

          {request.status === "return_issue" &&
            isIncoming &&
            request.ownerId === user.uid && (
              <button
                className={dangerButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => onResolveIssue(request)}
              >
                {actionId === request.id ? "Working..." : "Resolve Issue"}
              </button>
            )}

      </div>
    </article>
  );
}

function renderPickupSummary(request) {
  if (!hasPickupDetails(request)) {
    return (
      <small className="mt-2 block text-sm font-medium text-slate-500">
        Pickup details not set.
      </small>
    );
  }

  return (
    <small className="mt-2 block rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 ring-1 ring-emerald-100">
      Pickup: {request.pickupDate} at {request.pickupTime} -{" "}
      {request.pickupLocation}
      {request.pickupNote ? ` (${request.pickupNote})` : ""}
    </small>
  );
}

export default RequestCard;
