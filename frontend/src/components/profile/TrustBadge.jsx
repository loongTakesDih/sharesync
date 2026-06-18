import { getTrustBadgeTier } from "../../utils/trustBadge";

function TrustBadge({ className = "", rating, size = "md" }) {
  const badge = getTrustBadgeTier(rating);
  const isLarge = size === "lg";
  const isSmall = size === "sm";
  const shellClass = isLarge
    ? "min-h-20 px-4 py-3"
    : isSmall
      ? "min-h-11 px-2.5 py-2"
      : "min-h-14 px-3 py-2.5";
  const iconClass = isLarge
    ? "h-12 w-12 text-2xl"
    : isSmall
      ? "h-8 w-8 text-base"
      : "h-10 w-10 text-xl";
  const titleClass = isLarge
    ? "text-sm"
    : isSmall
      ? "text-[0.68rem]"
      : "text-xs";

  return (
    <div
      className={`group relative inline-flex max-w-full items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-br ${badge.surface} ${badge.accent} ${shellClass} shadow-xl ${badge.glow} ring-2 ${badge.ring} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl ${className}`}
      title={badge.title}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.75),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.28),transparent_45%)]" />
      <span className="pointer-events-none absolute -bottom-6 -right-5 h-16 w-16 rounded-full bg-white/20 blur-xl" />
      <span
        className={`relative grid shrink-0 place-items-center rounded-2xl bg-white/45 shadow-inner ring-1 ring-white/55 ${iconClass}`}
        aria-hidden="true"
      >
        {badge.emblem}
      </span>
      <span className="relative min-w-0">
        <span className={`block font-black uppercase tracking-wide ${titleClass}`}>
          {badge.title}
        </span>
      </span>
    </div>
  );
}

export default TrustBadge;
