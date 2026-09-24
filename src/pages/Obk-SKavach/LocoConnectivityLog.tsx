import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Train,
  Inbox,
  WifiOff,
  Wifi,
  Calendar,
  ExternalLink,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

interface LocoItem {
  sno?: number;
  locoId: string;
  firm?: string;
  locoVersion?: string;
  inKavachSection?: boolean;
  maxKavachDisconnectionDuration?: string;
  locoDisconnectionLimitExceeded?: boolean;
}

interface LocoHistoryDetail {
  locoId: string;
  firm: string;
  locoVersion: string;
  lastSeenNms: string;
  lastSeenCoa: string;
  nmsStatus: boolean;
  coaStatus: boolean;
}

interface ApiResponse {
  status: number;
  message: string;
  data?: {
    counts?: Record<string, number>;
    nmsLocoList?: LocoItem[];
    coaLocoList?: LocoItem[];
  };
}

export const LocoConnectivityLog: React.FC = () => {
  const navigate = useNavigate();
  const minDate: Dayjs = dayjs("2026-07-27");
  const maxDate: Dayjs = dayjs();

  const [fromDate, setFromDate] = useState<Dayjs>(() =>
    maxDate.isBefore(minDate) ? minDate : maxDate,
  );
  const [toDate, setToDate] = useState<Dayjs>(() => maxDate);
  const [fromTime, setFromTime] = useState<Dayjs>(() =>
    dayjs().startOf("day").add(1, "second"),
  );
  const [toTime, setToTime] = useState<Dayjs>(() => maxDate);
  const [selectedQuickRange, setSelectedQuickRange] = useState<
    "today" | "yesterday" | "7" | "30" | null
  >("today");
  const [loading, setLoading] = useState<boolean>(false);

  // New states for KPI details page view
  const [showDetailView, setShowDetailView] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<LocoHistoryDetail[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");

  // Frontend Filter States for COA and NMS Status
  const [nmsStatusFilter, setNmsStatusFilter] = useState<string>("ALL");
  const [coaStatusFilter, setCoaStatusFilter] = useState<string>("ALL");

  const applyQuickRange = (days?: number) => {
    const currentMoment = dayjs();
    const end = days ? currentMoment.subtract(1, "day").endOf("day") : currentMoment;
    const start = days ? end.subtract(days - 1, "day") : end;

    setSelectedQuickRange(days ? (String(days) as "7" | "30") : "today");
    setFromDate(start.startOf("day"));
    setToDate(end.startOf("day"));
    setFromTime(start.startOf("day").add(1, "second"));
    setToTime(days ? end : currentMoment);
    fetchData(start.startOf("day").add(1, "second"), days ? end : currentMoment);
  };

  const applyYesterday = () => {
    const yesterday = dayjs().subtract(1, "day");

    setSelectedQuickRange("yesterday");
    setFromDate(yesterday.startOf("day"));
    setToDate(yesterday.startOf("day"));
    setFromTime(yesterday.startOf("day").add(1, "second"));
    setToTime(yesterday.endOf("day"));
    fetchData(
      yesterday.startOf("day").add(1, "second"),
      yesterday.endOf("day"),
    );
  };

  const [error, setError] = useState<string | null>(null);
  const [nmsSearch, setNmsSearch] = useState<string>("");
  const [coaSearch, setCoaSearch] = useState<string>("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [nmsList, setNmsList] = useState<LocoItem[]>([]);
  const [coaList, setCoaList] = useState<LocoItem[]>([]);
  const [loadingCoaMap, setLoadingCoaMap] = useState<Record<string, boolean>>(
    {},
  );

  const cardColors = [
    {
      border: "border-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-50",
      icon: Train,
    },
    {
      border: "border-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-50",
      icon: Train,
    },
    {
      border: "border-red-500",
      text: "text-red-600",
      bg: "bg-red-50",
      icon: WifiOff,
    },
    {
      border: "border-green-500",
      text: "text-green-600",
      bg: "bg-green-50",
      icon: Wifi,
    },
  ];

  const fetchData = async (from: Dayjs, to: Dayjs): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get<ApiResponse>(
        "/locoConnectivityLog/getDashboardDataRange",
        {
          params: {
            fromDateTime: from.format("YYYY-MM-DDTHH:mm:ss"),
            toDateTime: to.format("YYYY-MM-DDTHH:mm:ss"),
          },
        },
      );

      const resData = response.data;

      if (resData?.status === 200 && resData?.data) {
        const d = resData.data;
        setCounts(d.counts || {});
        setNmsList(d.nmsLocoList || []);
        setCoaList(d.coaLocoList || []);
        setLoading(false);

        if (d.nmsLocoList && d.nmsLocoList.length > 0) {
          loadCoaMovementData(d.nmsLocoList, to);
        }
      } else {
        setError(resData?.message || "Failed to retrieve data.");
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(errorMsg || "Error connecting to the server.");
      console.error(err);
      setLoading(false);
    }
  };

  // Fetch KPI detail records
  const fetchLocoHistoryDetails = async () => {
    setShowDetailView(true);
    setHistoryLoading(true);
    try {
      const response = await axiosInstance.get(
        "/locoConnectivityLog/getLocoHistoryDetails",
      );
      setHistoryData(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching loco history details:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const today = dayjs();
    fetchData(today.startOf("day").add(1, "second"), today);
  }, []);

  const loadCoaMovementData = (list: LocoItem[], date: Dayjs) => {
    const initialLoadingState: Record<string, boolean> = {};
    list.forEach((item) => {
      initialLoadingState[item.locoId] = true;
    });
    setLoadingCoaMap(initialLoadingState);

    list.forEach(async (loco) => {
      try {
        // dynamic load logic if needed
      } catch (error) {
        console.error(
          `Error loading secondary data for ${loco.locoId}:`,
          error,
        );
      } finally {
        setLoadingCoaMap((prev) => ({ ...prev, [loco.locoId]: false }));
      }
    });
  };

  const handleGetReport = () => {
    if (!fromDate.isValid() || !toDate.isValid()) return;

    const fromDateTime = fromDate
      .hour(fromTime.hour())
      .minute(fromTime.minute())
      .second(fromTime.second())
      .millisecond(0);
    const toDateTime = toDate
      .hour(toTime.hour())
      .minute(toTime.minute())
      .second(toTime.second())
      .millisecond(0);

    if (fromDateTime.isAfter(toDateTime)) {
      setError("From date and time cannot be after the To date and time.");
      return;
    }

    fetchData(fromDateTime, toDateTime);
  };

  const filteredNmsList = useMemo(() => {
    const term = nmsSearch.trim().toLowerCase();
    if (!term) return nmsList;
    return nmsList.filter(
      (item) =>
        String(item.locoId).toLowerCase().includes(term) ||
        item.firm?.toLowerCase().includes(term),
    );
  }, [nmsList, nmsSearch]);

  const filteredCoaList = useMemo(() => {
    const term = coaSearch.trim().toLowerCase();
    if (!term) return coaList;
    return coaList.filter(
      (item) =>
        String(item.locoId).toLowerCase().includes(term) ||
        item.firm?.toLowerCase().includes(term),
    );
  }, [coaList, coaSearch]);

  // Combined Frontend Filter Logic for history details table
  const filteredHistoryList = useMemo(() => {
    return historyData.filter((item) => {
      const matchesSearch =
        !historySearch ||
        String(item.locoId)
          .toLowerCase()
          .includes(historySearch.trim().toLowerCase()) ||
        item.firm?.toLowerCase().includes(historySearch.trim().toLowerCase());

      const matchesNms =
        nmsStatusFilter === "ALL" ||
        (nmsStatusFilter === "CONNECTED" && item.nmsStatus) ||
        (nmsStatusFilter === "DISCONNECTED" && !item.nmsStatus);

      const matchesCoa =
        coaStatusFilter === "ALL" ||
        (coaStatusFilter === "CONNECTED" && item.coaStatus) ||
        (coaStatusFilter === "DISCONNECTED" && !item.coaStatus);

      return matchesSearch && matchesNms && matchesCoa;
    });
  }, [historyData, historySearch, nmsStatusFilter, coaStatusFilter]);

  const kpiEntries = useMemo(() => {
    const entries = Object.entries(counts);
    const result: Array<
      | { type: "single"; title: string; value: number }
      | {
          type: "pair";
          title: string;
          value: number;
          secondaryTitle: string;
          secondaryValue: number;
          thirdTitle: string;
          thirdValue: number;
        }
    > = [];

    for (let i = 0; i < entries.length; i++) {
      const [title, value] = entries[i];

      if (
        title === "Total OBK Locos" &&
        i + 1 < entries.length &&
        entries[i + 1][0] === "Total Commissioned OBK Locos"
      ) {
        const commissionedValue = entries[i + 1][1];
        result.push({
          type: "single",
          title: "Total Commissioned OBK Locos",
          value: commissionedValue,
        });
        i += 1;
        continue;
      }

      result.push({ type: "single", title, value });
    }

    return result;
  }, [counts]);

  const renderLocoTable = (
    list: LocoItem[],
    emptyMessage: string,
    options: {
      showKavachSection?: boolean;
      showConnectedColumns?: boolean;
    } = {},
  ) => {
    const { showKavachSection = false, showConnectedColumns = false } = options;

    return (
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-sm font-bold">
            <tr>
              <th className="py-3 px-4 border-b border-slate-200">S.No</th>
              <th className="py-3 px-4 border-b border-slate-200">Loco ID</th>
              <th className="py-3 px-4 border-b border-slate-200">Firm Name</th>
              {showConnectedColumns && (
                <>
                  <th className="py-3 px-4 border-b border-slate-200">
                    Max Disconnection
                  </th>
                  <th className="py-3 px-4 border-b border-slate-200">
                    Limit Exceeded
                  </th>
                </>
              )}
              {showKavachSection && (
                <th className="py-3 px-4 border-b border-slate-200">
                  Ran In Kavach Section
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {list.length > 0 ? (
              list.map((row: LocoItem, index: number) => {
                const isItemLoading = loadingCoaMap[row.locoId];

                return (
                  <tr
                    key={row.locoId || index}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-700">
                      {row.sno ?? index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5 group">
                        <span
                          onClick={() => navigate(`/loco/${row.locoId}`)}
                          className="text-rose-600 font-bold tracking-tight cursor-pointer"
                        >
                          {row.locoId}
                        </span>
                        <ExternalLink
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/loco/${row.locoId}?date=${toDate.format("YYYY-MM-DD")}`,
                            );
                          }}
                          className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 transition-all cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {row.firm ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border border-blue-600 text-blue-600 bg-blue-50/50">
                          {row.firm}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {showConnectedColumns && (
                      <>
                        <td className="py-3 px-4">
                          {isItemLoading ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                              Loading...
                            </span>
                          ) : (
                            (row.maxKavachDisconnectionDuration ?? "-")
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isItemLoading ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                              Loading...
                            </span>
                          ) : row.locoDisconnectionLimitExceeded ===
                            undefined ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                row.locoDisconnectionLimitExceeded
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {row.locoDisconnectionLimitExceeded
                                ? "Yes"
                                : "No"}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {showKavachSection && (
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            row.inKavachSection
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.inKavachSection ? "Yes" : "No"}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    3 +
                    (showConnectedColumns ? 2 : 0) +
                    (showKavachSection ? 1 : 0)
                  }
                  className="py-10 text-center text-slate-500 font-medium"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Inbox className="w-8 h-8 text-slate-400" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render detail view wrapped in a big card with top filter dropdowns and total count
  if (showDetailView) {
    return (
      <div className="p-4 bg-[#f8f9fa] min-h-screen">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDetailView(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-blue-700">
              Loco History Details
            </h1>
          </div>
        </div>

        {/* Big Outer Card Container */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          {/* Top Control Bar: Filters & Summary Counters */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* NMS Status Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  NMS Status:
                </label>
                <select
                  value={nmsStatusFilter}
                  onChange={(e) => setNmsStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                >
                  <option value="ALL">All NMS</option>
                  <option value="CONNECTED">Connected</option>
                  <option value="DISCONNECTED">Disconnected</option>
                </select>
              </div>

              {/* COA Status Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  COA Status:
                </label>
                <select
                  value={coaStatusFilter}
                  onChange={(e) => setCoaStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                >
                  <option value="ALL">All COA</option>
                  <option value="CONNECTED">Active</option>
                  <option value="DISCONNECTED">Not Active</option>
                </select>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search Loco ID or Firm..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Total Count Display */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Count:
              </span>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-xs">
                {filteredHistoryList.length} / {historyData.length}
              </span>
            </div>
          </div>

          {/* Table Container Inside Big Card */}
          <div>
            {historyLoading ? (
              <div className="py-20 flex justify-center items-center">
                <ContentLoading />
              </div>
            ) : (
              <div className="w-full max-w-full h-[550px] overflow-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 text-sm font-bold shadow-xs">
                    <tr>
                      <th className="py-3 px-4 border-b border-slate-200">
                        S.No
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        Loco ID
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        Firm
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        Loco Version
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        Last Seen (NMS)
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        Last Seen (COA)
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        NMS Status
                      </th>
                      <th className="py-3 px-4 border-b border-slate-200">
                        COA Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredHistoryList.length > 0 ? (
                      filteredHistoryList.map((item, index) => (
                        <tr
                          key={item.locoId || index}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-700">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-blue-600">
                            {item.locoId}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-300">
                              {item.firm}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {item.locoVersion}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.lastSeenNms}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {item.lastSeenCoa}
                          </td>
                          <td className="py-3 px-4">
                            {item.nmsStatus ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <XCircle className="w-3.5 h-3.5" /> Disconnected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {item.coaStatus ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                <XCircle className="w-3.5 h-3.5" /> Not Active
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-slate-500 font-medium"
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <Inbox className="w-8 h-8 text-slate-400" />
                            <span>
                              No Loco History details match the current filters.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-3 bg-[#f8f9fa] min-h-screen">
        {/* Header */}
        <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Loco <span className="text-[#2563eb]">Connectivity</span>{" "}
            <span className="text-[#5046e5]">History</span>
          </h1>

          <div className="flex w-full justify-end xl:w-auto">
            <div className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:min-w-[650px]">
              <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Report Range
                </span>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickRange()}
                    disabled={loading}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                      selectedQuickRange === "today"
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={applyYesterday}
                    disabled={loading}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                      selectedQuickRange === "yesterday"
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Yesterday
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickRange(7)}
                    disabled={loading}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                      selectedQuickRange === "7"
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Last 7 Days
                  </button>

                  <button
                    type="button"
                    onClick={() => applyQuickRange(30)}
                    disabled={loading}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                      selectedQuickRange === "30"
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Last 30 days
                  </button>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <DatePicker
                    format="DD-MM-YYYY"
                    value={fromDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    onChange={(newDate) => {
                      if (newDate) setFromDate(newDate);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          width: 155,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                          },
                        },
                      },
                    }}
                  />

                  <TimePicker
                    format="HH:mm:ss"
                    value={fromTime}
                    onChange={(newTime) => {
                      if (newTime) setFromTime(newTime);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          width: 130,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                          },
                        },
                      },
                    }}
                  />

                  <DatePicker
                    format="DD-MM-YYYY"
                    value={toDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    onChange={(newDate) => {
                      if (newDate) setToDate(newDate);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          width: 155,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                          },
                        },
                      },
                    }}
                  />

                  <TimePicker
                    format="HH:mm:ss"
                    value={toTime}
                    onChange={(newTime) => {
                      if (newTime) setToTime(newTime);
                    }}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          width: 130,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                          },
                        },
                      },
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGetReport}
                  disabled={loading}
                  className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {loading ? "Loading..." : "Get Report"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr className="mb-4 border-t-2 border-blue-500" />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div
          className="grid gap-6 mb-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              loading ? Math.max(kpiEntries.length, 4) : kpiEntries.length,
              4,
            )}, minmax(0,1fr))`,
          }}
        >
          {Array.from({
            length: loading
              ? Math.max(kpiEntries.length, 4)
              : kpiEntries.length,
          }).map((_, index) => {
            const style = cardColors[index % cardColors.length];
            const isFirstKpi = index === 0;

            if (loading) {
              return (
                <div
                  key={`loading-card-${index}`}
                  className={`min-h-[104px] p-5 rounded-lg bg-white border-l-4 ${style.border} shadow flex items-center justify-center`}
                >
                  <Loader2 className={`w-7 h-7 animate-spin ${style.text}`} />
                </div>
              );
            }

            const entry = kpiEntries[index];
            const { title, value } = entry;

            return (
              <div
                key={title}
                onClick={isFirstKpi ? fetchLocoHistoryDetails : undefined}
                className={`p-5 rounded-lg bg-white border-l-4 ${style.border} shadow flex justify-between items-center ${
                  isFirstKpi
                    ? "cursor-pointer hover:shadow-md transition-shadow hover:bg-slate-50"
                    : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-500">{title}</p>
                  <h2 className={`text-2xl font-bold mt-1 ${style.text}`}>
                    {value}
                  </h2>
                </div>
                <style.icon className={`w-10 h-10 ${style.text}`} />
              </div>
            );
          })}
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-slate-600 shadow-2xs">
        <span className="shrink-0 font-bold text-amber-700">
          ⚠️ Note:
        </span>
        <span className="truncate">
          A loco is marked as{" "}
          <strong className="text-slate-800">Connected</strong> if it was detected
          in NMS at any point during the selected period; otherwise, it is shown as{" "}
          <strong className="text-slate-800">Not Connected</strong>.
        </span>
      </div>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-slate-600 shadow-2xs">
          <span className="shrink-0 font-bold text-amber-700">
            ⚠️ Disclaimer:
          </span>
          <span className="truncate">
            Loco disconnection can be caused by loss of connection between{" "}
            <strong className="text-slate-800">OBK ↔ Station Kavach</strong>,{" "}
            <strong className="text-slate-800">Station Kavach ↔ NMS</strong>, or{" "}
            <strong className="text-slate-800">NMS ↔ CRIS Network</strong>.
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow border border-slate-200 py-16 flex justify-center items-center">
            <ContentLoading />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="bg-white rounded-lg shadow border border-red-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-red-50 border-b border-red-200 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-red-900 text-base">
                    Not Connected with NMS
                  </h2>
                  <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-full text-xs font-semibold">
                    {filteredCoaList.length}
                  </span>
                </div>
                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    placeholder="Search Loco..."
                    value={coaSearch}
                    onChange={(e) => setCoaSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-red-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>
              {renderLocoTable(
                filteredCoaList,
                coaSearch
                  ? "No matching records found."
                  : "No COA Loco records found for the selected date.",
                { showKavachSection: true, showConnectedColumns: false },
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-emerald-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-emerald-900 text-base">
                    Connected With NMS
                  </h2>
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-xs font-semibold">
                    {filteredNmsList.length}
                  </span>
                </div>

                <div className="relative w-full sm:w-48">
                  <input
                    type="text"
                    placeholder="Search Loco..."
                    value={nmsSearch}
                    onChange={(e) => setNmsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-emerald-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              {renderLocoTable(
                filteredNmsList,
                nmsSearch
                  ? "No matching NMS records found."
                  : "No NMS Loco records found for the selected date.",
                { showKavachSection: false, showConnectedColumns: false },
              )}
            </div>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
};

export default LocoConnectivityLog;
