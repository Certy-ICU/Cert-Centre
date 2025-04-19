"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";

interface TimeSeriesChartProps {
  data: {
    name: string; // Date (YYYY-MM-DD)
    revenue: number;
  }[];
}

export const TimeSeriesChart = ({
  data
}: TimeSeriesChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const textColor = isDark ? "#e5e7eb" : "#888888";
  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const lineColor = isDark ? "#38bdf8" : "#0369a1";

  // Format the date for better display
  const formattedData = data.map(item => ({
    ...item,
    name: new Date(item.name).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="name"
            stroke={textColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={textColor}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => [`$${value}`, 'Revenue']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff", borderColor: isDark ? "#374151" : "#e5e7eb" }}
            labelStyle={{ color: isDark ? "#e5e7eb" : "#000" }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 3, fill: lineColor }}
            activeDot={{ r: 8, fill: lineColor }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
} 