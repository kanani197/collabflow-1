import React, { useState, useCallback } from "react";
import { useDataset } from "../context/DatasetContext";
import { datasetService } from "../services/api";
import { PageHeader } from "../components/Common";

function ValidationCheckRow({ check }) {
  const icon = check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✕";
  const color = check.status === "pass" ? "text-leaf-600" : check.status === "warn" ? "text-ember-600" : "text-rose-600";
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className={`font-bold ${color}`}>{icon}</span>
      <span className="text-ink-700">{check.label}</span>
    </div>
  );
}

function MappingRow({ label, mapped }) {
  const status = mapped ? (Array.isArray(mapped) ? (mapped.length > 0 ? "auto" : "missing") : mapped.status) : "missing";
  const cols = Array.isArray(mapped) ? mapped : mapped?.columns || (mapped?.column ? [mapped.column] : []);
  const icon = status === "auto" ? "✓" : status === "needs_confirmation" ? "⚠" : "✕";
  const color = status === "auto" ? "text-leaf-600" : status === "needs_confirmation" ? "text-ember-600" : "text-rose-400";
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <span className={`text-xs font-semibold ${color} flex items-center gap-1 max-w-[55%] text-right`}>
        {icon} {cols.length > 0 ? cols.join(", ") : "Not mapped"}
      </span>
    </div>
  );
}

export default function Upload() {
  const { datasetInfo, refreshAll, resetToDefault } = useDataset();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const result = await datasetService.upload(file);
      setUploadResult(result);
      await refreshAll(false);
    } catch (err) {
      setUploadError(err?.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [refreshAll]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const mapping = uploadResult?.mapping || datasetInfo?.mapping;
  const validation = uploadResult?.validation || datasetInfo?.validation;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dataset Upload"
        subtitle="Upload your own Excel or CSV file, or keep using the bundled dissertation dataset. Nothing here requires code changes."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`card border-2 border-dashed text-center py-14 transition-colors ${
            dragOver ? "border-brand-400 bg-brand-50" : "border-ink-200"
          }`}
        >
          <div className="text-4xl mb-3">⬆</div>
          <div className="font-display font-bold text-ink-900 mb-1">Drag & drop your file here</div>
          <div className="text-sm text-ink-500 mb-4">Supported formats: .xlsx, .csv — max 10MB</div>
          <label className="btn-primary cursor-pointer inline-flex">
            {uploading ? "Uploading..." : "Choose File"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
              disabled={uploading}
            />
          </label>
          <div className="mt-6">
            <button className="btn-secondary" onClick={resetToDefault}>
              Use Dissertation Dataset
            </button>
          </div>
          {uploadError && (
            <div className="mt-4 text-sm text-rose-600 bg-rose-50 rounded-lg p-3 max-w-md mx-auto">
              {uploadError}
            </div>
          )}
          <div className="mt-6 text-xs text-ink-400 max-w-sm mx-auto">
            Privacy notice: your uploaded dataset is used to generate analysis for this
            session only. Do not upload personally identifiable or sensitive information
            unless you have appropriate permission.
          </div>
        </div>

        <div className="card">
          <div className="font-display font-bold text-ink-900 mb-1">
            {uploadResult ? uploadResult.file : datasetInfo?.label || "Current Dataset"}
          </div>
          <div className="text-sm text-ink-500 mb-4">
            {(uploadResult?.rows ?? datasetInfo?.rows) || 0} rows ·{" "}
            {(uploadResult?.columns ?? datasetInfo?.columns) || 0} columns
          </div>

          {validation ? (
            <>
              <div className="mb-4">
                {validation.checks?.map((c, i) => <ValidationCheckRow key={i} check={c} />)}
              </div>
              {validation.warnings?.length > 0 && (
                <div className="bg-ember-50 rounded-lg p-3 mb-3 space-y-1">
                  {validation.warnings.map((w, i) => (
                    <div key={i} className="text-xs text-ember-700">⚠ {w}</div>
                  ))}
                </div>
              )}
              <div className="badge badge-success">
                Status: {validation.status === "ready" ? "READY FOR ANALYSIS" : validation.status.toUpperCase()}
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-400">No validation data yet.</div>
          )}
        </div>
      </div>

      {mapping && (
        <div className="card">
          <div className="font-display font-bold text-ink-900 mb-1">Smart Column Mapping</div>
          <div className="text-sm text-ink-500 mb-4">
            CollabFlow automatically detects which columns correspond to each analysis
            variable. Review below — this mapping is used for every chart and statistic.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <MappingRow label="Professional Role" mapped={mapping.professional_role} />
              <MappingRow label="Technical Status" mapped={mapping.technical_status} />
              <MappingRow label="Hybrid Experience" mapped={mapping.hybrid_experience} />
              <MappingRow label="Primary Tool" mapped={mapping.primary_tool} />
              <MappingRow label="Tool Purpose" mapped={mapping.tool_purpose} />
            </div>
            <div>
              <MappingRow label="UX / Usability Items" mapped={mapping.ux_items} />
              <MappingRow label="Communication Items" mapped={mapping.communication_items} />
              <MappingRow label="Coordination Items" mapped={mapping.coordination_items} />
              <MappingRow label="Performance Items" mapped={mapping.performance_items} />
              <MappingRow label="Reverse-Scored Items" mapped={mapping.reverse_scored_items} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
