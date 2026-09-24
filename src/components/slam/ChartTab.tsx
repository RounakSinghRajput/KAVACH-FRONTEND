import React, { useEffect, useState, useMemo } from "react";
import { axiosInstance } from "../../services/axios";
import DrillDonutChart from "./DrillDonutChart";

interface Props {
  type: "firm" | "locoType" | "manufacturer";
  tab: string;
  value: string;
}

type ChartItem = {
  name: string;
  value: number;
};

const COLOR_PALETTE = [
  "#009999",
  "#33CCCC",
  "#1A2B3D",
  "#8C959A",

  "#9D005A",
  "#EE6A43",
  "#2E8B57",
  "#004E85",

  "#DF0068",
  "#F59D31",
  "#8BBF5D",
  "#1C85C8",
];

const ChartTab: React.FC<Props> = ({ type, tab, value }) => {
  const [data, setData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data],
  );
  const isBarChart = tab === "Zone" || tab === "Shed" || data.length > 8;

  // Map each item to a color and pre-calculate percentage
  const formattedDataWithColors = useMemo(() => {
    return data.map((item, index) => {
      const percentage =
        total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
      return {
        ...item,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        percentage: Number(percentage),
      };
    });
  }, [data, total]);

  const getEndpoint = () => {
    if (type === "firm") {
      switch (tab) {
        case "Zone":
          return `/slamLoco/zone/${value}`;
        case "Shed":
          return `/slamLoco/shed/${value}`;
        case "Loco Type":
          return `/slamLoco/locoType/${value}`;
        case "Manufacturer":
          return `/slamLoco/manufacturer/${value}`;
        case "Year":
          return `/slamLoco/year/${value}`;
      }
    }

    if (type === "locoType") {
      switch (tab) {
        case "Zone":
          return `/slamLoco/zone/locotype/${value}`;
        case "Shed":
          return `/slamLoco/shed/locotype/${value}`;
        case "Manufacturer":
          return `/slamLoco/manufacturer/locotype/${value}`;
        case "Firm":
          return `/slamLoco/firm/locotype/${value}`;
        case "Year":
          return `/slamLoco/year/locotype/${value}`;
      }
    }

    if (type === "manufacturer") {
      switch (tab) {
        case "Zone":
          return `/slamLoco/zone/manu/${value}`;
        case "Shed":
          return `/slamLoco/shed/manu/${value}`;
        case "Firm":
          return `/slamLoco/firm/manu/${value}`;
        case "Loco Type":
          return `/slamLoco/locotype/manu/${value}`;
        case "Year":
          return `/slamLoco/year/manu/${value}`;
      }
    }

    return "";
  };

  useEffect(() => {
    const endpoint = getEndpoint();
    if (!endpoint) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(endpoint);
        const rawData = res.data.data || [];

        const formattedData: ChartItem[] = rawData.map((item: any) => {
          const key = Object.keys(item)[0];
          return {
            name: key,
            value: Number(item[key]),
          };
        });

        setData(formattedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [type, tab, value]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-medium tracking-wide">
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Loading breakdown...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {tab} <span className="text-indigo-600 font-medium">/ {value}</span>
        </h2>
        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200">
          Total: {total.toLocaleString()} Locos
        </span>
      </div>

      {/* TOP SECTION: Donut Chart + Table Side-by-Side or Full Chart */}
      {!isBarChart ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 transition-all">
          <h3 className="font-bold text-base text-slate-800 tracking-wide mb-3">
            {tab} Distribution
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT CARD */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold mb-3">{tab} Distribution</h3>
              <div className="flex justify-center pt-4">
                <DrillDonutChart data={formattedDataWithColors} total={total} />
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold mb-4">{tab} Breakdown</h3>
              <div className="overflow-x-auto max-h-[380px]">
                <table className="min-w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm border-b border-slate-400 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">{tab}</th>
                      <th className="px-4 py-3 text-right w-28">Locos</th>
                      <th className="px-4 py-3 text-right w-24">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {formattedDataWithColors.map((row, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          {row.name}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-700">
                          {row.value.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <h3 className="font-bold text-base text-slate-800 tracking-wide mb-5">
            {tab} Distribution
          </h3>
          <div className="w-full flex justify-center py-2">
            <DrillDonutChart data={formattedDataWithColors} total={total} />
          </div>
        </div>
      )}

      {/* BOTTOM SECTION: Full Summary Table (For Bar Chart views) */}
      {isBarChart && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-800 tracking-wide">
              All {tab} Breakdown
            </h3>
          </div>

          <div className="overflow-hidden border border-slate-200/80 rounded-xl">
            <div className="overflow-auto max-h-[420px]">
              <table className="min-w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">{tab}</th>
                    <th className="px-4 py-3 text-right w-32">Locos</th>
                    <th className="px-4 py-3 text-right w-28">%</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {formattedDataWithColors.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        {row.value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center justify-end px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {row.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="sticky bottom-0 bg-slate-100 border-t-2 border-slate-200/90 font-bold text-slate-800">
                  <tr>
                    <td className="px-4 py-3 text-slate-900">Total</td>
                    <td className="px-4 py-3 text-right text-slate-900">
                      {total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-700">
                      100%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTab;
