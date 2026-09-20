import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner } from "../components/Common";

const TYPE_STYLES = {
  positive: { icon: "✓", cls: "bg-leaf-50 border-leaf-200 text-leaf-800" },
  finding: { icon: "●", cls: "bg-brand-50 border-brand-200 text-brand-800" },
  caution: { icon: "⚠", cls: "bg-ember-50 border-ember-200 text-ember-800" },
};

export default function Insights() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { insights, recommendations } = analysis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insights"
        subtitle="Auto-generated from the calculated statistical results for the current dataset. No causal claims are made."
      />

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-3">Key Findings</div>
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const style = TYPE_STYLES[ins.type] || TYPE_STYLES.finding;
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${style.cls}`}>
                <span className="font-bold">{style.icon}</span>
                <span>{ins.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card bg-brand-gradient text-white">
        <div className="font-display font-bold mb-3">Data-Informed Recommendations</div>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-1">{rec.label}</div>
              <div className="text-sm">{rec.text}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-white/60 mt-4">
          These are evidence-informed directions, not scientifically proven causal interventions.
        </div>
      </div>
    </div>
  );
}
