import React, { useState } from "react";
import {
  TrainFront,
  Wifi,
  WifiOff,
  BarChart3,
  GitFork,
  PieChart,
  LayoutGrid,
} from "lucide-react";

interface LocoBreakdownProps {
  totalRunning?: number;
  insideKavach?: number;
  outsideKavach?: number;
  commissioned?: number;
  nonCommissioned?: number;
  nmsConnectedInside?: number;
  nmsDisconnectedInside?: number;
}

export default function LocoBreakdownSection({
  totalRunning = 1250,
  insideKavach = 900,
  outsideKavach = 350,
  commissioned = 600,
  nonCommissioned = 300,
  nmsConnectedInside = 210,
  nmsDisconnectedInside = 90,
}: LocoBreakdownProps) {
  const [activeView, setActiveView] = useState<
    "waterfall" | "tree" | "donut" | "flow"
  >("waterfall");

  const getPercent = (val: number, base: number): string => {
    if (!base || base === 0) return "0.0";
    return ((val / base) * 100).toFixed(1);
  };

  const getPercentValue = (val: number, base: number): number => {
    if (!base || base === 0) return 0;
    return (val / base) * 100;
  };

  const insidePercent = Number(getPercent(insideKavach, totalRunning));
  const outsidePercent = Number(getPercent(outsideKavach, totalRunning));

  // Donut SVG circumference math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashInside = (insidePercent / 100) * circumference;
  const strokeDashOutside = circumference - strokeDashInside;

  return (
    <section className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden w-full">
      {/* HEADER & VIEW TOGGLES */}
      <div className="h-14 px-6 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <TrainFront className="w-4 h-4 text-blue-700" />
          </div>
          <h2 className="text-base font-bold text-blue-900 tracking-tight">
            CoA RUNNING LOCO BREAKDOWN
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView("waterfall")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeView === "waterfall"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Waterfall
            </button>

            <button
              type="button"
              onClick={() => setActiveView("tree")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeView === "tree"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Tree
            </button>

            <button
              type="button"
              onClick={() => setActiveView("donut")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeView === "donut"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Donut + Detail
            </button>
          </div>

          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs hidden sm:block">
            CoA – Running Locos
          </div>
        </div>
      </div>

      {/* VIEW CANVAS CONTAINER */}
      <div className="p-6 overflow-x-auto min-h-[380px] flex items-center justify-center bg-slate-50/50">
        {activeView === "waterfall" && (
          <div className="w-full p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
            {/* HEADER */}
            <div className="mb-3 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Step-wise Waterfall Breakdown
              </h3>

              <p className="text-[11px] text-slate-500 mt-0.5">
                Hierarchical distribution from Total Running Locos down to NMS
                status
              </p>
            </div>

            {/* WATERFALL CANVAS */}
            <div className="relative w-full h-[390px] overflow-visible">
              {/* ===================================================== */}
              {/* STEP 01 */}
              {/* ===================================================== */}

              <div
                className="
          absolute
          left-0
          top-0
          w-[24%]
          h-[205px]
          rounded-lg
          border border-blue-100
          bg-slate-50/60
          p-3
          shadow-sm
        "
              >
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-slate-400">
                  STEP 01 • BASELINE
                </span>

                <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                  Total Running Locos
                </h4>

                <p className="text-[10px] text-slate-400">COA System Total</p>

                <div className="absolute left-0 right-0 bottom-4 flex flex-col items-center">
                  <div className="text-[10px] font-bold text-blue-900 mb-1">
                    100%
                  </div>

                  <div
                    className="w-8 bg-blue-900 rounded-t-md"
                    style={{ height: "78px" }}
                  />

                  <div className="w-28 h-px bg-slate-300" />

                  <div className="text-base font-black text-blue-900 mt-1">
                    {totalRunning.toLocaleString()}
                  </div>

                  <div className="text-[10px] font-medium text-slate-600">
                    Total Running Locos
                  </div>
                </div>
              </div>

              {/* ===================================================== */}
              {/* CONNECTOR 1 (Starts at right edge Step 1, ends at top edge Step 2) */}
              {/* ===================================================== */}

              <svg
                className="absolute left-[20%] top-[25px] w-[13%] h-[32px] z-20 pointer-events-none overflow-visible"
                viewBox="0 0 100 32"
                fill="none"
              >
                <circle
                  cx="0"
                  cy="2"
                  r="3.5"
                  fill="white"
                  stroke="#2563eb"
                  strokeWidth="2"
                />
                <path
                  d="M 3.5 2 H 75 Q 98 2 98 20 V 26"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 93 20 L 98 29 L 103 20"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* ===================================================== */}
              {/* STEP 02 */}
              {/* ===================================================== */}

              <div
                className="
          absolute
          left-[25.33%]
          top-[55px]
          w-[24%]
          h-[205px]
          rounded-lg
          border border-amber-100
          bg-amber-50/20
          text-black
          p-3
          shadow-sm
        "
              >
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-amber-600">
                  STEP 02 • KAVACH AREA SPLIT
                </span>

                <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                  Kavach Area Breakdown
                </h4>

                <div className="absolute left-0 right-0 bottom-4 flex items-end justify-center gap-6">
                  {/* OUTSIDE */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-amber-600 mb-1">
                      {getPercent(outsideKavach, totalRunning)}%
                    </div>

                    <div
                      className="w-8 bg-amber-500 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          25,
                          getPercentValue(outsideKavach, totalRunning) * 0.78,
                        )}px`,
                      }}
                    />

                    <div className="w-16 h-px bg-slate-200" />

                    <div className="text-sm font-black text-amber-700 mt-1">
                      {outsideKavach.toLocaleString()}
                    </div>

                    <div className="text-[10px] font-medium text-slate-600">
                      Outside
                    </div>
                  </div>

                  {/* INSIDE */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-blue-600 mb-1">
                      {getPercent(insideKavach, totalRunning)}%
                    </div>

                    <div
                      className="w-8 bg-blue-600 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          25,
                          getPercentValue(insideKavach, totalRunning) * 0.78,
                        )}px`,
                      }}
                    />

                    <div className="w-16 h-px bg-slate-200" />

                    <div className="text-sm font-black text-blue-700 mt-1">
                      {insideKavach.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-semibold text-black">
                      Inside
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[9px] px-2 py-1 rounded bg-transparent border border-amber-100">
                  <span className="text-slate-500">Target:</span>

                  <span className="font-semibold text-slate-700">
                    {totalRunning.toLocaleString()} Locos
                  </span>
                </div>
              </div>

              {/* ===================================================== */}
              {/* CONNECTOR 2 (Starts at right edge Step 2, ends at top edge Step 3) */}
              {/* ===================================================== */}

              <svg
                className="absolute left-[45.33%] top-[80px] w-[13%] h-[32px] z-20 pointer-events-none overflow-visible"
                viewBox="0 0 100 32"
                fill="none"
              >
                <circle
                  cx="0"
                  cy="2"
                  r="3.5"
                  fill="white"
                  stroke="#d97706"
                  strokeWidth="2"
                />
                <path
                  d="M 3.5 2 H 75 Q 98 2 98 20 V 26"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 93 20 L 98 29 L 103 20"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* ===================================================== */}
              {/* STEP 03 */}
              {/* ===================================================== */}

              <div
                className="
          absolute
          left-[50.66%]
          top-[110px]
          w-[24%]
          h-[205px]
          rounded-lg
          border border-blue-100
          bg-blue-50/20
          p-3
          shadow-sm
        "
              >
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-blue-600">
                  STEP 03 • COMMISSIONING
                </span>

                <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                  Status (Inside Kavach)
                </h4>

                <div className="absolute left-0 right-0 bottom-4 flex items-end justify-center gap-6">
                  {/* NON COMMISSIONED */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-orange-600 mb-1">
                      {getPercent(nonCommissioned, insideKavach)}%
                    </div>

                    <div
                      className="w-8 bg-orange-500 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          25,
                          getPercentValue(nonCommissioned, insideKavach) * 0.78,
                        )}px`,
                      }}
                    />

                    <div className="w-16 h-px bg-slate-200" />

                    <div className="text-sm font-black text-orange-700 mt-1">
                      {nonCommissioned.toLocaleString()}
                    </div>

                    <div className="text-[10px] text-black-600">
                      Non-Commissioned
                    </div>
                  </div>

                  {/* COMMISSIONED */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-sky-600 mb-1">
                      {getPercent(commissioned, insideKavach)}%
                    </div>

                    <div
                      className="w-8 bg-sky-500 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          25,
                          getPercentValue(commissioned, insideKavach) * 0.78,
                        )}px`,
                      }}
                    />

                    <div className="w-16 h-px bg-slate-200" />

                    <div className="text-sm font-black text-sky-700 mt-1">
                      {commissioned.toLocaleString()}
                    </div>

                    <div className="text-[10px] text-black-600">
                      Commissioned
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[9px] px-2 py-1 rounded bg-transparent border border-blue-100">
                  <span className="text-slate-500">Target:</span>

                  <span className="font-semibold text-slate-700">
                    {insideKavach.toLocaleString()} Locos
                  </span>
                </div>
              </div>

              {/* ===================================================== */}
              {/* CONNECTOR 3 (Starts at right edge Step 3, ends at top edge Step 4) */}
              {/* ===================================================== */}

              <svg
                className="absolute left-[70.66%] top-[135px] w-[13%] h-[32px] z-20 pointer-events-none overflow-visible"
                viewBox="0 0 100 32"
                fill="none"
              >
                <circle
                  cx="0"
                  cy="2"
                  r="3.5"
                  fill="white"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
                <path
                  d="M 3.5 2 H 75 Q 98 2 98 20 V 26"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 93 20 L 98 29 L 103 20"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* ===================================================== */}
              {/* STEP 04 */}
              {/* ===================================================== */}

              <div
                className="
          absolute
          left-[76%]
          top-[165px]
          w-[24%]
          h-[205px]
          rounded-lg
          border border-emerald-100
          bg-emerald-50/20
          p-3
          shadow-sm
        "
              >
                <span className="text-[8px] font-extrabold tracking-wider uppercase text-emerald-600">
                  STEP 04 • NMS CONNECTIVITY
                </span>

                <h4 className="text-xs font-bold text-slate-800 mt-0.5">
                  Network (Commissioned Locos)
                </h4>

                <div className="absolute left-0 right-0 bottom-4 flex items-end justify-center gap-6">
                  {/* DISCONNECTED */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-rose-600 mb-1">
                      {getPercent(nmsDisconnectedInside, commissioned)}%
                    </div>

                    <div
                      className="w-8 bg-rose-500 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          25,
                          getPercentValue(nmsDisconnectedInside, commissioned) *
                            0.78,
                        )}px`,
                      }}
                    />

                    <div className="w-16 h-px bg-slate-200" />

                    <div className="text-sm font-black text-rose-600 mt-1">
                      {nmsDisconnectedInside.toLocaleString()}
                    </div>

                    <div className="text-[10px] text-black">Disconnected</div>
                  </div>

                  {/* CONNECTED */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-emerald-600 mb-1">
                      {getPercent(nmsConnectedInside, commissioned)}%
                    </div>

                    <div
                      className="w-8 bg-emerald-500 rounded-t-md"
                      style={{
                        height: `${Math.max(
                          25,
                          getPercentValue(nmsConnectedInside, commissioned) *
                            0.78,
                        )}px`,
                      }}
                    />

                    <div className="w-16 h-px bg-slate-200" />

                    <div className="text-sm font-black text-emerald-600 mt-1">
                      {nmsConnectedInside.toLocaleString()}
                    </div>

                    <div className="text-[10px] text-black-600">Connected</div>
                  </div>
                </div>

                <div className="absolute bottom-1.5 left-2 right-2 flex justify-between text-[9px] px-2 py-1 rounded bg-transparent border border-emerald-100">
                  <span className="text-slate-500">Target:</span>

                  <span className="font-semibold text-slate-700">
                    {commissioned.toLocaleString()} Locos
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* VIEW 2: HIERARCHICAL TREE */}
        {activeView === "tree" && (
          <div className="w-full min-w-[800px] p-6 bg-white rounded-xl border border-blue-100 shadow-sm flex flex-col items-center">
            <div className="w-full text-left mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Hierarchical Tree Diagram
              </h3>
              <p className="text-xs text-slate-500">
                Tree view of running locos, Kavach coverage and NMS status
              </p>
            </div>

            {/* LEVEL 1: Root */}
            <div className="bg-blue-900 text-white rounded-xl px-8 py-3 text-center shadow-md border border-blue-950 min-w-[280px]">
              <div className="text-xs font-extrabold uppercase tracking-wide">
                Total Running Locos (COA)
              </div>
              <div className="text-lg font-black mt-0.5">
                {totalRunning.toLocaleString()}{" "}
                <span className="text-xs font-normal text-blue-200">
                  (100%)
                </span>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-300" />
            <div className="w-[50%] h-0.5 bg-slate-300" />

            {/* LEVEL 2 */}
            <div className="w-full flex justify-around relative pt-6">
              <div className="absolute top-0 left-[25%] w-0.5 h-6 bg-slate-300" />
              <div className="absolute top-0 right-[25%] w-0.5 h-6 bg-slate-300" />

              {/* Inside Kavach */}
              <div className="flex flex-col items-center w-[48%]">
                <div className="w-full bg-sky-50 border border-sky-300 text-sky-950 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xs font-bold uppercase">
                    Inside Kavach Area
                  </div>
                  <div className="text-base font-black">
                    {insideKavach.toLocaleString()}{" "}
                    <span className="text-xs text-sky-700">
                      ({getPercent(insideKavach, totalRunning)}%)
                    </span>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-slate-300" />
                <div className="w-[70%] h-0.5 bg-slate-300" />

                {/* LEVEL 3 */}
                <div className="w-full flex justify-between relative pt-6 gap-2">
                  <div className="absolute top-0 left-[25%] w-0.5 h-6 bg-slate-300" />
                  <div className="absolute top-0 right-[25%] w-0.5 h-6 bg-slate-300" />

                  {/* Commissioned */}
                  <div className="w-[48%] bg-emerald-50 border border-red-300 text-red-950 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-xs font-bold">Non-Commissioned</div>
                    <div className="text-sm font-black">
                      {nonCommissioned.toLocaleString()}{" "}
                      <span className="text-[10px] text-red-700">
                        ({getPercent(nonCommissioned, insideKavach)}%)
                      </span>
                    </div>
                  </div>

                  {/* Non-commissioned */}
                  <div className="flex flex-col items-center w-[48%]">
                    <div className="w-full bg-orange-50 border border-green-300 text-green-950 rounded-xl p-2.5 text-center shadow-sm">
                      <div className="text-xs font-bold">Commissioned</div>
                      <div className="text-sm font-black">
                        {commissioned.toLocaleString()}{" "}
                        <span className="text-[10px] text-green-700">
                          ({getPercent(commissioned, insideKavach)}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-0.5 h-6 bg-slate-300" />
                    <div className="w-[80%] h-0.5 bg-slate-300" />

                    {/* LEVEL 4 */}
                    <div className="w-full flex justify-between relative pt-6 gap-2">
                      <div className="absolute top-0 left-[25%] w-0.5 h-6 bg-slate-300" />
                      <div className="absolute top-0 right-[25%] w-0.5 h-6 bg-slate-300" />

                      <div className="w-[48%] bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-xl p-2 text-center shadow-sm">
                        <div className="text-[11px] font-bold">
                          NMS Connected
                        </div>
                        <div className="text-xs font-black">
                          {nmsConnectedInside.toLocaleString()}
                        </div>
                      </div>

                      <div className="w-[48%] bg-rose-50 border border-rose-200 text-rose-950 rounded-xl p-2 text-center shadow-sm">
                        <div className="text-[11px] font-bold">
                          NMS Disconnected
                        </div>
                        <div className="text-xs font-black">
                          {nmsDisconnectedInside.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Outside Kavach */}
              <div className="w-[40%]">
                <div className="w-full bg-amber-50 border border--300 text-amber-950 rounded-xl p-3 text-center shadow-sm">
                  <div className="text-xs font-bold uppercase">
                    Outside Kavach Area
                  </div>
                  <div className="text-base font-black">
                    {outsideKavach.toLocaleString()}{" "}
                    <span className="text-xs text-amber-700">
                      ({getPercent(outsideKavach, totalRunning)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DONUT + DETAIL */}
        {activeView === "donut" && (
          <div className="w-full min-w-[800px] p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-bold text-slate-800">
                Combination View – Donut + Detail
              </h3>
              <p className="text-xs text-slate-500">
                Overall view with detailed split of non-commissioned locos
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6 items-center">
              {/* DYNAMIC SVG DONUT CHART */}
              <div className="col-span-5 flex flex-col items-center justify-center p-4 border-r border-slate-100">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 160 160"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      className="text-amber-400"
                      strokeWidth="18"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      className="text-sky-500"
                      strokeWidth="18"
                      strokeDasharray={`${strokeDashInside} ${strokeDashOutside}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">
                      Total Running Locos
                    </p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">
                      {totalRunning.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    Inside Kavach ({insidePercent}%)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    Outside Kavach ({outsidePercent}%)
                  </div>
                </div>
              </div>

              {/* BREAKDOWN CARDS */}
              <div className="col-span-7 flex flex-col gap-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-sky-900 uppercase mb-3">
                    Locos inside Kavach Area ({insideKavach.toLocaleString()})
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-emerald-600 text-white rounded-lg p-3">
                      <p className="text-lg font-black">
                        {getPercent(commissioned, insideKavach)}%
                      </p>
                      <p className="text-[11px] font-medium opacity-90 mt-0.5">
                        Commissioned ({commissioned.toLocaleString()})
                      </p>
                    </div>

                    <div className="bg-orange-500 text-white rounded-lg p-3">
                      <p className="text-lg font-black">
                        {getPercent(nonCommissioned, insideKavach)}%
                      </p>
                      <p className="text-[11px] font-medium opacity-90 mt-0.5">
                        Non-commissioned ({nonCommissioned.toLocaleString()})
                      </p>
                    </div>
                  </div>
                </div>
                {/* CONNECTOR ARROW SECTION */}
                <div className="grid grid-cols-2 gap-2 relative h-6 my-0.5 pointer-events-none">
                  {/* Arrow positioned directly under the Commissioned card (Column 1) */}
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="h-2.5 w-px bg-emerald-400/80" />
                    <div className="w-5 h-5 rounded-full bg-white border border-emerald-300 text-emerald-600 flex items-center justify-center shadow-xs -mt-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                  </div>
                  <div /> {/* Empty Column 2 to keep layout aligned */}
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase mb-3">
                    Commissioned Breakdown ({commissioned.toLocaleString()})
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-indigo-600 text-white rounded-lg p-3">
                      <p className="text-lg font-black">
                        {getPercent(nmsConnectedInside, commissioned)}%
                      </p>
                      <p className="text-[11px] font-medium opacity-90 mt-0.5">
                        NMS Connected ({nmsConnectedInside.toLocaleString()})
                      </p>
                    </div>

                    <div className="bg-rose-500 text-white rounded-lg p-3">
                      <p className="text-lg font-black">
                        {getPercent(nmsDisconnectedInside, commissioned)}%
                      </p>
                      <p className="text-[11px] font-medium opacity-90 mt-0.5">
                        NMS Disconnected (
                        {nmsDisconnectedInside.toLocaleString()})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
