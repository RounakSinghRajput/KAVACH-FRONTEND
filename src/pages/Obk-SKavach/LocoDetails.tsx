import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  RotateCw,
  Info,
  Train,
  MapPin,
  Shield,
  Wifi,
  Calendar,
  Clock,
  Cpu,
  Hash,
  Activity,
  Radio,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { Autocomplete, TextField } from "@mui/material";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

interface LocoOption {
  locoId: number;
  firm?: {
    id: number;
    name: string;
  };
  locoVersion?: string;
}

export default function LocoHistoryDetail() {
  const { locoId } = useParams<{ locoId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedDate = searchParams.get("date");

  const [locoOptions, setLocoOptions] = useState<LocoOption[]>([]);
  const [selectedLoco, setSelectedLoco] = useState<LocoOption | null>(null);

  // Independent Loading States for Section-by-Section API Execution
  const [loadingLive, setLoadingLive] = useState<boolean>(false);
  const [loadingConnHistory, setLoadingConnHistory] = useState<boolean>(false);
  const [loadingCoaHistory, setLoadingCoaHistory] = useState<boolean>(false);
  const [loadingCoaSummary, setLoadingCoaSummary] = useState<boolean>(false);

  // Global Refresh & Error States
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data States
  const [liveData, setLiveData] = useState<any>(null);
  const [connectivityHistory, setConnectivityHistory] = useState<any[]>([]);
  const [coaHistory, setCoaHistory] = useState<any[]>([]);
  const [coaMovementSummary, setCoaMovementSummary] = useState<any>(null);

  const initialDay = selectedDate ? dayjs(selectedDate) : dayjs();
  const [fromDate, setFromDate] = useState(initialDay.startOf("day"));
  const [toDate, setToDate] = useState(initialDay.endOf("day"));

  useEffect(() => {
    fetchLocos();
  }, []);

  useEffect(() => {
    if (!locoId || locoOptions.length === 0) return;

    const loco = locoOptions.find(
      (item) => String(item.locoId) === String(locoId),
    );

    setSelectedLoco(loco || null);
  }, [locoId, locoOptions]);

  const fetchLocos = async () => {
    try {
      const response = await axiosInstance.get("/loco/");
      const locos = response.data.data || [];
      setLocoOptions(locos);

      // If no locoId is in the URL, automatically select and load the first locomotive
      if (!locoId && locos.length > 0) {
        const defaultLocoId = String(locos[0].locoId);
        navigate(`/loco/${defaultLocoId}`, { replace: true });
      }
    } catch (err) {
      console.error("Unable to fetch loco list", err);
    }
  };

  // --- Independent API Callers ---
  const fetchLiveData = async (targetLocoId: string) => {
    setLoadingLive(true);
    try {
      const res = await axiosInstance.get(
        `/locoConnectivityLog/getLiveDataByLocoId/${targetLocoId}`,
      );
      setLiveData(res.data?.data || null);
    } catch (err) {
      console.error("Error fetching Live Data:", err);
    } finally {
      setLoadingLive(false);
    }
  };

  const fetchConnHistory = async (
    targetLocoId: string,
    formattedFrom: string,
    formattedTo: string,
  ) => {
    setLoadingConnHistory(true);
    try {
      const res = await axiosInstance.get(
        `/locoConnectivityLog/getLocoConnectivityHistory/${targetLocoId}?from=${formattedFrom}&to=${formattedTo}`,
      );
      setConnectivityHistory(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching Connectivity History:", err);
    } finally {
      setLoadingConnHistory(false);
    }
  };

  const fetchCoaHistory = async (
    targetLocoId: string,
    formattedFrom: string,
    formattedTo: string,
  ) => {
    setLoadingCoaHistory(true);
    try {
      const res = await axiosInstance.get(
        `/locotrainMovement/getCoaHistoryForLoco/${targetLocoId}?from=${formattedFrom}&to=${formattedTo}`,
      );
      setCoaHistory(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching COA History:", err);
    } finally {
      setLoadingCoaHistory(false);
    }
  };

  const fetchCoaSummary = async (
    targetLocoId: string,
    formattedFrom: string,
    formattedTo: string,
  ) => {
    setLoadingCoaSummary(true);
    try {
      const res = await axiosInstance.get(
        `/locoConnectivityLog/getCoAMovementWithNMSEvent/${targetLocoId}?from=${formattedFrom}&to=${formattedTo}`,
      );
      setCoaMovementSummary(res.data?.data || null);
    } catch (err) {
      console.error("Error fetching COA Movement Summary:", err);
    } finally {
      setLoadingCoaSummary(false);
    }
  };

  // Trigger all API requests concurrently without blocking each other
  const fetchAllData = async (
    isRefresh = false,
    targetLocoId?: string,
    from: Dayjs = fromDate,
    to: Dayjs = toDate,
  ) => {
    const activeLocoId = targetLocoId || locoId;

    if (!activeLocoId || activeLocoId.trim() === "") return;

    if (isRefresh) setRefreshing(true);
    setError(null);

    const formattedFrom = from.format("YYYY-MM-DDTHH:mm:ss");
    const formattedTo = to.format("YYYY-MM-DDTHH:mm:ss");

    await Promise.allSettled([
      fetchLiveData(activeLocoId),
      fetchConnHistory(activeLocoId, formattedFrom, formattedTo),
      fetchCoaHistory(activeLocoId, formattedFrom, formattedTo),
      fetchCoaSummary(activeLocoId, formattedFrom, formattedTo),
    ]);

    if (isRefresh) setRefreshing(false);
  };
  useEffect(() => {
    if (!locoId?.trim()) return;

    setLiveData(null);
    setConnectivityHistory([]);
    setCoaHistory([]);
    setCoaMovementSummary(null);

    fetchAllData(false, locoId, fromDate, toDate);
  }, [locoId]);
  const handleDateSearch = () => {
    fetchAllData(false, locoId, fromDate, toDate);
  };

  const handleTodayClick = () => {
    const todayStart = dayjs().startOf("day");
    const todayEnd = dayjs().endOf("day");

    setFromDate(todayStart);
    setToDate(todayEnd);

    fetchAllData(false, locoId, todayStart, todayEnd);
  };

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center max-w-sm">
          <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Error Loading Data
          </h3>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => fetchAllData(false, locoId, fromDate, toDate)}
            className="px-4 py-2 text-xs font-bold bg-[#2563eb] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-700 font-sans p-3 sm:p-4 md:p-6 space-y-5">
      {/* TOP HEADER BAR WITH LOCO SEARCH */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-blue-600">
        {/* LEFT GROUP: BACK BUTTON & TITLE */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg border border-slate-300/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
            <span>Back</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                liveData?.active
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-rose-500"
              }`}
            />

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Locomotive{" "}
              <span className="text-blue-600">History Dashboard</span>
            </h1>

            <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Loco No: {locoId}
            </span>
          </div>
        </div>

        {/* RIGHT GROUP: SEARCH & CONTROLS */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <Autocomplete
            size="small"
            className="w-full sm:w-[280px]"
            options={locoOptions}
            value={selectedLoco}
            onChange={(_, value) => {
              setSelectedLoco(value);
              if (value) {
                navigate(`/loco/${value.locoId}`);
              }
            }}
            getOptionLabel={(option) =>
              `${option.locoId} | ${option.firm?.name ?? ""}`
            }
            isOptionEqualToValue={(option, value) =>
              option.locoId === value.locoId
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search Loco..."
                size="small"
              />
            )}
          />

          <button
            onClick={() => fetchAllData(true, locoId, fromDate, toDate)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-all disabled:opacity-50 cursor-pointer h-10 sm:h-auto"
            title="Refresh Data"
          >
            <RotateCw
              className={`h-4 w-4 text-slate-600 ${
                refreshing ? "animate-spin text-blue-600" : ""
              }`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* TOP ROW: CORE CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CARD 1: LOCO DETAILS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between relative min-h-[320px]">
          {loadingLive ? (
            <ContentLoading />
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                    <Info className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Live Loco Details
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Train className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">
                        Loco Number
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                      {liveData?.locoId || locoId || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Hash className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">
                        Firm
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {liveData?.loco?.firm?.name || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Cpu className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">
                        Version
                      </span>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                      {liveData?.loco?.locoVersion
                        ? `v${liveData.loco.locoVersion}`
                        : "N/A"}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">
                        Current NMS Station
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold truncate">
                      {liveData?.mstStation?.code ||
                        liveData?.mstStation?.name ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">
                        Last Packet Date
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold truncate">
                      {liveData?.packetDate || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">
                        Last Packet Time
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-mono font-bold truncate">
                      {liveData?.packetTime || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 mt-4">
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Radio className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      SLAM
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      liveData?.slamAvailability
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {liveData?.slamAvailability ? "AVAILABLE" : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wifi className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      NMS Status
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      liveData?.active
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {liveData?.active ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* CARD 2: CURRENT TRAIN STATUS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between relative min-h-[320px]">
          {loadingLive ? (
            <ContentLoading />
          ) : (
            <>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Current COA Status
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold max-w-[200px] truncate">
                    <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {liveData?.cceptTrainMvmtDTO?.cavOrigSttn &&
                      liveData?.cceptTrainMvmtDTO?.cavDstnSttn
                        ? `${liveData.cceptTrainMvmtDTO.cavOrigSttn} → ${liveData.cceptTrainMvmtDTO.cavDstnSttn}`
                        : "No Route"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Train No
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-mono font-bold text-slate-900 truncate">
                      {liveData?.cceptTrainMvmtDTO?.cavTrainNumb || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Train Name
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 whitespace-normal break-words leading-4 sm:leading-5 line-clamp-2">
                      {liveData?.cceptTrainMvmtDTO?.cavTrainName || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Loco Running Date
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-mono text-slate-900 truncate">
                      {liveData?.cceptTrainMvmtDTO?.cadTrainDate || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Current Station
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {liveData?.cceptTrainMvmtDTO?.cavStnCode || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Origin
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {liveData?.cceptTrainMvmtDTO?.cavOrigSttn || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Destination
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {liveData?.cceptTrainMvmtDTO?.cavDstnSttn || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 col-span-2">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Last Event Time
                    </span>
                    <p className="mt-1 text-xs sm:text-sm font-mono font-bold text-blue-700 truncate">
                      {liveData?.cceptTrainMvmtDTO?.cadArvldPrtTime || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 mt-4">
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      Kavach Section Area
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      liveData?.activeInKavachSection
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {liveData?.activeInKavachSection ? "INSIDE" : "OUTSIDE"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className="h-4 w-4 text-violet-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      COA Status
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      liveData?.activeAsPerCoA
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {liveData?.activeAsPerCoA ? "Active" : "InActive"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* CARD 3: COA vs NMS Journey Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between relative min-h-[320px]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  COA vs NMS Journey
                </span>
              </div>

              <button
                onClick={() => {
                  const dateStr = fromDate.format("YYYY-MM-DD");
                  navigate(
                    `/loco-journey-map?locoNo=${locoId}&date=${dateStr}`,
                  );
                }}
                className="h-8 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition active:scale-95 cursor-pointer"
                title="View Loco Journey Map"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Journey Map</span>
              </button>
            </div>

            {loadingCoaSummary ? (
              <ContentLoading />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase font-semibold text-slate-500">
                    Total Connected Duration
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-emerald-700 font-mono">
                    {coaMovementSummary?.totalConnectedDuration || "--:--:--"}
                  </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase font-semibold text-slate-500">
                    Total Disconnected Duration
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-red-700 font-mono">
                    {coaMovementSummary?.totalDisconnectedDuration ||
                      "--:--:--"}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase font-semibold text-slate-500">
                    Total Connected (In Kavach)
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-blue-700 font-mono">
                    {coaMovementSummary?.kavachTotalConnectedDuration ||
                      "--:--:--"}
                  </p>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase font-semibold text-slate-500">
                    Total Disconnected (In Kavach)
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-orange-700 font-mono">
                    {coaMovementSummary?.kavachTotalDisconnectedDuration ||
                      "--:--:--"}
                  </p>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase font-semibold text-slate-500">
                    Max Disconnection (In Kavach)
                  </p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-violet-700 font-mono">
                    {coaMovementSummary?.maxKavachDisconnectionDuration ||
                      "--:--:--"}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-2.5 sm:p-3 ${
                    coaMovementSummary?.locoDisconnectionLimitExceeded
                      ? "border-red-200 bg-red-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <p className="text-[10px] sm:text-[11px] uppercase font-semibold text-slate-500">
                    Disconnection Limit
                  </p>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-base sm:text-lg">
                      {coaMovementSummary?.locoDisconnectionLimitExceeded
                        ? "🔴"
                        : "🟢"}
                    </span>

                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        coaMovementSummary?.locoDisconnectionLimitExceeded
                          ? "text-red-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {coaMovementSummary?.locoDisconnectionLimitExceeded
                        ? "Limit Exceeded"
                        : "Normal"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONSOLIDATED MAIN SECTION: DATE FILTERS + TABLES */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5 space-y-4">
        {/* DATE FILTER CONTROLS TOOLBAR */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 w-full">
            <span className="text-sm font-semibold text-slate-700">
              Search History :-
            </span>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500">From</span>
                <DateTimePicker
                  value={fromDate}
                  onChange={(value) => value && setFromDate(value)}
                  format="DD-MM-YYYY HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      size: "small",
                      className: "w-full sm:w-[190px]",
                      sx: {
                        "& .MuiInputBase-root": {
                          height: 38,
                          fontSize: 13,
                        },
                      },
                    },
                  }}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500">To</span>
                <DateTimePicker
                  value={toDate}
                  onChange={(value) => value && setToDate(value)}
                  format="DD-MM-YYYY HH:mm"
                  ampm={false}
                  slotProps={{
                    textField: {
                      size: "small",
                      className: "w-full sm:w-[190px]",
                      sx: {
                        "& .MuiInputBase-root": {
                          height: 38,
                          fontSize: 13,
                        },
                      },
                    },
                  }}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                <button
                  onClick={handleDateSearch}
                  className="flex-1 sm:flex-initial h-9 rounded-md bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  Search
                </button>

                <button
                  onClick={handleTodayClick}
                  className="flex-1 sm:flex-initial h-9 rounded-md border border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </LocalizationProvider>

        {/* TABLES GRID CONTAINER */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
          {/* NMS EVENT HISTORY TABLE */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 flex flex-col h-[450px] sm:h-[500px]">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0284c7] text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                <span>NMS Event History</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-700">
                <span>{fromDate.format("DD-MM-YYYY HH:mm")}</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-100 relative">
              {loadingConnHistory ? (
                <ContentLoading />
              ) : (
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="sticky top-0 bg-slate-50 text-blue-700 uppercase text-[12px] font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2.5 pl-4">NMS Stn</th>
                      <th className="p-2.5">COA Stn</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Zone/Div</th>
                      <th className="p-2.5 pr-4 text-center">In Kavach</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                    {connectivityHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                              <Train className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-slate-700 text-xs block">
                              No history found for this range.
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              Try selecting a different date range.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      connectivityHistory.map((log, index) => (
                        <tr
                          key={log.id || index}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-2.5 pl-4 font-bold text-slate-800">
                            {log.station?.code ? `${log.station.code}` : ""}
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">
                            {log.coaStnCode || "N/A"}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 font-bold rounded text-[10px] ${
                                log.eventType === "RECONNECTED" ||
                                log.eventType === "CONNECTED"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {log.eventType || "CONNECTED"}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {log.eventTime || "N/A"}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {log.station?.division?.zone?.code || "N/A"} /{" "}
                            {log.station?.division?.code || "N/A"}
                          </td>
                          <td className="p-2.5 pr-4 text-center font-bold">
                            {log.inKavachSection ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* COA MOVEMENT HISTORY TABLE */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 flex flex-col h-[450px] sm:h-[500px]">
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#7c3aed] text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                <Train className="h-3.5 w-3.5" />
                <span>COA Movement History</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-700">
                <span>{fromDate.format("DD-MM-YYYY HH:mm")}</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-100 relative">
              {loadingCoaHistory ? (
                <ContentLoading />
              ) : (
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap font-mono">
                  <thead className="sticky top-0 bg-slate-50 text-blue-700 uppercase text-[12px] font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-3 pl-4">Train No.</th>
                      <th className="p-3">Train Name</th>
                      <th className="p-3">Station</th>
                      <th className="p-3">Route</th>
                      <th className="p-3 pr-4">Movement Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                    {coaHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                              <Train className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-slate-700 text-xs block">
                              No movement logs available for this range.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      coaHistory.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="p-3 pl-4">
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
                              {item.cavTrainNumb || "N/A"}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700 max-w-[220px]">
                            <div className="truncate">
                              {item.cavTrainName || "N/A"}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-700">
                              {item.cavStnCode || "N/A"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">
                                {item.cavOrigSttn || "--"}
                              </span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold">
                                {item.cavDstnSttn || "--"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 pr-4">
                            <span className="font-mono text-[12px] font-semibold text-slate-700 whitespace-nowrap">
                              {item.updatedDate || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
