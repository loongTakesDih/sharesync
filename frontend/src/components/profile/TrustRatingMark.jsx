function TrustRatingMark({ className = "", rating, size = "md" }) {
  const numericRating = Number(rating);
  const displayRating = Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : "3.0";
  const sizeClass =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-lg"
        : "text-2xl";
  const starClass =
    size === "lg"
      ? "text-3xl sm:text-4xl"
      : size === "sm"
        ? "text-base"
        : "text-xl";
  const weightClass = size === "lg" ? "font-black" : "font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-2 ${weightClass} tracking-tight text-slate-950 ${sizeClass} ${className}`}
    >
      <span>
        {displayRating}
        <span>/5</span>
      </span>
      <span className={`trust-rating-star ${starClass}`} aria-hidden="true">
        {"\u2605"}
      </span>
    </span>
  );
}

export default TrustRatingMark;
