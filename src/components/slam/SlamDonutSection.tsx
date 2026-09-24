import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { axiosInstance } from "../../services/axios";
import DrillDownModal from "../../components/slam/DrillDownModal";

/* ================= COLORS ================= */

const COLORS = [
  "#DC2626",
  "#F97316",
  "#FACC15",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];

/* ================= TYPES ================= */

type ChartItem = {
  name: string;
  value: number;
};

// Expanded chartType union to include "installationProgress"
type ChartType = "firm" | "locoType" | "manufacturer";

/* ================= NEEDLE ================= */

const renderNeedle = (props: any, angle: number) => {
  const { cx, cy, outerRadius } = props;
  const RADIAN = Math.PI / 180;

  const length = outerRadius - 55;

  const x = cx + length * Math.cos(-angle * RADIAN);
  const y = cy + length * Math.sin(-angle * RADIAN);

  return (
    <g>
      <line
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke="#1f2937"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill="#1f2937" />
    </g>
  );
};

/* ================= CARD ================= */
const DashboardCard: React.FC<{
  title: string;
  total: number;
  children: React.ReactNode;
}> = ({ title, total, children }) => (
  <div
    className="
      bg-white 
      rounded-xl 
      p-4 
      shadow-sm 
      transition-all 
      duration-300 
      hover:shadow-lg 
      hover:-translate-y-1
      border
      hover:border-indigo-200
    "
  >
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-xs font-semibold tracking-wide">{title}</h2>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 font-medium">Total:</span>

        <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-full">
          {total}
        </span>
      </div>
    </div>

    {children}
  </div>
);

/* ================= DONUT + BAR ================= */

const DonutChart: React.FC<{
  data: ChartItem[];
  total: number;
  chartType?: ChartType;
  onSliceClick?: (type: ChartType, value: string, total: number) => void;
}> = ({ data, total, chartType, onSliceClick }) => {
  const [needleAngle, setNeedleAngle] = useState(0);
  const [pieProps, setPieProps] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ✅ attach color + original index
  const enrichedData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    originalIndex: index,
  }));

  // sort BUT keep color
  const sortedData = [...enrichedData].sort((a, b) => b.value - a.value);

  if (!data.length) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
        No Data
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-4 w-full">
      {/* DONUT */}
      <div className="relative w-full max-w-[200px] aspect-square mx-auto md:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enrichedData}
              dataKey="value"
              innerRadius="40%"
              outerRadius="80%"
              stroke="none"
              onMouseEnter={(entry: any, index: number) => {
                const midAngle = (entry.startAngle + entry.endAngle) / 2;
                setNeedleAngle(midAngle);
                setPieProps(entry);
                setActiveIndex(index);
              }}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(entry: any) => {
                if (chartType && onSliceClick) {
                  onSliceClick(chartType, entry.name, entry.value);
                }
              }}
            >
              {enrichedData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                />
              ))}
            </Pie>

            {pieProps && renderNeedle(pieProps, needleAngle)}
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* DIVIDER */}
      <div className="hidden md:block w-[2px] h-40 bg-gray-400 opacity-80" />

      {/* DETAILS */}
      <div className="w-full md:flex-1 space-y-3">
        {sortedData.map((item) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0;
          const isActive = activeIndex === item.originalIndex;

          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(item.originalIndex)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`transition-all duration-300 ${
                isActive ? "scale-[1.02]" : "opacity-70"
              }`}
            >
              <div className="flex justify-between text-[11px] mb-1">
                <span className="truncate capitalize">
                  {item.name.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span>{percent.toFixed(0)}%</span>
              </div>

              <div className="w-full h-[4px] bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ================= MAIN SECTION ================= */

const SlamDonutSection: React.FC = () => {
  const [firmData, setFirmData] = useState<ChartItem[]>([]);
  const [locoTypeData, setLocoTypeData] = useState<ChartItem[]>([]);
  const [manufacturerData, setManufacturerData] = useState<ChartItem[]>([]);
  const [brakeTypeData, setBrakeTypeData] = useState<ChartItem[]>([]);
  const [versionData, setVersionData] = useState<ChartItem[]>([]);
  const [installationProgressData, setInstallationProgressData] = useState<
    ChartItem[]
  >([]);
  const [installationTotal, setInstallationTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ChartType>("firm");
  const [selectedValue, setSelectedValue] = useState("");
  const [selectedTotal, setSelectedTotal] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          firmRes,
          versionRes,
          locoTypeRes,
          manufacturerRes,
          brakeTypeRes,
          installationProgressRes,
        ] = await Promise.all([
          axiosInstance.get("/slamLoco/firmCount"),
          axiosInstance.get("/slamLoco/versionCount"),
          axiosInstance.get("/slamLoco/locoTypeCount"),
          axiosInstance.get("/slamLoco/manufacturerCount"),
          axiosInstance.get("/slamLoco/brakeTypeCount"),
          axiosInstance.get("/slamLoco/installation-progress"),
        ]);

        const mapData = (arr: Record<string, number>[]): ChartItem[] =>
          arr.map((item) => {
            const [k, v] = Object.entries(item)[0];
            return { name: k, value: Number(v) };
          });

        setFirmData(mapData(firmRes.data.data));
        setVersionData(mapData(versionRes.data.data));
        setLocoTypeData(mapData(locoTypeRes.data.data));
        setManufacturerData(mapData(manufacturerRes.data.data));
        setBrakeTypeData(mapData(brakeTypeRes.data.data));

        // Format installation progress response object into ChartItem array
        const instDataObj = installationProgressRes.data;
        if (instDataObj) {
          const progressItems: ChartItem[] = Object.entries(instDataObj)
            .filter(([key]) => key !== "total") // Omit total from slice dataset
            .map(([key, value]) => ({
              name: key,
              value: Number(value),
            }));

          setInstallationProgressData(progressItems);
          setInstallationTotal(
            instDataObj.total ??
              progressItems.reduce((acc, curr) => acc + curr.value, 0),
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calcTotal = (arr: ChartItem[]) => arr.reduce((s, d) => s + d.value, 0);

  const handleSliceClick = (type: ChartType, value: string, total: number) => {
    setSelectedType(type);
    setSelectedValue(value);
    setSelectedTotal(total);
    setOpenModal(true);
  };

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
      {/* Row 1 */}
      <DashboardCard title="Firm Distribution" total={calcTotal(firmData)}>
        <DonutChart
          data={firmData}
          total={calcTotal(firmData)}
          chartType="firm"
          onSliceClick={handleSliceClick}
        />
      </DashboardCard>

      <DashboardCard title="Loco Type" total={calcTotal(locoTypeData)}>
        <DonutChart
          data={locoTypeData}
          total={calcTotal(locoTypeData)}
          chartType="locoType"
          onSliceClick={handleSliceClick}
        />
      </DashboardCard>

      {/* Row 2 */}
      <DashboardCard
        title="Manufacturer Type"
        total={calcTotal(manufacturerData)}
      >
        <DonutChart
          data={manufacturerData}
          total={calcTotal(manufacturerData)}
          chartType="manufacturer"
          onSliceClick={handleSliceClick}
        />
      </DashboardCard>

      <DashboardCard title="Kavach Installed Status" total={installationTotal}>
        <DonutChart
          data={installationProgressData}
          total={installationTotal}
          // chartType="installationProgress"
          // onSliceClick={handleSliceClick}
        />
      </DashboardCard>

      {/* Row 3 */}
      <DashboardCard title="Brake Type" total={calcTotal(brakeTypeData)}>
        <DonutChart data={brakeTypeData} total={calcTotal(brakeTypeData)} />
      </DashboardCard>

      <DashboardCard title="Kavach Version" total={calcTotal(versionData)}>
        <DonutChart data={versionData} total={calcTotal(versionData)} />
      </DashboardCard>

      <DrillDownModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        type={selectedType}
        value={selectedValue}
        total={selectedTotal}
      />
    </div>
  );
};

export default SlamDonutSection;
