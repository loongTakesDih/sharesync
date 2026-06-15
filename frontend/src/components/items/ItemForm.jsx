import { itemCategories } from "../../utils/itemCategories";
import { itemConditions } from "../../utils/itemCondition";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function ItemForm({
  category,
  condition,
  description,
  imageBase64,
  imageProcessing,
  name,
  onCategoryChange,
  onConditionChange,
  onDescriptionChange,
  onImageChange,
  onImageRemove,
  onNameChange,
  onPreferredPickupLocationChange,
  onSubmit,
  preferredPickupLocation,
  saving,
}) {
  return (
    <form className="grid gap-4 md:max-w-2xl" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Item name
        <input
          className={inputClass}
          type="text"
          placeholder="Cordless drill, rice cooker, folding table..."
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Category
        <select
          className={inputClass}
          required
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">Select a category</option>
          {itemCategories.map((itemCategory) => (
            <option key={itemCategory} value={itemCategory}>
              {itemCategory}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Condition
        <select
          className={inputClass}
          value={condition}
          onChange={(event) => onConditionChange(event.target.value)}
        >
          <option value="">Not specified</option>
          {itemConditions.map((itemCondition) => (
            <option key={itemCondition} value={itemCondition}>
              {itemCondition}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Item image
        <input
          className={inputClass}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => onImageChange(event.target.files?.[0])}
        />
        <span className="text-xs font-semibold text-slate-500">
          Optional. If you upload one, you will crop it to the shared 4:3
          listing size before saving.
        </span>
      </label>

      {imageProcessing && (
        <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-stone-200">
          Preparing image...
        </p>
      )}

      {imageBase64 && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <img
            alt="Selected item preview"
            className="h-44 w-full rounded-xl object-cover"
            src={imageBase64}
          />
          <button
            className="mt-3 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-50"
            type="button"
            onClick={onImageRemove}
          >
            Remove image
          </button>
        </div>
      )}

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Description
        <textarea
          className={`${inputClass} min-h-32`}
          placeholder="Add size, what is included, or borrowing notes."
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Preferred pickup location
        <input
          className={inputClass}
          type="text"
          placeholder="Lobby, Block A or Guardhouse"
          value={preferredPickupLocation}
          onChange={(event) =>
            onPreferredPickupLocationChange(event.target.value)
          }
        />
        <span className="text-xs font-semibold text-slate-500">
          Optional. The final pickup details can still be arranged after a
          request is accepted.
        </span>
      </label>

      <button
        className="rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={saving || imageProcessing}
      >
        {saving ? "Listing..." : "List Item"}
      </button>
    </form>
  );
}

export default ItemForm;
