export const defaultTrustStats = {
  completedBorrows: 0,
  goodReturns: 0,
  minorWearReturns: 0,
  returnIssues: 0,
  damagedReturns: 0,
  missingPartReturns: 0,
  notReturnedIssues: 0,
  otherIssues: 0,
};

export const clampTrustScore = (score) => Math.max(0, Math.min(100, score));

export const getTrustScore = (profile) =>
  clampTrustScore(Number(profile?.reputationScore ?? 100));

export const getTrustStats = (profile) => ({
  ...defaultTrustStats,
  ...(profile?.trustStats || {}),
});

export const getTrustLabel = (score) => {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Reliable";
  }

  if (score >= 50) {
    return "Fair";
  }

  if (score >= 25) {
    return "Risky";
  }

  return "Low Trust";
};

export const getTrustBadgeClass = (score) => {
  if (score >= 90) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (score >= 75) {
    return "bg-teal-50 text-teal-800 ring-teal-200";
  }

  if (score >= 50) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }

  return "bg-red-50 text-red-700 ring-red-200";
};
