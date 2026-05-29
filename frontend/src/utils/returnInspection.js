export const returnConditionOptions = [
  { label: "Good condition", value: "good" },
  { label: "Minor wear", value: "minor_wear" },
  { label: "Damaged", value: "damaged" },
  { label: "Missing part", value: "missing_part" },
  { label: "Not returned properly", value: "not_returned_properly" },
  { label: "Other", value: "other" },
];

export const returnIssueConditions = [
  "damaged",
  "missing_part",
  "not_returned_properly",
  "other",
];

export const getReturnConditionLabel = (condition) =>
  returnConditionOptions.find((option) => option.value === condition)?.label ||
  "Return issue";

export const getTrustAdjustmentForCondition = (condition) =>
  ({
    good: {
      scoreDelta: 3,
      statKey: "goodReturns",
      completed: true,
    },
    minor_wear: {
      scoreDelta: 1,
      statKey: "minorWearReturns",
      completed: true,
    },
    damaged: {
      scoreDelta: -10,
      statKey: "damagedReturns",
      completed: false,
    },
    missing_part: {
      scoreDelta: -15,
      statKey: "missingPartReturns",
      completed: false,
    },
    not_returned_properly: {
      scoreDelta: -20,
      statKey: "notReturnedIssues",
      completed: false,
    },
    other: {
      scoreDelta: -8,
      statKey: "otherIssues",
      completed: false,
    },
  }[condition]);
