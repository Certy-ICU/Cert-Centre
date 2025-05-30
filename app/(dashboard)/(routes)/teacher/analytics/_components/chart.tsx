"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";

interface ChartProps {
  data: {
    name: string;
    total: number;
  }[];
}

export const Chart = ({
  data
}: ChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const textColor = isDark ? "#e5e7eb" : "#888888";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
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
            labelFormatter={(label) => `Course: ${label}`}
            contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff", borderColor: isDark ? "#374151" : "#e5e7eb" }}
            labelStyle={{ color: isDark ? "#e5e7eb" : "#000" }}
          />
          <Legend wrapperStyle={{ color: textColor }} />
          <Bar
            dataKey="total"
            fill={isDark ? "#38bdf8" : "#0369a1"}
            radius={[4, 4, 0, 0]}
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}