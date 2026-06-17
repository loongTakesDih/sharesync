function StatCard({
  icon,
  label,
  loading = false,
  note,
  tone = "neutral",
  value,
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50"
        : "border-stone-200 bg-white";

  return (
    <article
      className={`animate-slide-up rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/80 text-xl shadow-sm ring-1 ring-stone-200">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">
        {loading ? "..." : value}
      </p>
      {note && (
        <p className="mt-2 text-sm font-semibold text-slate-500">{note}</p>
      )}
    </article>
  );
}

export default StatCard;
