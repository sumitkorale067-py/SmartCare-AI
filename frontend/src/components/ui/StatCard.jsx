export default function StatCard({ label, value, hint, icon: Icon, tone }) {
  const toneClasses =
    tone === "alert"
      ? "bg-rose-50 border-rose-100 text-rose-700"
      : tone === "success"
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : "bg-slate-50 border-slate-100 text-slate-700";

  const iconBg =
    tone === "alert"
      ? "bg-rose-100 text-rose-700"
      : tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft border border-slate-100 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-transparent to-blue-50 opacity-60" />
      <div className="relative p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              {label}
            </p>
            {hint && (
              <p className="mt-0.5 text-[11px] text-slate-500 max-w-[14rem]">
                {hint}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={`h-9 w-9 rounded-2xl flex items-center justify-center shadow ${iconBg}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>

        <div className={`mt-auto inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClasses}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
          Live, personalised from SmartCare AI
        </div>
      </div>
    </div>
  );
}

