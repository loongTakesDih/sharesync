export const returnConditionOptions = [
  { label: "Excellent condition", value: "excellent" },
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
    excellent: {
      ratingDelta: 2,
      statKey: "excellentReturns",
      completed: true,
    },
    good: {
      ratingDelta: 1.5,
      statKey: "goodReturns",
      completed: true,
    },
    minor_wear: {
      ratingDelta: 0.5,
      statKey: "minorWearReturns",
      completed: true,
    },
    damaged: {
      ratingDelta: -1,
      statKey: "damagedReturns",
      completed: false,
    },
    missing_part: {
      ratingDelta: -1.5,
      statKey: "missingPartReturns",
      completed: false,
    },
    not_returned_properly: {
      ratingDelta: -2,
      statKey: "notReturnedIssues",
      completed: false,
    },
    other: {
      ratingDelta: -0.5,
      statKey: "otherIssues",
      completed: false,
    },
  }[condition]);
