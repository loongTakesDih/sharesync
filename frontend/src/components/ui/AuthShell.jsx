const orbitItems = [
  {
    className: "left-1/2 top-0 -translate-x-1/2 bg-emerald-100 text-emerald-800",
    icon: "\u{1F4E6}",
  },
  {
    className: "right-0 top-1/2 -translate-y-1/2 bg-amber-100 text-amber-800",
    icon: "\u{1F6E0}\uFE0F",
  },
  {
    className:
      "bottom-0 left-1/2 -translate-x-1/2 bg-sky-100 text-sky-800",
    icon: "\u{1F4DA}",
  },
  {
    className: "left-0 top-1/2 -translate-y-1/2 bg-violet-100 text-violet-800",
    icon: "\u{1F91D}",
  },
];

const floatingItems = [
  {
    className: "left-[8%] top-[14%] bg-orange-100 text-orange-800",
    icon: "\u{1F373}",
  },
  {
    className: "right-[11%] top-[18%] bg-teal-100 text-teal-800",
    icon: "\u{1F50C}",
  },
  {
    className: "left-[16%] bottom-[18%] bg-lime-100 text-lime-800",
    icon: "\u{1F9FA}",
  },
  {
    className: "right-[17%] bottom-[16%] bg-sky-100 text-sky-800",
    icon: "\u{1F3C0}",
  },
  {
    className: "left-[45%] top-[10%] bg-rose-100 text-rose-800",
    icon: "\u{1F4AC}",
  },
];

const miniCards = [
  {
    text: `${"\u{1F6E0}\uFE0F"} Drill available nearby`,
  },
  {
    text: `${"\u{1F4DA}"} Books shared today`,
  },
  {
    text: `${"\u{1F91D}"} Pickup arranged`,
  },
  {
    text: `${"\u{2B50}"} Trusted returns`,
  },
];

function AuthShell({ children, subtitle, title }) {
  return (
    <div className="sharesync-auth-atmosphere relative min-h-screen overflow-hidden px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="sharesync-auth-dots pointer-events-none absolute inset-0" />
      <div className="animate-gradient-shift pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.42),rgba(236,253,245,0.2),rgba(255,247,237,0.32),rgba(240,249,255,0.26))]" />

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(26rem,0.9fr)]">
        <section className="relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-white/60 bg-white/35 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:min-h-[28rem] sm:p-8 lg:min-h-[42rem]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_35%_36%,rgba(16,185,129,0.2),transparent_15rem),radial-gradient(circle_at_70%_30%,rgba(251,191,36,0.18),transparent_14rem),radial-gradient(circle_at_55%_72%,rgba(56,189,248,0.14),transparent_16rem)]" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-white/80 px-4 py-3 shadow-lg shadow-slate-950/10 ring-1 ring-white/70">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xl font-black text-white shadow-lg shadow-emerald-900/20">
                S
              </span>
              <span>
                <span className="block text-2xl font-black tracking-tight text-slate-950">
                  ShareSync
                </span>
                <span className="block text-xs font-black uppercase tracking-wide text-emerald-700">
                  Community Marketplace
                </span>
              </span>
            </div>

            <h1 className="mt-8 max-w-2xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Borrow what you need, share what you don't. {"\u{1F331}"}
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Join your community marketplace for sharing tools, books, kitchen
              items, and everyday essentials.
            </p>
          </div>

          <div className="pointer-events-none absolute inset-0 hidden sm:block">
            <div className="animate-orbit-slow absolute left-1/2 top-[58%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 lg:h-96 lg:w-96">
              {orbitItems.map((item) => (
                <span
                  className={`absolute grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow-lg shadow-slate-950/10 ring-1 ring-white/70 ${item.className}`}
                  key={item.icon}
                >
                  {item.icon}
                </span>
              ))}
            </div>

            <div className="animate-orbit-reverse absolute left-1/2 top-[58%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 lg:h-64 lg:w-64">
              <span className="absolute left-1/2 top-0 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-2xl bg-white/85 text-xl shadow-md ring-1 ring-white/70">
                {"\u{1F3E0}"}
              </span>
              <span className="absolute bottom-0 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-2xl bg-white/85 text-xl shadow-md ring-1 ring-white/70">
                {"\u{2B50}"}
              </span>
            </div>

            {floatingItems.map((item, index) => (
              <span
                className={`animate-float-medium absolute grid h-12 w-12 place-items-center rounded-2xl text-xl shadow-lg shadow-slate-950/10 ring-1 ring-white/70 ${item.className}`}
                key={item.icon}
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                {item.icon}
              </span>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-5 bottom-5 z-10 hidden grid-cols-2 gap-3 lg:grid">
            {miniCards.map((card) => (
              <div
                className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm font-black text-slate-700 shadow-lg shadow-slate-950/5 backdrop-blur"
                key={card.text}
              >
                {card.text}
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="animate-slide-up mx-auto w-full max-w-xl rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="mb-8 space-y-3">
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
                ShareSync Marketplace
              </p>
              <h2 className="text-4xl font-black tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="text-base font-medium leading-7 text-slate-600">
                {subtitle}
              </p>
            </div>
            <div className="grid gap-5">{children}</div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ["\u{1F3D8}\uFE0F", "Community-based"],
                ["\u{2B50}", "Trust-focused"],
                ["\u{1F331}", "Sustainable sharing"],
              ].map(([icon, label]) => (
                <span
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 ring-1 ring-emerald-100"
                  key={label}
                >
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AuthShell;
