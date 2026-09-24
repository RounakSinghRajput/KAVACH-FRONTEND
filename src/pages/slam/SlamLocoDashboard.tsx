import React from "react";
import SlamDonutSection from "../../components/slam/SlamDonutSection";
import SlamLocoManagementPage from "../../components/slam/SlamLocotable";

const SlamDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ================= PAGE HEADER ================= */}
      <div className="p-6">
        <div className="mb-6 rounded-2xl bg-white px-6 py-5 shadow border">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">
            LKavach (OBK) SLAM Dashboard
          </h1>
        </div>

        {/* ================= DONUT CHARTS ================= */}
        <SlamDonutSection />
      </div>

      {/* ================= TABLE (UNCHANGED PAGE) ================= */}
      <div className="px-6 pb-6">
        <SlamLocoManagementPage />
      </div>
    </div>
  );
};

export default SlamDashboardPage;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { axiosInstance } from "../../services/axios";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip as RechartsTooltip,
//   AreaChart,
//   Area,
//   CartesianGrid,
// } from "recharts";
// import {
//   Train,
//   CheckCircle,
//   Clock,
//   Hourglass,
//   FileCheck,
//   RefreshCw,
//   Eye,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   SlidersHorizontal,
//   X,
//   Filter,
// } from "lucide-react";

// // --- TypeScript Interfaces ---

// export enum DateType {
//   OFFERED = "OFFERED",
//   INSTALLATION = "INSTALLATION",
//   PCC = "PCC",
//   FINAL_COMMISSIONING = "FINAL_COMMISSIONING",
// }

// export interface DashboardFilterRequest {
//   dateType?: DateType;
//   fromDate?: string;
//   toDate?: string;
//   make?: string;
//   version?: string;
//   contract?: string;
//   zone?: string;
//   division?: string;
//   shed?: string;
//   locoType?: string;
//   brakeType?: string;

//   manufacturer?: string;
//   page: number;
//   size: number;
//   sortBy: string;
//   sortDirection: string;
// }

// export interface KpiSummaryDto {
//   totalLocos: number;
//   offeredCount: number;
//   installationCompletedCount: number;
//   pccCount: number;
//   finalCommissionedCount: number;
// }

// export interface ChartDataDto {
//   label: string;
//   value: number;
//   [key: string]: any;
// }

// export interface ChartsResponseDto {
//   makeWise: ChartDataDto[];
//   versionWise: ChartDataDto[];
//   contractWise: ChartDataDto[];
//   monthlyTrend: ChartDataDto[];
//   brakeTypeWise: ChartDataDto[];
//   locoTypeWise: ChartDataDto[];
//   manufacturerWise: ChartDataDto[];
//   zoneWise: ChartDataDto[];
//   divisionWise: ChartDataDto[];
//   shedWise: ChartDataDto[];
// }

// export interface ZoneDivisionShedSummaryDto {
//   zone: string;
//   division: string;
//   shed: string;
//   count: number;
// }

// export interface SummaryTablesDto {
//   zoneDivisionShed: ZoneDivisionShedSummaryDto[];
// }

// export interface SlamLocoDashboardRowDto {
//   sno: number;
//   loco: string;
//   make: string;
//   contract: string;
//   version: string;
//   zone: string;
//   division: string;
//   shed: string;
//   locoType: string;
//   brakeType: string;
//   manufacturer?: string;
//   locoOfferedInstallation?: string;
//   installationCompleted?: string;
//   preCommissioningPcc?: string;
//   finalTestingCommissioning?: string;
//   remarks?: string;
//   lastUpdatedOn?: string;
// }

// export interface BaseMasterDto {
//   id: number;
//   name: string;
//   code: string;
//   createdAt?: string;
//   updatedAt?: string;
//   createdBy?: string;
//   updatedBy?: string;
//   zonalId?: string;
// }

// export interface ApiResponseWrapper<T> {
//   data: T[];
// }

// export interface TableResponseDto {
//   totalRecords: number;
//   page: number;
//   size: number;
//   totalPages: number;
//   rows: SlamLocoDashboardRowDto[];
// }

// export interface DashboardResponseDto {
//   summary: KpiSummaryDto;
//   charts: ChartsResponseDto;
//   summaryTables: SummaryTablesDto;
//   table: TableResponseDto;
// }

// interface MasterOption {
//   id: number;
//   code: string;
//   name: string;
// }

// const DOUGHNUT_COLORS = ["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
// const manufacturerOptions = ["CLW", "BLW", "PLW", "BHEL", "DKAE", "UNKNOWN"];

// export const SlamDashboard: React.FC = () => {
//   // Filter Drawer State (Closed by default)
//   const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

//   // Filter Values
//   const [dateType, setDateType] = useState<DateType>();
//   const [fromDate, setFromDate] = useState<string>("");
//   const [toDate, setToDate] = useState<string>("");
//   const [zone, setZone] = useState<string>("");
//   const [division, setDivision] = useState<string>("");
//   const [shed, setShed] = useState<string>("");
//   const [make, setMake] = useState<string>("");
//   const [brakeType, setBrakeType] = useState<string>("");
//   const [version, setVersion] = useState<string>("");
//   const [locoType, setLocoType] = useState<string>("");

//   // Dropdown Options State (Populated via Endpoints)
//   const [zoneOptions, setZoneOptions] = useState<MasterOption[]>([]);
//   const [divisions, setDivisions] = useState<MasterOption[]>([]);
//   const [sheds, setSheds] = useState<MasterOption[]>([]);
//   const [makeOptions, setMakeOptions] = useState<any[]>([]);
//   const [manufacturer, setManufacturer] = useState("");

//   // Pagination & Loading States
//   const [page, setPage] = useState<number>(0);
//   const [size, setSize] = useState<number>(10);
//   const [data, setData] = useState<DashboardResponseDto | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);

//   // --- Fetch Dynamic Dropdown Options ---

//   // Fetch Zone List
//   useEffect(() => {
//     axiosInstance
//       .get("/zone/")
//       .then((res) => {
//         const zonesData = Array.isArray(res.data)
//           ? res.data
//           : (res.data?.data ?? []);
//         setZoneOptions(zonesData);
//       })
//       .catch((err: unknown) => {
//         console.error("Error fetching zone options:", err);
//         setZoneOptions([]);
//       });
//   }, []);

//   // Fetch Make / Firm List
//   useEffect(() => {
//     axiosInstance
//       .get("/firm/")
//       .then((res) => {
//         const firmData = Array.isArray(res.data)
//           ? res.data
//           : (res.data?.data ?? []);
//         setMakeOptions(firmData);
//       })
//       .catch((err: unknown) => {
//         console.error("Error fetching firm options:", err);
//         setMakeOptions([]);
//       });
//   }, []);

//   // Zone change -> Fetch Divisions using Zone ID
//   // Zone Change: Updates zone state for API filter and fetches division options by Zone ID
//   const onZoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = e.target.value; // ID used for endpoint
//     const selectedOption = zoneOptions.find((z) => String(z.id) === selectedId);

//     // Pass the Code (e.g. "CR") or Name to the filter state that your dashboard API uses
//     setZone(selectedOption ? selectedOption.code : "");
//     setDivision("");
//     setShed("");
//     setDivisions([]);
//     setSheds([]);

//     if (!selectedId) return;

//     try {
//       const res = await axiosInstance.get(
//         `/division/getAllDivisionByZone/${selectedId}`,
//       );
//       const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
//       setDivisions(data);
//     } catch (err) {
//       console.error("Error fetching divisions by zone:", err);
//       setDivisions([]);
//     }
//   };

//   // Division Change: Updates division state for API filter and fetches shed options by Division ID
//   const onDivisionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = e.target.value; // ID used for endpoint
//     const selectedOption = divisions.find((d) => String(d.id) === selectedId);

//     // Pass the Code (e.g. "BSL") or Name to the filter state that your dashboard API uses
//     setDivision(selectedOption ? selectedOption.code : "");
//     setShed("");
//     setSheds([]);

//     if (!selectedId) return;

//     try {
//       const res = await axiosInstance.get(`/shed/division/${selectedId}`);
//       const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
//       setSheds(data);
//     } catch (err) {
//       console.error("Error fetching sheds by division:", err);
//       setSheds([]);
//     }
//   };

//   // Shed Change: Updates shed state for API filter
//   const onShedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedId = e.target.value;
//     const selectedOption = sheds.find((s) => String(s.id) === selectedId);
//     setShed(selectedOption ? selectedOption.code : "");
//   };

//   // Fetch Main Dashboard Data
//   const fetchDashboardData = useCallback(async () => {
//     setLoading(true);
//     const filterPayload: DashboardFilterRequest = {
//       dateType: dateType || undefined,
//       fromDate: fromDate || undefined,
//       toDate: toDate || undefined,
//       zone: zone || undefined,
//       division: division || undefined,
//       shed: shed || undefined,
//       make: make || undefined,
//       brakeType: brakeType || undefined,
//       manufacturer: manufacturer || undefined,
//       version: version || undefined,
//       locoType: locoType || undefined,
//       page,
//       size,
//       sortBy: "sno",
//       sortDirection: "DESC",
//     };

//     try {
//       const response = await axiosInstance.post<DashboardResponseDto>(
//         "/api/slam/dashboard",
//         filterPayload,
//       );
//       setData(response.data);
//     } catch (error) {
//       console.error("Error fetching dashboard metrics:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     dateType,
//     fromDate,
//     toDate,
//     zone,
//     division,
//     shed,
//     make,
//     brakeType,
//     manufacturer,
//     version,
//     locoType,
//     page,
//     size,
//   ]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, [fetchDashboardData]);

//   const handleApplyFilters = () => {
//     setPage(0);
//     fetchDashboardData();
//     setIsFilterOpen(false);
//   };

//   const handleResetFilters = () => {
//     setDateType(DateType.INSTALLATION);
//     setFromDate("");
//     setToDate("");
//     setZone("");
//     setDivision("");
//     setShed("");
//     setDivisions([]);
//     setSheds([]);
//     setMake("");
//     setBrakeType("");
//     setVersion("");
//     setLocoType("");
//     setManufacturer("");
//     setPage(0);
//   };

//   // Helper Aggregations for 3 Summary Tables
//   const zoneSummary = useMemo(() => {
//     const map = new Map<string, number>();
//     data?.summaryTables.zoneDivisionShed.forEach((item) => {
//       if (item.zone) map.set(item.zone, (map.get(item.zone) || 0) + item.count);
//     });
//     return Array.from(map.entries()).map(([zone, count]) => ({ zone, count }));
//   }, [data]);

//   const divisionSummary = useMemo(() => {
//     const map = new Map<string, number>();
//     data?.summaryTables.zoneDivisionShed.forEach((item) => {
//       if (item.division)
//         map.set(item.division, (map.get(item.division) || 0) + item.count);
//     });
//     return Array.from(map.entries()).map(([division, count]) => ({
//       division,
//       count,
//     }));
//   }, [data]);

//   const shedSummary = useMemo(() => {
//     const map = new Map<string, number>();
//     data?.summaryTables.zoneDivisionShed.forEach((item) => {
//       if (item.shed) map.set(item.shed, (map.get(item.shed) || 0) + item.count);
//     });
//     return Array.from(map.entries()).map(([shed, count]) => ({ shed, count }));
//   }, [data]);

//   const formatDateOnly = (dateTime?: string) => {
//     if (!dateTime) return "-";

//     // Handles: 2026-08-17T10:30:45
//     // and:     2026-08-17 10:30:45
//     const datePart = dateTime.split("T")[0].split(" ")[0];

//     const [year, month, day] = datePart.split("-");

//     if (!year || !month || !day) return dateTime;

//     return `${day}-${month}-${year}`;
//   };

//   return (
//     <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans relative overflow-x-hidden">
//       {/* --- HEADER BAR --- */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 mb-6 border-b border-slate-200/80 gap-4">
//         {/* Left Section: Dashboard Badge */}
//         <div className="relative group cursor-default">
//           <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
//           <span className="relative inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 shadow-sm border border-white/20 uppercase tracking-widest select-none">
//             <span className="relative flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
//             </span>
//             OBK SLAM DASHBOARD
//           </span>
//         </div>

//         {/* Right Section: Action Buttons */}
//         <div className="flex items-center gap-3">
//           {/* Filters Button */}
//           <button
//             onClick={() => setIsFilterOpen(true)}
//             className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition active:scale-95"
//             title="Open Filters"
//           >
//             <Filter className="w-4 h-4 text-indigo-600" />
//             <span>Filters</span>
//           </button>

//           {/* Refresh Button */}
//           <button
//             onClick={fetchDashboardData}
//             disabled={loading}
//             className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300/80 rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
//           >
//             <RefreshCw
//               className={`w-3.5 h-3.5 text-indigo-600 ${loading ? "animate-spin" : ""}`}
//             />
//             <span>{loading ? "Refreshing..." : "Refresh"}</span>
//           </button>
//         </div>
//       </div>
//       {/* --- LEFT SLIDING FILTER PANEL (DRAWER) --- */}
//       {isFilterOpen && (
//         <div
//           onClick={() => setIsFilterOpen(false)}
//           className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
//         />
//       )}

//       <div
//         className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
//           isFilterOpen ? "translate-x-0" : "translate-x-full"
//         }`}
//       >
//         <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
//           <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
//             <Filter className="w-4 h-4 text-indigo-600" />
//             <span>Filter Criteria</span>
//           </div>
//           <button
//             onClick={() => setIsFilterOpen(false)}
//             className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
//           {/* 1. Date Type */}
//           <div>
//             <label className="block font-semibold text-slate-700 mb-1">
//               Date Type
//             </label>
//             <select
//               value={dateType}
//               onChange={(e) => setDateType(e.target.value as DateType)}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value={DateType.INSTALLATION}>Installation Date</option>
//               <option value={DateType.OFFERED}>Offered Date</option>
//               <option value={DateType.PCC}>PCC Date</option>
//               <option value={DateType.FINAL_COMMISSIONING}>
//                 Commissioning Date
//               </option>
//             </select>
//           </div>

//           {/* 2. From Date & To Date */}
//           <div className="grid grid-cols-2 gap-2">
//             <div>
//               <label className="block font-semibold text-slate-700 mb-1">
//                 From Date
//               </label>
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
//               />
//             </div>
//             <div>
//               <label className="block font-semibold text-slate-700 mb-1">
//                 To Date
//               </label>
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
//               />
//             </div>
//           </div>

//           {/* Zone Dropdown */}
//           {/* Zone Dropdown */}
//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1">
//               Zone
//             </label>
//             <select
//               onChange={onZoneChange}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">All Zones</option>
//               {Array.isArray(zoneOptions) &&
//                 zoneOptions.map((z) => (
//                   <option key={z.id} value={z.id}>
//                     {z.code} - {z.name}
//                   </option>
//                 ))}
//             </select>
//           </div>

//           {/* Division Dropdown */}
//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1">
//               Division
//             </label>
//             <select
//               onChange={onDivisionChange}
//               disabled={!zone}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
//             >
//               <option value="">
//                 {!zone ? "Select Zone first" : "All Divisions"}
//               </option>
//               {Array.isArray(divisions) &&
//                 divisions.map((d) => (
//                   <option key={d.id} value={d.id}>
//                     {d.code} {d.name ? `- ${d.name}` : ""}
//                   </option>
//                 ))}
//             </select>
//           </div>

//           {/* Shed Dropdown */}
//           <div>
//             <label className="block text-sm font-semibold text-slate-700 mb-1">
//               Shed
//             </label>
//             <select
//               onChange={onShedChange}
//               disabled={!division}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
//             >
//               <option value="">
//                 {!division ? "Select Division first" : "All Sheds"}
//               </option>
//               {Array.isArray(sheds) &&
//                 sheds.map((s) => (
//                   <option key={s.id} value={s.id}>
//                     {s.code} {s.name ? `${s.name}` : ""}
//                   </option>
//                 ))}
//             </select>
//           </div>
//           {/* Make / Firm */}
//           <div>
//             <label className="block font-semibold text-slate-700 mb-1">
//               Firm / Make
//             </label>
//             <select
//               value={make}
//               onChange={(e) => setMake(e.target.value)}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">All Makes</option>
//               {Array.isArray(makeOptions) &&
//                 makeOptions.map((m: any) => (
//                   <option
//                     key={m.id ?? m.code ?? m.name ?? m}
//                     value={m.code ?? m.name ?? m}
//                   >
//                     {m.code && m.name
//                       ? `${m.code} - ${m.name}`
//                       : (m.name ?? m.code ?? m)}
//                   </option>
//                 ))}
//             </select>
//           </div>

//           {/* Brake Type */}
//           <div>
//             <label className="block font-semibold text-slate-700 mb-1">
//               Brake Type
//             </label>
//             <select
//               value={brakeType}
//               onChange={(e) => setBrakeType(e.target.value)}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">All Brake Types</option>
//               <option value="AIR BRAKE">AIR BRAKE</option>
//               <option value="AIR+REGENE BRAKE">AIR+REGENE BRAKE</option>
//               <option value="DUAL BRAKE">DUAL BRAKE</option>
//             </select>
//           </div>

//           {/* Manufacturer */}
//           <div>
//             <label className="block font-semibold text-slate-600 mb-1">
//               Manufacturer
//             </label>

//             <select
//               value={manufacturer}
//               onChange={(e) => setManufacturer(e.target.value)}
//               className="w-full h-8 px-2 border border-slate-300 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">All Manufacturers</option>

//               {manufacturerOptions.map((m) => (
//                 <option key={m} value={m}>
//                   {m}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Kavach Version */}
//           <div>
//             <label className="block font-semibold text-slate-700 mb-1">
//               Kavach Version
//             </label>
//             <select
//               value={version}
//               onChange={(e) => setVersion(e.target.value)}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">All Versions</option>
//               <option value="4.0">4.0</option>
//               <option value="4">4</option>
//               <option value="3.2">3.2</option>
//               <option value="3">3</option>
//             </select>
//           </div>

//           {/* Loco Type */}
//           <div>
//             <label className="block font-semibold text-slate-700 mb-1">
//               Loco Type
//             </label>
//             <select
//               value={locoType}
//               onChange={(e) => setLocoType(e.target.value)}
//               className="w-full p-2 border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
//             >
//               <option value="">All Loco Types</option>
//               <option value="WAG9HC">WAG9HC</option>
//               <option value="WAP7">WAP7</option>
//               <option value="WAG9H">WAG9H</option>
//               <option value="WAG7">WAG7</option>
//               <option value="WAP4">WDP4</option>
//               <option value="WAG9">WAG9</option>
//               <option value="WAP5AB">WAP5AB</option>
//               <option value="WAP5">WAP5</option>
//               <option value="EF9K">EF9K</option>
//               <option value="WAP7AB">WAP7AB</option>
//               <option value="WAP1">WAP1</option>
//               <option value="WAG5T">WAG5T</option>
//             </select>
//           </div>
//         </div>

//         <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
//           <button
//             onClick={handleApplyFilters}
//             className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-md shadow-sm transition active:scale-95"
//           >
//             Apply Filters
//           </button>
//           <button
//             onClick={handleResetFilters}
//             className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-md transition active:scale-95"
//           >
//             Reset
//           </button>
//         </div>
//       </div>

//       {/* --- ALL 5 KPIs --- */}
//       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
//         <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-blue-600 shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               Total Locos
//             </p>
//             <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
//               {data?.summary.totalLocos.toLocaleString() ?? 0}
//             </h2>
//             <p className="text-[11px] text-slate-400 mt-0.5">100% Target</p>
//           </div>
//           <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
//             <Train className="w-6 h-6" />
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               Offered
//             </p>
//             <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
//               {data?.summary.offeredCount.toLocaleString() ?? 0}
//             </h2>
//             <p className="text-[11px] text-rose-600 font-medium mt-0.5">
//               {data?.summary.totalLocos
//                 ? (
//                     (data.summary.offeredCount / data.summary.totalLocos) *
//                     100
//                   ).toFixed(1)
//                 : 0}
//               %
//             </p>
//           </div>
//           <div className="p-2.5 bg-rose-50 rounded-lg text-rose-500">
//             <Hourglass className="w-6 h-6" />
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               Installation
//             </p>
//             <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
//               {data?.summary.installationCompletedCount.toLocaleString() ?? 0}
//             </h2>
//             <p className="text-[11px] text-amber-600 font-medium mt-0.5">
//               {data?.summary.totalLocos
//                 ? (
//                     (data.summary.installationCompletedCount /
//                       data.summary.totalLocos) *
//                     100
//                   ).toFixed(1)
//                 : 0}
//               %
//             </p>
//           </div>
//           <div className="p-2.5 bg-amber-50 rounded-lg text-amber-500">
//             <Clock className="w-6 h-6" />
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-purple-600 shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               PCC Done
//             </p>
//             <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
//               {data?.summary.pccCount.toLocaleString() ?? 0}
//             </h2>
//             <p className="text-[11px] text-purple-600 font-medium mt-0.5">
//               {data?.summary.totalLocos
//                 ? (
//                     (data.summary.pccCount / data.summary.totalLocos) *
//                     100
//                   ).toFixed(1)
//                 : 0}
//               %
//             </p>
//           </div>
//           <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
//             <FileCheck className="w-6 h-6" />
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 shadow-sm flex justify-between items-center">
//           <div>
//             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
//               Commissioned
//             </p>
//             <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
//               {data?.summary.finalCommissionedCount.toLocaleString() ?? 0}
//             </h2>
//             <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
//               {data?.summary.totalLocos
//                 ? (
//                     (data.summary.finalCommissionedCount /
//                       data.summary.totalLocos) *
//                     100
//                   ).toFixed(1)
//                 : 0}
//               %
//             </p>
//           </div>
//           <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
//             <CheckCircle className="w-6 h-6" />
//           </div>
//         </div>
//       </div>

//       {/* --- ROW 1: CHARTS --- */}
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-60">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
//             Manufacturer Wise
//           </h3>

//           <div className="h-44">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={data?.charts.manufacturerWise ?? []}
//                   dataKey="value"
//                   nameKey="label"
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={30}
//                   outerRadius={65}
//                   paddingAngle={2}
//                 >
//                   {(data?.charts.manufacturerWise ?? []).map((_, index) => (
//                     <Cell
//                       key={`manufacturer-cell-${index}`}
//                       fill={DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]}
//                     />
//                   ))}
//                 </Pie>

//                 <RechartsTooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-60">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
//             Firm / Make Wise
//           </h3>
//           <div className="h-44">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 layout="vertical"
//                 data={data?.charts.makeWise ?? []}
//                 margin={{ left: 10, right: 20 }}
//               >
//                 <XAxis type="number" hide />
//                 <YAxis
//                   dataKey="label"
//                   type="category"
//                   axisLine={false}
//                   tickLine={false}
//                   width={90}
//                   interval={0}
//                   tick={({ x, y, payload }) => {
//                     const label = payload.value || "";
//                     const truncated =
//                       label.length > 12
//                         ? `${label.substring(0, 12)}...`
//                         : label;

//                     return (
//                       <text
//                         x={x}
//                         y={y}
//                         dy={4}
//                         textAnchor="end"
//                         fill="#475569"
//                         fontSize={10}
//                       >
//                         {truncated}
//                       </text>
//                     );
//                   }}
//                 />
//                 <RechartsTooltip />
//                 <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-60">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
//             Brake Type Wise
//           </h3>

//           <div className="h-44">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={data?.charts.brakeTypeWise ?? []}
//                   dataKey="value"
//                   nameKey="label"
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={30}
//                   outerRadius={65}
//                   paddingAngle={2}
//                 >
//                   {(data?.charts.brakeTypeWise ?? []).map((_, index) => (
//                     <Cell
//                       key={`brake-cell-${index}`}
//                       fill={DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]}
//                     />
//                   ))}
//                 </Pie>

//                 <RechartsTooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-60">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
//             Loco Type Wise
//           </h3>

//           <div className="h-44">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart
//                 layout="vertical"
//                 data={data?.charts.locoTypeWise ?? []}
//                 margin={{ top: 0, right: 20, left: 5, bottom: 0 }}
//               >
//                 <XAxis type="number" hide />

//                 <YAxis
//                   dataKey="label"
//                   type="category"
//                   axisLine={false}
//                   tickLine={false}
//                   width={65}
//                   interval={0}
//                   tick={{
//                     fontSize: 9,
//                   }}
//                 />

//                 <RechartsTooltip />

//                 <Bar
//                   dataKey="value"
//                   fill="#8b5cf6"
//                   radius={[0, 4, 4, 0]}
//                   barSize={8}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* --- ROW 2: MONTHLY PROGRESS & ZONE/DIVISION/SHED TABLE --- */}
//       <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
//         {/* 1. Monthly Installation Progress (Expanded: 2/5 width) */}
//         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col lg:col-span-2">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
//             Monthly Installation Progress
//           </h3>

//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={data?.charts.monthlyTrend ?? []}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="label" style={{ fontSize: "11px" }} />
//                 <YAxis style={{ fontSize: "11px" }} />
//                 <RechartsTooltip />

//                 <Area
//                   type="monotone"
//                   dataKey="value"
//                   stroke="#10b981"
//                   fill="rgba(16, 185, 129, 0.15)"
//                   strokeWidth={2}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* 2. Version Count - Compact Donut Chart (Narrow: 1/5 width) */}
//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col lg:col-span-1">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 shrink-0">
//             Version Share
//           </h3>

//           <div className="flex-1 relative min-h-0">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={data?.charts.versionWise ?? []}
//                   dataKey="value"
//                   nameKey="label"
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={20}
//                   outerRadius={55}
//                   paddingAngle={4}
//                 >
//                   {(data?.charts.versionWise ?? []).map((entry, index) => (
//                     <Cell
//                       key={`cell-${index}`}
//                       fill={DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]}
//                     />
//                   ))}
//                 </Pie>
//                 <RechartsTooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Compact Legend */}
//           <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap justify-center gap-x-2 gap-y-1 shrink-0 overflow-y-auto max-h-20">
//             {(data?.charts.versionWise ?? []).map((item, index) => (
//               <div
//                 key={item.label}
//                 className="flex items-center gap-1 text-[10px]"
//               >
//                 <span
//                   className="w-2 h-2 rounded-full shrink-0"
//                   style={{
//                     backgroundColor:
//                       DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length],
//                   }}
//                 />
//                 <span className="font-semibold text-slate-600 truncate max-w-[40px]">
//                   {item.label}:
//                 </span>
//                 <span className="font-bold text-slate-800">
//                   {item.value.toLocaleString()}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* 3. Zone / Division / Shed Breakdown (Expanded: 2/5 width) */}
//         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col lg:col-span-2">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
//             Zone / Division / Shed Breakdown
//           </h3>
//           <div className="overflow-x-auto overflow-y-auto flex-1">
//             <table className="w-full text-xs text-left border-collapse">
//               <thead className="bg-slate-100 text-slate-600 sticky top-0">
//                 <tr>
//                   <th className="p-2 border-b">Zone</th>
//                   <th className="p-2 border-b">Division</th>
//                   <th className="p-2 border-b">Shed</th>
//                   <th className="p-2 border-b text-right">Total Count</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data?.summaryTables.zoneDivisionShed.map((row, idx) => (
//                   <tr
//                     key={idx}
//                     className="hover:bg-slate-50 border-b border-slate-100"
//                   >
//                     <td className="p-2 font-semibold text-slate-700">
//                       {row.zone}
//                     </td>
//                     <td className="p-2">{row.division}</td>
//                     <td className="p-2">{row.shed}</td>
//                     <td className="p-2 text-right font-bold text-blue-900">
//                       {row.count}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* --- ROW 3: 3 SEPARATE SMALL TABLES --- */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
//             Zone-Wise Count
//           </h3>
//           <div className="overflow-y-auto max-h-52">
//             <table className="w-full text-xs text-left border-collapse">
//               <thead className="bg-slate-100 text-slate-600 sticky top-0">
//                 <tr>
//                   <th className="p-2 border-b">Zone</th>
//                   <th className="p-2 border-b text-right">Count</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {zoneSummary.map((item, idx) => (
//                   <tr key={idx} className="hover:bg-slate-50">
//                     <td className="p-2 font-semibold text-slate-700">
//                       {item.zone}
//                     </td>
//                     <td className="p-2 text-right font-bold text-blue-900">
//                       {item.count}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
//             Division-Wise Count
//           </h3>
//           <div className="overflow-y-auto max-h-52">
//             <table className="w-full text-xs text-left border-collapse">
//               <thead className="bg-slate-100 text-slate-600 sticky top-0">
//                 <tr>
//                   <th className="p-2 border-b">Division</th>
//                   <th className="p-2 border-b text-right">Count</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {divisionSummary.map((item, idx) => (
//                   <tr key={idx} className="hover:bg-slate-50">
//                     <td className="p-2 font-semibold text-slate-700">
//                       {item.division}
//                     </td>
//                     <td className="p-2 text-right font-bold text-blue-900">
//                       {item.count}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
//           <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
//             Shed-Wise Count
//           </h3>
//           <div className="overflow-y-auto max-h-52">
//             <table className="w-full text-xs text-left border-collapse">
//               <thead className="bg-slate-100 text-slate-600 sticky top-0">
//                 <tr>
//                   <th className="p-2 border-b">Shed</th>
//                   <th className="p-2 border-b text-right">Count</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {shedSummary.map((item, idx) => (
//                   <tr key={idx} className="hover:bg-slate-50">
//                     <td className="p-2 font-semibold text-slate-700">
//                       {item.shed}
//                     </td>
//                     <td className="p-2 text-right font-bold text-blue-900">
//                       {item.count}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* --- MASTER DATA TABLE --- */}
//       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
//           <h3 className="text-sm font-bold text-slate-800">
//             Master Locomotive Details Table
//           </h3>
//           <div className="flex items-center gap-2 text-xs">
//             <span className="text-slate-500">
//               Total Records: <strong>{data?.table.totalRecords ?? 0}</strong>
//             </span>
//             <select
//               value={size}
//               onChange={(e) => {
//                 setSize(Number(e.target.value));
//                 setPage(0);
//               }}
//               className="p-1 border border-slate-300 rounded text-xs outline-none"
//             >
//               <option value={10}>10</option>
//               <option value={20}>20</option>
//               <option value={50}>50</option>
//             </select>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-xs text-left border-collapse">
//             <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
//               <tr>
//                 <th className="p-3">Loco No.</th>
//                 <th className="p-3">Make</th>
//                 <th className="p-3">Version</th>
//                 <th className="p-3">Contract</th>
//                 <th className="p-3">Loco Type</th>
//                 <th className="p-3">Brake Type</th>
//                 <th className="p-3">Manufacturer</th>
//                 <th className="p-3">Zone</th>
//                 <th className="p-3">Division</th>
//                 <th className="p-3">Shed</th>
//                 <th className="p-3">Offered</th>
//                 <th className="p-3">Installation Done</th>
//                 <th className="p-3">PCC Done</th>
//                 <th className="p-3">Final Commissioned</th>
//                 <th className="p-3">Remarks</th>
//                 <th className="p-3 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {data?.table.rows.map((row) => (
//                 <tr key={row.sno} className="hover:bg-slate-50 transition">
//                   <td className="p-3 font-bold text-blue-900">{row.loco}</td>
//                   <td className="p-3">{row.make}</td>
//                   <td className="p-3">{row.version}</td>
//                   <td className="p-3">{row.contract}</td>
//                   <td className="p-3">{row.locoType}</td>
//                   <td className="p-3">{row.brakeType}</td>
//                   <td className="p-3">{row.manufacturer}</td>
//                   <td className="p-3">{row.zone}</td>
//                   <td className="p-3">{row.division}</td>
//                   <td className="p-3">{row.shed}</td>

//                   <td className="p-3">
//                     {formatDateOnly(row.locoOfferedInstallation)}
//                   </td>

//                   <td className="p-3">
//                     {formatDateOnly(row.installationCompleted)}
//                   </td>

//                   <td className="p-3">
//                     {formatDateOnly(row.preCommissioningPcc)}
//                   </td>

//                   <td className="p-3">
//                     {formatDateOnly(row.finalTestingCommissioning)}
//                   </td>
//                   <td className="p-3 max-w-[200px]">
//                     <div className="truncate" title={row.remarks ?? "N/A"}>
//                       {row.remarks ?? "-"}
//                     </div>
//                   </td>
//                   <td className="p-3 text-center">
//                     <button className="text-slate-400 hover:text-blue-600 transition">
//                       <Eye className="w-4 h-4" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-xs text-slate-500 gap-2">
//           <span>
//             Page <strong>{(data?.table.page ?? 0) + 1}</strong> of{" "}
//             <strong>{data?.table.totalPages ?? 1}</strong>
//           </span>
//           <div className="flex items-center gap-1">
//             <button
//               disabled={page === 0}
//               onClick={() => setPage(0)}
//               className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
//             >
//               <ChevronsLeft className="w-4 h-4" />
//             </button>
//             <button
//               disabled={page === 0}
//               onClick={() => setPage((p) => p - 1)}
//               className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>
//             <button
//               disabled={page + 1 >= (data?.table.totalPages ?? 1)}
//               onClick={() => setPage((p) => p + 1)}
//               className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//             <button
//               disabled={page + 1 >= (data?.table.totalPages ?? 1)}
//               onClick={() => setPage((data?.table.totalPages ?? 1) - 1)}
//               className="p-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
//             >
//               <ChevronsRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SlamDashboard;
