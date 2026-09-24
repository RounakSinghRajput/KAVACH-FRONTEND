import React, { useState, useEffect, useCallback } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  Popover,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import FilterListIcon from "@mui/icons-material/FilterList";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

// Hardcoded Dropdown Options
const HARDCODED_DIVISIONS = [
  "MEDHA_SC",
  "MEDHA_HYB",
  "MEDHA_BRC",
  "HBL_BRC",
  "HBL_AGRA",
  "MEDHA_DLI",
  "HBL_KOTA",
  "HBL_DDU",
  "HBL_HWH",
  "HBL_ASN",
  "MEDHA_BCT",
  "KARNEX_PRYJ",
  "MEDHA_RTM",
];
const HARDCODED_MESSAGE_TYPES = [
  "11",
  "12",
  "14",
  "15",
  "16",
  "17",
  "19",
  "21",
];

// TypeScript Interfaces
export interface ExceptionalReportItem {
  dateTime: string;
  messageType: string;
  division: string;
  errorName: string;
  packetData: string;
  station: string;
  firm: string;
}

export interface ApiResponse {
  status: string;
  message: string;
  data: ExceptionalReportItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FilterOptionsResponse {
  divisions: string[];
  messageTypes: string[];
  firms: string[];
  stations: string[];
}

export const ExceptionalReport: React.FC = () => {
  // Primary Filter States
  // Default: Date range is 12 hours prior to current time until current time
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().subtract(12, "hour"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());

  // Default selection: Message Type = "17", Division = "HBL_BRC"
  const [messageType, setMessageType] = useState<string>("17");
  const [division, setDivision] = useState<string>("HBL_BRC");

  // Table Column Filter States (Firm & Station Popovers)
  const [selectedFirm, setSelectedFirm] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("");

  // Column Filter Popover Anchors
  const [firmAnchorEl, setFirmAnchorEl] = useState<HTMLButtonElement | null>(
    null,
  );
  const [stationAnchorEl, setStationAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  // Dynamic Column Filter Dropdown Options (for Firm and Station column filters)
  const [firmsList, setFirmsList] = useState<string[]>([]);
  const [stationsList, setStationsList] = useState<string[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState<boolean>(false);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");
  const [exportingFiltered, setExportingFiltered] = useState<boolean>(false);
  const [exportingAll, setExportingAll] = useState<boolean>(false);

  // Data & Pagination States
  const [records, setRecords] = useState<ExceptionalReportItem[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Format Dayjs to ISO String for API
  const formatApiDate = (date: Dayjs | null) =>
    date ? date.format("YYYY-MM-DDTHH:mm:ss") : "";

  // Fetch Dynamic Column Filter Options (Firms & Stations)
  const fetchFilterOptions = useCallback(async () => {
    setLoadingDropdowns(true);
    try {
      const params: Record<string, string> = {
        fromDate: formatApiDate(fromDate),
        toDate: formatApiDate(toDate),
      };
      if (division) params.division = division;
      if (messageType) params.messageType = messageType;
      if (selectedFirm) params.firm = selectedFirm;
      if (selectedStation) params.station = selectedStation;

      const response = await axiosInstance.get<FilterOptionsResponse>(
        "/api/reports/exceptional/filters",
        { params },
      );

      if (response.data) {
        setFirmsList(response.data.firms || []);
        setStationsList(response.data.stations || []);
      }
    } catch (err) {
      console.error("Error fetching column filter dropdown options:", err);
    } finally {
      setLoadingDropdowns(false);
    }
  }, [fromDate, toDate, division, messageType, selectedFirm, selectedStation]);

  // Fetch Report Data from GET /surakshaApi/api/reports/exceptional
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page,
        size,
        fromDate: formatApiDate(fromDate),
        toDate: formatApiDate(toDate),
      };

      if (division) params.division = division;
      if (messageType) params.messageType = messageType;
      if (selectedFirm) params.firm = selectedFirm;
      if (selectedStation) params.station = selectedStation;

      const response = await axiosInstance.get<ApiResponse>(
        "/api/reports/exceptional",
        { params },
      );

      if (response.data && response.data.status === "SUCCESS") {
        setRecords(response.data.data || []);
        setTotalElements(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 0);
      } else {
        setRecords([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (err: any) {
      console.error("Error fetching exceptional report:", err);
      setError("Failed to fetch report records. Please try again.");
      setRecords([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    size,
    fromDate,
    toDate,
    division,
    messageType,
    selectedFirm,
    selectedStation,
  ]);

  // Initial Data Load
  useEffect(() => {
    fetchReport();
    fetchFilterOptions();
  }, []);

  // Re-fetch when pagination or column header filters update
  useEffect(() => {
    fetchReport();
  }, [page, size, selectedFirm, selectedStation]);

  // Apply Primary Filters
  const handleApplyFilters = () => {
    setSelectedFirm("");
    setSelectedStation("");
    setPage(0);
    fetchReport();
    fetchFilterOptions();
  };

  // Reset Filters (Resets to last 12 hours, MSG TYPE: 17, DIVISION: HBL_BRC)
  const handleReset = () => {
    setFromDate(dayjs().subtract(12, "hour"));
    setToDate(dayjs());
    setMessageType("17");
    setDivision("HBL_BRC");
    setSelectedFirm("");
    setSelectedStation("");
    setPage(0);
  };

  // File Download Helper
  const triggerFileDownload = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Export Filtered Records (all=false)
  const handleExportFiltered = async () => {
    setExportingFiltered(true);
    try {
      const endpoint =
        exportFormat === "excel"
          ? "/api/reports/exceptional/export/xlsx"
          : "/api/reports/exceptional/export/csv";
      const fileExt = exportFormat === "excel" ? "xlsx" : "csv";

      const params: Record<string, string | boolean> = {
        all: false,
        fromDate: formatApiDate(fromDate),
        toDate: formatApiDate(toDate),
      };

      if (division) params.division = division;
      if (messageType) params.messageType = messageType;
      if (selectedFirm) params.firm = selectedFirm;
      if (selectedStation) params.station = selectedStation;

      const response = await axiosInstance.get(endpoint, {
        params,
        responseType: "blob",
      });

      triggerFileDownload(
        response.data,
        `exceptional_report_filtered.${fileExt}`,
      );
    } catch (err) {
      console.error("Error exporting filtered report:", err);
      alert("Failed to export filtered report.");
    } finally {
      setExportingFiltered(false);
    }
  };

  // Export All Records (all=true)
  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const endpoint =
        exportFormat === "excel"
          ? "/api/reports/exceptional/export/xlsx"
          : "i/api/reports/exceptional/export/csv";
      const fileExt = exportFormat === "excel" ? "xlsx" : "csv";

      const response = await axiosInstance.get(endpoint, {
        params: { all: true },
        responseType: "blob",
      });

      triggerFileDownload(response.data, `exceptional_report_all.${fileExt}`);
    } catch (err) {
      console.error("Error exporting all records:", err);
      alert("Failed to export all records.");
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-full min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
        {/* PAGE TITLE */}
        <div className="mb-4 border-b-2 border-blue-600 pb-2">
          <h1 className="text-2xl font-bold text-blue-700">
            Exceptional NMS Report
          </h1>
        </div>

        {/* TOP FILTERS TOOLBAR */}
        <div className="mb-4 flex flex-wrap items-center gap-3 py-1">
          <DateTimePicker
            label="From Date"
            value={fromDate}
            maxDate={dayjs()}
            ampm={false}
            format="YYYY-MM-DD HH:mm:ss"
            onChange={(newValue) => setFromDate(newValue)}
            slotProps={{
              textField: {
                size: "small",
                sx: { backgroundColor: "white", width: 220 },
              },
            }}
          />

          <DateTimePicker
            label="To Date"
            value={toDate}
            maxDate={dayjs()}
            ampm={false}
            format="YYYY-MM-DD HH:mm:ss"
            onChange={(newValue) => setToDate(newValue)}
            slotProps={{
              textField: {
                size: "small",
                sx: { backgroundColor: "white", width: 220 },
              },
            }}
          />

          {/* HARDCODED MESSAGE TYPE DROPDOWN */}
          <FormControl
            size="small"
            sx={{ minWidth: 170, backgroundColor: "white" }}
          >
            <InputLabel>Message Type</InputLabel>
            <Select
              value={messageType}
              label="Message Type"
              onChange={(e) => setMessageType(e.target.value)}
            >
              <MenuItem value="">All Message Types</MenuItem>
              {HARDCODED_MESSAGE_TYPES.map((mt) => (
                <MenuItem key={mt} value={mt}>
                  {mt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* HARDCODED DIVISION DROPDOWN */}
          <FormControl
            size="small"
            sx={{ minWidth: 170, backgroundColor: "white" }}
          >
            <InputLabel>Division</InputLabel>
            <Select
              value={division}
              label="Division"
              onChange={(e) => setDivision(e.target.value)}
            >
              <MenuItem value="">All Divisions</MenuItem>
              {HARDCODED_DIVISIONS.map((div) => (
                <MenuItem key={div} value={div}>
                  {div}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 h-[40px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Applying...</span>
              </>
            ) : (
              "Apply"
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            title="Reset Filters"
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 disabled:opacity-50 border border-slate-300 bg-white rounded-lg transition-all h-[40px] flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* DATA CONTAINER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full flex flex-col">
          {/* Card Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-800">
                Exceptional NMS Report
              </h2>
              <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Total Found: {totalElements}
              </span>
            </div>

            {/* EXPORT BUTTONS */}
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "excel" | "csv")
                }
                className="px-2.5 py-1.5 border border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>

              <button
                onClick={handleExportFiltered}
                disabled={exportingFiltered || exportingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {exportingFiltered ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                )}
                Export Filtered
              </button>

              <button
                onClick={handleExportAll}
                disabled={exportingFiltered || exportingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {exportingAll ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                )}
                Export All Data
              </button>
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="relative h-[480px] w-full overflow-y-auto overflow-x-auto">
            {loading ? <ContentLoading /> : null}

            {error ? (
              <div className="p-8 text-center text-red-500 font-medium text-sm">
                {error}
              </div>
            ) : records.length === 0 && !loading ? (
              <div className="p-12 text-center text-slate-400 font-medium text-sm">
                No records available for the selected criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1250px]">
                <thead className="sticky top-0 bg-blue-600 text-white text-xs font-semibold uppercase tracking-wider z-10">
                  <tr>
                    {/* Columns Order:
                        1. Date Time, 2. Message Type, 3. Division, 4. Error Name, 5. Packet Data, 6. Station, 7. Firm */}
                    <th className="py-3 px-4 border-r border-blue-500 min-w-[180px] w-[180px]">
                      Date Time
                    </th>

                    <th className="py-3 px-4 border-r border-blue-500 min-w-[140px] w-[140px]">
                      Message Type
                    </th>

                    <th className="py-3 px-4 border-r border-blue-500 min-w-[140px] w-[140px]">
                      Division
                    </th>

                    {/* COLUMN FILTER: STATION */}
                    <th className="py-3 px-4 border-r border-blue-500 min-w-[140px] w-[140px]">
                      <div className="flex items-center justify-between">
                        <span>Station</span>
                        <IconButton
                          size="small"
                          onClick={(e) => setStationAnchorEl(e.currentTarget)}
                          sx={{ color: "white", padding: "2px" }}
                        >
                          {selectedStation ? (
                            <FilterListOffIcon fontSize="small" />
                          ) : (
                            <FilterListIcon fontSize="small" />
                          )}
                        </IconButton>
                      </div>

                      <Popover
                        open={Boolean(stationAnchorEl)}
                        anchorEl={stationAnchorEl}
                        onClose={() => setStationAnchorEl(null)}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                      >
                        <div className="p-3 w-48 bg-white flex flex-col gap-2">
                          <label className="text-xs font-semibold text-slate-600">
                            Filter by Station
                          </label>
                          <select
                            value={selectedStation}
                            onChange={(e) => {
                              setSelectedStation(e.target.value);
                              setPage(0);
                              setStationAnchorEl(null);
                            }}
                            disabled={loadingDropdowns}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                          >
                            <option value="">All Stations</option>
                            {stationsList.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Popover>
                    </th>

                    {/* COLUMN FILTER: FIRM */}
                    <th className="py-3 px-4 min-w-[140px] w-[140px]">
                      <div className="flex items-center justify-between">
                        <span>Firm</span>
                        <IconButton
                          size="small"
                          onClick={(e) => setFirmAnchorEl(e.currentTarget)}
                          sx={{ color: "white", padding: "2px" }}
                        >
                          {selectedFirm ? (
                            <FilterListOffIcon fontSize="small" />
                          ) : (
                            <FilterListIcon fontSize="small" />
                          )}
                        </IconButton>
                      </div>

                      <Popover
                        open={Boolean(firmAnchorEl)}
                        anchorEl={firmAnchorEl}
                        onClose={() => setFirmAnchorEl(null)}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                      >
                        <div className="p-3 w-48 bg-white flex flex-col gap-2">
                          <label className="text-xs font-semibold text-slate-600">
                            Filter by Firm
                          </label>
                          <select
                            value={selectedFirm}
                            onChange={(e) => {
                              setSelectedFirm(e.target.value);
                              setPage(0);
                              setFirmAnchorEl(null);
                            }}
                            disabled={loadingDropdowns}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-800 bg-white"
                          >
                            <option value="">All Firms</option>
                            {firmsList.map((firm) => (
                              <option key={firm} value={firm}>
                                {firm}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Popover>
                    </th>
                    <th className="py-3 px-4 border-r border-blue-500 min-w-[220px] w-[220px]">
                      Error Name
                    </th>

                    <th className="py-3 px-4 border-r border-blue-500 min-w-[380px]">
                      Packet Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {records.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-blue-600 whitespace-nowrap min-w-[180px]">
                        {row.dateTime}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap min-w-[140px]">
                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-md font-semibold">
                          {row.messageType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap min-w-[140px]">
                        {row.division}
                      </td>

                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap min-w-[140px]">
                        {row.station}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap min-w-[140px]">
                        {row.firm}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs whitespace-nowrap min-w-[220px]">
                        {row.errorName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700 min-w-[380px] whitespace-pre-wrap">
                        {row.packetData}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER PAGINATION */}
          <div className="flex items-center justify-end gap-6 p-3.5 border-t border-slate-200 bg-white text-sm text-slate-600 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page:</span>
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="border border-slate-300 rounded px-2.5 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="text-xs font-medium">
              {totalElements === 0
                ? "0–0 of 0"
                : `${page * size + 1}–${Math.min(
                    (page + 1) * size,
                    totalElements,
                  )} of ${totalElements}`}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0 || loading}
                onClick={() => setPage(0)}
                title="First Page"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 font-bold text-base hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all"
              >
                &laquo;
              </button>
              <button
                disabled={page === 0 || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                title="Previous Page"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 font-bold text-base hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all"
              >
                &lt;
              </button>
              <button
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage((prev) => prev + 1)}
                title="Next Page"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 font-bold text-base hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all"
              >
                &gt;
              </button>
              <button
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage(totalPages - 1)}
                title="Last Page"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 font-bold text-base hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default ExceptionalReport;
