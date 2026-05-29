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
  goodReturns: 0,
  minorWearReturns: 0,
  returnIssues: 0,
  damagedReturns: 0,
  missingPartReturns: 0,
  notReturnedIssues: 0,
  otherIssues: 0,
};

const trustAdjustments = {
  good: {
    completed: true,
    scoreDelta: 3,
    statKey: "goodReturns",
  },
  minor_wear: {
    completed: true,
    scoreDelta: 1,
    statKey: "minorWearReturns",
  },
  damaged: {
    completed: false,
    scoreDelta: -10,
    statKey: "damagedReturns",
  },
  missing_part: {
    completed: false,
    scoreDelta: -15,
    statKey: "missingPartReturns",
  },
  not_returned_properly: {
    completed: false,
    scoreDelta: -20,
    statKey: "notReturnedIssues",
  },
  other: {
    completed: false,
    scoreDelta: -8,
    statKey: "otherIssues",
  },
};

const targetStatuses = ["completed", "return_issue"];

const clampTrustScore = (score) => Math.max(0, Math.min(100, score));

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

      if (after.trustScoreProcessed === true) {
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
        const currentScore = Number(
            borrowerData.reputationScore === undefined ?
              100 :
              borrowerData.reputationScore,
        );
        const currentStats = {
          ...defaultTrustStats,
          ...(borrowerData.trustStats || {}),
        };
        const nextScore = clampTrustScore(
            currentScore + freshAdjustment.scoreDelta,
        );
        const nextStats = {
          ...currentStats,
          [freshAdjustment.statKey]:
            (currentStats[freshAdjustment.statKey] || 0) + 1,
          lastUpdatedAt: FieldValue.serverTimestamp(),
        };

        if (freshAdjustment.completed) {
          nextStats.completedBorrows =
            (currentStats.completedBorrows || 0) + 1;
        } else {
          nextStats.returnIssues = (currentStats.returnIssues || 0) + 1;
        }

        transaction.set(
            borrowerRef,
            {
              reputationScore: nextScore,
              trustStats: nextStats,
            },
            {merge: true},
        );
        transaction.update(requestRef, {
          trustScoreProcessed: true,
          trustScoreProcessedAt: FieldValue.serverTimestamp(),
          trustScoreDelta: freshAdjustment.scoreDelta,
        });
      });
    },
);
