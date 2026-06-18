const getDate = (value) => {
  if (!value) {
    return null;
  }

  if (value.toDate) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
};

export const formatRelativeTime = (value, fallback = "recently") => {
  const date = getDate(value);

  if (!date) {
    return fallback;
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60 * 1000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / (60 * 1000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months} mo ago`;
  }

  const years = Math.floor(months / 12);

  return `${years} yr${years === 1 ? "" : "s"} ago`;
};
