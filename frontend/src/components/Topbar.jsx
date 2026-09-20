import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "../context/DatasetContext";
import { useTheme } from "../context/ThemeContext";
import { datasetService } from "../services/api";

export default function Topbar() {
  const { datasetInfo, eligibleOnly, setEligibleOnly, resetToDefault, refreshAll } = useDataset();
  const { theme, toggleTheme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await datasetService.upload(file);
      await refreshAll(false);
      setEligibleOnly(false);
      navigate("/upload");
    } catch (err) {
      alert(err?.response?.data?.error || "Upload failed. Please check the file and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-ink-100 dark:bg-ink-900/80 dark:border-ink-700">
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Current dataset</span>
            <span className="font-display font-bold text-ink-900 truncate max-w-[220px] sm:max-w-none">
              {datasetInfo?.label || "Loading..."}
              {datasetInfo?.isDefault && (
                <span className="badge badge-brand ml-2 align-middle">Demo</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-ink-100 rounded-xl p-1 mr-2">
            <button
              onClick={() => setEligibleOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !eligibleOnly ? "bg-white shadow-sm text-brand-700" : "text-ink-500"
              }`}
            >
              Full Dataset
            </button>
            <button
              onClick={() => setEligibleOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                eligibleOnly ? "bg-white shadow-sm text-brand-700" : "text-ink-500"
              }`}
            >
              Eligible Dataset
            </button>
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleQuickUpload} />
          <button className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload Dataset"}
          </button>
          <button className="btn-ghost" onClick={resetToDefault} title="Reset to dissertation dataset">
            Reset
          </button>
          <button
            className="btn-ghost w-10 !px-0 justify-center"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </header>
  );
}
