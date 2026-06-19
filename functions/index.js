const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {setGlobalOptions} = require("firebase-functions");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

initializeApp();
setGlobalOptions({maxInstances: 10});

const db = getFirestore();

const defaultTrustStats = {
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

const trustAdjustments = {
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
};

const targetStatuses = ["completed", "return_issue"];
const issueConditions = [
  "damaged",
  "missing_part",
  "not_returned_properly",
  "other",
];
const conditionScores = {
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

const normalizeTrustStats = (trustStats = {}) => {
  const stats = {...defaultTrustStats, ...trustStats};
  const conditionCount = Object.keys(conditionScores).reduce(
      (total, key) => total + getCount(stats[key]),
      0,
  );
  const estimatedReturnScore = Object.entries(conditionScores).reduce(
      (total, [key, score]) => total + getCount(stats[key]) * score,
      0,
  );
  const storedReturnScore = Number(trustStats.totalReturnScore);

  return {
    ...stats,
    completedBorrows: Math.max(
        getCount(trustStats.completedBorrows),
        conditionCount,
    ),
    totalReturnScore:
      trustStats.totalReturnScore !== undefined &&
      trustStats.totalReturnScore !== null &&
      trustStats.totalReturnScore !== "" &&
      Number.isFinite(storedReturnScore) &&
      storedReturnScore >= 0 ?
        storedReturnScore :
        estimatedReturnScore,
  };
};

const calculateTrustRating = (stats) => {
  if (stats.completedBorrows === 0) return 3;

  const average = stats.totalReturnScore / stats.completedBorrows;
  return Math.max(0, Math.min(5, Math.round(average * 2) / 2));
};

exports.processRequestTrustScore = onDocumentUpdated(
    "requests/{requestId}",
    async (event) => {
      const before = event.data.before.data();
      const after = event.data.after.data();
      const requestRef = event.data.after.ref;
      const requestId = event.params.requestId;

      if (!targetStatuses.includes(after.status)) {
        return;
      }

      if (
        after.trustScoreProcessed === true ||
        after.trustRatingProcessed === true
      ) {
        return;
      }

      const trustRelevantStatusChange = before.status !== after.status;
      const processingFlagChanged =
        before.trustScoreProcessed !== after.trustScoreProcessed;

      if (!trustRelevantStatusChange && !processingFlagChanged) {
        return;
      }

      const adjustment = trustAdjustments[after.returnCondition];

      if (!adjustment) {
        logger.warn("Skipping trust score update: unknown return condition", {
          requestId,
          returnCondition: after.returnCondition,
        });
        return;
      }

      if (!after.borrowerId) {
        logger.warn("Skipping trust score update: missing borrowerId", {
          requestId,
        });
        return;
      }

      const borrowerRef = db.collection("users").doc(after.borrowerId);

      await db.runTransaction(async (transaction) => {
        const freshRequest = await transaction.get(requestRef);
        const freshRequestData = freshRequest.data();

        if (
          !freshRequest.exists ||
          freshRequestData.trustScoreProcessed === true ||
          freshRequestData.trustRatingProcessed === true ||
          !targetStatuses.includes(freshRequestData.status)
        ) {
          return;
        }

        const freshAdjustment =
          trustAdjustments[freshRequestData.returnCondition];

        if (!freshAdjustment) {
          return;
        }

        const borrowerSnapshot = await transaction.get(borrowerRef);
        const borrowerData = borrowerSnapshot.exists ?
          borrowerSnapshot.data() :
          {};
        const currentStats = normalizeTrustStats(borrowerData.trustStats);
        const nextStats = {
          ...currentStats,
          completedBorrows: currentStats.completedBorrows + 1,
          totalReturnScore:
            currentStats.totalReturnScore + freshAdjustment.score,
          [freshAdjustment.statKey]:
            (currentStats[freshAdjustment.statKey] || 0) + 1,
          lastUpdatedAt: FieldValue.serverTimestamp(),
        };

        if (issueConditions.includes(freshRequestData.returnCondition)) {
          nextStats.returnIssues = (currentStats.returnIssues || 0) + 1;
        }

        const nextRating = calculateTrustRating(nextStats);

        transaction.set(
            borrowerRef,
            {
              trustRating: nextRating,
              trustStats: nextStats,
            },
            {merge: true},
        );
        transaction.update(requestRef, {
          trustScoreProcessed: true,
          trustScoreProcessedAt: FieldValue.serverTimestamp(),
          trustScoreDelta: freshAdjustment.score,
          trustRatingProcessed: true,
          trustRatingProcessedAt: FieldValue.serverTimestamp(),
          returnScore: freshAdjustment.score,
        });
      });
    },
);
