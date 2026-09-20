import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState, SignificanceBadge } from "../components/Common";

const LABELS = { ux: "UX / Usability", communication: "Communication", coordination: "Coordination", performance: "Team Performance" };

export default function Comparisons() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { technical_vs_nontechnical, tool_comparison } = analysis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Group Comparison"
        subtitle="Technical vs non-technical (Welch t-test, Mann-Whitney U) and tool-based (Kruskal-Wallis) comparisons across all four constructs."
      />

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-1">Technical vs Non-Technical</div>
        <div className="text-sm text-ink-500 mb-4">
          Tests whether "collaborative asymmetry" is reflected as a measurable score gap in this dataset.
        </div>
        {technical_vs_nontechnical.available === false && !technical_vs_nontechnical.reason ? null : technical_vs_nontechnical.reason && !technical_vs_nontechnical.ux ? (
          <EmptyState reason={technical_vs_nontechnical.reason} />
        ) : (
          <table className="table-clean">
            <thead>
              <tr>
                <th>Construct</th><th>Technical M (SD)</th><th>Non-Technical M (SD)</th>
                <th>Welch t</th><th>p</th><th>Mann-Whitney U</th><th>p</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(LABELS).map(([key, label]) => {
                const res = technical_vs_nontechnical[key];
                if (!res || !res.available) {
                  return <tr key={key}><td>{label}</td><td colSpan={7} className="text-ink-400">{res?.reason || "Not available"}</td></tr>;
                }
                return (
                  <tr key={key}>
                    <td className="font-medium">{label}</td>
                    <td>{res.group_a.mean} ({res.group_a.sd})</td>
                    <td>{res.group_b.mean} ({res.group_b.sd})</td>
                    <td>{res.welch_t}</td>
                    <td>{res.welch_p}</td>
                    <td>{res.mann_whitney_u}</td>
                    <td>{res.mann_whitney_p}</td>
                    <td><SignificanceBadge significant={res.welch_significant} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-1">Tool Comparison (Kruskal-Wallis)</div>
        <div className="text-sm text-ink-500 mb-4">Non-parametric comparison across primary collaboration tools.</div>
        {tool_comparison.reason && !tool_comparison.ux ? (
          <EmptyState reason={tool_comparison.reason} />
        ) : (
          <table className="table-clean">
            <thead>
              <tr><th>Construct</th><th>H</th><th>df</th><th>p</th><th>Result</th></tr>
            </thead>
            <tbody>
              {Object.entries(LABELS).map(([key, label]) => {
                const res = tool_comparison[key];
                if (!res || !res.available) {
                  return <tr key={key}><td>{label}</td><td colSpan={4} className="text-ink-400">{res?.reason}</td></tr>;
                }
                return (
                  <tr key={key}>
                    <td className="font-medium">{label}</td>
                    <td>{res.H}</td>
                    <td>{res.df}</td>
                    <td>{res.p}</td>
                    <td><SignificanceBadge significant={res.significant} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
