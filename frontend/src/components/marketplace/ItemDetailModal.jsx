import Badge from "../ui/Badge";
import { getItemCategoryLabel } from "../../utils/itemCategories";

function ItemDetailModal({
  item,
  onClose,
  onOpenUserProfile,
  onRequest,
  requested,
  requesting,
  user,
}) {
  if (!item) {
    return null;
  }

  const isOwnItem = item.ownerId === user.uid;
  const ownerLabel = item.ownerUsername || item.ownerEmail || item.ownerId;
  const categoryLabel = getItemCategoryLabel(item);
  const requestDisabled = isOwnItem || !item.available || requested || requesting;
  let helperText = "Send a request to borrow this item from your neighbor.";
  let requestLabel = "Request Item";

  if (isOwnItem) {
    helperText = "This is your listing.";
  } else if (!item.available) {
    helperText = "This item is not available right now.";
  } else if (requested) {
    helperText = "You already have a pending request for this item.";
    requestLabel = "Requested";
  } else if (requesting) {
    requestLabel = "Requesting...";
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-2xl overflow-auto rounded-3xl border border-stone-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="h-48 bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100 p-6">
          <div className="flex h-full items-end justify-between">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/85 text-3xl font-black text-emerald-800 shadow-sm ring-1 ring-white">
              {(item.name || "?").slice(0, 2).toUpperCase()}
            </div>
            <Badge
              className={
                item.available
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-stone-100 text-slate-600 ring-stone-200"
              }
            >
              {item.available ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                {item.community}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {item.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800 ring-1 ring-amber-100">
                  {categoryLabel}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-slate-600 ring-1 ring-stone-200">
                  {item.community}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Listed by{" "}
                <button
                  className="font-bold text-emerald-800 underline-offset-4 hover:underline"
                  type="button"
                  onClick={() =>
                    onOpenUserProfile?.(item.ownerId, {
                      photoURL: item.ownerPhotoURL || "",
                      username: ownerLabel,
                    })
                  }
                >
                  {ownerLabel}
                </button>
              </p>
            </div>
            <button
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-stone-50"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 leading-7 text-slate-700">
            {item.description || "No description provided."}
          </p>

          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-emerald-950">{helperText}</p>
            {!isOwnItem && (
              <button
                className="rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-500"
                type="button"
                disabled={requestDisabled}
                onClick={() => onRequest(item)}
              >
                {requestLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal;
