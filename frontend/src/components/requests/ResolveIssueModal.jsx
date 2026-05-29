const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function ResolveIssueModal({
  makeItemAvailable,
  modal,
  note,
  onClose,
  onMakeItemAvailableChange,
  onNoteChange,
  onSubmit,
  saving,
}) {
  if (!modal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <form
        className="max-h-[calc(100svh-3rem)] w-full max-w-xl overflow-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        onSubmit={onSubmit}
      >
        <p className="text-sm font-bold uppercase tracking-wide text-red-700">
          Return Issue
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Resolve Issue
        </h2>
        <p className="mt-2 leading-7 text-slate-600">
          Mark this return issue as settled once the item situation is clear.
        </p>
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800 ring-1 ring-red-100">
          {modal.request.itemName}
        </p>

        <label className="mt-6 grid gap-2 text-sm font-bold text-slate-700">
          Resolution note
          <textarea
            className={`${inputClass} min-h-28`}
            placeholder="Explain how this issue was resolved..."
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>

        <label className="mt-5 flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-stone-200">
          <input
            className="h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
            type="checkbox"
            checked={makeItemAvailable}
            onChange={(event) =>
              onMakeItemAvailableChange(event.target.checked)
            }
          />
          Make item available again
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            {saving ? "Resolving..." : "Resolve Issue"}
          </button>
          <button
            className="rounded-2xl border border-stone-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-stone-50"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ResolveIssueModal;
