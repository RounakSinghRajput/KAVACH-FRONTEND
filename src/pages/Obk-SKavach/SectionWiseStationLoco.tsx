import { useState, useEffect, useRef } from "react";
import {
  Search,
  Calendar,
  Train,
  MapPin,
  X,
  RefreshCw,
  Building2,
  ArrowRight,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

// --- Interfaces ---
interface NmsStatus {
  id: number;
  div: string;
  firm: string;
  section: string;
  isActive: boolean;
}

interface LocoMetrics {
  totalConnectedDuration?: string;
  totalDisconnectedDuration?: string;
  kavachTotalConnectedDuration?: string;
  kavachTotalDisconnectedDuration?: string;
  maxKavachDisconnectionDuration?: string;
  locoDisconnectionLimitExceeded?: boolean;
}

interface SectionDetailData {
  sectionId: number;
  sectionName: string;
  stationCodes: string[];
  locosDetectedTotal: string[];
  locosDetectedNMS: string[];
  locosDetectedCoA: string[];
  fromTime: string;
  toTime: string;
  totalLocosAnalyzed: number;
  locosExceedingDisconnectionLimit: number;
  locoReports: any[];
}

export default function NmsStatusDashboard() {
  const navigate = useNavigate();

  // Main Grid Data
  const [nmsList, setNmsList] = useState<NmsStatus[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  // Top Filters
  const [selectedDiv, setSelectedDiv] = useState<string>("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState<string>("");

  // In-Page Detail States
  const [selectedSection, setSelectedSection] = useState<NmsStatus | null>(
    null,
  );
  const [sectionDetail, setSectionDetail] = useState<SectionDetailData | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"locos" | "stations">("locos");
  const [detailSearch, setDetailSearch] = useState<string>("");

  // Table Level Date Filter for Section & Loco Details
  const [locoTableDate, setLocoTableDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Secondary API States for Loco Table
  const [locoMetricsMap, setLocoMetricsMap] = useState<
    Record<string, LocoMetrics>
  >({});
  const [loadingLocoMap, setLoadingLocoMap] = useState<Record<string, boolean>>(
    {},
  );

  // Ref to directly point and scroll down to detail view
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch NMS Status List
  const fetchNmsStatus = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const response = await axiosInstance.get("/nmsIp/getAllNMSStatus");
      setNmsList(response.data?.data || []);
    } catch (err: any) {
      console.error(err);
      setListError(err.message || "Failed to load NMS status list.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchNmsStatus();
    const interval = setInterval(
      () => {
        fetchNmsStatus();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  // Sync table date filter whenever top-level date changes
  useEffect(() => {
    setLocoTableDate(selectedDate);
  }, [selectedDate]);

  // Secondary API: Fetch movement metrics for a single Loco ID
  const fetchCoaMovement = async (locoId: string, dateStr: string) => {
    const from = `${dateStr}T00:00:00`;
    const to = `${dateStr}T23:59:59`;

    const response = await axiosInstance.get(
      `/locoConnectivityLog/getCoAMovementWithNMSEvent/${locoId}`,
      { params: { from, to } },
    );
    return response.data?.data || {};
  };

  // Trigger individual secondary API calls for each Loco detected
  const loadLocoMetricsData = (locos: string[], dateStr: string) => {
    const initialLoadingMap: Record<string, boolean> = {};
    locos.forEach((locoId) => {
      initialLoadingMap[locoId] = true;
    });
    setLoadingLocoMap(initialLoadingMap);
    setLocoMetricsMap({});

    locos.forEach(async (locoId) => {
      try {
        const metrics = await fetchCoaMovement(locoId, dateStr);
        setLocoMetricsMap((prev) => ({
          ...prev,
          [locoId]: {
            totalConnectedDuration: metrics.totalConnectedDuration,
            totalDisconnectedDuration: metrics.totalDisconnectedDuration,
            kavachTotalConnectedDuration: metrics.kavachTotalConnectedDuration,
            kavachTotalDisconnectedDuration:
              metrics.kavachTotalDisconnectedDuration,
            maxKavachDisconnectionDuration:
              metrics.maxKavachDisconnectionDuration,
            locoDisconnectionLimitExceeded:
              metrics.locoDisconnectionLimitExceeded,
          },
        }));
      } catch (err) {
        console.error(`Failed to fetch secondary metrics for ${locoId}:`, err);
      } finally {
        setLoadingLocoMap((prev) => ({ ...prev, [locoId]: false }));
      }
    });
  };

  // Main Section Detail Fetcher: Updates Section data + Secondary Loco data dynamically
  const fetchSectionDetails = async (nmsItem: NmsStatus, dateStr: string) => {
    setLoadingDetail(true);
    setDetailError(null);

    const fromIso = `${dateStr}T00:00:00`;
    const toIso = `${dateStr}T23:59:59`;
    const endpoint = `/locoConnectivityLog/getKavachSectionWiseStationLoco/${nmsItem.id}?from=${fromIso}&to=${toIso}`;

    try {
      const response = await axiosInstance.get(endpoint);
      const data: SectionDetailData = response.data?.data || null;
      setSectionDetail(data);
      setLoadingDetail(false);

      if (data && data.locosDetectedTotal && data.locosDetectedTotal.length > 0) {
        loadLocoMetricsData(data.locosDetectedTotal, dateStr);
      }
    } catch (err: any) {
      console.error(err);
      setDetailError(err.message || "Failed to fetch section details.");
      setLoadingDetail(false);
    }
  };

  // Handle table date filter change: Re-runs both primary section API and secondary loco APIs
  const handleLocoTableDateChange = (newDate: string) => {
    setLocoTableDate(newDate);
    if (selectedSection) {
      fetchSectionDetails(selectedSection, newDate);
    }
  };

  // 2. Fetch Detail view in-page on card click
  const handleCardClick = async (nmsItem: NmsStatus) => {
    setSelectedSection(nmsItem);
    setDetailSearch("");
    setActiveTab("locos");
    setLocoTableDate(selectedDate);

    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    fetchSectionDetails(nmsItem, selectedDate);
  };

  // Filter Grid List
  const divisions = [
    "ALL",
    ...Array.from(new Set(nmsList.map((item) => item.div))),
  ];

  const filteredNmsList = nmsList.filter((item) => {
    const matchesDiv = selectedDiv === "ALL" || item.div === selectedDiv;
    const matchesSearch =
      item.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.div.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDiv && matchesSearch;
  });

  // Cell Handlers
  const handleStationClick = (code: string) => {
    alert(`Station clicked: ${code}`);
  };

  const handleLocoClick = (locoNo: string) => {
    navigate(`/loco-journey-map?locoNo=${locoNo}&date=${locoTableDate}`);
  };

  const activeCount = nmsList.filter((item) => item.isActive === true).length;
  const inactiveCount = nmsList.filter(
    (item) => item.isActive === false,
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 p-6 space-y-6">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-blue-600">
        <div>
          <h1 className="text-2xl font-bold text-blue-800 relative inline-block">
            SectionWise NMS Status Dashboard
            <span className="block h-0.5 w-full bg-blue-600 rounded-full mt-1"></span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-500">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-800 font-medium focus:outline-none py-0.5 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-slate-500">DIV:</span>
            <select
              value={selectedDiv}
              onChange={(e) => setSelectedDiv(e.target.value)}
              className="bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-800 font-medium focus:outline-none py-0.5 cursor-pointer"
            >
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-0 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-5 pr-2 py-0.5 bg-transparent border-b border-slate-300 focus:border-blue-600 text-slate-800 text-xs focus:outline-none w-36"
            />
          </div>

          <button
            onClick={fetchNmsStatus}
            disabled={loadingList}
            className="text-blue-600 hover:text-blue-700 transition p-1"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {listError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
          {listError}
        </div>
      )}

      {/* NMS CARDS GRID */}
      <div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 mb-3 shadow-sm">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            All NMS Sections ({filteredNmsList.length})
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Active</span>
              <span className="text-lg font-bold text-emerald-600">
                {activeCount}
              </span>
            </div>
            <div className="h-5 w-px bg-slate-300" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Inactive</span>
              <span className="text-lg font-bold text-rose-600">
                {inactiveCount}
              </span>
            </div>
          </div>
        </div>

        {loadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse p-4"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredNmsList.map((item) => {
              const isSelected = selectedSection?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm ${
                    isSelected
                      ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/40"
                      : item.isActive
                        ? "bg-emerald-50/60 border-emerald-300 hover:border-emerald-500 hover:shadow-md"
                        : "bg-rose-50/60 border-rose-300 hover:border-rose-500 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        item.isActive
                          ? "bg-emerald-200/80 text-emerald-800"
                          : "bg-rose-200/80 text-rose-800"
                      }`}
                    >
                      DIV: {item.div}
                    </span>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.isActive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {item.section}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Firm:{" "}
                      <span className="text-slate-700 font-semibold">
                        {item.firm}
                      </span>
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1 text-blue-600">
                      {isSelected ? "Pointing Below" : "Select"}
                      {isSelected ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowRight className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION DETAILS VIEW */}
      <div ref={detailSectionRef} className="pt-2">
        {selectedSection && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-600 underline underline-offset-4 decoration-2 decoration-blue-500">
                  Section: {selectedSection.section}
                </h2>
                <p className="text-xs text-slate-600 font-mono mt-1">
                  Division: {selectedSection.div} | Firm: {selectedSection.firm}
                </p>
              </div>

              <button
                onClick={() => setSelectedSection(null)}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
              >
                <X className="h-4 w-4" />
                Close Details
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingDetail ? (
                <ContentLoading />
              ) : detailError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                  {detailError}
                </div>
              ) : sectionDetail ? (
                <>
                  {/* TIME & METRIC STRIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-blue-50/40 border border-blue-100 border-l-4 border-l-blue-600 p-4 rounded-xl shadow-xs">
                      <div className="text-blue-700 text-[13px] uppercase font-bold tracking-wider">
                        Total Stations In Section
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600 mt-1">
                        {sectionDetail.stationCodes?.length ?? 0}
                      </div>
                    </div>

                    <div className="bg-blue-50/40 border border-blue-100 border-l-4 border-l-blue-600 p-4 rounded-xl shadow-xs">
                      <div className="text-blue-700 text-[13px] uppercase font-bold tracking-wider">
                        Total Loco Detected (NMS + CoA)
                      </div>
                      <div className="text-2xl font-extrabold text-blue-600 mt-1">
                        {sectionDetail.locosDetectedTotal?.length ?? 0}
                      </div>
                    </div>

                    <div className="bg-rose-50/40 border border-rose-100 border-l-4 border-l-rose-600 p-4 rounded-xl shadow-xs">
                      <div className="text-rose-700 text-[13px] uppercase font-bold tracking-wider">
                        Not Connected with NMS
                      </div>
                      <div className="text-2xl font-extrabold text-rose-600 mt-1">
                        {sectionDetail.locosDetectedCoA?.length ?? 0}
                      </div>
                    </div>

                    <div className="bg-emerald-50/40 border border-emerald-100 border-l-4 border-l-emerald-600 p-4 rounded-xl shadow-xs">
                      <div className="text-emerald-700 text-[13px] uppercase font-bold tracking-wider">
                        Connected With NMS
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                        {sectionDetail.locosDetectedNMS?.length ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* CONTROLS BAR WITH DYNAMIC TABLE DATE FILTER */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                      <button
                        onClick={() => setActiveTab("locos")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition ${
                          activeTab === "locos"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Train className="h-4 w-4" />
                        Locomotives ({sectionDetail.locosDetectedTotal?.length ?? 0})
                      </button>

                      <button
                        onClick={() => setActiveTab("stations")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition ${
                          activeTab === "stations"
                            ? "bg-white text-emerald-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                        Stations ({sectionDetail.stationCodes?.length ?? 0})
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* DYNAMIC TABLE DATE FILTER */}
                      {activeTab === "locos" && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-900">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-slate-600 font-sans font-bold">
                            Data Date:
                          </span>
                          <input
                            type="date"
                            value={locoTableDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) =>
                              handleLocoTableDateChange(e.target.value)
                            }
                            className="bg-transparent border-none text-blue-800 font-bold font-mono focus:outline-none cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="relative">
                        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={`Search ${activeTab}...`}
                          value={detailSearch}
                          onChange={(e) => setDetailSearch(e.target.value)}
                          className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* LOCO TABLE WITH COLUMN DIVIDERS & PER-ITEM LOADERS */}
                  {activeTab === "locos" ? (
                    <div className="border border-slate-200 rounded-lg overflow-x-auto overflow-y-auto max-h-96 shadow-sm">
                      <table className="w-full text-left font-mono text-xs border-collapse min-w-[900px]">
                        <thead className="bg-slate-100 text-slate-600 font-sans uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10 whitespace-nowrap">
                          <tr>
                            <th className="p-3 w-12 bg-slate-100 border-r border-slate-200">
                              #
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Loco ID
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Total Connected Duration
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Total Disconnected Duration
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Total Connected in kavach sec
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Total Disconnected in kavach sec
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Max Con.. Disconn. In kavach sec
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Limit Exceeded
                            </th>
                            <th className="p-3 text-right bg-slate-100">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white whitespace-nowrap">
                          {(sectionDetail.locosDetectedTotal ?? [])
                            .filter((loco) =>
                              loco
                                .toLowerCase()
                                .includes(detailSearch.toLowerCase()),
                            )
                            .map((loco, index) => {
                              const isItemLoading = loadingLocoMap[loco];
                              const metrics = locoMetricsMap[loco];

                              return (
                                <tr
                                  key={index}
                                  className="hover:bg-blue-50/50 transition"
                                >
                                  <td className="p-3 text-slate-400 font-sans border-r border-slate-200">
                                    {index + 1}
                                  </td>
                                  <td className="p-3 font-bold border-r border-slate-200">
                                    <button
                                      onClick={() => handleLocoClick(loco)}
                                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded border border-blue-200 transition inline-flex items-center gap-1"
                                    >
                                      <Train className="h-3 w-3" />
                                      {loco}
                                    </button>
                                  </td>

                                  {/* Total Connected Duration */}
                                  <td className="p-3 border-r border-slate-200">
                                    {isItemLoading ? (
                                      <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        Loading...
                                      </span>
                                    ) : (
                                      (metrics?.totalConnectedDuration ?? "-")
                                    )}
                                  </td>

                                  {/* Total Disconnected Duration */}
                                  <td className="p-3 border-r border-slate-200">
                                    {isItemLoading ? (
                                      <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        Loading...
                                      </span>
                                    ) : (
                                      (metrics?.totalDisconnectedDuration ??
                                      "-")
                                    )}
                                  </td>

                                  {/* Kavach Connected Duration */}
                                  <td className="p-3 border-r border-slate-200">
                                    {isItemLoading ? (
                                      <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        Loading...
                                      </span>
                                    ) : (
                                      (metrics?.kavachTotalConnectedDuration ??
                                      "-")
                                    )}
                                  </td>

                                  {/* Kavach Disconnected Duration */}
                                  <td className="p-3 border-r border-slate-200">
                                    {isItemLoading ? (
                                      <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        Loading...
                                      </span>
                                    ) : (
                                      (metrics?.kavachTotalDisconnectedDuration ??
                                      "-")
                                    )}
                                  </td>

                                  {/* Max Kavach Disconnection Duration */}
                                  <td className="p-3 border-r border-slate-200">
                                    {isItemLoading ? (
                                      <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        Loading...
                                      </span>
                                    ) : (
                                      (metrics?.maxKavachDisconnectionDuration ??
                                      "-")
                                    )}
                                  </td>

                                  {/* Limit Exceeded Status */}
                                  <td className="p-3 border-r border-slate-200">
                                    {isItemLoading ? (
                                      <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                        Loading...
                                      </span>
                                    ) : metrics?.locoDisconnectionLimitExceeded !==
                                      undefined ? (
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          metrics.locoDisconnectionLimitExceeded
                                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        }`}
                                      >
                                        {metrics.locoDisconnectionLimitExceeded
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>

                                  <td className="p-3 text-right font-sans">
                                    <button
                                      onClick={() => handleLocoClick(loco)}
                                      className="text-xs text-blue-600 font-semibold hover:underline"
                                    >
                                      View Log ➜
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* STATION TABLE WITH COLUMN DIVIDERS */
                    <div className="border border-slate-200 rounded-lg overflow-y-auto max-h-96 shadow-sm">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-500 font-sans uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-16 bg-slate-100 border-r border-slate-200">
                              #
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Station Code
                            </th>
                            <th className="p-3 bg-slate-100 border-r border-slate-200">
                              Section Name
                            </th>
                            <th className="p-3 text-right bg-slate-100">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(sectionDetail.stationCodes ?? [])
                            .filter((stn) =>
                              stn
                                .toLowerCase()
                                .includes(detailSearch.toLowerCase()),
                            )
                            .map((stn, index) => (
                              <tr
                                key={index}
                                className="hover:bg-emerald-50/50 transition"
                              >
                                <td className="p-3 text-slate-400 font-sans border-r border-slate-200">
                                  {index + 1}
                                </td>
                                <td className="p-3 border-r border-slate-200">
                                  <button
                                    onClick={() => handleStationClick(stn)}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold rounded border border-emerald-200 transition inline-flex items-center gap-1.5"
                                  >
                                    <MapPin className="h-3.5 w-3.5" />
                                    {stn}
                                  </button>
                                </td>
                                <td className="p-3 text-slate-600 font-sans font-medium border-r border-slate-200">
                                  {sectionDetail.sectionName}
                                </td>
                                <td className="p-3 text-right font-sans">
                                  <button
                                    onClick={() => handleStationClick(stn)}
                                    className="text-xs text-emerald-600 font-semibold hover:underline"
                                  >
                                    View Station Map ➜
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
