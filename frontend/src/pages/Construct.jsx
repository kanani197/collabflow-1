import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState, AlphaBadge } from "../components/Common";
import BarChartCard from "../charts/BarChartCard";

export default function Construct({ constructKey, title, accent }) {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const construct = analysis.constructs[constructKey];
  const reliability = analysis.reliability[constructKey];
  const normality = analysis.normality[constructKey];

  if (!construct.available) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} />
        <EmptyState title="Construct not available" reason={construct.reason} />
      </div>
    );
  }

  const itemData = construct.items.map((it) => ({
    name: it.column.replace(/^Q\d+\.?\s*/, "").split(".")[0].slice(0, 40),
    value: it.mean,
    reversed: it.reverse_scored,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={
          constructKey === "ux"
            ? "Adapted UX/Usability Scale — six SUS-style items. This is not the official 10-item SUS instrument."
            : `${construct.n_items} mapped item(s) contributing to the composite score.`
        }
      >
        <AlphaBadge alpha={reliability.alpha} flagLow={reliability.flag_low} />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Composite Mean</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{construct.composite_stats.mean ?? "—"}</div>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">SD</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{construct.composite_stats.sd ?? "—"}</div>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">N</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{construct.composite_stats.n ?? "—"}</div>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Normality (Shapiro-Wilk)</span>
          <div className="font-display font-bold text-sm text-ink-900 mt-2">
            {normality.available ? (normality.normal ? "Normal" : "Non-normal") : "N/A"}
            {normality.available && <span className="text-ink-400 font-normal"> (p={normality.p})</span>}
          </div>
        </div>
      </div>

      {construct.warning && (
        <div className="card bg-ember-50 border-ember-200 text-sm text-ember-700">⚠ {construct.warning}</div>
      )}

      <BarChartCard title="Item-Level Means" data={itemData} domain={[0, 5]} height={280} />

      <div className="card overflow-x-auto">
        <div className="font-display font-bold text-ink-900 mb-3">Item Descriptive Statistics</div>
        <table className="table-clean">
          <thead>
            <tr><th>Item</th><th>Mean</th><th>SD</th><th>Min</th><th>Max</th><th>Reverse-scored</th></tr>
          </thead>
          <tbody>
            {construct.items.map((it) => (
              <tr key={it.column}>
                <td className="max-w-md">{it.column}</td>
                <td>{it.mean}</td>
                <td>{it.sd}</td>
                <td>{it.min}</td>
                <td>{it.max}</td>
                <td>{it.reverse_scored ? <span className="badge badge-info">Yes</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-2">Reliability — Cronbach's Alpha</div>
        {reliability.available ? (
          <div className="flex items-center gap-4 flex-wrap">
            <AlphaBadge alpha={reliability.alpha} flagLow={reliability.flag_low} />
            <span className="text-sm text-ink-600">{reliability.interpretation}</span>
            <span className="text-xs text-ink-400">({reliability.n_items} items, n={reliability.n_obs})</span>
          </div>
        ) : (
          <span className="text-sm text-ink-500">{reliability.reason}</span>
        )}
      </div>
    </div>
  );
}
