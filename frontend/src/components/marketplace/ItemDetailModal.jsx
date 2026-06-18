import { useEffect, useState } from "react";
import Badge from "../ui/Badge";
import TrustRatingMark from "../profile/TrustRatingMark";
import { fetchUserProfile } from "../../services/userService";
import { formatFirestoreDate } from "../../utils/formatDate";
import { getItemCategoryLabel } from "../../utils/itemCategories";
import { getItemConditionLabel } from "../../utils/itemCondition";
import { getTrustRating, getTrustStats } from "../../utils/trust";

const DetailRow = ({ label, value }) => (
  <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-bold text-slate-900">{value}</dd>
  </div>
);

function SimilarListingCard({ item, onOpenDetail }) {
  return (
    <button
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
      type="button"
      onClick={() => onOpenDetail(item)}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
        {item.imageBase64 ? (
          <img
            alt={item.name}
            className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            src={item.imageBase64}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-xl font-black text-emerald-800 shadow-sm">
              {(item.name || "?").slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="grid gap-1 p-3">
        <h4 className="line-clamp-1 text-sm font-black text-slate-950">
          {item.name}
        </h4>
        <p className="line-clamp-1 text-xs font-bold text-slate-500">
          {getItemCategoryLabel(item)}
        </p>
      </div>
    </button>
  );
}

function ItemDetailModal({
  item,
  items = [],
  onClose,
  onOpenDetail,
  onOpenUserProfile,
  onRequest,
  ownerActions,
  ownerStatus,
  requested,
  requesting,
  user,
}) {
  const [ownerProfileState, setOwnerProfileState] = useState({
    ownerId: "",
    profile: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!item?.ownerId) {
      return undefined;
    }

    fetchUserProfile(item.ownerId)
      .then((profile) => {
        if (!cancelled) {
          setOwnerProfileState({
            ownerId: item.ownerId,
            profile,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOwnerProfileState({
            ownerId: item.ownerId,
            profile: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [item?.ownerId]);

  if (!item) {
    return null;
  }

  const isOwnItem = item.ownerId === user?.uid;
  const ownerProfile =
    ownerProfileState.ownerId === item.ownerId ? ownerProfileState.profile : null;
  const ownerLabel = item.ownerUsername || "ShareSync user";
  const categoryLabel = getItemCategoryLabel(item);
  const conditionLabel = getItemConditionLabel(item);
  const ownerTrustRating = ownerProfile ? getTrustRating(ownerProfile) : null;
  const ownerTrustStats = ownerProfile ? getTrustStats(ownerProfile) : null;
  const listedDate = formatFirestoreDate(item.createdAt, "Not listed");
  const preferredPickupLocation =
    item.preferredPickupLocation || "To be arranged";
  const canRequest =
    Boolean(user) &&
    !isOwnItem &&
    item.available &&
    !requested &&
    !requesting &&
    Boolean(onRequest);
  const similarListings = items
    .filter(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.available &&
        candidate.category === item.category &&
        (!item.community || candidate.community === item.community)
    )
    .slice(0, 4);

  let requestLabel = "Request to Borrow";
  let helperText =
    "Pickup details can be arranged after the owner accepts your request.";

  if (!user) {
    requestLabel = "Login to request";
    helperText = "Log in to send a borrowing request for this item.";
  } else if (isOwnItem) {
    requestLabel = "This is your item";
    helperText = "Manage this listing from My Items.";
  } else if (!item.available) {
    requestLabel = "Currently unavailable";
    helperText = "This item is not available for new requests right now.";
  } else if (requested) {
    requestLabel = "Request already sent";
    helperText = "You already have an active request for this item.";
  } else if (requesting) {
    requestLabel = "Sending request...";
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-[1500px] overflow-auto rounded-2xl border border-stone-200 bg-[#f8f6f1] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Item Details
            </p>
            <h2 className="line-clamp-1 text-xl font-black text-slate-950">
              {item.name}
            </h2>
          </div>
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <div className="grid gap-5">
            <div className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
                <div className="relative min-h-80 bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100 xl:min-h-[34rem]">
                  {item.imageBase64 ? (
                    <img
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      src={item.imageBase64}
                    />
                  ) : (
                    <div className="flex h-full min-h-80 items-center justify-center">
                      <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white/85 text-4xl font-black text-emerald-800 shadow-sm ring-1 ring-white">
                        {(item.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-5 p-5 sm:p-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                      {item.community || "Community"}
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                      {item.name}
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="bg-amber-50 text-amber-800 ring-amber-100">
                        {categoryLabel}
                      </Badge>
                      <Badge className="bg-teal-50 text-teal-800 ring-teal-100">
                        {conditionLabel}
                      </Badge>
                      <Badge
                        className={
                          item.available
                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                            : "bg-stone-100 text-slate-600 ring-stone-200"
                        }
                      >
                        {item.available ? "✅ Available" : "⚠️ Unavailable"}
                      </Badge>
                    </div>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <DetailRow label="👤 Listed by" value={ownerLabel} />
                    <DetailRow label="Listed date" value={listedDate} />
                    <DetailRow label="🏘️ Community" value={item.community || "-"} />
                    <DetailRow
                      label="📍 Preferred pickup"
                      value={preferredPickupLocation}
                    />
                  </dl>

                  <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                    <h4 className="text-sm font-black uppercase tracking-wide text-slate-500">
                    ✨ Description
                    </h4>
                    <p className="mt-2 max-w-prose whitespace-pre-wrap leading-7 text-slate-700">
                      {item.description || "No description provided."}
                    </p>
                  </section>
                </div>
              </div>
            </div>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                👤 Meet the Owner
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    {ownerLabel}
                  </h3>
                  {ownerTrustRating !== null && (
                    <TrustRatingMark
                      className="mt-1"
                      rating={ownerTrustRating}
                      size="sm"
                    />
                  )}
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    ShareSync community member
                  </p>
                  {ownerTrustStats && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      🤝 Completed borrows: {ownerTrustStats.completedBorrows}
                    </p>
                  )}
                </div>
                <button
                  className="self-start rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                  type="button"
                  onClick={() =>
                    onOpenUserProfile?.(item.ownerId, {
                      photoURL: item.ownerPhotoURL || "",
                      trustRating: ownerProfile?.trustRating,
                      trustStats: ownerProfile?.trustStats,
                      username: ownerLabel,
                    })
                  }
                >
                  View Profile
                </button>
              </div>
            </section>

            {similarListings.length > 0 && (
              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                      ✨ Similar listings
                    </p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">
                      More in {categoryLabel}
                    </h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {similarListings.map((similarItem) => (
                    <SimilarListingCard
                      item={similarItem}
                      key={similarItem.id}
                      onOpenDetail={onOpenDetail}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                {isOwnItem ? "Listing management" : "Borrowing"}
              </p>
              {ownerStatus || (
                <Badge
                  className={
                    item.available
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                      : "bg-stone-100 text-slate-600 ring-stone-200"
                  }
                >
                  {item.available ? "✅ Available" : "⚠️ Unavailable"}
                </Badge>
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {helperText}
            </p>
            {isOwnItem && ownerActions ? (
              <div className="mt-5 grid gap-3">{ownerActions}</div>
            ) : (
              <button
                className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-500 disabled:hover:scale-100"
                type="button"
                disabled={!canRequest}
                onClick={() => onRequest(item)}
              >
                {requestLabel}
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal;
