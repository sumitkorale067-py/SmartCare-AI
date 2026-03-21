export default function SectionCard({ title, subtitle, children, padded = true }) {
  return (
    <section className="rounded-2xl bg-white border border-slate-100 shadow-soft">
      {(title || subtitle) && (
        <header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
          {title && (
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              {subtitle}
            </p>
          )}
        </header>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}

