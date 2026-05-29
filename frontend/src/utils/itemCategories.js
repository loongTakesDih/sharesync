export const itemCategories = [
  "Tools",
  "Books",
  "Kitchen",
  "Electronics",
  "Sports",
  "Household",
  "Other",
];

export const getItemCategoryLabel = (item) => item.category || "Uncategorized";

export const isValidItemCategory = (category) =>
  itemCategories.includes(category);
