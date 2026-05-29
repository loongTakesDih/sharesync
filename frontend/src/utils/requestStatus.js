export const hasPickupDetails = (request) =>
  request.pickupLocation && request.pickupDate && request.pickupTime;

export const closedRequestStatuses = [
  "rejected",
  "withdrawn",
  "item_deleted",
  "completed",
];

export const activeBorrowingStatuses = [
  "approved",
  "pickup_scheduled",
  "pickup_confirmed",
  "borrowed",
  "return_pending",
];

export const getStatusBadgeLabel = (status) =>
  ({
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    item_deleted: "Item No Longer Available",
    pickup_scheduled: "Pickup Scheduled",
    pickup_change_requested: "Pickup Change Requested",
    pickup_confirmed: "Pickup Confirmed",
    borrowed: "Borrowed",
    return_pending: "Return Pending",
    return_issue: "Return Issue",
    completed: "Completed",
  }[status] ||
  status ||
  "Pending");

export const getStatusBadgeClass = (status) =>
  ({
    pending: "bg-amber-50 text-amber-800 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    pickup_scheduled: "bg-teal-50 text-teal-800 ring-teal-200",
    pickup_change_requested: "bg-amber-50 text-amber-800 ring-amber-200",
    pickup_confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    borrowed: "bg-sky-50 text-sky-800 ring-sky-200",
    return_pending: "bg-amber-50 text-amber-800 ring-amber-200",
    return_issue: "bg-red-50 text-red-700 ring-red-200",
    completed: "bg-stone-100 text-slate-700 ring-stone-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    withdrawn: "bg-stone-100 text-slate-600 ring-stone-200",
    item_deleted: "bg-stone-100 text-slate-600 ring-stone-200",
  }[status || "pending"] || "bg-stone-100 text-slate-600 ring-stone-200");

export const getOwnerLabel = (request) =>
  request.ownerUsername || request.ownerEmail || request.ownerId;

export const getBorrowerLabel = (request) =>
  request.borrowerUsername || request.borrowerEmail || request.borrowerId;
