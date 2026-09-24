import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface EChartProps {
  option: any;
  style?: React.CSSProperties;
}

export const EChart: React.FC<EChartProps> = ({ option, style }) => {
  const chartType = option?.series?.[0]?.type || "line";

  const data =
    option?.series?.[0]?.data?.map((value: any, index: number) => ({
      name: option?.xAxis?.data?.[index] || `Item ${index + 1}`,
      value: typeof value === "object" ? value.value : value,
    })) || [];

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <ResponsiveContainer width="100%" height={400} style={style}>
      {chartType === "bar" ? (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill={colors[0]} />
        </BarChart>
      ) : chartType === "pie" ? (
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ) : (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            strokeWidth={2}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};
