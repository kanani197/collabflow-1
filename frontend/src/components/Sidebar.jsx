import React from "react";
import { NavLink } from "react-router-dom";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: "\u25A6" },
      { to: "/upload", label: "Datasets", icon: "\u2B06" },
      { to: "/preview", label: "Data Preview", icon: "\u25A4" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { to: "/demographics", label: "Demographics", icon: "\u25CF" },
      { to: "/tools", label: "Collaboration Tools", icon: "\u2699" },
      { to: "/ux", label: "UX / Usability", icon: "\u2739" },
      { to: "/communication", label: "Communication", icon: "\u2709" },
      { to: "/coordination", label: "Coordination", icon: "\u21C6" },
      { to: "/performance", label: "Team Performance", icon: "\u25B2" },
      { to: "/features", label: "Feature Analysis", icon: "\u2318" },
    ],
  },
  {
    label: "Statistics",
    items: [
      { to: "/correlations", label: "Correlations", icon: "\u2248" },
      { to: "/comparisons", label: "Group Comparison", icon: "\u2696" },
      { to: "/insights", label: "Insights", icon: "\u2727" },
    ],
  },
  {
    label: "Qualitative",
    items: [
      { to: "/interview", label: "Interview Insights", icon: "\u2727" },
      { to: "/challenges", label: "Challenges", icon: "\u26A0" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/reports", label: "Reports", icon: "\u2637" },
      { to: "/collaboration", label: "Collaboration", icon: "\u25C8" },
      { to: "/settings", label: "Settings", icon: "\u2699" },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-brand-gradient text-white">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-display font-extrabold text-lg">
            C
          </div>
          <div>
            <div className="font-display font-extrabold text-lg leading-tight tracking-tight">CollabFlow</div>
            <div className="text-[11px] text-white/60 leading-tight">Analytics Platform</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="w-4 text-center">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/50">
        Built from real MSc dissertation research
      </div>
    </aside>
  );
}
