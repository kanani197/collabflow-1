import React, { useState } from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner } from "../components/Common";
import { feedbackService } from "../services/api";

export default function Settings() {
  const { datasetInfo, analysis, loading } = useDataset();
  const [ratings, setRatings] = useState({ easeOfUse: 3, easeOfLearning: 3, confidence: 3, integration: 3, satisfaction: 3 });
  const [submitted, setSubmitted] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const submitFeedback = async () => {
    await feedbackService.submit(ratings);
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings / Dataset Information" subtitle="Details about the current dataset and application-level feedback." />

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-3">Dataset Information</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-ink-400 text-xs uppercase font-semibold">Label</div><div className="font-medium">{datasetInfo?.label}</div></div>
          <div><div className="text-ink-400 text-xs uppercase font-semibold">Rows</div><div className="font-medium">{datasetInfo?.rows}</div></div>
          <div><div className="text-ink-400 text-xs uppercase font-semibold">Columns</div><div className="font-medium">{datasetInfo?.columns}</div></div>
          <div><div className="text-ink-400 text-xs uppercase font-semibold">Is Default</div><div className="font-medium">{datasetInfo?.isDefault ? "Yes" : "No"}</div></div>
        </div>
      </div>

      {analysis.validation.pii_flags?.length > 0 && (
        <div className="card bg-rose-50 border-rose-200">
          <div className="font-display font-bold text-rose-700 mb-1">Possible PII Detected</div>
          <div className="text-sm text-rose-600">
            The following columns may contain personally identifiable information:{" "}
            {analysis.validation.pii_flags.join(", ")}. Please confirm you have permission to
            analyse this data.
          </div>
        </div>
      )}

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-1">CollabFlow Application Feedback</div>
        <div className="text-sm text-ink-500 mb-4">
          This rates the CollabFlow application itself — separate from the dissertation dataset analysis.
        </div>
        {submitted ? (
          <div className="text-leaf-600 font-medium text-sm">Thank you for your feedback!</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(ratings).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm capitalize text-ink-700">{key.replace(/([A-Z])/g, " $1")}</span>
                <input
                  type="range" min="1" max="5" value={val}
                  onChange={(e) => setRatings((r) => ({ ...r, [key]: Number(e.target.value) }))}
                  className="w-40 accent-brand-600"
                />
                <span className="text-sm font-semibold w-4 text-center">{val}</span>
              </div>
            ))}
            <button className="btn-primary mt-2" onClick={submitFeedback}>Submit Feedback</button>
          </div>
        )}
      </div>
    </div>
  );
}
