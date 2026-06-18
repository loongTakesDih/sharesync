import { clampRating } from "./trust";

export const trustBadgeTiers = {
  1: {
    accent: "text-red-100",
    description: "This profile has a risky return history. Borrowing trust is still being rebuilt.",
    emblem: "\u26A0\uFE0F",
    glow: "shadow-red-950/25",
    ring: "ring-red-300/60",
    surface: "from-red-950 via-red-800 to-slate-950",
    title: "Red Flag",
  },
  2: {
    accent: "text-orange-950",
    description: "This profile needs more consistent care before trust feels stable.",
    emblem: "\u{1F525}",
    glow: "shadow-orange-900/20",
    ring: "ring-orange-300/70",
    surface: "from-orange-300 via-amber-500 to-orange-800",
    title: "Warning Mark",
  },
  3: {
    accent: "text-slate-950",
    description: "This profile is building a steady sharing record in the community.",
    emblem: "\u{1F6E1}\uFE0F",
    glow: "shadow-slate-700/15",
    ring: "ring-slate-300/80",
    surface: "from-slate-100 via-sky-200 to-violet-200",
    title: "Steady Neighbor",
  },
  4: {
    accent: "text-emerald-950",
    description: "This profile has a strong history of responsible returns.",
    emblem: "\u2728",
    glow: "shadow-emerald-900/20",
    ring: "ring-emerald-300/80",
    surface: "from-teal-200 via-emerald-300 to-cyan-400",
    title: "Community Keeper",
  },
  5: {
    accent: "text-amber-950",
    description: "This profile is one of the community's most trusted sharers.",
    emblem: "\u{1F451}",
    glow: "shadow-amber-900/25",
    ring: "ring-amber-300/90",
    surface: "from-amber-200 via-yellow-300 to-emerald-300",
    title: "Golden Guardian",
  },
};

export const getTrustBadgeTier = (trustRating) => {
  const rating = clampRating(Number(trustRating) || 0);

  if (rating <= 1) {
    return { id: 1, ...trustBadgeTiers[1] };
  }

  if (rating <= 2) {
    return { id: 2, ...trustBadgeTiers[2] };
  }

  if (rating <= 3) {
    return { id: 3, ...trustBadgeTiers[3] };
  }

  if (rating <= 4) {
    return { id: 4, ...trustBadgeTiers[4] };
  }

  return { id: 5, ...trustBadgeTiers[5] };
};
