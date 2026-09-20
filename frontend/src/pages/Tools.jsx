import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState, SignificanceBadge } from "../components/Common";
import BarChartCard from "../charts/BarChartCard";
import DonutChartCard from "../charts/DonutChartCard";

export default function Tools() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { tool_usage, tool_comparison } = analysis;
  const toolData = tool_usage.summary.available
    ? tool_usage.summary.categories.map((c) => ({ name: c.label, value: c.count }))
    : [];
  const purposeData = tool_usage.purpose.available
    ? tool_usage.purpose.categories.map((c) => ({ name: c.label, value: c.count }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Collaboration Tool Analysis" subtitle="Frequency, purpose, and construct comparison by primary tool (Kruskal-Wallis)." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {toolData.length > 0 ? (
          <DonutChartCard title="Tool Usage Distribution" data={toolData} />
        ) : (
          <EmptyState reason={tool_usage.summary.reason} />
        )}
        {purposeData.length > 0 ? (
          <BarChartCard title="Primary Purpose" data={purposeData} horizontal height={280} />
        ) : (
          <EmptyState reason={tool_usage.purpose.reason} />
        )}
      </div>

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-1">Tool Comparison — Kruskal-Wallis Test</div>
        <div className="text-sm text-ink-500 mb-4">
          Non-parametric comparison of each construct's composite score across tools.
        </div>
        <table className="table-clean">
          <thead>
            <tr><th>Construct</th><th>H</th><th>df</th><th>p</th><th>Result</th></tr>
          </thead>
          <tbody>
            {Object.entries(tool_comparison).map(([key, res]) => {
              if (key === "available" || key === "reason") return null;
              if (!res.available) return (
                <tr key={key}><td className="capitalize">{key}</td><td colSpan={4} className="text-ink-400">{res.reason}</td></tr>
              );
              return (
                <tr key={key}>
                  <td className="capitalize font-medium">{key}</td>
                  <td>{res.H}</td>
                  <td>{res.df}</td>
                  <td>{res.p}</td>
                  <td><SignificanceBadge significant={res.significant} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
