import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { axiosInstance } from "../../services/axios"; // ✅ fixed path

/* ================= COLORS ================= */

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#fb923c",
  "#a855f7",
  "#06b6d4",
  "#ef4444",
  "#14b8a6",
];

type ChartItem = {
  name: string;
  value: number;
};

/* ================= PAGE ================= */

const LocoDashboardPage: React.FC = () => {
  const [firmData, setFirmData] = useState<ChartItem[]>([]);
  const [versionData, setVersionData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [firmRes, versionRes] = await Promise.all([
          axiosInstance.get("/slamLoco/firmCount"),
          axiosInstance.get("/slamLoco/versionCount"),
        ]);

        const mapData = (arr: Record<string, number>[]): ChartItem[] =>
          arr.map((item) => {
            const [k, v] = Object.entries(item)[0];
            return { name: k, value: Number(v) };
          });

        // Normalize version label to `v<major.minor>` when possible (e.g., "3.2.4" -> "v3.2")
        const normalizeVersion = (name: string): string => {
          const s = String(name);
          // prefer major.minor (e.g., "3.2"), fall back to major
          const m = s.match(/(\d+\.\d+)/) || s.match(/(\d+)/);
          return m ? `v${m[0]}` : s;
        };

        setFirmData(mapData(firmRes.data.data));
        setVersionData(
          mapData(versionRes.data.data).map((item) => ({
            ...item,
            name: normalizeVersion(item.name),
          })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const firmTotal = useMemo(
    () => firmData.reduce((s, d) => s + d.value, 0),
    [firmData],
  );

  const versionTotal = useMemo(
    () => versionData.reduce((s, d) => s + d.value, 0),
    [versionData],
  );

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-6">
        <div className="h-12 w-1/3 bg-gray-200 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded-2xl" />
          <div className="h-80 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* HEADER */}
      <div className="mb-8 rounded-2xl bg-white px-6 py-5 shadow border">
        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          LKavach (OBK) Dashboard (SLAM)
        </h1>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Firm Distribution" total={firmTotal}>
          <DonutChart data={firmData} total={firmTotal} />
        </DashboardCard>

        <DashboardCard title="Kavach Version" total={versionTotal}>
          <DonutChart data={versionData} total={versionTotal} />
        </DashboardCard>
      </div>
    </div>
  );
};

export default LocoDashboardPage;

/* ================= CARD ================= */

const DashboardCard: React.FC<{
  title: string;
  total: number;
  children: React.ReactNode;
}> = ({ title, total, children }) => (
  <div
    className="
      group relative overflow-hidden
      rounded-2xl p-5
      bg-white border shadow-md
      transition-all duration-300
      hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/60
    "
  >
    {/* hover glow */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-100/40 to-purple-100/40 pointer-events-none" />

    <div className="flex justify-between items-center mb-4 relative">
      <h2 className="font-semibold text-slate-700">{title}</h2>
      <div className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full shadow">
        {total}
      </div>
    </div>

    {children}
  </div>
);

/* ================= DONUT ================= */

const DonutChart: React.FC<{
  data: ChartItem[];
  total: number;
}> = ({ data, total }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-400">
        No Data
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* CHART */}
      <div className="relative w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={72}
              outerRadius={105}
              stroke="none"
              animationDuration={1100}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                  style={{
                    transition: "all 0.25s ease",
                    filter:
                      activeIndex === i
                        ? "drop-shadow(0 0 10px rgba(0,0,0,0.25))"
                        : "none",
                  }}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatedNumber value={total} />
        </div>
      </div>

      {/* LEGEND */}
      <div className="mt-4 w-full space-y-1">
        {data.map((d, i) => {
          const percent = ((d.value / total) * 100).toFixed(1);
          const active = activeIndex === i;

          return (
            <div
              key={d.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`
                flex items-center justify-between text-xs px-3 py-2 rounded-lg
                cursor-pointer transition-all duration-200
                ${
                  active
                    ? "bg-blue-50 shadow-md scale-[1.02]"
                    : "bg-gray-50 hover:bg-white hover:shadow-sm"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium">{d.name}</span>
              </div>

              <span className="text-gray-500">
                {d.value} • {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= COUNTER ================= */

const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({
  value,
  className,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(value / 20));

    const id = setInterval(() => {
      start += step;
      if (start >= value) {
        start = value;
        clearInterval(id);
      }
      setDisplay(start);
    }, 25);

    return () => clearInterval(id);
  }, [value]);

  // Minimal center: only the number, no background, border or label
  return (
    <div className={`pointer-events-none ${className ?? ""}`}>
      <div className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-none">
        {display}
      </div>
    </div>
  );
};
//
