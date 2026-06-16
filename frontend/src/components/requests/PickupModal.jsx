import { getBorrowerLabel, getOwnerLabel, hasPickupDetails } from "../../utils/requestStatus";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
const acceptButtonClass =
  "rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60";
const mutedButtonClass =
  "rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60";

function PickupModal({
  modal,
  onClose,
  onDateChange,
  onLocationChange,
  onNoteChange,
  onSave,
  onTimeChange,
  onChangeMessageChange,
  onSubmitChangeRequest,
  pickupChangeMessage,
  pickupDate,
  pickupLocation,
  pickupNote,
  pickupSaving,
  pickupTime,
}) {
  if (!modal) {
    return null;
  }

  const listedPickupLocation = modal.request.preferredPickupLocation?.trim();
  const lockPickupLocation = modal.mode === "edit" && Boolean(listedPickupLocation);
  const pickupLocationClass = lockPickupLocation
    ? `${inputClass} cursor-not-allowed bg-stone-100 text-slate-500`
    : inputClass;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-xl overflow-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        {modal.mode === "change" ? (
          <form className="grid gap-5" onSubmit={onSubmitChangeRequest}>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Request Different Time
              </h3>
              <p className="mt-1 text-slate-600">{modal.request.itemName}</p>
              <small className="mt-2 block text-sm font-medium text-slate-500">
                Owner: {getOwnerLabel(modal.request)}
              </small>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Message for the owner
              <textarea
                className={inputClass}
                placeholder="Example: Could we meet one hour later?"
                value={pickupChangeMessage}
                onChange={(event) => onChangeMessageChange(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className={acceptButtonClass}
                disabled={pickupSaving}
                type="submit"
              >
                {pickupSaving ? "Sending..." : "Send Request"}
              </button>
              <button
                className={mutedButtonClass}
                type="button"
                onClick={onClose}
                disabled={pickupSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : modal.mode === "edit" ? (
          <form className="grid gap-5" onSubmit={onSave}>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {hasPickupDetails(modal.request)
                  ? "Edit Pickup Details"
                  : "Set Pickup Details"}
              </h3>
              <p className="mt-1 text-slate-600">{modal.request.itemName}</p>
              <small className="mt-2 block text-sm font-medium text-slate-500">
                Borrower: {getBorrowerLabel(modal.request)}
              </small>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Pickup Location
              <input
                className={pickupLocationClass}
                type="text"
                value={pickupLocation}
                readOnly={lockPickupLocation}
                aria-readonly={lockPickupLocation}
                onChange={(event) => onLocationChange(event.target.value)}
              />
              {lockPickupLocation && (
                <span className="text-xs font-semibold text-slate-500">
                  Uses the pickup location specified in the item listing.
                </span>
              )}
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Pickup Date
              <input
                className={inputClass}
                type="date"
                value={pickupDate}
                onChange={(event) => onDateChange(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Pickup Time
              <input
                className={inputClass}
                type="time"
                value={pickupTime}
                onChange={(event) => onTimeChange(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Pickup Note
              <textarea
                className={inputClass}
                value={pickupNote}
                onChange={(event) => onNoteChange(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className={acceptButtonClass}
                disabled={pickupSaving}
                type="submit"
              >
                {pickupSaving ? "Saving..." : "Save Details"}
              </button>
              <button
                className={mutedButtonClass}
                type="button"
                onClick={onClose}
                disabled={pickupSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Pickup Details
              </h3>
              <p className="mt-1 text-slate-600">{modal.request.itemName}</p>
              <small className="mt-2 block text-sm font-medium text-slate-500">
                Owner: {getOwnerLabel(modal.request)}
              </small>
            </div>

            {hasPickupDetails(modal.request) ? (
              <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-slate-700">
                <p>
                  <strong>Location:</strong> {modal.request.pickupLocation}
                </p>
                <p>
                  <strong>Date:</strong> {modal.request.pickupDate}
                </p>
                <p>
                  <strong>Time:</strong> {modal.request.pickupTime}
                </p>
                {modal.request.pickupNote && (
                  <p>
                    <strong>Note:</strong> {modal.request.pickupNote}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-slate-600">
                Pickup details have not been set by the owner yet. Please check
                again later.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button className={mutedButtonClass} type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PickupModal;
