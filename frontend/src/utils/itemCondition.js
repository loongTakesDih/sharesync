export const itemConditions = [
  "Like New",
  "Good",
  "Lightly Used",
  "Worn",
  "Needs Care",
];

export const getItemConditionLabel = (item) =>
  item?.condition || "Not specified";
