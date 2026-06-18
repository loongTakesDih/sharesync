export const defaultTrustStats = {
  completedBorrows: 0,
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
  goodReturns: 4.5,
  minorWearReturns: 3.5,
  damagedReturns: 2,
  missingPartReturns: 1.5,
  notReturnedIssues: 0.5,
  otherIssues: 2,
};

const getCount = (value) => {
  const count = Number(value);

  return Number.isFinite(count) && count > 0 ? count : 0;
};

export const calculateAggregateTrustRating = (trustStats = {}) => {
  const stats = {
    ...defaultTrustStats,
    ...trustStats,
  };
  const positiveConditionCount =
    getCount(stats.excellentReturns) +
    getCount(stats.goodReturns) +
    getCount(stats.minorWearReturns);
  const issueConditionCount =
    getCount(stats.damagedReturns) +
    getCount(stats.missingPartReturns) +
    getCount(stats.notReturnedIssues) +
    getCount(stats.otherIssues);
  const unclassifiedCompleted = Math.max(
    0,
    getCount(stats.completedBorrows) - positiveConditionCount
  );
  const unclassifiedIssues = Math.max(
    0,
    getCount(stats.returnIssues) - issueConditionCount
  );
  const weightedScore =
    getCount(stats.excellentReturns) * conditionRatingWeights.excellentReturns +
    getCount(stats.goodReturns) * conditionRatingWeights.goodReturns +
    getCount(stats.minorWearReturns) * conditionRatingWeights.minorWearReturns +
    getCount(stats.damagedReturns) * conditionRatingWeights.damagedReturns +
    getCount(stats.missingPartReturns) * conditionRatingWeights.missingPartReturns +
    getCount(stats.notReturnedIssues) *
      conditionRatingWeights.notReturnedIssues +
    getCount(stats.otherIssues) * conditionRatingWeights.otherIssues +
    unclassifiedCompleted * 4 +
    unclassifiedIssues * 1.5;
  const totalRecords =
    positiveConditionCount +
    issueConditionCount +
    unclassifiedCompleted +
    unclassifiedIssues;

  if (totalRecords === 0) {
    return null;
  }

  return clampRating(roundRatingToHalf(weightedScore / totalRecords));
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
  const aggregateRating = calculateAggregateTrustRating(profile?.trustStats);

  if (aggregateRating !== null) {
    return aggregateRating;
  }

  const rating = Number(profile?.trustRating);

  if (
    profile?.trustRating !== undefined &&
    profile?.trustRating !== null &&
    profile?.trustRating !== "" &&
    Number.isFinite(rating)
  ) {
    return clampRating(rating);
  }

  if (
    profile?.reputationScore !== undefined &&
    profile?.reputationScore !== null &&
    profile?.reputationScore !== ""
  ) {
    return convertReputationScoreToRating(profile.reputationScore);
  }

  return 3;
};

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

export const getTrustStats = (profile) => ({
  ...defaultTrustStats,
  ...(profile?.trustStats || {}),
});
