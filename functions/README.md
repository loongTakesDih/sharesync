# ShareSync Cloud Functions

Cloud Functions are planned for the production trust-score pipeline, but they
are not currently deployed because the Firebase project is on the Spark plan.

For the FYP prototype, return inspection updates trust score fields from the
frontend with a `trustScoreProcessed` guard. When the project upgrades to Blaze,
move that logic back to the Firestore trigger in `index.js` and tighten client
rules so users cannot write trust fields directly.
