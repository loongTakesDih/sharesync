import { formatRelativeTime } from "../../utils/relativeTime";

function ItemCard({
  actions,
  item,
  onOpenDetail,
  onOpenUserProfile,
  onToggleSaved,
  saved = false,
  savingSaved = false,
  showAvailability = true,
  showDescription = false,
  user,
}) {
  const isOwnItem = item.ownerId === user?.uid;
  const ownerLabel = item.ownerUsername || "Neighbor";
  const categoryLabel = item.category || "Uncategorized";
  const canOpenDetail = Boolean(onOpenDetail);
  const hasFooterLeadingContent = showAvailability || Boolean(actions);
  const availableAge = formatRelativeTime(item.availableSince || item.createdAt);
  const canSave = Boolean(onToggleSaved) && !isOwnItem;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_40px_rgba(15,23,42,0.07)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg">
      <div
        className={`block w-full flex-1 text-left ${
          canOpenDetail ? "cursor-pointer" : ""
        }`}
        role={canOpenDetail ? "button" : undefined}
        tabIndex={canOpenDetail ? 0 : undefined}
        onClick={() => onOpenDetail?.(item)}
        onKeyDown={(event) => {
          if (canOpenDetail && (event.key === "Enter" || event.key === " ")) {
            onOpenDetail?.(item);
          }
        }}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
          <div className="absolute right-4 top-4 z-10">
            {isOwnItem ? (
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-emerald-800 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
                Yours
              </span>
            ) : (
              canSave && (
                <button
                  aria-label={saved ? "Remove from saved items" : "Save item"}
                  className={
                    saved
                      ? "grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-lg font-black text-rose-600 shadow-md ring-1 ring-rose-100 backdrop-blur transition hover:scale-105"
                      : "grid h-10 w-10 place-items-center rounded-full bg-white/95 text-lg font-black text-slate-500 shadow-md ring-1 ring-white/70 backdrop-blur transition hover:scale-105 hover:text-rose-600"
                  }
                  disabled={savingSaved}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleSaved(item);
                  }}
                >
                  {saved ? "♥" : "♡"}
                </button>
              )
            )}
          </div>
          {item.imageBase64 && (
            <img
              alt={item.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              src={item.imageBase64}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
          <div className="flex h-full items-end justify-between">
            <div className="relative z-10 p-4">
              {!item.imageBase64 && (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 text-2xl font-black text-emerald-800 shadow-md ring-1 ring-white/60">
                  {(item.name || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-lg font-black text-slate-950">
              {item.name}
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              {availableAge}
            </p>
            {Number(item.itemReviewCount) > 0 && (
              <p className="mt-2 text-sm font-black text-amber-700">
                {item.itemReviewCount}{" "}
                {Number(item.itemReviewCount) === 1 ? "rating" : "ratings"}
              </p>
            )}
            {showDescription && (
              <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                {item.description || "No description provided."}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-800 shadow-sm ring-1 ring-amber-100">
              {categoryLabel}
            </span>
            <button
              className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-100"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenUserProfile?.(item.ownerId, {
                  photoURL: item.ownerPhotoURL || "",
                  username: ownerLabel,
                });
              }}
            >
              {ownerLabel}
            </button>
          </div>
        </div>
      </div>

      {hasFooterLeadingContent && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100/80 bg-gradient-to-r from-white to-stone-50/80 px-5 py-4">
          {showAvailability && (
            <strong
              className={
                item.available
                  ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200"
                  : "inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-stone-200"
              }
            >
              {item.available ? "Available" : "Unavailable"}
            </strong>
          )}

          {actions}
        </div>
      )}
    </article>
  );
}

export default ItemCard;
