import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

export interface ChartItem {
  name: string;
  value: number;
}

interface Props {
  data: ChartItem[];
  total: number;
}

const COLORS = [
  "#28B0B8",
  "#257ED6",
  "#E63946",
  "#B5175E",
  "#FA8223",
  "#A1C349",
];

const renderNeedle = (props: any, angle: number) => {
  const { cx, cy, outerRadius } = props;

  const RADIAN = Math.PI / 180;

  const length = outerRadius - 25;

  const x = cx + length * Math.cos(-angle * RADIAN);

  const y = cy + length * Math.sin(-angle * RADIAN);

  return (
    <g>
      <line x1={cx} y1={cy} x2={x} y2={y} stroke="#374151" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={4} fill="#374151" />
    </g>
  );
};

const DrillDonutChart: React.FC<Props> = ({ data, total }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [needleAngle, setNeedleAngle] = useState(0);

  const [pieProps, setPieProps] = useState<any>(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-400">
        No Data Available
      </div>
    );
  }

  return (
    <div className="w-full h-full focus:outline-none">
      <div className="h-[380px]">
        {data.length <= 8 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as any}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                stroke="none"
                onMouseEnter={(entry: any, index: number) => {
                  setActiveIndex(index);

                  setPieProps(entry);

                  setNeedleAngle((entry.startAngle + entry.endAngle) / 2);
                }}
                onMouseLeave={() => {
                  setActiveIndex(null);
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.35
                    }
                  />
                ))}
              </Pie>

              {pieProps && renderNeedle(pieProps, needleAngle)}

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,

                right: 20,

                left: 0,

                bottom: 100,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
                tick={{
                  fontSize: 12,

                  fill: "#374151",
                }}
              />

              <YAxis
                tick={{
                  fontSize: 12,

                  fill: "#374151",
                }}
              />

              <Tooltip />

              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                <LabelList dataKey="." position="top" fontSize={11} />

                {data.map((item, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DrillDonutChart;
