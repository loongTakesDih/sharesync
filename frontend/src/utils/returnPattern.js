export const returnConditionDefinitions = [
  {
    animationType: "excellent",
    border: "border-amber-200/80",
    description:
      "Outstanding return quality. Keep every item this well cared for.",
    gradient: "from-amber-400 to-emerald-500",
    icon: "\u2728",
    key: "excellentReturns",
    label: "Excellent Condition",
    surface: "from-amber-50 via-white to-emerald-50",
    text: "text-emerald-800",
  },
  {
    animationType: "good",
    border: "border-emerald-200/80",
    description:
      "Reliable return quality. Small care habits keep trust strong.",
    gradient: "from-emerald-400 to-teal-500",
    icon: "\u2705",
    key: "goodReturns",
    label: "Good Condition",
    surface: "from-emerald-50 via-white to-teal-50",
    text: "text-emerald-800",
  },
  {
    animationType: "minor-wear",
    border: "border-sky-200/80",
    description:
      "Light wear recorded. Extra care helps keep shared items lasting longer.",
    gradient: "from-sky-400 to-slate-500",
    icon: "\u{1F4A7}",
    key: "minorWearReturns",
    label: "Minor Wear",
    surface: "from-sky-50 via-white to-slate-50",
    text: "text-sky-800",
  },
  {
    animationType: "other-issue",
    border: "border-violet-200/80",
    description:
      "An unusual return issue was recorded. Pay closer attention to item care and return details..",
    gradient: "from-violet-400 to-amber-500",
    icon: "\u{1F50E}",
    key: "otherIssues",
    label: "Other Issue",
    surface: "from-violet-50 via-white to-amber-50",
    text: "text-violet-800",
  },
  {
    animationType: "damaged",
    border: "border-orange-200/80",
    description:
      "Damage was recorded. Careful handling is needed before future returns.",
    gradient: "from-orange-400 to-red-500",
    icon: "\u{1F6E0}\uFE0F",
    key: "damagedReturns",
    label: "Damaged",
    surface: "from-orange-50 via-white to-red-50",
    text: "text-red-800",
  },
  {
    animationType: "missing-part",
    border: "border-amber-300/80",
    description:
      "Missing parts were recorded. Check all pieces before returning an item.",
    gradient: "from-amber-400 to-rose-500",
    icon: "\u{1F9E9}",
    key: "missingPartReturns",
    label: "Missing Part",
    surface: "from-amber-50 via-white to-rose-50",
    text: "text-amber-900",
  },
  {
    animationType: "not-returned",
    border: "border-red-300/70",
    description:
      "Return process was incomplete. Follow pickup and return expectations clearly.",
    gradient: "from-red-500 to-slate-800",
    icon: "\u26A0\uFE0F",
    key: "notReturnedIssues",
    label: "Not Returned Properly",
    surface: "from-red-50 via-white to-slate-100",
    text: "text-red-800",
  },
];

const getSafeCount = (value) => {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? count : 0;
};

export const getReturnConditionCounts = (trustStats = {}) =>
  returnConditionDefinitions.map((condition) => ({
    ...condition,
    count: getSafeCount(trustStats[condition.key]),
  }));

export const getMostCommonOutcomes = (conditionCounts) => {
  const highestCount = Math.max(
    0,
    ...conditionCounts.map((condition) => condition.count)
  );

  return {
    highestCount,
    outcomes:
      highestCount === 0
        ? []
        : conditionCounts.filter(
            (condition) => condition.count === highestCount
          ),
  };
};

export const getConditionPercentage = (count, completedBorrows) => {
  const total = getSafeCount(completedBorrows);

  if (total === 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (getSafeCount(count) / total) * 100));
};
