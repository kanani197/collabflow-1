import React from "react";
import { useDataset } from "../context/DatasetContext";
import { PageHeader, LoadingSpinner, EmptyState } from "../components/Common";
import BarChartCard from "../charts/BarChartCard";

export default function Challenges() {
  const { analysis, loading } = useDataset();
  if (loading) return <LoadingSpinner />;
  if (!analysis) return null;

  const { open_text } = analysis;

  if (!open_text.available) {
    return (
      <div className="space-y-6">
        <PageHeader title="Challenges / Open Feedback" />
        <EmptyState reason={open_text.reason} />
      </div>
    );
  }

  const keywordData = open_text.keyword_frequency.map((k) => ({ name: k.word, value: k.count }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenges / Open Feedback"
        subtitle="Free-text responses on the biggest collaboration challenge respondents face."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Total Rows</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{open_text.total_rows}</div>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Responses Received</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{open_text.responses_received}</div>
          <div className="text-xs text-ink-500">{open_text.response_rate_pct}% response rate</div>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Usable Responses</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{open_text.usable_responses}</div>
        </div>
        <div className="stat-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Missing</span>
          <div className="font-display font-extrabold text-2xl text-ink-900">{open_text.missing_responses}</div>
        </div>
      </div>

      {open_text.response_rate_pct < 20 && (
        <div className="card bg-ember-50 border-ember-200 text-sm text-ember-700">
          ⚠ Response rate is very low ({open_text.response_rate_pct}%). No systematic thematic
          categorisation should be inferred from this few responses.
        </div>
      )}

      {open_text.keyword_note ? (
        <div className="card bg-ink-50 text-sm text-ink-500">{open_text.keyword_note}</div>
      ) : (
        keywordData.length > 0 && (
          <BarChartCard title="Keyword Frequency" data={keywordData} horizontal height={320} />
        )
      )}

      <div className="card">
        <div className="font-display font-bold text-ink-900 mb-3">Raw Responses</div>
        {open_text.responses.length === 0 ? (
          <div className="text-sm text-ink-400">No responses recorded.</div>
        ) : (
          <table className="table-clean">
            <thead><tr><th>Response</th><th>Word Count</th></tr></thead>
            <tbody>
              {open_text.responses.map((r, i) => (
                <tr key={i}>
                  <td>{r.text}</td>
                  <td>{r.word_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card bg-ink-50/60 text-xs text-ink-500">{open_text.caveat}</div>
    </div>
  );
}
