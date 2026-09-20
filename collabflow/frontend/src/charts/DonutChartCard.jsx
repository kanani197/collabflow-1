import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PALETTE } from "./BarChartCard";

export default function DonutChartCard({ data, title, subtitle, height = 260 }) {
  return (
    <div className="card">
      {title && <div className="font-display font-bold text-ink-900 mb-0.5">{title}</div>}
      {subtitle && <div className="text-xs text-ink-500 mb-3">{subtitle}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={3}
            cornerRadius={6}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eeeef5" }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
