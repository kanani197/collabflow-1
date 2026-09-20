import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState } from "../components/Common";

export default function InterviewInsights() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { interview } = analysis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Insights"
        subtitle="Qualitative evidence from the dissertation's semi-structured interview phase."
      />

      {!interview.available ? (
        <EmptyState title="Not available for this dataset" reason={interview.reason} />
      ) : (
        <>
          <div className="card bg-ember-50 border-ember-200 text-sm text-ember-700">
            ⚠ {interview.caveat}
          </div>

          <div className="card">
            <div className="font-display font-bold text-ink-900 mb-3">Participant Profile</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><div className="text-ink-400 text-xs uppercase font-semibold">Label</div><div className="font-medium">{interview.participant.label}</div></div>
              <div><div className="text-ink-400 text-xs uppercase font-semibold">Role</div><div className="font-medium">{interview.participant.role}</div></div>
              <div><div className="text-ink-400 text-xs uppercase font-semibold">Experience</div><div className="font-medium">{interview.participant.experience}</div></div>
              <div><div className="text-ink-400 text-xs uppercase font-semibold">Arrangement</div><div className="font-medium">{interview.participant.working_arrangement}</div></div>
              <div><div className="text-ink-400 text-xs uppercase font-semibold">Tools</div><div className="font-medium">{interview.participant.tools_used.join(", ")}</div></div>
            </div>
            <div className="mt-3 text-xs text-ink-500">
              Planned sample: {interview.planned_sample} · Actual: {interview.actual_sample}
            </div>
          </div>

          <div className="space-y-3">
            {interview.themes.map((t, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="font-display font-bold text-ink-900">{t.title}</span>
                  <div className="ml-auto flex gap-1">
                    {t.related_rq.map((rq) => <span key={rq} className="badge badge-info">{rq}</span>)}
                  </div>
                </div>
                <p className="text-sm text-ink-600 mb-2">{t.summary}</p>
                <blockquote className="border-l-4 border-brand-200 pl-3 text-sm italic text-ink-500">
                  "{t.quotation}"
                </blockquote>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="font-display font-bold text-ink-900 mb-2">Proposed Improvements (from interview)</div>
            <ul className="space-y-1.5 text-sm text-ink-700 list-disc list-inside">
              {interview.proposed_improvements.map((imp, i) => <li key={i}>{imp}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
