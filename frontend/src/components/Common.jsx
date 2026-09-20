import React from "react";

export function SignificanceBadge({ significant, p }) {
  if (significant) {
    return <span className="badge badge-success">Significant {p != null && `(p=${p})`}</span>;
  }
  return <span className="badge badge-warning">Not significant {p != null && `(p=${p})`}</span>;
}

export function EmptyState({ title = "Not available", reason }) {
  return (
    <div className="card border-dashed border-2 border-ink-200 bg-ink-50/50 text-center py-10">
      <div className="text-3xl mb-2">○</div>
      <div className="font-semibold text-ink-700">{title}</div>
      {reason && <div className="text-sm text-ink-500 mt-1 max-w-md mx-auto">{reason}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-ink-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function AlphaBadge({ alpha, flagLow }) {
  if (alpha == null) return <span className="badge badge-warning">N/A</span>;
  const cls = flagLow ? "badge-danger" : "badge-success";
  return <span className={`badge ${cls}`}>α = {alpha}</span>;
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
