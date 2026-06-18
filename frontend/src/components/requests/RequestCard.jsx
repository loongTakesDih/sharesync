import Badge from "../ui/Badge";
import {
  activeBorrowingStatuses,
  closedRequestStatuses,
  getBorrowerLabel,
  getOwnerLabel,
  getStatusBadgeClass,
  hasPickupDetails,
  pendingBorrowerRequestStatuses,
} from "../../utils/requestStatus";
import { getReturnConditionLabel } from "../../utils/returnInspection";
import {
  formatTrustRating,
  getTrustRating,
  getTrustStats,
  renderStars,
} from "../../utils/trust";

const acceptButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2 text-center text-sm font-bold leading-5 text-white shadow-sm transition-all duration-200 hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-center text-sm font-bold leading-5 text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const mutedButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 py-2 text-center text-sm font-bold leading-5 text-slate-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

function RequestCard({
  actionId,
  direction,
  formatCreatedAt,
  getPastTimestamp,
  hasUnreadChat = false,
  onAccept,
  onConfirmHandover,
  onConfirmPickup,
  onEditPickup,
  onOpenChat,
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
  const trustRating = trustProfile ? getTrustRating(trustProfile) : null;
  const trustStats = trustProfile ? getTrustStats(trustProfile) : null;
  const statusBadgeLabel = getRequestCardStatusLabel(request, isIncoming);

  return (
    <article
      className={`grid min-w-0 gap-5 rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md ${
        closedRequestStatuses.includes(request.status)
          ? "border-stone-200 opacity-80"
          : hasUnreadChat
            ? "border-emerald-300 ring-2 ring-emerald-100"
          : "border-stone-200"
      }`}
    >
      <div className="min-w-0">
        {hasUnreadChat && (
          <span className="mb-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
            New chat {"\u{1F4AC}"}
          </span>
        )}
        <h3 className="break-words text-lg font-black leading-6 text-slate-950">
          {request.itemName}
        </h3>
        <Badge
          className={`mt-3 max-w-full whitespace-normal text-left leading-5 ${getStatusBadgeClass(request.status)}`}
        >
          {statusBadgeLabel}
        </Badge>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-slate-600">
          <span className="shrink-0">{isIncoming ? "Borrower:" : "Owner:"}</span>
          <button
            className="min-w-0 break-words text-left font-bold text-emerald-800 underline-offset-4 hover:underline"
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
              Trust Rating: {renderStars(trustRating)}{" "}
              {formatTrustRating(trustRating)}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Completed Borrows: {trustStats.completedBorrows}
            </p>
            {trustRating < 2.5 && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-100">
                This borrower has a low trust rating. Review carefully before
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
        {request.status === "approved" && isIncoming && (
          <small className="mt-2 block text-sm text-slate-500">
            Set pickup details for the borrower.
          </small>
        )}
        {request.status === "approved" && !isIncoming && (
          <small className="mt-2 block text-sm text-slate-500">
            Your request is still pending while the owner sets pickup details.
          </small>
        )}
        {request.status === "pickup_scheduled" && (
          <>
            {renderPickupSummary(request)}
            <small className="mt-2 block text-sm text-slate-500">
              {isIncoming
                ? "Waiting for the borrower to confirm these pickup details."
                : "Review the pickup details, then confirm or request a different time."}
            </small>
          </>
        )}
        {request.status === "pickup_change_requested" && (
          <>
            {renderPickupSummary(request)}
            <small className="mt-2 block rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-100">
              {isIncoming
                ? `Requested change: ${
                    request.pickupChangeMessage || "No message provided."
                  }`
                : "You requested a different pickup time. Waiting for the owner to update the details."}
            </small>
          </>
        )}
        {request.status === "pickup_confirmed" && (
          <>
            {renderPickupSummary(request)}
            <small className="mt-2 block text-sm text-slate-500">
              {isIncoming
                ? "The borrower confirmed the pickup details. Confirm handover once the item is handed over."
                : "Pickup confirmed. Waiting for the owner to confirm item handover."}
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

      <div className="grid w-full gap-3">
        {request.status === "pending" &&
          isIncoming &&
          request.ownerId === user.uid && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                className={acceptButtonClass}
                disabled={actionId === request.id}
                type="button"
                onClick={() => onAccept(request)}
              >
                {actionId === request.id ? "Working..." : "Approve & Set Pickup"}
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
          !isIncoming &&
          request.borrowerId === user.uid && (
            <button className={mutedButtonClass} disabled type="button">
              Waiting for Pickup Details
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
                disabled
                type="button"
              >
                Waiting Borrower Confirmation
              </button>
            )}

          {request.status === "pickup_scheduled" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className={acceptButtonClass}
                  disabled={actionId === request.id}
                  type="button"
                  onClick={() => onConfirmPickup(request)}
                >
                  {actionId === request.id ? "Working..." : "OK"}
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

          {request.status === "pickup_change_requested" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <button className={mutedButtonClass} disabled type="button">
                Waiting Owner Update
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

          {request.status === "pickup_confirmed" &&
            !isIncoming &&
            request.borrowerId === user.uid && (
              <button className={mutedButtonClass} disabled type="button">
                Waiting Handover
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

        <button
          className={mutedButtonClass}
          type="button"
          onClick={() => onOpenChat?.(request)}
        >
          Open Chat
        </button>
      </div>
    </article>
  );
}

function getRequestCardStatusLabel(request, isIncoming) {
  if (!isIncoming && pendingBorrowerRequestStatuses.includes(request.status)) {
    return "Pending Request";
  }

  if (activeBorrowingStatuses.includes(request.status)) {
    return "Active Borrowing";
  }

  if (!isIncoming) {
    return {
      rejected: "Request Rejected",
      withdrawn: "Withdrawn",
      item_deleted: "Item No Longer Available",
      completed: "Completed",
    }[request.status] || request.status || "Pending Request";
  }

  return (
    {
      pending: "Needs Approval",
      approved: "Set Pickup Details",
      pickup_scheduled: "Waiting Borrower",
      pickup_change_requested: "Pickup Change Requested",
      pickup_confirmed: "Ready for Handover",
      rejected: "Request Rejected",
      withdrawn: "Withdrawn",
      item_deleted: "Item No Longer Available",
      completed: "Completed",
    }[request.status] ||
    request.status ||
    "Needs Approval"
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
