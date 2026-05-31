const sliderClass =
  "w-full accent-emerald-700";

function ImageCropModal({
  crop,
  focalX,
  focalY,
  onApply,
  onCancel,
  onFocalXChange,
  onFocalYChange,
  onZoomChange,
  processing,
  zoom,
}) {
  if (!crop) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div
        className="max-h-[calc(100svh-3rem)] w-full max-w-2xl overflow-auto rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Crop item image
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Images are saved in a fixed 4:3 size so listings stay consistent.
            </p>
          </div>
          <button
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-stone-50"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              alt="Crop preview"
              className="h-full w-full object-cover"
              src={crop.source}
              style={{
                objectPosition: `${focalX}% ${focalY}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${focalX}% ${focalY}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Zoom
            <input
              className={sliderClass}
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Move left / right
            <input
              className={sliderClass}
              type="range"
              min="0"
              max="100"
              value={focalX}
              onChange={(event) => onFocalXChange(Number(event.target.value))}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Move up / down
            <input
              className={sliderClass}
              type="range"
              min="0"
              max="100"
              value={focalY}
              onChange={(event) => onFocalYChange(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            className="rounded-2xl border border-stone-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-stone-50"
            type="button"
            onClick={onCancel}
          >
            Choose another image
          </button>
          <button
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={processing}
            onClick={onApply}
          >
            {processing ? "Saving crop..." : "Use cropped image"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
