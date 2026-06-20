import { useState } from "react";
import { saveItemReview } from "../../services/reviewService";

function ItemReviewModal({ existingReview, onClose, onSaved, request, user, userProfile }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!request) {
    return null;
  }

  const submitReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const review = await saveItemReview({
        comment,
        rating,
        request,
        user,
        userProfile,
      });

      onSaved(review);
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <form
        className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl"
        onSubmit={submitReview}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Borrower item review
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {existingReview ? "Edit review" : "Rate item"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {request.itemName}
            </p>
          </div>
          <button
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-stone-50"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-black text-slate-700">Your rating</legend>
          <div className="mt-3 flex gap-2" aria-label="Item rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl transition hover:scale-105 ${
                  star <= rating
                    ? "bg-amber-100 text-amber-600 ring-1 ring-amber-200"
                    : "bg-stone-50 text-stone-300 ring-1 ring-stone-200"
                }`}
                key={star}
                type="button"
                onClick={() => setRating(star)}
              >
                {"\u2605"}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 grid gap-2 text-sm font-black text-slate-700">
          Comment <span className="font-semibold text-slate-400">(optional)</span>
          <textarea
            className="min-h-28 resize-y rounded-2xl border border-stone-200 px-4 py-3 font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            maxLength={300}
            placeholder="What should other neighbors know about this item?"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <span className="text-right text-xs font-semibold text-slate-400">
            {comment.length}/300
          </span>
        </label>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <button
          className="mt-5 w-full rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || rating === 0}
          type="submit"
        >
          {saving ? "Saving review..." : existingReview ? "Update Review" : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

export default ItemReviewModal;
