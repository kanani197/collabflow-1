import React from "react";

const ACCENTS = {
  brand: "from-brand-500 to-brand-700",
  aqua: "from-aqua-400 to-aqua-600",
  ember: "from-ember-400 to-ember-600",
  leaf: "from-leaf-400 to-leaf-600",
  rose: "from-rose-400 to-rose-600",
  ink: "from-ink-400 to-ink-800",
};

export default function StatCard({ label, value, sublabel, accent = "brand", icon }) {
  return (
    <div className="stat-card">
      <div
        className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${ACCENTS[accent]} opacity-10`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</span>
        {icon && (
          <span
            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ACCENTS[accent]} text-white flex items-center justify-center text-sm shadow-sm`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="font-display font-extrabold text-2xl text-ink-900 mt-1">{value}</div>
      {sublabel && <div className="text-xs text-ink-500">{sublabel}</div>}
    </div>
  );
}
