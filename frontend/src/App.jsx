import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import DataPreview from "./pages/DataPreview";
import Demographics from "./pages/Demographics";
import Tools from "./pages/Tools";
import Construct from "./pages/Construct";
import Correlations from "./pages/Correlations";
import Comparisons from "./pages/Comparisons";
import Insights from "./pages/Insights";
import Collaboration from "./pages/Collaboration";
import Settings from "./pages/Settings";
import InterviewInsights from "./pages/InterviewInsights";
import Challenges from "./pages/Challenges";
import FeatureAnalysis from "./pages/FeatureAnalysis";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-900">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/preview" element={<DataPreview />} />
            <Route path="/demographics" element={<Demographics />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/ux" element={<Construct constructKey="ux" title="UX / Usability" accent="brand" />} />
            <Route path="/communication" element={<Construct constructKey="communication" title="Communication" accent="aqua" />} />
            <Route path="/coordination" element={<Construct constructKey="coordination" title="Coordination" accent="ember" />} />
            <Route path="/performance" element={<Construct constructKey="performance" title="Team Performance" accent="leaf" />} />
            <Route path="/correlations" element={<Correlations />} />
            <Route path="/comparisons" element={<Comparisons />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/features" element={<FeatureAnalysis />} />
            <Route path="/interview" element={<InterviewInsights />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/collaboration" element={<Collaboration />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
