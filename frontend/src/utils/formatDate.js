export const formatFirestoreDate = (timestamp, fallback = "") => {
  if (!timestamp?.toDate) {
    return fallback;
  }

  return timestamp.toDate().toLocaleString();
};
