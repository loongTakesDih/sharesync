export const returnConditionOptions = [
  { label: "Excellent condition", score: 5, value: "excellent" },
  { label: "Good condition", score: 4, value: "good" },
  { label: "Minor wear", score: 3, value: "minor_wear" },
  { label: "Other issue", score: 2, value: "other" },
  { label: "Damaged", score: 1.5, value: "damaged" },
  { label: "Missing part", score: 1, value: "missing_part" },
  {
    label: "Not returned properly",
    score: 0,
    value: "not_returned_properly",
  },
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
      score: 5,
      statKey: "excellentReturns",
    },
    good: {
      score: 4,
      statKey: "goodReturns",
    },
    minor_wear: {
      score: 3,
      statKey: "minorWearReturns",
    },
    damaged: {
      score: 1.5,
      statKey: "damagedReturns",
    },
    missing_part: {
      score: 1,
      statKey: "missingPartReturns",
    },
    not_returned_properly: {
      score: 0,
      statKey: "notReturnedIssues",
    },
    other: {
      score: 2,
      statKey: "otherIssues",
    },
  }[condition]);
