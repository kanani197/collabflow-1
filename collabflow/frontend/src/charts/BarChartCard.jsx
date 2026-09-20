import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

const PALETTE = ["#7c3aed", "#06b6d4", "#f97316", "#10b981", "#f43f5e", "#6d28d9", "#0891b2"];

export default function BarChartCard({ data, dataKey = "value", nameKey = "name", height = 260,
  colorful = true, horizontal = false, domain, formatter, title, subtitle }) {
  return (
    <div className="card">
      {title && <div className="font-display font-bold text-ink-900 mb-0.5">{title}</div>}
      {subtitle && <div className="text-xs text-ink-500 mb-3">{subtitle}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 5, right: 15, left: horizontal ? 40 : 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eeeef5" />
          {horizontal ? (
            <>
              <XAxis type="number" domain={domain} stroke="#8a8aa3" fontSize={12} />
              <YAxis type="category" dataKey={nameKey} stroke="#8a8aa3" fontSize={12} width={120} />
            </>
          ) : (
            <>
              <XAxis dataKey={nameKey} stroke="#8a8aa3" fontSize={12} />
              <YAxis domain={domain} stroke="#8a8aa3" fontSize={12} />
            </>
          )}
          <Tooltip
            formatter={formatter}
            contentStyle={{ borderRadius: 12, border: "1px solid #eeeef5", boxShadow: "0 8px 24px -8px rgba(76,29,149,0.15)" }}
          />
          <Bar dataKey={dataKey} radius={[8, 8, 8, 8]} maxBarSize={48}>
            {colorful &&
              data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            <LabelList dataKey={dataKey} position={horizontal ? "right" : "top"} style={{ fontSize: 11, fill: "#4b4b66", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PALETTE };
