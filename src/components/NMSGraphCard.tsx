import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Label,
  Area,
} from "recharts";
import type { NMSDataPoint } from "../types/nms";

interface Props {
  title: string;
  data: NMSDataPoint[];
  last24h?: string;
}

/* 🎨 Gradients */
const gradients = [
  "linear-gradient(180deg, #1d4ed8, #7c3aed)", // blue → violet
  "linear-gradient(180deg, #0891b2, #16a34a)", // cyan → green
  "linear-gradient(180deg, #d97706, #dc2626)", // amber → red
  "linear-gradient(180deg, #2563eb, #0ea5e9)", // blue → sky
  "linear-gradient(180deg, #db2777, #9333ea)", // pink → purple
  "linear-gradient(180deg, #0f766e, #22c55e)", // teal → green
  "linear-gradient(180deg, #ea580c, #be123c)", // orange → rose
  "linear-gradient(180deg, #4d7c0f, #10b981)", // olive → emerald
  "linear-gradient(180deg, #6d28d9, #2563eb)", // deep purple → blue
  "linear-gradient(180deg, #0284c7, #0f172a)", // sky → navy
  "linear-gradient(180deg, #b91c1c, #f59e0b)", // red → yellow
  "linear-gradient(180deg, #334155, #0f766e)", // slate → teal
  "linear-gradient(180deg, #a21caf, #f97316)", // magenta → orange
  "linear-gradient(180deg, #15803d, #84cc16)", // green → lime
  "linear-gradient(180deg, #4338ca, #f43f5e)", // indigo → rose (NEW)
];

/* 🎯 Matching stroke colors */
const strokeColors = [
  "#1d4ed8", // blue
  "#0891b2", // cyan
  "#d97706", // amber
  "#2563eb", // blue sky
  "#db2777", // pink
  "#0f766e", // teal
  "#ea580c", // orange
  "#4d7c0f", // olive
  "#6d28d9", // deep purple
  "#0284c7", // sky
  "#b91c1c", // red
  "#334155", // slate
  "#a21caf", // magenta
  "#15803d", // green
  "#4338ca", // indigo (NEW)
];

/* 🔒 Stable gradient based on title */
const getIndexFromTitle = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % gradients.length;
};

/* 🕒 Create last 20 timestamps with 0 values */
const createZeroGraphData = (points = 20, gapSeconds = 20): NMSDataPoint[] => {
  const now = new Date();

  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now.getTime() - (points - 1 - i) * gapSeconds * 1000);

    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    const ss = String(t.getSeconds()).padStart(2, "0");

    return {
      timestamp: `${hh}:${mm}:${ss}_local`,
      packetLength: 0,
    } as NMSDataPoint;
  });
};

export const NmsGraphCard: React.FC<Props> = ({ title, data, last24h }) => {
  // ✅ Stable gradient + stroke for same title
  const idx = useMemo(() => getIndexFromTitle(title), [title]);
  const gradient = gradients[idx];
  const stroke = strokeColors[idx];

  // Unique id for area fill
  const fillId = useMemo(
    () => `fill-${title.replace(/\s+/g, "-").toLowerCase()}`,
    [title]
  );

  // ✅ Check if dummy graph
  const isDummy = !data || data.length === 0;

  // ✅ If no data -> generate dummy time + 0 values
  const finalData = useMemo(() => {
    if (isDummy) return createZeroGraphData(20, 20);
    return data.slice(-20);
  }, [data, isDummy]);

  // Styles
  const cardStyle: React.CSSProperties = {
    position: "relative",
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    minHeight: 380,
    height: "100%",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  };

  const leftBorderStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: 6,
    height: "100%",
    background: gradient,
  };

  const bottomBorderStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: "100%",
    height: 6,
    background: gradient,
  };

  const badgeStyle: React.CSSProperties = {
    position: "absolute",
    top: 12,
    right: 16,
    fontSize: 12,
    fontWeight: 700,
    color: stroke,
    background: "#ffffffcc",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${stroke}33`,
    backdropFilter: "blur(6px)",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 26px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
      }}
    >
      {/* LEFT gradient border */}
      <div style={leftBorderStyle} />

      {/* BOTTOM gradient border */}
      <div style={bottomBorderStyle} />

      {/* ✅ Badge (Loading / Last 24h) */}
      <div style={badgeStyle}>
        {isDummy ? "Loading..." : `Last 24h: ${last24h ?? "--"}`}
      </div>

      <h4 style={{ marginBottom: 10, fontWeight: 800, color: "#111827" }}>
        {title}
      </h4>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={finalData}
          margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => String(value).split("_")[0]}
          >
            <Label
              value="Timestamp (HH:MM:SS)"
              position="insideBottom"
              offset={-25}
              style={{
                textAnchor: "middle",
                fill: "#111827",
                fontSize: 14,
                fontWeight: 700,
              }}
            />
          </XAxis>

          <YAxis domain={[0, "auto"]}>
            <Label
              value="Packets Length (In Bytes)"
              angle={-90}
              position="insideLeft"
              offset={10}
              style={{
                textAnchor: "middle",
                fill: "#111827",
                fontSize: 14,
                fontWeight: 700,
              }}
            />
          </YAxis>

          <Tooltip
            labelFormatter={(value) => `Time: ${String(value).split("_")[0]}`}
          />

          {/* Area fill */}
          <Area
            type="monotone"
            dataKey="packetLength"
            stroke={stroke}
            fill={`url(#${fillId})`}
            strokeWidth={2}
            dot={false}
          />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="packetLength"
            stroke={stroke}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
