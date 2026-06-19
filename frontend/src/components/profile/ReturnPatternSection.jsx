import SectionCard from "../ui/SectionCard";
import {
  getConditionPercentage,
  getMostCommonOutcomes,
  getReturnConditionCounts,
} from "../../utils/returnPattern";

function ReturnPatternSection({ trustStats }) {
  const conditions = getReturnConditionCounts(trustStats);
  const common = getMostCommonOutcomes(conditions);

  return (
    <SectionCard
      className="flex h-full flex-col xl:col-span-8"
      contentClassName="flex-1"
      subtitle="A clear view of the outcomes behind this profile's return history."
      title={`${"\u2728"} Return Pattern`}
    >
      <div className="grid h-full items-stretch gap-5 xl:grid-cols-[minmax(17rem,0.9fr)_minmax(0,1.1fr)]">
        <OutcomeSpotlight common={common} />
        <ConditionSpectrum
          completedBorrows={trustStats.completedBorrows}
          conditions={conditions}
        />
      </div>
    </SectionCard>
  );
}

function OutcomeSpotlight({ common }) {
  const isEmpty = common.outcomes.length === 0;
  const isSingle = common.outcomes.length === 1;
  const primary = common.outcomes[0];
  const animationType = isSingle
    ? primary.animationType
    : isEmpty
      ? "empty"
      : "mixed";
  const surface = isSingle
    ? primary.surface
    : isEmpty
      ? "from-stone-50 via-white to-emerald-50"
      : "from-violet-50 via-white to-amber-50";
  const title = isEmpty
    ? "No return history yet"
    : isSingle
      ? primary.label
      : "Tied Most Common Outcomes";
  const description = isEmpty
    ? "Return patterns will appear after completed borrows."
    : isSingle
      ? primary.description
      : "Several return outcomes are currently tied. Future completed returns will make this pattern clearer.";

  return (
    <article
      className={`return-pattern-spotlight outcome-theme-${animationType} animate-slide-up relative flex min-h-80 flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br ${isSingle ? primary.border : "border-white/80"} ${surface} p-6 shadow-lg shadow-slate-950/5 ring-1 ring-stone-100 xl:h-full xl:min-h-0`}
    >
      <OutcomeMotion type={animationType} />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Outcome Spotlight
            </p>
            <p className="mt-2 text-xs font-bold text-slate-500">
              {isEmpty ? "Waiting for return data" : "Leading return pattern"}
            </p>
          </div>
          <span
            className={`outcome-theme-icon outcome-theme-icon-${animationType} grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/80 text-2xl shadow-sm ring-1 ring-white`}
            aria-hidden="true"
          >
            {isSingle ? primary.icon : isEmpty ? "\u{1F4CB}" : "\u{1F3AF}"}
          </span>
        </div>

        <h3 className="mt-7 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {description}
        </p>

        {!isEmpty && !isSingle && (
          <div className="mt-5 flex flex-wrap gap-2">
            {common.outcomes.slice(0, 4).map((outcome) => (
              <OutcomeChip key={outcome.key} outcome={outcome} />
            ))}
            {common.outcomes.length > 4 && (
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black text-white shadow-sm">
                +{common.outcomes.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-8 flex items-end justify-between gap-4 border-t border-white/80 pt-5">
        <div>
          <p className="text-5xl font-black text-slate-950">
            {isEmpty ? 0 : common.highestCount}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            {isEmpty ? "Recorded outcomes" : "Returns at this frequency"}
          </p>
        </div>
        <p className="max-w-40 text-right text-xs font-semibold leading-5 text-slate-500">
          Return care patterns update after every completed inspection.
        </p>
      </div>
    </article>
  );
}

function OutcomeMotion({ type }) {
  return (
    <div
      className={`outcome-motion outcome-motion-${type} pointer-events-none absolute inset-0 overflow-hidden`}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  );
}

function OutcomeChip({ outcome }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm ring-1 ring-stone-200 transition hover:-translate-y-0.5">
      <span aria-hidden="true">{outcome.icon}</span>
      {outcome.label} ({outcome.count})
    </span>
  );
}

function ConditionSpectrum({ completedBorrows, conditions }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/80 bg-white/85 p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Condition Spectrum
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            Return history at a glance
          </h3>
        </div>
        <span className="rounded-full bg-stone-50 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-stone-200">
          {completedBorrows} completed
        </span>
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-between gap-3">
        {conditions.map((condition, index) => {
          const percentage = getConditionPercentage(
            condition.count,
            completedBorrows
          );

          return (
            <div
              className="animate-slide-up rounded-2xl p-3 transition hover:bg-stone-50/80"
              key={condition.key}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-base shadow-sm ring-1 ring-stone-200"
                    aria-hidden="true"
                  >
                    {condition.icon}
                  </span>
                  <span className="truncate text-sm font-black text-slate-800">
                    {condition.label}
                  </span>
                </div>
                <span className={`text-sm font-black ${condition.text}`}>
                  {condition.count}
                </span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200">
                <div
                  aria-label={`${condition.label}: ${condition.count}, ${Math.round(percentage)} percent of completed borrows`}
                  className={`return-pattern-bar h-full rounded-full bg-gradient-to-r ${condition.gradient}`}
                  role="img"
                  style={{
                    animationDelay: `${120 + index * 70}ms`,
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 border-t border-stone-200 pt-4 text-xs font-semibold leading-5 text-slate-500">
        Return patterns are based on completed borrow inspections.
      </p>
    </article>
  );
}

export function CompactOutcomeSummary({ trustStats }) {
  const common = getMostCommonOutcomes(getReturnConditionCounts(trustStats));
  const isEmpty = common.outcomes.length === 0;
  const isSingle = common.outcomes.length === 1;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-50 p-4 ring-1 ring-stone-200">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
        Return Pattern
      </p>
      <p className="mt-2 font-black text-slate-950">
        {isEmpty
          ? "No return history yet"
          : isSingle
            ? common.outcomes[0].label
            : common.outcomes.length > 4
              ? "Mixed return history"
              : "Tied most common outcomes"}
      </p>
      {isEmpty ? (
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          Return patterns will appear after completed borrows.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {common.outcomes.slice(0, 4).map((outcome) => (
            <OutcomeChip key={outcome.key} outcome={outcome} />
          ))}
          {common.outcomes.length > 4 && (
            <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
              +{common.outcomes.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ReturnPatternSection;
