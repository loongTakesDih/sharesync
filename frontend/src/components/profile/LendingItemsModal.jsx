import EmptyState from "../ui/EmptyState";

// Generic popup that lists a set of items grouped by the community they belong
// to. Used from the profile's Lending Activity cards to break the counts down
// across every community the user is involved in.
function LendingItemsModal({ emptyLabel, entries = [], onClose, subtitle, title }) {
  const groups = groupByCommunity(entries);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-2xl overflow-auto rounded-2xl border border-stone-200 bg-[#f8f6f1] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          <button
            className="shrink-0 rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:p-6">
          {entries.length === 0 && (
            <EmptyState>{emptyLabel || "Nothing to show yet."}</EmptyState>
          )}

          {groups.map((group) => (
            <section className="grid gap-3" key={group.label}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-wide text-emerald-700">
                  {"\u{1F3D8}️"} {group.label}
                </h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-stone-200">
                  {group.items.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((entry) => (
                  <article
                    className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm"
                    key={entry.id}
                  >
                    {entry.image ? (
                      <img
                        alt={entry.name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        src={entry.image}
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-100 text-sm font-black text-emerald-800">
                        {(entry.name || "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">
                        {entry.name}
                      </p>
                      {entry.meta && (
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                          {entry.meta}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupByCommunity(entries) {
  const map = new Map();

  entries.forEach((entry) => {
    const label = entry.communityLabel || "Community not set";

    if (!map.has(label)) {
      map.set(label, { items: [], label });
    }

    map.get(label).items.push(entry);
  });

  return [...map.values()];
}

export default LendingItemsModal;
