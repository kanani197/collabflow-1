import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, SignificanceBadge } from "../components/Common";
import CorrelationMatrix from "../charts/CorrelationMatrix";
import BarChartCard from "../charts/BarChartCard";

export default function Correlations() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { correlations } = analysis;
  const labels = ["UX / Usability", "Communication", "Coordination", "Team Performance"];
  const available = correlations.filter((c) => c.available);
  const barData = available.map((c) => ({
    name: `${c.variable_a.split(" ")[0]} \u2194 ${c.variable_b.split(" ")[0]}`,
    value: c.coefficient,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Correlation Analysis"
        subtitle="Relationships between UX, communication, coordination, and performance. Method (Pearson/Spearman) is auto-selected by normality testing. Associations only — never causation."
      />

      <CorrelationMatrix correlations={correlations} labels={labels} />

      <BarChartCard title="Correlation Coefficients" data={barData} domain={[-1, 1]} />

      <div className="card overflow-x-auto">
        <div className="font-display font-bold text-ink-900 mb-3">Academic Detail</div>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Pair</th><th>Method</th><th>Coefficient</th><th>p</th><th>N</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {available.map((c) => (
              <tr key={c.pair}>
                <td className="font-medium">{c.variable_a} ↔ {c.variable_b}</td>
                <td className="capitalize">{c.primary_method}</td>
                <td>{c.coefficient}</td>
                <td>{c.p_value}</td>
                <td>{c.n}</td>
                <td><SignificanceBadge significant={c.significant} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        {available.map((c) => (
          <div key={c.pair} className="card">
            <div className="text-xs text-ink-400 mb-1">{c.primary_reasoning}</div>
            <div className="text-sm text-ink-700">{c.interpretation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
