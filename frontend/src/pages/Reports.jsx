import React, { useState } from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner } from "../components/Common";
import { exportService } from "../services/api";
import { downloadBlob } from "../utils/download";

const SECTIONS = [
  "Dataset Overview", "Data Quality", "Demographics", "Tool Usage", "UX Analysis",
  "Communication", "Coordination", "Performance", "Reliability", "Normality",
  "Correlation Analysis", "Group Comparisons", "Tool Comparisons", "Open Feedback",
  "Interview Insights", "Key Findings", "Evidence-Informed Recommendations", "Limitations",
];

export default function Reports() {
  const { analysis, eligibleOnly, loading } = useDataset();
  const [downloading, setDownloading] = useState(null);

  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      if (type === "report") {
        const blob = await exportService.downloadReport(eligibleOnly);
        downloadBlob(blob, "collabflow_analysis_report.txt");
      } else if (type === "csv") {
        const blob = await exportService.downloadCsv(eligibleOnly);
        downloadBlob(blob, "collabflow_cleaned_dataset.csv");
      }
    } catch (e) {
      alert("Export failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle={`Generate a complete analysis report for the currently selected dataset (${analysis.dataset_label}, ${eligibleOnly ? "Eligible" : "Full"} sample).`}
      />

      <div className="card bg-brand-gradient text-white">
        <div className="font-display font-bold text-lg mb-1">Generate Analysis Report</div>
        <p className="text-sm text-white/80 mb-4">
          This report is generated from the currently selected dataset and eligibility filter.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className="btn bg-white text-brand-700 hover:brightness-95"
            onClick={() => handleDownload("report")}
            disabled={downloading}
          >
            {downloading === "report" ? "Generating..." : "Download Full Report (.txt)"}
          </button>
          <button
            className="btn bg-white/15 text-white border border-white/30 hover:bg-white/25"
            onClick={() => handleDownload("csv")}
            disabled={downloading}
          >
            {downloading === "csv" ? "Preparing..." : "Download Cleaned Dataset (.csv)"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-3">Report Contents</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {SECTIONS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-sm text-ink-700">
              <span className="w-5 h-5 rounded-full bg-ink-100 text-ink-500 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
