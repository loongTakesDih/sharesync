import { getItemCategoryLabel } from "../../utils/itemCategories";

function ItemCard({
  actions,
  item,
  onOpenDetail,
  onOpenUserProfile,
  onRequest,
  requested,
  requesting,
  showDescription = false,
  user,
}) {
  const isOwnItem = item.ownerId === user.uid;
  const ownerLabel = item.ownerUsername || item.ownerEmail || item.ownerId;
  const categoryLabel = getItemCategoryLabel(item);
  const requestDisabled = !item.available || requested || requesting;
  const canOpenDetail = Boolean(onOpenDetail);
  let requestLabel = "Request";

  if (requested) {
    requestLabel = "Requested";
  } else if (requesting) {
    requestLabel = "Requesting...";
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
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
        <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100">
          {item.imageBase64 && (
            <img
              alt={item.name}
              className="absolute inset-0 h-full w-full object-contain"
              src={item.imageBase64}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
          <div className="flex h-full items-end justify-between">
            <div className="relative z-10 p-4">
              {!item.imageBase64 && (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 text-2xl font-black text-emerald-800 shadow-sm">
                  {(item.name || "?").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {isOwnItem && (
              <span className="relative z-10 m-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                Yours
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3 p-5">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-lg font-black text-slate-950">
              {item.name}
            </h3>
            {showDescription && (
              <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                {item.description || "No description provided."}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-800 ring-1 ring-amber-100">
              {categoryLabel}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 font-bold text-slate-600">
              {item.community}
            </span>
            <button
              className="rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800 transition hover:bg-emerald-100"
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-5 py-4">
        <strong
          className={
            item.available
              ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200"
              : "inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-stone-200"
          }
        >
          {item.available ? "Available" : "Unavailable"}
        </strong>

        {actions}

        {!isOwnItem && (
          <button
            className="rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-500"
            type="button"
            disabled={requestDisabled}
            onClick={() => onRequest(item)}
          >
            {requestLabel}
          </button>
        )}
      </div>
    </article>
  );
}

export default ItemCard;
