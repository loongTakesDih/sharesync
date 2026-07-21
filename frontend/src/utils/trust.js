export const defaultTrustStats = {
  completedBorrows: 0,
  totalReturnScore: 0,
  excellentReturns: 0,
  goodReturns: 0,
  minorWearReturns: 0,
  returnIssues: 0,
  damagedReturns: 0,
  missingPartReturns: 0,
  notReturnedIssues: 0,
  otherIssues: 0,
};

export const clampRating = (rating) => Math.max(0, Math.min(5, rating));

export const roundRatingToHalf = (rating) => Math.round(rating * 2) / 2;

const conditionRatingWeights = {
  excellentReturns: 5,
  goodReturns: 4,
  minorWearReturns: 3,
  damagedReturns: 1.5,
  missingPartReturns: 1,
  notReturnedIssues: 0,
  otherIssues: 2,
};

const getCount = (value) => {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? count : 0;
};

export const normalizeTrustStats = (trustStats = {}) => {
  const stats = {
    ...defaultTrustStats,
    ...trustStats,
  };
  const conditionCount = Object.keys(conditionRatingWeights).reduce(
    (total, key) => total + getCount(stats[key]),
    0
  );
  const estimatedReturnScore = Object.entries(conditionRatingWeights).reduce(
    (total, [key, score]) => total + getCount(stats[key]) * score,
    0
  );
  const storedReturnScore = Number(trustStats?.totalReturnScore);

  return {
    ...stats,
    completedBorrows: Math.max(
      getCount(trustStats?.completedBorrows),
      conditionCount
    ),
    totalReturnScore:
      trustStats?.totalReturnScore !== undefined &&
      trustStats?.totalReturnScore !== null &&
      trustStats?.totalReturnScore !== "" &&
      Number.isFinite(storedReturnScore) &&
      storedReturnScore >= 0
        ? storedReturnScore
        : estimatedReturnScore,
  };
};

// Mirrors the server-side accumulation in functions/index.js so the frontend can
// rebuild a borrower's trust stats directly from their request records. This keeps
// the profile in sync with what actually exists in Firebase: deleting a borrow
// record removes its contribution, and if a record isn't there it isn't counted.
const trustAdjustments = {
  excellent: { score: 5, statKey: "excellentReturns" },
  good: { score: 4, statKey: "goodReturns" },
  minor_wear: { score: 3, statKey: "minorWearReturns" },
  damaged: { score: 1.5, statKey: "damagedReturns" },
  missing_part: { score: 1, statKey: "missingPartReturns" },
  not_returned_properly: { score: 0, statKey: "notReturnedIssues" },
  other: { score: 2, statKey: "otherIssues" },
};

const trustTargetStatuses = ["completed", "return_issue"];

const issueReturnConditions = [
  "damaged",
  "missing_part",
  "not_returned_properly",
  "other",
];

export const computeTrustStatsFromRequests = (requests = []) => {
  const stats = { ...defaultTrustStats };

  requests.forEach((request) => {
    if (!trustTargetStatuses.includes(request?.status)) {
      return;
    }

    const adjustment = trustAdjustments[request?.returnCondition];

    if (!adjustment) {
      return;
    }

    stats.completedBorrows += 1;
    stats.totalReturnScore += adjustment.score;
    stats[adjustment.statKey] = (stats[adjustment.statKey] || 0) + 1;

    if (issueReturnConditions.includes(request.returnCondition)) {
      stats.returnIssues += 1;
    }
  });

  return stats;
};

export const calculateAggregateTrustRating = (trustStats = {}) => {
  const stats = normalizeTrustStats(trustStats);

  if (stats.completedBorrows === 0) {
    return 3;
  }

  return clampRating(
    roundRatingToHalf(stats.totalReturnScore / stats.completedBorrows)
  );
};

export const convertReputationScoreToRating = (score) => {
  if (score === undefined || score === null || score === "") {
    return 3;
  }

  const numericScore = Number(score);

  if (!Number.isFinite(numericScore)) {
    return 3;
  }

  return clampRating(roundRatingToHalf(numericScore / 20));
};

export const getTrustRating = (profile) => {
  return calculateAggregateTrustRating(profile?.trustStats);
};

export const getBorrowLimitForRating = (rating) => {
  const safeRating = clampRating(Number(rating) || 0);

  if (safeRating <= 1.5) return 1;
  if (safeRating <= 2.5) return 2;
  return null;
};

export const getBorrowLimitMessage = (rating) =>
  Number(rating) <= 1.5
    ? "Your trust rating is low. You can only have 1 active borrow at a time. Complete your current borrow responsibly to rebuild trust."
    : "Your trust rating is still recovering. You can only have 2 active borrows at a time.";

export const formatTrustRating = (rating) =>
  `${clampRating(Number(rating) || 0).toFixed(1)}/5`;

export const renderStars = (rating) => {
  const safeRating = clampRating(Number(rating) || 0);
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return `${"\u2605".repeat(fullStars)}${
    hasHalfStar ? "\u00bd" : ""
  }${"\u2606".repeat(emptyStars)}`;
};

export const getTrustRatingBadgeClass = (rating) => {
  const safeRating = clampRating(Number(rating) || 0);

  if (safeRating >= 4.5) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (safeRating >= 3.5) {
    return "bg-teal-50 text-teal-800 ring-teal-200";
  }

  if (safeRating >= 2.5) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }

  return "bg-red-50 text-red-700 ring-red-200";
};

export const getTrustStats = (profile) =>
  normalizeTrustStats(profile?.trustStats);
