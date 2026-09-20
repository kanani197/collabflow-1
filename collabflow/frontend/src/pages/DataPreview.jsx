import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner } from "../components/Common";
import { exportService } from "../services/api";
import { downloadBlob } from "../utils/download";

const DTYPE_COLORS = {
  likert: "badge-brand",
  numeric: "badge-info",
  categorical: "badge-success",
  text: "badge-warning",
  datetime: "badge-danger",
};

export default function DataPreview() {
  const { analysis, eligibleOnly, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const profile = analysis.validation.column_profile;

  const handleDownloadCsv = async () => {
    const blob = await exportService.downloadCsv(eligibleOnly);
    downloadBlob(blob, "collabflow_cleaned_dataset.csv");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Preview"
        subtitle="Structural profile of the current dataset — column types, missing values, and sample values."
      >
        <button className="btn-secondary" onClick={handleDownloadCsv}>Download Cleaned Dataset</button>
      </PageHeader>

      <div className="card overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Missing</th>
              <th>Unique Values</th>
              <th>Sample Values</th>
            </tr>
          </thead>
          <tbody>
            {profile.map((col) => (
              <tr key={col.column}>
                <td className="font-medium max-w-xs truncate" title={col.column}>{col.column}</td>
                <td>
                  <span className={`badge ${DTYPE_COLORS[col.dtype] || "badge-info"}`}>{col.dtype}</span>
                </td>
                <td>
                  {col.missing > 0 ? (
                    <span className="text-ember-600 font-semibold">{col.missing} ({col.missing_pct}%)</span>
                  ) : (
                    <span className="text-leaf-600">0</span>
                  )}
                </td>
                <td>{col.unique_values}</td>
                <td className="max-w-sm truncate text-ink-500" title={col.sample_values.join(", ")}>
                  {col.sample_values.slice(0, 4).join(", ")}
                  {col.sample_values.length > 4 && "…"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card bg-ink-50/60 text-sm text-ink-500">
        Personally identifiable information is not displayed here even if detected —
        see the Settings page for privacy flags on the current dataset.
      </div>
    </div>
  );
}
