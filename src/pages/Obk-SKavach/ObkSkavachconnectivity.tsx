import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Map as MapIcon,
  TrainFront,
  Eye,
  MapPin,
  LocateFixed,
  ExternalLink,
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
  WifiOff,
  Wifi,
  FileText,
  RadioTower,
} from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";

// OpenLayers Imports
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Overlay from "ol/Overlay";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import LocoBreakdownSection from "./LocoBreakdownSection";
import { ContentLoading } from "../../components/common/LoadingScreen";
import { axiosInstance } from "../../services/axios";

// ============================================================================
// API DATA TYPE DEFINITIONS
// ============================================================================
interface LiveLocoConnectivity {
  locoId: string;
  kavachSubSystemId: string;

  loco: {
    sno: number;
    locoId: number;
    firm: {
      id: number;
      name: string;
    };
    locoType: string | null;
    locoVersion: string;
    slamAvailability: boolean;
    condemned: boolean | null;
    shed: string | null;
    createdDate: string | null;
  };

  mstStation: {
    id: number;
    name: string;
    code: string;

    division: {
      id: number;
      name: string;
      code: string;

      zone: {
        id: number;
        name: string;
        code: string;
      };
    };

    firm: {
      id: number;
      name: string;
    };

    nmsVersion: string;
    kavachSubSystemId: number;
  };

  active: boolean;
  activeAsPerCoA: boolean;
  activeInKavachSection: boolean;
  inKavachSection: boolean;

  firstSeen: string;

  lastSeen: string;

  packetDate: string;

  packetTime: string;
  slamAvailability: boolean;
  cceptTrainMvmtDTO?: {
    cavLocoNumb?: string;
    cavTrainNumb?: string;
    cavTrainName?: string;
    cadTrainDate?: string;
    cavStnCode?: string;
    cadSchldTime?: string;
    cadArvldPrtTime?: string;
    cavOrigSttn?: string;
    cavDstnSttn?: string;
    cadPttDprtTime?: string;
    cadPttArvlTime?: string;
    cavDrtn?: string;
    updatedDate?: string;
  };
}

interface RecentEvent {
  id: number;
  locoNo: string;
  kavachSubSysId: string;

  eventType: string;

  eventTime: string;
  coaEventTime: string;

  briefDescription: string | null;

  station: {
    name: string;
    code: string;

    division: {
      code: string;

      zone: {
        code: string;
      };
    };
  };

  loco: {
    locoId: number;

    firm: {
      name: string;
    };

    locoVersion: string;
  };
}

const SplitArrow = () => {
  return (
    <div className="w-14 h-[150px] shrink-0 flex items-center justify-center">
      <svg
        viewBox="0 0 70 160"
        className="w-full h-full overflow-visible"
        fill="none"
      >
        {/* GREEN UPPER BRANCH */}
        <path
          d="M2 80
             C18 80 16 40 32 40
             H58"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M50 32 L60 40 L50 48"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* RED LOWER BRANCH */}
        <path
          d="M2 80
             C18 80 16 120 32 120
             H58"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M50 112 L60 120 L50 128"
          stroke="#ef4444"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
const KavachSplitArrow = () => {
  return (
    <div className="relative w-10 h-[204px] shrink-0">
      <svg
        viewBox="0 0 40 204"
        className="absolute inset-0 w-full h-full"
        fill="none"
      >
        {/* GREEN */}
        <path
          d="M1 48 C10 48 12 48 18 48 H32"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M27 42 L34 48 L27 54"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* RED */}
        <path
          d="M1 48 C10 48 11 156 18 156 H32"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M27 150 L34 156 L27 162"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
const CommissionedSplitArrow = () => {
  return (
    <div className="relative w-10 h-[204px] shrink-0">
      <svg
        viewBox="0 0 40 204"
        className="absolute inset-0 w-full h-full"
        fill="none"
      >
        {/* GREEN */}
        <path
          d="M1 48 C10 48 12 48 18 48 H32"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M27 42 L34 48 L27 54"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* RED */}
        <path
          d="M1 48 C10 48 11 156 18 156 H32"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M27 150 L34 156 L27 162"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default function SurakshaContentOnly() {
  const navigate = useNavigate();
  // Real API State Hooks
  const [connectivityLogs, setConnectivityLogs] = useState<
    LiveLocoConnectivity[]
  >([]);
  const [selectedLog, setSelectedLog] = useState<LiveLocoConnectivity | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [tickerLogs, setTickerLogs] = useState<RecentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [syncCountdown, setSyncCountdown] = useState<number>(300);
  const [dashboardCards, setDashboardCards] = useState<Record<string, number>>(
    {},
  );
  const [mapFilter, setMapFilter] = useState<
    "ALL" | "CONNECTED" | "DISCONNECTED"
  >("ALL");

  const [initialLoading, setInitialLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [inKavachSection, setInKavachSection] = useState<boolean | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyData, setHistoryData] = useState<any[]>([]);

  const [connectedSearch, setConnectedSearch] = useState<string>("");
  const [disconnectedSearch, setDisconnectedSearch] = useState<string>("");
  const [disconnectedDivisionFilter, setDisconnectedDivisionFilter] =
    useState<string>("");
  const [connectedDivisionFilter, setConnectedDivisionFilter] =
    useState<string>("");
  const [divisionFilterOpen, setDivisionFilterOpen] = useState<
    "disconnected" | "connected" | null
  >(null);
  const [connectedCoaSort, setConnectedCoaSort] = useState<
    "NONE" | "COA_ACTIVE_FIRST" | "COA_INACTIVE_FIRST"
  >("NONE");
  const [disconnectedKavachSort, setDisconnectedKavachSort] = useState<
    "NONE" | "KAVACH_FIRST" | "NONKAVACH_FIRST"
  >("NONE");

  const GREEN_LOCO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="20" height="20"><circle cx="50" cy="50" r="42" fill="%2322c55e" stroke="white" stroke-width="4"/><circle cx="50" cy="50" r="48" fill="none" stroke="%2322c55e" stroke-width="2" stroke-dasharray="4,2"/><g transform="translate(26, 26) scale(2)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></g></svg>`;
  const RED_LOCO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="20" height="20"><circle cx="50" cy="50" r="42" fill="%23ef4444" stroke="white" stroke-width="4"/><circle cx="50" cy="50" r="48" fill="none" stroke="%23ef4444" stroke-width="2" stroke-dasharray="4,2"/><g transform="translate(26, 26) scale(2)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></g></svg>`;
  // Map Container & Marker Source Refs

  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerSourceRef = useRef(new VectorSource());
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const stationCache = useRef<Record<string, { lon: number; lat: number }>>({});

  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  const fetchDashboardData = async (showLoader = false) => {
    if (showLoader) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [dashboardResponse, recentResponse] = await Promise.all([
        axiosInstance.get("/locoConnectivityLog/getDashboardData"),
        axiosInstance.get("/locoConnectivityLog/getLast20Records"),
      ]);
      // ================= Dashboard =================

      const dashboardData = dashboardResponse.data.data;

      setDashboardCards(dashboardData.counts || {});

      const logs: LiveLocoConnectivity[] = dashboardData.locoList || [];

      setConnectivityLogs(logs);

      if (logs.length > 0) {
        setSelectedLog(logs[0]);
      }

      // ================= Recent Events =================

      const recentEvents: RecentEvent[] = recentResponse.data.data || [];

      setTickerLogs(recentEvents);

      // ================= Last Sync =================
      const now = new Date();

      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();

      const hours = now.getHours();
      const hours12 = hours % 12 || 12;

      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const ampm = hours >= 12 ? "PM" : "AM";

      setLastSyncTime(
        `${dd}-${mm}-${yyyy} ${String(hours12).padStart(
          2,
          "0",
        )}:${minutes}:${seconds} ${ampm}`,
      );

      setSyncCountdown(300);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      if (showLoader) {
        setInitialLoading(false);
      }

      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchDashboardData(true);

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 300000);

    const tick = setInterval(() => {
      setSyncCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
  }, []);
  // Initialize OpenLayers Map Component Workspace
  useEffect(() => {
    if (!mapElement.current) return;

    // Center near Kota / Lakheri Coordinates (approx 25.66, 76.17)
    const initialCenter = fromLonLat([76.17, 25.66]);

    // Marker styling declaration
    const markerLayer = new VectorLayer({
      source: markerSourceRef.current,
    });

    const indiaBoundaryLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: {
          LAYERS: "P_SMMS:india_boundary",
          TILED: true,
        },
      }),
      visible: true,
    });
    const allStationLayer = new TileLayer({
      source: new TileWMS({
        url: "https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/wms",
        params: {
          LAYERS: "P_SMMS:railway_station",
          TILED: true,
        },
      }),
      visible: true,
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),

        indiaBoundaryLayer,

        allStationLayer, // <-- ADD THIS

        new TileLayer({
          source: new TileWMS({
            url: "https://suraksha.indianrailways.gov.in/geoserver/P_SURAKSHA/wms",
            params: {
              LAYERS: "P_SURAKSHA:suraksha_comissioned_stations",
              TILED: true,
            },
          }),
          visible: true,
        }),

        markerLayer,
      ],
      view: new View({
        center: initialCenter,
        zoom: 5,
      }),
    });

    mapRef.current = map;
    const popupOverlay = new Overlay({
      element: popupRef.current!,
      positioning: "bottom-center",
      offset: [0, -18],
      stopEvent: false,
    });

    map.addOverlay(popupOverlay);

    popupOverlayRef.current = popupOverlay;

    map.on("pointermove", (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature,
      );

      if (!feature) {
        popupRef.current?.classList.add("hidden");

        return;
      }

      const loco = feature.get("locoData");

      if (!loco) {
        popupRef.current?.classList.add("hidden");

        return;
      }
      const popup = popupRef.current;

      if (!popup) return;

      const train = loco.cceptTrainMvmtDTO;

      popupRef.current!.innerHTML = `
<div style="
width:290px;
font-family:Segoe UI,Arial,sans-serif;
font-size:11px;
color:#334155;
">

<div style="
display:flex;
justify-space-between;
align-items:center;
padding-bottom:6px;
margin-bottom:8px;
border-bottom:1px solid #e5e7eb;
">

<div style="
font-size:14px;
font-weight:700;
color:#1d4ed8;
">
Loco : ${loco.locoId}
</div>

<span style="
padding:2px 8px;
border-radius:10px;
font-size:10px;
font-weight:600;
background:${loco.active ? "#dcfce7" : "#fee2e2"};
color:${loco.active ? "#15803d" : "#dc2626"};
">
${loco.active ? "Connected" : "Disconnected"}
</span>

</div>

<table style="
width:100%;
border-collapse:collapse;
">

<tr>
<td style="padding:2px 0;color:#64748b;">Station</td>
<td style="text-align:right;font-weight:600;">
${loco.mstStation?.code ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Zone / Div</td>
<td style="text-align:right;font-weight:600;">
${loco.mstStation?.division?.zone?.code ?? "-"} /
${loco.mstStation?.division?.code ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Firm</td>
<td style="text-align:right;font-weight:600;">
${loco.loco?.firm?.name ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Version</td>
<td style="text-align:right;font-weight:600;">
${loco.loco?.locoVersion ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Kavach Sec</td>
<td style="text-align:right;font-weight:600;">
${loco.activeInKavachSection ? "Yes" : "No"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Packet Time</td>
<td style="text-align:right;font-weight:600;">
${loco.packetTime ?? "-"}
</td>
</tr>

${
  train
    ? `
<tr>
<td colspan="2">
<hr style="margin:8px 0;border:none;border-top:1px solid #e5e7eb;">
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Train No</td>
<td style="text-align:right;font-weight:600;">
${train.cavTrainNumb ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Train Name</td>
<td style="text-align:right;font-weight:600;">
${train.cavTrainName ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Route</td>
<td style="text-align:right;font-weight:600;">
${train.cavOrigSttn ?? "-"} → ${train.cavDstnSttn ?? "-"}
</td>
</tr>

<tr>
<td style="padding:2px 0;color:#64748b;">Direction</td>
<td style="text-align:right;font-weight:600;">
${train.cavDrtn ?? "-"}
</td>
</tr>
`
    : ""
}

</table>

</div>
`;

      popupRef.current!.classList.remove("hidden");

      popupOverlayRef.current?.setPosition(
        (feature.getGeometry() as Point).getCoordinates(),
      );
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);
  useEffect(() => {
    if (connectivityLogs.length > 0) {
      showAllLocosOnMap();
    }
  }, [connectivityLogs, mapFilter]);

  useEffect(() => {
    if (!divisionFilterOpen) return;

    const handleOutsideDivisionFilter = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest("[data-division-filter]")) {
        setDivisionFilterOpen(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideDivisionFilter);
    return () =>
      document.removeEventListener("mousedown", handleOutsideDivisionFilter);
  }, [divisionFilterOpen]);

  const connectedRunningLogs = connectivityLogs.filter((log) => log.active);
  const disconnectedRunningLogs = connectivityLogs.filter(
    (log) => !log.active && log.activeAsPerCoA,
  );

  const normalizeSearch = (value: string) => value.trim().toLowerCase();
  const divisionOptions = Array.from(
    new Set(
      connectivityLogs
        .map((log) => log.mstStation?.division?.code)
        .filter((code): code is string => Boolean(code)),
    ),
  ).sort();

  const connectedFilteredLogs = (() => {
    const search = normalizeSearch(connectedSearch);
    const division = normalizeSearch(connectedDivisionFilter);

    const list = connectedRunningLogs.filter((log) => {
      const zoneDiv =
        `${log.mstStation?.division?.zone?.code ?? ""} / ${log.mstStation?.division?.code ?? ""}`.toLowerCase();

      const matchesSearch = [log.locoId, log.mstStation?.code, zoneDiv]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
      const matchesDivision =
        !division ||
        normalizeSearch(log.mstStation?.division?.code ?? "") === division;

      if (!matchesSearch || !matchesDivision) return false;

      return true;
    });

    if (connectedCoaSort === "COA_ACTIVE_FIRST") {
      list.sort(
        (a, b) => (b.activeAsPerCoA ? 1 : 0) - (a.activeAsPerCoA ? 1 : 0),
      );
    }

    if (connectedCoaSort === "COA_INACTIVE_FIRST") {
      list.sort(
        (a, b) => (a.activeAsPerCoA ? 1 : 0) - (b.activeAsPerCoA ? 1 : 0),
      );
    }

    return list;
  })();
  // Connected Table Counts
  const connectedCoaActiveCount = connectedFilteredLogs.filter(
    (log) => log.activeAsPerCoA,
  ).length;

  const connectedCoaInactiveCount = connectedFilteredLogs.filter(
    (log) => !log.activeAsPerCoA,
  ).length;

  const disconnectedFilteredLogs = (() => {
    const division = normalizeSearch(disconnectedDivisionFilter);
    const list = disconnectedRunningLogs.filter((log) => {
      const search = normalizeSearch(disconnectedSearch);

      const zoneDiv =
        `${log.mstStation?.division?.zone?.code ?? ""} / ${log.mstStation?.division?.code ?? ""}`.toLowerCase();

      const matchesSearch =
        !search ||
        [log.locoId, log.mstStation?.code, zoneDiv]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));
      const matchesDivision =
        !division ||
        normalizeSearch(log.mstStation?.division?.code ?? "") === division;

      if (!matchesSearch || !matchesDivision) return false;

      return true;
    });

    if (disconnectedKavachSort === "KAVACH_FIRST") {
      list.sort(
        (a, b) =>
          (b.activeInKavachSection ? 1 : 0) - (a.activeInKavachSection ? 1 : 0),
      );
    }

    if (disconnectedKavachSort === "NONKAVACH_FIRST") {
      list.sort(
        (a, b) =>
          (a.activeInKavachSection ? 1 : 0) - (b.activeInKavachSection ? 1 : 0),
      );
    }

    return list;
  })();
  // Disconnected Table Counts
  const kavachAreaCount = disconnectedFilteredLogs.filter(
    (log) => log.activeInKavachSection,
  ).length;

  const nonKavachAreaCount = disconnectedFilteredLogs.filter(
    (log) => !log.activeInKavachSection,
  ).length;

  const openDetailModal = async (log: LiveLocoConnectivity) => {
    setSelectedLog(log);
    setDetailModalOpen(true);

    try {
      setHistoryLoading(true);

      const response = await axiosInstance.get(
        `/locoConnectivityLog/connectionLogByLoco?loco=${log.locoId}`,
      );

      const history = response.data.data || [];

      setHistoryData(history);

      // Get latest available inKavachSection value
      const latestKavach = history.find(
        (item: any) => item.inKavachSection !== null,
      );

      setInKavachSection(latestKavach?.inKavachSection ?? null);
    } catch (err) {
      console.error(err);
      setHistoryData([]);
      setInKavachSection(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setInKavachSection(null);
  };

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );

  const getStationCoordinate = async (stationCode: string) => {
    if (stationCache.current[stationCode]) {
      return stationCache.current[stationCode];
    }

    const url =
      `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows` +
      `?service=WFS` +
      `&version=1.0.0` +
      `&request=GetFeature` +
      `&typeName=P_SMMS:railway_station` +
      `&CQL_FILTER=${encodeURIComponent(`sttncode='${stationCode}'`)}` +
      `&outputFormat=application/json`;

    const response = await fetch(url);

    const data = await response.json();

    if (!data.features.length) return null;

    const feature = data.features[0];

    let lon;
    let lat;

    if (feature.geometry.type === "Point") {
      [lon, lat] = feature.geometry.coordinates;
    } else {
      [lon, lat] = feature.geometry.coordinates[0];
    }

    stationCache.current[stationCode] = {
      lon,
      lat,
    };

    return { lon, lat };
  };
  const showAllLocosOnMap = async () => {
    if (!mapRef.current) return;
    markerSourceRef.current.clear();

    let logsToShow = connectivityLogs;

    if (mapFilter === "CONNECTED") {
      logsToShow = connectivityLogs.filter((log) => log.active);
    }

    if (mapFilter === "DISCONNECTED") {
      logsToShow = connectivityLogs.filter(
        (log) => !log.active && log.activeAsPerCoA,
      );
    }

    for (const log of logsToShow) {
      if (!log.mstStation?.code) continue;

      const coordinate = await getStationCoordinate(log.mstStation.code);

      if (!coordinate) continue;

      const marker = new Feature({
        geometry: new Point(fromLonLat([coordinate.lon, coordinate.lat])),
      });
      marker.set("locoData", log);

      marker.setStyle(
        new Style({
          image: new Icon({
            src: log.active ? GREEN_LOCO : RED_LOCO,

            scale: 1,

            anchor: [0.5, 1],
          }),
        }),
      );

      markerSourceRef.current.addFeature(marker);
    }
  };
  const handleLocateStation = async (log: LiveLocoConnectivity) => {
    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setSelectedLog(log);

    if (!mapRef.current) return;
    if (!log.mstStation?.code) {
      alert("Station not available");
      return;
    }

    const stationCode = log.mstStation.code;
    const url =
      `https://suraksha.indianrailways.gov.in/geoserver/P_SMMS/ows` +
      `?service=WFS` +
      `&version=1.0.0` +
      `&request=GetFeature` +
      `&typeName=P_SMMS:railway_station` +
      `&CQL_FILTER=${encodeURIComponent(`sttncode='${stationCode}'`)}` +
      `&outputFormat=application/json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.features || !data.features.length) {
        alert("Station not found");
        return;
      }

      const feature = data.features[0];
      let lon;
      let lat;
      if (feature.geometry.type === "Point") {
        [lon, lat] = feature.geometry.coordinates;
      } else {
        [lon, lat] = feature.geometry.coordinates[0];
      }
      mapRef.current?.getView().animate({
        center: fromLonLat([lon, lat]),
        zoom: 15,
        duration: 1000,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const connectedCount = connectivityLogs.filter((log) => log.active).length;

  const disconnectedCount = connectivityLogs.filter(
    (log) => !log.active && log.activeAsPerCoA,
  ).length;

  const formatCoaDateTime = (date?: string) => {
    if (!date) return "N/A";

    const d = new Date(date);

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // ============================================================
  // DASHBOARD FLOW COUNTS
  // ============================================================

  const getDashboardCount = (key: string): number => {
    return dashboardCards[key] ?? 0;
  };

  // Section 1 - CoA Running Loco Breakdown
  const totalRunning = getDashboardCount("Total Running Locos (CoA)");

  const insideKavach = getDashboardCount("Loco Running in Kavach Area");

  const outsideKavach = getDashboardCount("Loco Not Running in Kavach Area");

  const commissioned = getDashboardCount(
    "Commissioned Loco Running in Kavach Area",
  );

  const nonCommissioned = getDashboardCount(
    "Non Commissioned Loco Running in Kavach Area",
  );

  const nmsConnectedInside = getDashboardCount(
    "Commissioned Loco Running in Kavach Area NMS Connected",
  );

  const nmsDisconnectedInside = getDashboardCount(
    "Commissioned Loco Running in Kavach Area NMS DisConnected",
  );

  // Section 2 - OBK Logs
  const totalObkLogs = getDashboardCount("Total Loco Running in OBK LocoLogs");

  const obkLogsInCoa = getDashboardCount(
    "Total Loco Running in OBK LocoLogs in CoA",
  );

  const obkLogsNotInCoa = getDashboardCount(
    "Total Loco Running in OBK LocoLogs not in CoA",
  );

  // Section 3 - External Network
  const outsideCoaNmsConnected = getDashboardCount(
    "NMS Connected running Locos outside of CoA",
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#f4f7fc] text-slate-700 font-sans antialiased text-xs overflow-y-auto">
      {/* HEADER SECTION */}
      <header className="w-full h-16 bg-gradient-to-r from-[#0B5ED7] via-[#0A58CA] to-[#084298] shadow-md border-b border-blue-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white tracking-wide">
                OBK – S-Kavach Connectivity Monitoring
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase">
                LIVE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] text-blue-200 uppercase">Last Sync</p>
            <p className="text-sm font-semibold text-white">
              {lastSyncTime || "Syncing..."}
            </p>
            <p className="text-[10px] text-blue-200">
              Next sync in:{" "}
              <span className="font-mono text-white">{syncCountdown}s</span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-green-500/15 border border-green-400/30 px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-200 font-semibold">
              Connected
            </span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 transition flex items-center justify-center"
          >
            <RefreshCw
              className={`h-5 w-5 text-white ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* MAIN BODY AREA */}
      <div className="p-2 space-y-5 flex-1">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center h-10">
            {/* Left Label */}

            <div className="px-4 h-full flex items-center bg-blue-600 text-white text-xs font-bold whitespace-nowrap">
              📡 RECENT EVENTS
            </div>

            {/* Live Indicator */}

            <div className="px-3 text-[10px] font-semibold text-green-600 flex items-center gap-1 border-r">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>

            {/* Events */}

            <div className="flex-1 overflow-hidden">
              <div className="ticker-track">
                {[...tickerLogs, ...tickerLogs].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const selected = connectivityLogs.find(
                        (log) => log.locoId === item.locoNo,
                      );

                      if (selected) {
                        setSelectedLog(selected);
                        handleLocateStation(selected);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 h-10 border-r hover:bg-blue-50 transition whitespace-nowrap"
                  >
                    <TrainFront
                      size={14}
                      className={`${
                        item.eventType === "RECONNECTED"
                          ? "text-green-600"
                          : "text-red-600 animate-pulse"
                      }`}
                    />

                    <span className="font-bold text-blue-700">
                      {item.locoNo}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.eventType === "RECONNECTED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.eventType === "RECONNECTED"
                        ? "RECONNECTED"
                        : "DISCONNECTED"}
                    </span>

                    <span className="text-slate-600 font-medium">
                      {item.station?.code}
                    </span>

                    <span className="text-slate-400 text-[10px]">
                      {item.eventTime}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
    SECTION 1 : COA RUNNING LOCO BREAKDOWN
============================================================ */}
        {/* <section className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
          {/* SECTION HEADER */}

        {/* </section> */}
        <LocoBreakdownSection
          totalRunning={totalRunning}
          insideKavach={insideKavach}
          outsideKavach={outsideKavach}
          commissioned={commissioned}
          nonCommissioned={nonCommissioned}
          nmsConnectedInside={nmsConnectedInside}
          nmsDisconnectedInside={nmsDisconnectedInside}
        />

        {/* ============================================================
    SECTION 2 & 3 : OBK LOGS & EXTERNAL NETWORK
============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* SECTION 2 : OBK LOCO LOGS */}
          <section className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-12 px-5 flex items-center justify-between bg-gradient-to-r from-amber-50 via-white to-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                  <RadioTower className="w-4 h-4 text-amber-700" />
                </div>
                <h2 className="text-base font-bold text-amber-900 tracking-tight">
                  NOT IN COA
                </h2>
              </div>

              <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs">
                Outside CoA
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="h-[105px] w-full rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <RadioTower className="w-6 h-6 text-amber-600" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-amber-950 uppercase leading-snug">
                      NMS Connected Locos
                      <br />
                      Outside CoA
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-4xl font-black text-amber-950 tracking-tight">
                    {outsideCoaNmsConnected.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* SECTION 3 : EXTERNAL NETWORK */}
          <section className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="h-12 px-5 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-purple-50 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-700" />
                </div>
                <h2 className="text-base font-bold text-purple-900 tracking-tight">
                  OBK LOCO LOGS
                </h2>
              </div>

              <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs">
                OBK Logs Status
              </div>
            </div>

            <div className="p-4 grid grid-cols-[1.15fr_40px_1fr] gap-3 items-center">
              {/* TOTAL OBK LOGS */}
              <div className="h-[105px] rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white flex items-center px-4">
                <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>

                <div className="ml-3.5">
                  <p className="text-xs font-bold text-purple-900 uppercase leading-snug">
                    Total OBK
                    <br />
                    Loco Logs
                  </p>
                  <p className="mt-0.5 text-3xl font-black text-purple-950">
                    {totalObkLogs.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* SPLIT */}
              <SplitArrow />

              {/* IN COA / NOT IN COA */}
              <div className="grid grid-rows-2 gap-2">
                <div className="h-[48px] rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white flex items-center px-3.5 justify-between">
                  <p className="text-xs font-bold text-emerald-900 uppercase">
                    In CoA
                  </p>
                  <span className="text-xl font-black text-emerald-700">
                    {obkLogsInCoa.toLocaleString()}
                  </span>
                </div>

                <div className="h-[48px] rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-white flex items-center px-3.5 justify-between">
                  <p className="text-xs font-bold text-red-900 uppercase">
                    Not In CoA
                  </p>
                  <span className="text-xl font-black text-red-600">
                    {obkLogsNotInCoa.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-slate-600 shadow-2xs">
          <span className="shrink-0 font-bold text-amber-700">⚠️ Note:</span>
          <span className="leading-relaxed">
            <strong className="text-slate-800">
              Total Running Locos (CoA)
            </strong>{" "}
            considers all locos present in CoA within the last 20 minutes, while
            <strong className="text-slate-800"> NMS status</strong> is based on
            a 60-second packet timeout. A loco is marked as{" "}
            <strong className="text-slate-800">Disconnected in NMS</strong> when
            no packet is received for more than{" "}
            <strong className="text-slate-800">60 seconds</strong>.
          </span>
        </div>
        {/* Disclaimer */}
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-slate-600 shadow-2xs">
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

        {/* LOG DATA TABLES */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-slate-100/60 font-sans">
          {/* ------------------------------------------------------------- */}
          {/* CARD 1: DISCONNECTED LOCOS                                    */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md">
            <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-rose-50 shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
                      <WifiOff className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-red-600">
                        Live Monitoring
                      </p>

                      <h3 className="text-sm font-bold text-slate-800">
                        Running Locos Disconnected In NMS
                      </h3>
                    </div>

                    <span className="ml-3 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold shadow">
                      {disconnectedFilteredLogs.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-lg bg-white border border-slate-200 min-w-[180px] text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold text-slate-900">
                    Loco Running
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-3 items-center">
                    <div
                      className={`${disconnectedKavachSort === "KAVACH_FIRST" ? "p-2 rounded bg-rose-50 border border-rose-200" : ""}`}
                    >
                      <div className="text-[9px] text-slate-700 font-bold">
                        Inside Kavach Section
                      </div>
                      <div
                        className={`text-sm font-bold ${disconnectedKavachSort === "KAVACH_FIRST" ? "text-rose-700" : "text-slate-900"}`}
                      >
                        {kavachAreaCount}
                      </div>
                    </div>

                    <div
                      className={`${disconnectedKavachSort === "NONKAVACH_FIRST" ? "p-2 rounded bg-orange-50 border border-orange-200" : ""}`}
                    >
                      <div className="text-[9px] text-slate-700 font-bold">
                        Outside Kavach Section
                      </div>
                      <div
                        className={`text-sm font-bold ${disconnectedKavachSort === "NONKAVACH_FIRST" ? "text-orange-700" : "text-slate-900"}`}
                      >
                        {nonKavachAreaCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={disconnectedSearch}
                  onChange={(e) => setDisconnectedSearch(e.target.value)}
                  placeholder="Search loco, station, zone/div..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Table Body Container */}
            <div className="overflow-y-auto w-full h-[520px] scrollbar-thin scrollbar-thumb-slate-200">
              {initialLoading ? (
                <ContentLoading />
              ) : error ? (
                <div className="p-12 text-center text-rose-500 font-semibold text-xs">
                  {error}
                </div>
              ) : disconnectedFilteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No disconnected locos available.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-10">
                    <tr className="text-black font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Loco No</th>
                      <th className="relative py-3 px-3">
                        <div
                          data-division-filter
                          className="relative flex items-center gap-1.5"
                        >
                          <span>DVN</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDivisionFilterOpen((open) =>
                                open === "disconnected" ? null : "disconnected",
                              )
                            }
                            className={`rounded p-0.5 transition hover:bg-slate-200 ${
                              disconnectedDivisionFilter
                                ? "text-blue-600"
                                : "text-slate-500"
                            }`}
                            title="Filter by division"
                          >
                            <Filter className="h-3.5 w-3.5" />
                          </button>
                          {divisionFilterOpen === "disconnected" && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-3 text-left font-normal shadow-xl">
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Filter Division
                              </p>
                              <Autocomplete
                                size="small"
                                options={divisionOptions}
                                value={disconnectedDivisionFilter || null}
                                onChange={(_, value) => {
                                  setDisconnectedDivisionFilter(value ?? "");
                                  setDivisionFilterOpen(null);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Search division code"
                                    size="small"
                                  />
                                )}
                                noOptionsText="No division found"
                                disablePortal
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setDisconnectedDivisionFilter("");
                                  setDivisionFilterOpen(null);
                                }}
                                className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                              >
                                Clear filter
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3">Station</th>

                      <th className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setDisconnectedKavachSort((prev) => {
                                if (prev === "NONE") return "KAVACH_FIRST";
                                if (prev === "KAVACH_FIRST")
                                  return "NONKAVACH_FIRST";
                                return "NONE";
                              })
                            }
                            className="font-bold hover:text-slate-900 transition-colors"
                            title="Cycle sort: none → Kavach first → Non-Kavach first"
                          >
                            Running In Kavach Section
                          </button>

                          <div className="flex items-center gap-0.5 bg-slate-200/60 p-0.5 rounded-md">
                            <button
                              type="button"
                              onClick={() =>
                                setDisconnectedKavachSort("KAVACH_FIRST")
                              }
                              className={`p-0.5 rounded transition-colors ${
                                disconnectedKavachSort === "KAVACH_FIRST"
                                  ? "bg-white text-emerald-600 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                              title="Sort: Inside Kavach first"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDisconnectedKavachSort("NONKAVACH_FIRST")
                              }
                              className={`p-0.5 rounded transition-colors ${
                                disconnectedKavachSort === "NONKAVACH_FIRST"
                                  ? "bg-white text-rose-600 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                              title="Sort: Outside Kavach first"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-3">NMS Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disconnectedFilteredLogs.map((log, index) => {
                      const isSelected = selectedLog?.locoId === log.locoId;
                      return (
                        <tr
                          key={index}
                          onClick={() => setSelectedLog(log)}
                          className={`group transition-colors duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-rose-50/40"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-rose-600 font-bold tracking-tight">
                                {log.locoId}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/loco/${log.locoId}`);
                                }}
                                title="Open Full Profile"
                                className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition-all"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {log.mstStation?.division?.code ?? "N/A"}
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {(log.mstStation?.code ||
                              log.cceptTrainMvmtDTO?.cavStnCode) ??
                              "N/A"}
                          </td>

                          <td className="py-3 px-3 text-center align-middle">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                log.activeInKavachSection
                                  ? "bg-emerald-100/70 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {log.activeInKavachSection ? "Yes" : "No"}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Disconnected
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocateStation(log);
                                }}
                                title="Locate on Map"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <LocateFixed className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailModal(log);
                                }}
                                title="View Details"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* CARD 2: CONNECTED LOCOS                                      */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md">
            {/* Header */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-cyan-50 shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Activity className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600">
                        Live Monitoring
                      </p>

                      <h3 className="text-sm font-bold text-slate-800">
                        Running Locos Connected In NMS
                      </h3>
                    </div>

                    <span className="ml-3 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow">
                      {connectedFilteredLogs.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded-lg bg-white border border-slate-200 min-w-[180px] text-center shadow-sm">
                  <div className="text-[10px] uppercase font-bold text-slate-900">
                    COA running status
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-3 items-center">
                    <div
                      className={`${connectedCoaSort === "COA_ACTIVE_FIRST" ? "p-2 rounded bg-green-50 border border-green-200" : ""}`}
                    >
                      <div className="text-[9px] text-slate-700 font-bold">
                        Active In COA
                      </div>
                      <div
                        className={`text-sm font-bold ${connectedCoaSort === "COA_ACTIVE_FIRST" ? "text-green-700" : "text-slate-900"}`}
                      >
                        {connectedCoaActiveCount}
                      </div>
                    </div>

                    <div
                      className={`${connectedCoaSort === "COA_INACTIVE_FIRST" ? "p-2 rounded bg-red-50 border border-red-200" : ""}`}
                    >
                      <div className="text-[9px] text-slate-700 font-bold">
                        Inactive In COA
                      </div>
                      <div
                        className={`text-sm font-bold ${connectedCoaSort === "COA_INACTIVE_FIRST" ? "text-rose-700" : "text-slate-900"}`}
                      >
                        {connectedCoaInactiveCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={connectedSearch}
                  onChange={(e) => setConnectedSearch(e.target.value)}
                  placeholder="Search loco, station, zone/div..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Table Body Container */}
            <div className="overflow-y-auto w-full h-[520px] scrollbar-thin scrollbar-thumb-slate-200">
              {initialLoading ? (
                <ContentLoading />
              ) : error ? (
                <div className="p-12 text-center text-rose-500 font-semibold text-xs">
                  {error}
                </div>
              ) : connectedFilteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No connected locos available.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-10">
                    <tr className="text-black font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Loco No</th>
                      <th className="relative py-3 px-3">
                        <div
                          data-division-filter
                          className="relative flex items-center gap-1.5"
                        >
                          <span>DVN</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDivisionFilterOpen((open) =>
                                open === "connected" ? null : "connected",
                              )
                            }
                            className={`rounded p-0.5 transition hover:bg-slate-200 ${
                              connectedDivisionFilter
                                ? "text-blue-600"
                                : "text-slate-500"
                            }`}
                            title="Filter by division"
                          >
                            <Filter className="h-3.5 w-3.5" />
                          </button>
                          {divisionFilterOpen === "connected" && (
                            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-3 text-left font-normal shadow-xl">
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Filter Division
                              </p>
                              <Autocomplete
                                size="small"
                                options={divisionOptions}
                                value={connectedDivisionFilter || null}
                                onChange={(_, value) => {
                                  setConnectedDivisionFilter(value ?? "");
                                  setDivisionFilterOpen(null);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Search division code"
                                    size="small"
                                  />
                                )}
                                noOptionsText="No division found"
                                disablePortal
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setConnectedDivisionFilter("");
                                  setDivisionFilterOpen(null);
                                }}
                                className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                              >
                                Clear filter
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-3">STN (COA)</th>
                      <th className="py-3 px-3">STN (NMS)</th>

                      <th className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setConnectedCoaSort((prev) => {
                                if (prev === "NONE") return "COA_ACTIVE_FIRST";
                                if (prev === "COA_ACTIVE_FIRST")
                                  return "COA_INACTIVE_FIRST";
                                return "NONE";
                              })
                            }
                            className="font-bold hover:text-slate-900 transition-colors"
                            title="Cycle sort: none → Active first → Inactive first"
                          >
                            COA Status
                          </button>

                          <div className="flex items-center gap-0.5 bg-slate-200/60 p-0.5 rounded-md">
                            <button
                              type="button"
                              onClick={() =>
                                setConnectedCoaSort("COA_ACTIVE_FIRST")
                              }
                              className={`p-0.5 rounded transition-colors ${
                                connectedCoaSort === "COA_ACTIVE_FIRST"
                                  ? "bg-white text-emerald-600 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                              title="Sort: Active first"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConnectedCoaSort("COA_INACTIVE_FIRST")
                              }
                              className={`p-0.5 rounded transition-colors ${
                                connectedCoaSort === "COA_INACTIVE_FIRST"
                                  ? "bg-white text-rose-600 shadow-sm"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                              title="Sort: Inactive first"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-3">NMS Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {connectedFilteredLogs.map((log, index) => {
                      const isSelected = selectedLog?.locoId === log.locoId;
                      return (
                        <tr
                          key={index}
                          onClick={() => setSelectedLog(log)}
                          className={`group transition-colors duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50/40"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className="text-indigo-600 font-bold tracking-tight">
                                {log.locoId}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/loco/${log.locoId}`);
                                }}
                                title="Open Full Profile"
                                className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition-all"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {log.mstStation?.division?.code ?? "N/A"}
                          </td>

                          <td className="py-3 px-3 font-semibold text-indigo-900/80">
                            {log.cceptTrainMvmtDTO?.cavStnCode ?? "N/A"}
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            {log.mstStation?.code ?? "N/A"}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.activeAsPerCoA
                                  ? "bg-emerald-100/80 text-emerald-800"
                                  : "bg-rose-100/80 text-rose-800"
                              }`}
                            >
                              {log.activeAsPerCoA ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Connected
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocateStation(log);
                                }}
                                title="Locate on Map"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <LocateFixed className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailModal(log);
                                }}
                                title="View Details"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* DETAIL MODAL */}

        {detailModalOpen && selectedLog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px]">
              {/* HEADER */}
              <div className="px-6 py-4 bg-[#0B5ED7] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrainFront className="h-5 w-5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">
                        Loco {selectedLog.locoId}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          selectedLog.active
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {selectedLog.active ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-white hover:text-slate-200 text-2xl font-semibold leading-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* MAIN CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden flex-1 text-slate-700">
                {/* LEFT COLUMN */}
                <div className="md:col-span-7 p-6 overflow-y-auto bg-slate-50 border-r border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200">
                    Loco Details
                  </h4>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    {/* Station / Zone */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Loco Number
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.locoId ?? "N/A"}
                      </p>
                    </div>
                    {/* Manufacturer */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Loco Firm
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.loco?.firm?.name ?? "N/A"}
                      </p>
                    </div>

                    {/* OBK Version */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        OBK Version
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5 font-mono">
                        {selectedLog.loco?.locoVersion ?? "N/A"}
                      </p>
                    </div>

                    {/* Loco Type */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Loco Type
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.loco?.locoType ?? "N/A"}
                      </p>
                    </div>

                    {/* Station */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Station
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.mstStation?.code ?? "N/A"}
                      </p>
                    </div>

                    {/* Station Firm */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Station Firm
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.mstStation?.firm?.name ?? "N/A"}
                      </p>
                    </div>
                    {/* Zone */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Zone
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.mstStation?.division?.zone?.code ?? "N/A"}
                      </p>
                    </div>

                    {/* Division */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Division Code
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedLog.mstStation?.division?.code ?? "N/A"}
                      </p>
                    </div>

                    {/* Active As Per COA */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Active As Per COA
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            selectedLog.activeAsPerCoA
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {selectedLog.activeAsPerCoA
                            ? "🟢 Active"
                            : "🔴 Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Active As Per NMS
                      </p>
                      <p className="font-semibold text-slate-800 mt-0.5 font-mono">
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              selectedLog.active
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-orange-100 text-orange-700 border border-orange-200"
                            }`}
                          >
                            {selectedLog.active ? "🟢 Active" : "🟠 Inactive"}
                          </span>
                        </div>
                      </p>
                    </div>
                    {!selectedLog.active && (
                      <div className="col-span-2 p-3 rounded-lg bg-white border border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          In Kavach Section
                        </p>

                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              selectedLog.activeInKavachSection
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-orange-100 text-orange-700 border border-orange-200"
                            }`}
                          >
                            {selectedLog.activeInKavachSection
                              ? "🟢 In Kavach Section"
                              : "🟠 Outside Kavach Section"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN : Connection History */}
                <div className="md:col-span-5 bg-slate-50 border-l border-slate-200 flex flex-col h-full min-h-0">
                  {/* Header */}
                  <div className="px-5 py-4 border-b bg-white">
                    <h3 className="text-sm font-bold text-slate-800">
                      Connection Disconnection History
                    </h3>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Loco : {selectedLog?.locoId}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
                    {selectedLog?.active ? (
                      historyLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        </div>
                      ) : historyData.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full text-slate-400 text-sm">
                          <TrainFront className="h-8 w-8 mb-3 opacity-30" />
                          No History Available
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-300 rounded-full" />

                          {historyData.map((item, index) => {
                            const connected =
                              item.eventType === "CONNECTED" ||
                              item.eventType === "RECONNECTED";

                            return (
                              <div
                                key={index}
                                className="relative flex gap-4 pb-8 last:pb-0"
                              >
                                <div
                                  className={`relative z-10 w-4 h-4 rounded-full border-2 border-white shadow ${
                                    connected ? "bg-green-500" : "bg-red-500"
                                  }`}
                                />

                                <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    {/* NMS */}
                                    <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2">
                                      <div className="mb-2 flex items-center justify-between border-b border-blue-100 pb-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                          NMS STN :-
                                        </span>

                                        <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-900">
                                          {item.station?.code ?? "N/A"}
                                        </span>
                                      </div>

                                      <div>
                                        <p className="mb-1 text-[10px] font-medium text-slate-500">
                                          Packet Time
                                        </p>

                                        <div className="rounded-md border border-blue-100 bg-white px-2 py-2">
                                          <p className="font-mono text-[12px] font-semibold leading-5 text-slate-900 tabular-nums">
                                            {item.eventTime ?? "N/A"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* COA */}
                                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2">
                                      <div className="mb-2 flex items-center justify-between border-b border-emerald-100 pb-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                          COA STN :-
                                        </span>

                                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-900">
                                          {item.coaStnCode ?? "N/A"}
                                        </span>
                                      </div>

                                      <div>
                                        <p className="mb-1 text-[10px] font-medium text-slate-500">
                                          Event Time
                                        </p>

                                        <div className="rounded-md border border-emerald-100 bg-white px-2 py-2">
                                          <p className="font-mono text-[12px] font-semibold leading-5 text-slate-900 tabular-nums">
                                            {formatCoaDateTime(
                                              item.coaEventTime,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Kavach Section */}
                                  {item.eventType === "DISCONNECTED" && (
                                    <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                                      <span className="text-[11px] font-semibold text-slate-600">
                                        Kavach Section
                                      </span>

                                      <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                          item.inKavachSection
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                      >
                                        <span
                                          className={`h-2 w-2 rounded-full ${
                                            item.inKavachSection
                                              ? "bg-emerald-600"
                                              : "bg-amber-600"
                                          }`}
                                        />
                                        {item.inKavachSection
                                          ? "Inside"
                                          : "Outside"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <WifiOff className="h-12 w-12 text-red-500 mb-4" />

                        <p className="mt-2 text-sm text-slate-500">
                          Connection history is not available.
                        </p>

                        <div
                          className={`mt-6 px-5 py-3 rounded-xl font-semibold border ${
                            inKavachSection === true
                              ? "bg-green-50 border-green-200 text-green-700"
                              : inKavachSection === false
                                ? "bg-orange-50 border-orange-200 text-orange-700"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {inKavachSection === true
                            ? "🟢 Disconnected In Kavach Section"
                            : inKavachSection === false
                              ? "🟠 Disconnected Loco"
                              : "⚪ Information Not Available"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MIDDLE MAP & SPECS LAYOUT */}
        <section ref={mapSectionRef} className="flex gap-4">
          {/* TRACK GEOLOCATION MAP */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>

                <span className="font-bold text-slate-800 text-xs">
                  Loco Tracking Map
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMapFilter("ALL")}
                  className={`px-3 py-1 rounded text-[11px] font-semibold ${
                    mapFilter === "ALL"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Total Running Loco
                </button>

                <button
                  onClick={() => setMapFilter("CONNECTED")}
                  className={`px-3 py-1 rounded text-[11px] font-semibold ${
                    mapFilter === "CONNECTED"
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  NMS Connected
                </button>

                <button
                  onClick={() => setMapFilter("DISCONNECTED")}
                  className={`px-3 py-1 rounded text-[11px] font-semibold ${
                    mapFilter === "DISCONNECTED"
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  NMS Disconnected
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[420px] lg:min-h-[640px] bg-slate-100 relative">
              <div
                ref={mapElement}
                className="w-full h-full absolute inset-0"
              />

              <div
                ref={popupRef}
                className="hidden bg-white rounded-xl border border-slate-200 shadow-xl p-3 text-xs min-w-[230px]"
              ></div>

              {/* FLOATING ACTION TOOLBAR CONTROLS */}
              <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 shadow-lg bg-white/70 backdrop-blur-sm p-1 rounded-xl">
                <button
                  onClick={() => console.log("Toggle map base overlays")}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white/95 hover:bg-white transition flex items-center justify-center text-slate-700"
                  title="Layer Map Base View"
                >
                  <MapIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    const view = mapRef.current?.getView();
                    if (view) view.setZoom((view.getZoom() || 11) + 1);
                  }}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white/95 hover:bg-white transition flex items-center justify-center text-slate-700 text-base font-bold"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    const view = mapRef.current?.getView();
                    if (view) view.setZoom((view.getZoom() || 11) - 1);
                  }}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white/95 hover:bg-white transition flex items-center justify-center text-slate-700 text-base font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
              </div>

              {/* STATUS INDEXES OVERLAY CARD */}
              <div className="absolute bottom-4 left-4 z-20 w-72 rounded-xl bg-white/95 backdrop-blur shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-blue-700 text-white px-4 py-2 font-bold flex items-center gap-2">
                  🚆 Live Loco Status
                </div>

                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">
                      Total Running (CoA)
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                      {dashboardCards["Total Running Locos (CoA)"] ?? 0}
                    </span>
                  </div>

                  <hr />

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-green-700 font-medium">
                      🟢 NMS Connected
                    </span>

                    <span className="text-lg font-bold text-green-700">
                      {dashboardCards["NMS Connected"] ?? 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-red-700 font-medium">
                      🔴 NMS Disconnected
                    </span>

                    <span className="text-lg font-bold text-red-700">
                      {dashboardCards["NMS Disconnected"] ?? 0}
                    </span>
                  </div>

                  <hr />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
