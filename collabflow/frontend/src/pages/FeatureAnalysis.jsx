import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState } from "../components/Common";
import BarChartCard from "../charts/BarChartCard";

export default function FeatureAnalysis() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { feature_analysis } = analysis;

  return (
    <div className="space-y-6">
      <PageHeader title="Feature Analysis" subtitle="RQ4: which features most affect communication, coordination, and knowledge sharing?" />

      <div className="card bg-brand-50 border-brand-200 text-sm text-brand-700">
        ℹ {feature_analysis.note}
      </div>

      {!feature_analysis.available ? (
        <EmptyState reason="No feature-level proxy items are mapped in this dataset." />
      ) : (
        <>
          <BarChartCard
            title="Feature Proxy Means"
            data={feature_analysis.proxies.map((p) => ({ name: p.proxy_label, value: p.mean }))}
            domain={[0, 5]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feature_analysis.proxies.map((p) => (
              <div key={p.column} className="card">
                <div className="font-display font-bold text-ink-900 mb-1">{p.proxy_label}</div>
                <div className="text-xs text-ink-400 mb-3">{p.column}</div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div><div className="text-ink-400 text-xs">Mean</div><div className="font-semibold">{p.mean}</div></div>
                  <div><div className="text-ink-400 text-xs">SD</div><div className="font-semibold">{p.sd}</div></div>
                  <div><div className="text-ink-400 text-xs">Min</div><div className="font-semibold">{p.min}</div></div>
                  <div><div className="text-ink-400 text-xs">Max</div><div className="font-semibold">{p.max}</div></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
