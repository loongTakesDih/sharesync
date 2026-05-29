import EmptyState from "../ui/EmptyState";

function RequestSection({
  className = "",
  emptyMessage,
  loading,
  renderRequestCard,
  requests,
  title,
}) {
  return (
    <section
      className={`rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-slate-700">
          {requests.length}
        </span>
      </div>
      <div className="mt-5 grid gap-4">
        {loading && <p className="text-slate-600">Loading requests...</p>}
        {!loading && requests.length === 0 && (
          <EmptyState>{emptyMessage}</EmptyState>
        )}
        {!loading && requests.map(renderRequestCard)}
      </div>
    </section>
  );
}

export default RequestSection;
