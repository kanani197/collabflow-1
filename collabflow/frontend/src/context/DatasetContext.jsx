import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { datasetService } from "../services/api";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [datasetInfo, setDatasetInfo] = useState(null); // label, isDefault, rows, columns, validation, mapping
  const [analysis, setAnalysis] = useState(null); // full analytics JSON
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshAll = useCallback(async (eligible = eligibleOnly) => {
    setLoading(true);
    setError(null);
    try {
      const [info, result] = await Promise.all([
        datasetService.getCurrent(),
        datasetService.analyze(eligible),
      ]);
      setDatasetInfo(info);
      setAnalysis(result);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load dataset.");
    } finally {
      setLoading(false);
    }
  }, [eligibleOnly]);

  useEffect(() => {
    refreshAll(eligibleOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleOnly]);

  const resetToDefault = useCallback(async () => {
    await datasetService.reset();
    setEligibleOnly(false);
    await refreshAll(false);
  }, [refreshAll]);

  const value = {
    datasetInfo,
    analysis,
    eligibleOnly,
    setEligibleOnly,
    loading,
    error,
    refreshAll,
    resetToDefault,
  };

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within DatasetProvider");
  return ctx;
}
