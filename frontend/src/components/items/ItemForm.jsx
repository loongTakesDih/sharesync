import { itemCategories } from "../../utils/itemCategories";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

function ItemForm({
  category,
  description,
  name,
  onCategoryChange,
  onDescriptionChange,
  onNameChange,
  onSubmit,
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
        Description
        <textarea
          className={`${inputClass} min-h-32`}
          placeholder="Add condition, size, what is included, or pickup notes."
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </label>

      <button
        className="rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={saving}
      >
        {saving ? "Listing..." : "List Item"}
      </button>
    </form>
  );
}

export default ItemForm;
