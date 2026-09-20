import React from "react";

function cellColor(coef, significant) {
  if (coef == null) return "bg-ink-50 text-ink-300";
  const magnitude = Math.abs(coef);
  if (!significant) return "bg-ink-50 text-ink-500";
  if (magnitude >= 0.3) return "bg-brand-500 text-white";
  if (magnitude >= 0.2) return "bg-brand-300 text-brand-900";
  return "bg-brand-100 text-brand-700";
}

export default function CorrelationMatrix({ correlations, labels }) {
  const map = {};
  correlations.forEach((c) => {
    if (!c.available) return;
    map[`${c.variable_a}|${c.variable_b}`] = c;
    map[`${c.variable_b}|${c.variable_a}`] = c;
  });

  return (
    <div className="card overflow-x-auto">
      <div className="font-display font-bold text-ink-900 mb-3">Correlation Matrix (Spearman/Pearson, auto-selected)</div>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="p-2"></th>
            {labels.map((l) => (
              <th key={l} className="p-2 text-xs font-semibold text-ink-500">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((rowLabel) => (
            <tr key={rowLabel}>
              <td className="p-2 text-xs font-semibold text-ink-500 whitespace-nowrap">{rowLabel}</td>
              {labels.map((colLabel) => {
                if (rowLabel === colLabel) {
                  return (
                    <td key={colLabel} className="p-1">
                      <div className="w-16 h-12 rounded-lg bg-ink-100 flex items-center justify-center text-ink-400 text-xs font-semibold">
                        1.00
                      </div>
                    </td>
                  );
                }
                const c = map[`${rowLabel}|${colLabel}`];
                return (
                  <td key={colLabel} className="p-1">
                    <div className={`w-16 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${cellColor(c?.coefficient, c?.significant)}`}>
                      <span>{c?.coefficient != null ? c.coefficient.toFixed(2) : "—"}</span>
                      <span className="text-[9px] font-medium opacity-80">
                        {c ? `p=${c.p_value}` : ""}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
