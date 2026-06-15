import {
  getTrustAdjustmentForCondition,
  returnConditionOptions,
} from "../../utils/returnInspection";

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function ReturnInspectionModal({
  condition,
  errorMessage,
  modal,
  note,
  onClose,
  onConditionChange,
  onNoteChange,
  onSubmit,
  saving,
}) {
  if (!modal) {
    return null;
  }

  const adjustment = getTrustAdjustmentForCondition(condition);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <form
        className="max-h-[calc(100svh-3rem)] w-full max-w-xl overflow-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        aria-modal="true"
        onSubmit={onSubmit}
      >
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Return Inspection
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Inspect Returned Item
        </h2>
        <p className="mt-2 leading-7 text-slate-600">
          The borrower marked this item as returned. Check the item condition
          before completing the request.
        </p>
        <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-stone-200">
          {modal.request.itemName}
        </p>

        <div className="mt-6 grid gap-3">
          <p className="text-sm font-bold text-slate-700">Return condition</p>
          {returnConditionOptions.map((option) => (
            <label
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              key={option.value}
            >
              <input
                className="h-4 w-4 border-stone-300 text-emerald-700 focus:ring-emerald-500"
                type="radio"
                name="returnCondition"
                value={option.value}
                checked={condition === option.value}
                onChange={(event) => onConditionChange(event.target.value)}
              />
              {option.label}
            </label>
          ))}
        </div>

        <label className="mt-5 grid gap-2 text-sm font-bold text-slate-700">
          Inspection note
          <textarea
            className={`${inputClass} min-h-28`}
            placeholder="Add a short note about the returned item..."
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>

        {adjustment && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
            Trust rating change: {adjustment.ratingDelta > 0 ? "+" : ""}
            {adjustment.ratingDelta.toFixed(1)}
          </p>
        )}

        {errorMessage && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            {saving ? "Submitting..." : "Submit Inspection"}
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

export default ReturnInspectionModal;
