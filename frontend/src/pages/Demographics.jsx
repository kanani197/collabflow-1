import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState } from "../components/Common";
import BarChartCard from "../charts/BarChartCard";
import DonutChartCard from "../charts/DonutChartCard";

function CategoryTable({ summary }) {
  if (!summary.available) return <EmptyState reason={summary.reason} />;
  return (
    <div className="card">
      <table className="table-clean">
        <thead>
          <tr><th>Category</th><th>Frequency</th><th>Percentage</th></tr>
        </thead>
        <tbody>
          {summary.categories.map((c) => (
            <tr key={c.label}>
              <td className="font-medium">{c.label}</td>
              <td>{c.count}</td>
              <td>{c.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Demographics() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { demographics } = analysis;
  const roleData = demographics.professional_role.available
    ? demographics.professional_role.categories.map((c) => ({ name: c.label, value: c.count }))
    : [];
  const techData = demographics.technical_status.available
    ? demographics.technical_status.categories.map((c) => ({ name: c.label, value: c.count }))
    : [];
  const expData = demographics.hybrid_experience.available
    ? demographics.hybrid_experience.categories.map((c) => ({ name: c.label, value: c.count }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Demographics" subtitle="Respondent profile: professional role, technical classification, and hybrid/remote experience." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {roleData.length > 0 ? (
          <BarChartCard title="Professional Role" data={roleData} horizontal height={280} />
        ) : (
          <EmptyState reason={demographics.professional_role.reason} />
        )}
        {techData.length > 0 ? (
          <DonutChartCard title="Technical vs Non-Technical" data={techData} />
        ) : (
          <EmptyState reason={demographics.technical_status.reason} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {expData.length > 0 ? (
          <BarChartCard title="Hybrid / Remote Experience" data={expData} />
        ) : (
          <EmptyState reason={demographics.hybrid_experience.reason} />
        )}
        <CategoryTable summary={demographics.professional_role} />
      </div>
    </div>
  );
}
