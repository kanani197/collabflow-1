import React from "react";
import { useDataset } from "../context/DatasetContext";
import StatCard from "../components/StatCard";
import { LoadingSpinner, EmptyState } from "../components/Common";
import BarChartCard from "../charts/BarChartCard";
import DonutChartCard from "../charts/DonutChartCard";
import CorrelationMatrix from "../charts/CorrelationMatrix";

export default function Dashboard() {
  const { analysis, datasetInfo, loading, error, eligibleOnly } = useDataset();

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Could not load dataset" reason={error} />;
  if (!analysis) return null;

  const { kpis, tool_usage, constructs, correlations, sample, validation } = analysis;

  const constructBarData = [
    { name: "UX", value: kpis.ux_mean },
    { name: "Communication", value: kpis.communication_mean },
    { name: "Coordination", value: kpis.coordination_mean },
    { name: "Performance", value: kpis.performance_mean },
  ].filter((d) => d.value != null);

  const toolDonutData =
    tool_usage.summary.available
      ? tool_usage.summary.categories.map((c) => ({ name: c.label, value: c.count }))
      : [];

  const corrBarData = correlations
    .filter((c) => c.available)
    .map((c) => ({ name: `${c.variable_a.split(" ")[0]}–${c.variable_b.split(" ")[0]}`, value: c.coefficient, sig: c.significant }));

  const labels = ["UX / Usability", "Communication", "Coordination", "Team Performance"];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-brand-gradient text-white p-6 md:p-8 shadow-glow relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="relative">
          <div className="badge bg-white/15 text-white mb-3">
            {eligibleOnly ? "Eligible Dataset View" : "Full Dataset View"}
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight">CollabFlow</h1>
          <p className="text-white/80 mt-1 max-w-xl">
            Analyse collaboration, user experience, communication, coordination and team
            performance using real survey data.
          </p>
        </div>
      </div>

      {sample.excluded_by_eligibility > 0 && (
        <div className="card bg-ember-50 border-ember-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-ember-700 font-medium">
            {sample.excluded_by_eligibility} records excluded by the current eligibility rule
            (less than 3 months hybrid/remote experience). Currently viewing:{" "}
            <strong>{eligibleOnly ? `Eligible Dataset (N=${sample.n_used})` : `Full Dataset (N=${sample.n_used})`}</strong>
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Respondents" value={kpis.total_respondents} accent="brand" icon="N" />
        <StatCard label="Technical" value={kpis.technical_count ?? "—"} accent="aqua" icon="T" />
        <StatCard label="Non-Technical" value={kpis.non_technical_count ?? "—"} accent="ember" icon="NT" />
        <StatCard label="Primary Tool" value={kpis.most_used_tool ?? "—"} accent="leaf" icon="⚙" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="UX Score" value={kpis.ux_mean ?? "—"} sublabel="out of 5" accent="brand" />
        <StatCard label="Communication" value={kpis.communication_mean ?? "—"} sublabel="out of 5" accent="aqua" />
        <StatCard label="Coordination" value={kpis.coordination_mean ?? "—"} sublabel="out of 5" accent="ember" />
        <StatCard label="Performance" value={kpis.performance_mean ?? "—"} sublabel="out of 5" accent="leaf" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Significant Correlations" value={`${kpis.significant_correlations} / ${correlations.filter(c=>c.available).length}`} accent="rose" />
        <StatCard label="Missing Values" value={kpis.total_missing_values} accent="ink" />
        <StatCard label="Dataset Status" value={validation.status === "ready" ? "Ready" : validation.status} accent="leaf" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartCard
          title="Construct Composite Scores"
          subtitle="Mean score (1–5 scale) across all mapped items"
          data={constructBarData}
          domain={[0, 5]}
        />
        {toolDonutData.length > 0 ? (
          <DonutChartCard title="Tool Usage Distribution" subtitle="Primary collaboration tool" data={toolDonutData} />
        ) : (
          <EmptyState reason="Variable not available in uploaded dataset." />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartCard
          title="Correlation Overview"
          subtitle="Coefficient by construct pair (colored bars, not significance-coded)"
          data={corrBarData}
          domain={[-1, 1]}
        />
        <CorrelationMatrix correlations={correlations} labels={labels} />
      </div>
    </div>
  );
}
