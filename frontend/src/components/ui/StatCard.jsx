function StatCard({ label, loading = false, note, tone = "neutral", value }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50"
        : "border-stone-200 bg-white";

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
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
