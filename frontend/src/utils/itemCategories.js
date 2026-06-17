export const itemCategories = [
  "Tools",
  "Books",
  "Kitchen",
  "Electronics",
  "Sports",
  "Household",
  "Other",
];

export const itemCategoryEmojiMap = {
  Tools: "🛠️",
  Books: "📚",
  Kitchen: "🍳",
  Electronics: "🔌",
  Sports: "🏀",
  Household: "🧺",
  Other: "✨",
};

export const getItemCategoryEmoji = (category) =>
  itemCategoryEmojiMap[category] || "✨";

export const getItemCategoryLabel = (item) => {
  const category = item.category || "Uncategorized";

  return `${getItemCategoryEmoji(category)} ${category}`;
};

export const isValidItemCategory = (category) =>
  itemCategories.includes(category);
