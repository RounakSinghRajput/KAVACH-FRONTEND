import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Download,
  X,
  Filter,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye,
  AlignEndVertical,
  ArrowLeft,
  ArrowRight,
  AlignEndHorizontal,
} from "lucide-react";
import { Autocomplete, CircularProgress, ClickAwayListener, TextField, createFilterOptions } from "@mui/material";
import {
  fetchKavachIncidentsPaginated,
  exportKavachIncidentsToExcel,
  fetchIncidentCategories,
  fetchLocoNumbers,
  fetchStationNumbers,
  KavachIncidentRequest,
  IncidentCategoryItem,
  StationItem,
  fetchPacketPopup,
} from "../../api/kavachIncidentApi";
import { ContentLoading } from "../../components/common/LoadingScreen";
import { axiosInstance } from "../../services/axios";
import type { Zone, Division } from "../../services/api";

/* ================= TYPES ================= */

interface KavachIncident {
  NMSGenerated: any;
  criticalityLevel: string;
  incidentSubCategory: any;
  incidentCategory: any;
  briefDescription: string;
  id: number;
  tripNo: number;
  tripDate: string;
  incidentDateTime: string;
  locoNo: string;
  trainNo: string;
  loco: {
    sno: number;
    locoId: number;
    firm: {
      id: number;
      name: string;
    };
    locoType: string | null;
    locoVersion: string;
    condemned: string;
    shedName: string;
  };
  division: {
    id: number;
    name: string;
    code: string;
  };
  mstStation: {
    id: number;
    name: string;
    code: string;
    firm: {
      id: number;
      name: string;
    } | null;
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
  };
  currentPktId: number;
  previousPktId: number | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

interface LocoItem {
  sno: number;
  locoId: number;
  firm: {
    id: number;
    name: string;
  };
  locoType: string | null;
  locoVersion: string;
  condemned: string;
  shed: string;
  createdDate: string;
}

interface PaginationInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

const CriticalityButton = ({ level }: { level: string }) => {
  const styles: any = {
    high: "bg-red-500 text-white",
    critical: "bg-red-700 text-white",
    medium: "bg-orange-400 text-white",
    low: "bg-green-500 text-white",
  };
  return (
    <span
      className={`px-3 py-1 rounded text-xs font-medium ${styles[level?.toLowerCase()] || "bg-gray-400 text-white"}`}
    >
      {level}
    </span>
  );
};

const filterZoneDivision = createFilterOptions<Zone | Division>({
  stringify: (option) => `${option.name || ""} ${option.code || ""}`,
});

const extractTimeOnly = (dateTimeStr: string) => {
  if (!dateTimeStr) return "-";
  // Format: "03-01-2026 07:19:39.456" - extract time part
  const parts = dateTimeStr.split(" ");
  if (parts.length > 1) {
    return parts[1].substring(0, 8); // HH:MM:SS
  }
  return "-";
};

const ROWS_PER_PAGE_OPTIONS = [2, 10, 25, 50, 100, 500, 1000];
const MIN_DATE = "2026-04-16";
const TODAY = new Date().toISOString().split("T")[0];

const IncidencesPage = () => {
  const [incidents, setIncidents] = useState<KavachIncident[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    size: 10,
    number: 0,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [locoOptions, setLocoOptions] = useState<LocoItem[]>([]);
  const [stationOptions, setStationOptions] = useState<StationItem[]>([]);
  const [incidentCategoryOptions, setIncidentCategoryOptions] = useState<IncidentCategoryItem[]>([]);
  const [locoSearchText, setLocoSearchText] = useState("");
  const [stationSearchText, setStationSearchText] = useState("");
  const [zoneSearchText, setZoneSearchText] = useState("");
  const [divisionSearchText, setDivisionSearchText] = useState("");
  const [draftZoneId, setDraftZoneId] = useState<number | null>(null);
  const [draftDivisionId, setDraftDivisionId] = useState<number | null>(null);
  const [draftLocoId, setDraftLocoId] = useState<number | null>(null);
  const [draftLocoFirmId, setDraftLocoFirmId] = useState<number | null>(null);
  const [draftStationId, setDraftStationId] = useState<number | null>(null);
  const [draftStationFirmId, setDraftStationFirmId] = useState<number | null>(null);
  const [draftIncidentCategoryId, setDraftIncidentCategoryId] = useState<number | null>(null);
  const [draftIncidentSubCategoryId, setDraftIncidentSubCategoryId] = useState<number | null>(null);
  const [draftCriticalityLevel, setDraftCriticalityLevel] = useState<string | null>(null);
  const [draftIsNMSGenerated, setDraftIsNMSGenerated] = useState<boolean | null>(null);
  const [incidentCategorySearchText, setIncidentCategorySearchText] = useState("");
  const [loadingLocoOptions, setLoadingLocoOptions] = useState(false);
  const [loadingStationOptions, setLoadingStationOptions] = useState(false);
  const [loadingIncidentCategoryOptions, setLoadingIncidentCategoryOptions] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);
  const [popupLoading, setPopupLoading] = useState(false);

  // Tracks which column-wise filter panel dropdown is currently open
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(
    null,
  );

  const [packetType, setPacketType] = useState<"CURRENT" | "PREVIOUS" | null>(
    null,
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  useEffect(() => {
    loadCategories();
    loadSubCategories();
    loadFirms();
    loadZones();
    loadDivisions();
  }, []);

  // Filter state
  const currentDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [filters, setFilters] = useState<any>({
    tripDateFrom: "2026-04-16",
    tripDateTo: currentDate,
    locoId: null,
    locoFirmId: null,
    stationId: null,
    stationFirmId: null,
    zoneId: null,
    divisionId: null,
    incidentCategoryId: null,
    incidentSubCategoryId: null,
    criticalityLevel: null,
    isNMSGenerated: null,
  });

  const computeHasActiveFilters = (filterState: any) => {
    return (
      filterState.tripDateFrom !== "2026-04-16" ||
      filterState.tripDateTo !== currentDate ||
      Boolean(filterState.locoId) ||
      Boolean(filterState.locoFirmId) ||
      Boolean(filterState.stationId) ||
      Boolean(filterState.stationFirmId) ||
      Boolean(filterState.zoneId) ||
      Boolean(filterState.divisionId) ||
      Boolean(filterState.incidentCategoryId) ||
      Boolean(filterState.incidentSubCategoryId) ||
      Boolean(filterState.criticalityLevel) ||
      filterState.isNMSGenerated !== null
    );
  };

  const hasActiveFilters = useMemo(
    () => computeHasActiveFilters(filters),
    [filters, currentDate],
  );

  const buildIncidentsRequestBody = (
    pageNum = 0,
    pageSize = pagination.size,
    exportFlag = false,
    filterState = filters,
  ): KavachIncidentRequest => ({
    tripDateFrom: filterState.tripDateFrom,
    tripDateTo: filterState.tripDateTo,
    locoId: filterState.locoId ? Number(filterState.locoId) : null,
    locoFirmId: filterState.locoFirmId ? Number(filterState.locoFirmId) : null,
    stationId: filterState.stationId ? Number(filterState.stationId) : null,
    stationFirmId: filterState.stationFirmId
      ? Number(filterState.stationFirmId)
      : null,
    zoneId: filterState.zoneId ? Number(filterState.zoneId) : null,
    divisionId: filterState.divisionId ? Number(filterState.divisionId) : null,
    incidentCategoryId: filterState.incidentCategoryId
      ? Number(filterState.incidentCategoryId)
      : null,
    incidentSubCategoryId: filterState.incidentSubCategoryId
      ? Number(filterState.incidentSubCategoryId)
      : null,
    criticalityLevel: filterState.criticalityLevel || null,
    isNMSGenerated:
      filterState.isNMSGenerated !== null ? filterState.isNMSGenerated : null,
    page: pageNum,
    size: pageSize,
    sortBy: "tripDate",
    sortDir: "desc",
    export: exportFlag,
  });

  const loadCategories = async () => {
    const res = await axiosInstance.get("/incidentCategory/");
    setCategories(res.data.data || []);
  };
  const loadSubCategories = async () => {
    const res = await axiosInstance.get("/IncidentSubCategory/");
    setSubCategories(res.data.data || []);
  };
  const loadFirms = async () => {
    const res = await axiosInstance.get("/firm/");
    setFirms(res.data.data || []);
  };
  const loadZones = async () => {
    const res = await axiosInstance.get("/zone/");
    setZones(res.data.data || []);
  };
  const loadDivisions = async () => {
    const res = await axiosInstance.get("/division/");
    setDivisions(res.data.data || []);
  };

  const fetchIncidents = useCallback(
    async (
      pageNum = 0,
      pageSize = pagination.size,
      filterState = filters,
    ) => {
      setLoading(true);
      try {
        const requestBody = buildIncidentsRequestBody(
          pageNum,
          pageSize,
          false,
          filterState,
        );
        const response = await fetchKavachIncidentsPaginated(requestBody);
        const pageData = response?.page ?? {
          size: pageSize,
          number: pageNum,
          totalElements: 0,
          totalPages: 0,
        };

        setIncidents(response?.content ?? []);
        setPagination(pageData);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      }
      setLoading(false);
    },
    [pagination.size, filters],
  );

  const loadLocoOptions = useCallback(async () => {
    setLoadingLocoOptions(true);
    try {
      const response = await fetchLocoNumbers();
      setLocoOptions(response ?? []);
    } catch (error) {
      console.error("Error fetching loco list:", error);
    } finally {
      setLoadingLocoOptions(false);
    }
  }, []);

  const loadStationOptions = useCallback(async () => {
    setLoadingStationOptions(true);
    try {
      const response = await fetchStationNumbers();
      setStationOptions(response ?? []);
    } catch (error) {
      console.error("Error fetching station list:", error);
    } finally {
      setLoadingStationOptions(false);
    }
  }, []);

  const handlePacketPopup = async (
    locoNo: number,
    type: "CURRENT" | "PREVIOUS",
  ) => {
    try {
      setPacketType(type);
      setPopupOpen(true);
      setPopupLoading(true);
      setPopupData(null);

      const response = await fetchPacketPopup(locoNo);

      setPopupData(response?.[0] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setPopupLoading(false);
    }
  };
  const loadIncidentCategoryOptions = useCallback(async () => {
    setLoadingIncidentCategoryOptions(true);
    try {
      const response = await fetchIncidentCategories();
      setIncidentCategoryOptions(response ?? []);
    } catch (error) {
      console.error("Error fetching incident category list:", error);
    } finally {
      setLoadingIncidentCategoryOptions(false);
    }
  }, []);

  useEffect(() => {
    loadLocoOptions();
    loadStationOptions();
    loadIncidentCategoryOptions();
  }, [loadLocoOptions, loadStationOptions, loadIncidentCategoryOptions]);

  useEffect(() => {
    if (filters.locoId === null) {
      setLocoSearchText("");
      return;
    }

    const selectedLoco = locoOptions.find(
      (loco) => loco.sno === Number(filters.locoId),
    );
    setLocoSearchText(selectedLoco ? String(selectedLoco.locoId) : "");
  }, [filters.locoId, locoOptions]);

  useEffect(() => {
    if (filters.stationId === null) {
      setStationSearchText("");
      return;
    }

    const selectedStation = stationOptions.find(
      (station) => station.id === Number(filters.stationId),
    );
    setStationSearchText(
      selectedStation
        ? `${selectedStation.code} - ${selectedStation.name}`
        : "",
    );
  }, [filters.stationId, stationOptions]);

  const getAppliedZoneSearchText = () => {
    const selectedZone = zones.find((zone) => zone.id === Number(filters.zoneId));
    return selectedZone ? selectedZone.code : "";
  };

  const getAppliedDivisionSearchText = () => {
    const selectedDivision = divisions.find(
      (division) => division.id === Number(filters.divisionId),
    );
    return selectedDivision ? selectedDivision.code : "";
  };

  useEffect(() => {
    if (filters.zoneId === null) {
      setZoneSearchText("");
      return;
    }

    setZoneSearchText(getAppliedZoneSearchText());
  }, [filters.zoneId, zones]);

  useEffect(() => {
    if (filters.divisionId === null) {
      setDivisionSearchText("");
      return;
    }

    setDivisionSearchText(getAppliedDivisionSearchText());
  }, [filters.divisionId, divisions]);

  const closeActiveHeaderFilter = () => {
    if (activeHeaderFilter === "zone") {
      setDraftZoneId(filters.zoneId);
      setZoneSearchText(getAppliedZoneSearchText());
    }
    if (activeHeaderFilter === "division") {
      setDraftDivisionId(filters.divisionId);
      setDivisionSearchText(getAppliedDivisionSearchText());
    }
    if (activeHeaderFilter === "locoNo") {
      setDraftLocoId(filters.locoId);
      setLocoSearchText(filters.locoId ? String(filters.locoId) : "");
    }
    if (activeHeaderFilter === "locoOem") {
      setDraftLocoFirmId(filters.locoFirmId);
    }
    if (activeHeaderFilter === "station") {
      setDraftStationId(filters.stationId);
      setStationSearchText(filters.stationId ? String(filters.stationId) : "");
    }
    if (activeHeaderFilter === "stationOem") {
      setDraftStationFirmId(filters.stationFirmId);
    }
    if (activeHeaderFilter === "category") {
      setDraftIncidentCategoryId(filters.incidentCategoryId);
    }
    if (activeHeaderFilter === "subCategory") {
      setDraftIncidentSubCategoryId(filters.incidentSubCategoryId);
    }
    if (activeHeaderFilter === "criticality") {
      setDraftCriticalityLevel(filters.criticalityLevel);
    }
    if (activeHeaderFilter === "nms") {
      setDraftIsNMSGenerated(filters.isNMSGenerated);
    }
    setActiveHeaderFilter(null);
  };

  useEffect(() => {
    if (activeHeaderFilter === "zone") {
      setDraftZoneId(filters.zoneId);
      setZoneSearchText(getAppliedZoneSearchText());
    }
    if (activeHeaderFilter === "division") {
      setDraftDivisionId(filters.divisionId);
      setDivisionSearchText(getAppliedDivisionSearchText());
    }
    if (activeHeaderFilter === "locoNo") {
      setDraftLocoId(filters.locoId);
      setLocoSearchText(filters.locoId ? String(filters.locoId) : "");
    }
    if (activeHeaderFilter === "locoOem") {
      setDraftLocoFirmId(filters.locoFirmId);
    }
    if (activeHeaderFilter === "station") {
      setDraftStationId(filters.stationId);
      setStationSearchText(filters.stationId ? String(filters.stationId) : "");
    }
    if (activeHeaderFilter === "stationOem") {
      setDraftStationFirmId(filters.stationFirmId);
    }
    if (activeHeaderFilter === "category") {
      setDraftIncidentCategoryId(filters.incidentCategoryId);
    }
    if (activeHeaderFilter === "subCategory") {
      setDraftIncidentSubCategoryId(filters.incidentSubCategoryId);
    }
    if (activeHeaderFilter === "criticality") {
      setDraftCriticalityLevel(filters.criticalityLevel);
    }
    if (activeHeaderFilter === "nms") {
      setDraftIsNMSGenerated(filters.isNMSGenerated);
    }
  }, [activeHeaderFilter, filters.zoneId, filters.divisionId, zones, divisions]);

  useEffect(() => {
    if (filters.incidentCategoryId === null) {
      setIncidentCategorySearchText("");
      return;
    }

    const selectedCategory = incidentCategoryOptions.find(
      (category) => category.id === Number(filters.incidentCategoryId),
    );
    setIncidentCategorySearchText(selectedCategory ? selectedCategory.name : "");
  }, [filters.incidentCategoryId, incidentCategoryOptions]);

  useEffect(() => {
    fetchIncidents(0);
  }, []);

  const handleFilterApply = () => {
    if (filters.tripDateFrom < MIN_DATE) {
      alert("From Date cannot be before 16-Apr-2026");
      return;
    }

    if (filters.tripDateTo > TODAY) {
      alert("To Date cannot be greater than today");
      return;
    }

    if (filters.tripDateFrom > filters.tripDateTo) {
      alert("From Date cannot be greater than To Date");
      return;
    }
    setOpenFilter(false);
    fetchIncidents(0);
    setFiltersApplied(hasActiveFilters);
  };

  const handleFilterReset = () => {
    const defaultFilters = {
      tripDateFrom: "2026-04-16",
      tripDateTo: currentDate,
      locoId: null,
      locoFirmId: null,
      stationId: null,
      stationFirmId: null,
      zoneId: null,
      divisionId: null,
      incidentCategoryId: null,
      incidentSubCategoryId: null,
      criticalityLevel: null,
      isNMSGenerated: null,
    };

    setFilters(defaultFilters);
    setLocoSearchText("");
    setStationSearchText("");
    setZoneSearchText("");
    setDivisionSearchText("");
    setIncidentCategorySearchText("");
    setDraftZoneId(null);
    setDraftDivisionId(null);
    setDraftLocoId(null);
    setDraftLocoFirmId(null);
    setDraftStationId(null);
    setDraftStationFirmId(null);
    setDraftIncidentCategoryId(null);
    setDraftIncidentSubCategoryId(null);
    setDraftCriticalityLevel(null);
    setDraftIsNMSGenerated(null);
    setActiveHeaderFilter(null);
    setOpenFilter(false);
    setFiltersApplied(false);
    fetchIncidents(0, undefined, defaultFilters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      fetchIncidents(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleRowsPerPageChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, size: newSize, number: 0 }));
    fetchIncidents(0, newSize);
  };

  const getFileNameFromContentDisposition = (contentDisposition?: string) => {
    if (!contentDisposition) return null;
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
      contentDisposition,
    );
    if (!match) return null;
    return match[1].replace(/['"]/g, "");
  };

  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const requestBody = buildIncidentsRequestBody(0, pagination.size, true);
      const response = await exportKavachIncidentsToExcel(requestBody);
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fileName =
        getFileNameFromContentDisposition(
          response.headers["content-disposition"],
        ) ||
        `Kavach_Incidents_${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:T]/g, "")}.xlsx`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting incidents:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const msg12Sections = [
    {
      title: "Header Information",
      fields: [
        "DATE_TIME",
        "CREATED_AT",
        "ID",
        "MSG_TIME",
        "MESSAGE_TYPE",
        "MESSAGE_LENGTH",
        "STATIONARY_KAVACH_ID",
        "NMS_SYSTEM_ID",
        "SYSTEM_VERSION",
        "ONBOARD_ACTIVE_RADIO",
        "SOF_TX_BYTE1",
        "SOF_TX_BYTE2",
      ],
    },
    {
      title: "Packet Details",
      fields: [
        "NO_OF_MA_SECTION_COUNT",
        "ROUTE_ID",
        "PKT_TYPE",
        "PKT_LENGTH",
        "FRAME_NUM",
        "SOURCE_LOCO_ID",
        "SOURCE_LOCO_VERSION",
        "ABS_LOCO_LOC",
        "TRAIN_LENGTH",
        "TRAIN_SPEED",
        "MOVEMENT_DIR",
        "EMERGENCY_STATUS",
        "LOCO_MODE",
        "LAST_RFID_TAG",
        "TIN",
      ],
    },
    {
      title: "Extra Information",
      fields: [
        "L_DOUBTOVER",
        "L_DOUBTUNDER",
        "TRAIN_INT",
        "TAG_DUP",
        "TAG_LINK_INFO",
        "BRAKE_APPLIED",
        "NEW_MA_REPLY",
        "LAST_REF_PROFILE_NUM",
        "SIG_OV",
        "INFO_ACK",
        "SPARE",
        "LOCO_HEALTH_STATUS",
        "MAC_CODE",
        "FIRM_NAME",
        "DIVISION",
        "ZONE",
      ],
    },
  ];
  const formatTripDate = (dateStr: string) => {
    if (!dateStr) return "-";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };
  const resetAllFilters = () => {
    const defaultFilters = {
      tripDateFrom: "2026-04-16",
      tripDateTo: currentDate,
      locoId: null,
      locoFirmId: null,
      stationId: null,
      stationFirmId: null,
      zoneId: null,
      divisionId: null,
      incidentCategoryId: null,
      incidentSubCategoryId: null,
      criticalityLevel: null,
      isNMSGenerated: null,
    };

    setFilters(defaultFilters);
    setLocoSearchText("");
    setStationSearchText("");
    setZoneSearchText("");
    setDivisionSearchText("");
    setIncidentCategorySearchText("");
    setDraftZoneId(null);
    setDraftDivisionId(null);
    setDraftLocoId(null);
    setDraftLocoFirmId(null);
    setDraftStationId(null);
    setDraftStationFirmId(null);
    setDraftIncidentCategoryId(null);
    setDraftIncidentSubCategoryId(null);
    setDraftCriticalityLevel(null);
    setDraftIsNMSGenerated(null);
    setActiveHeaderFilter(null);
    setOpenFilter(false);
    setFiltersApplied(false);
    fetchIncidents(0, undefined, defaultFilters);
  };
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg h-[calc(100vh-88px)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-blue-600">KAVACH Incidents</h1>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setOpenFilter(true)}
            className={`flex items-center gap-2 border px-4 py-2 rounded-lg transition ${filtersApplied && hasActiveFilters
                ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "border-gray-300 hover:bg-gray-50"
              }`}
          >
            <Filter size={18} />
            {filtersApplied && hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-blue-600" />
            )}
            Filter
          </button>
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-2 border border-red-500 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Reset Filters
          </button>

          <button
            onClick={exportToExcel}
            disabled={exportLoading}
            className="flex items-center gap-2 border border-blue-500 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportLoading ? (
              <>
                <span className="inline-flex h-4 w-4 rounded-full border-2 border-current border-b-transparent animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} /> Export
              </>
            )}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto h-full min-h-0">
          <div className="h-full overflow-y-auto min-h-0 pb-4">
            {loading ? (
              <div className="flex h-[500px] items-center justify-center">
                <ContentLoading />
              </div>
            ) : (
              <table className="min-w-[1600px] w-full text-sm">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap">
                      SNo
                    </th>
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Zone</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "zone" ? null : "zone",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.zoneId
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "zone" && (
                        <ClickAwayListener onClickAway={closeActiveHeaderFilter}>
                          <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[200px] font-normal whitespace-normal text-left">
                            <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                              Filter Zone
                            </div>
                            <Autocomplete<any, false, false, true>
                            freeSolo
                            size="small"
                            options={zones}
                            filterOptions={filterZoneDivision}
                            getOptionLabel={(option) =>
                              typeof option === "string" ? option : option.code
                            }
                            renderOption={(props, option) => (
                              <li {...props}>
                                {option.code} - {option.name}
                              </li>
                            )}
                            value={
                              zones.find((zone) => zone.id === draftZoneId) ?? null
                            }
                            inputValue={zoneSearchText}
                            onInputChange={(_, value) => {
                              setZoneSearchText(value);
                              if (value === "") {
                                setDraftZoneId(null);
                              }
                            }}
                            onChange={(_, value) => {
                              if (typeof value === "string") {
                                setDraftZoneId(null);
                                setZoneSearchText(value);
                              } else if (!value) {
                                setDraftZoneId(null);
                                setZoneSearchText("");
                              } else {
                                setDraftZoneId(value.id);
                                setZoneSearchText(value.code);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Zone"
                                placeholder="All"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                }}
                              />
                            )}
                            noOptionsText="No zone found"
                            disablePortal
                          />
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = {
                                  ...filters,
                                  zoneId: null,
                                };
                                setDraftZoneId(null);
                                setZoneSearchText("");
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = {
                                  ...filters,
                                  zoneId: draftZoneId,
                                };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </ClickAwayListener>
                      )}
                    </th>
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Division</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "division" ? null : "division",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.divisionId
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "division" && (
                        <ClickAwayListener onClickAway={closeActiveHeaderFilter}>
                          <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[200px] font-normal whitespace-normal text-left">
                            <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                              Filter Division
                            </div>
                            <Autocomplete<any, false, false, true>
                            freeSolo
                            size="small"
                            options={divisions}
                            filterOptions={filterZoneDivision}
                            getOptionLabel={(option) =>
                              typeof option === "string" ? option : option.code
                            }
                            renderOption={(props, option) => (
                              <li {...props}>
                                {option.code} - {option.name}
                              </li>
                            )}
                            value={
                              divisions.find(
                                (division) => division.id === draftDivisionId,
                              ) ?? null
                            }
                            inputValue={divisionSearchText}
                            onInputChange={(_, value) => {
                              setDivisionSearchText(value);
                              if (value === "") {
                                setDraftDivisionId(null);
                              }
                            }}
                            onChange={(_, value) => {
                              if (typeof value === "string") {
                                setDraftDivisionId(null);
                                setDivisionSearchText(value);
                              } else if (!value) {
                                setDraftDivisionId(null);
                                setDivisionSearchText("");
                              } else {
                                setDraftDivisionId(value.id);
                                setDivisionSearchText(value.code);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Division"
                                placeholder="All"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                }}
                              />
                            )}
                            noOptionsText="No division found"
                            disablePortal
                          />
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = {
                                  ...filters,
                                  divisionId: null,
                                };
                                setDraftDivisionId(null);
                                setDivisionSearchText("");
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = {
                                  ...filters,
                                  divisionId: draftDivisionId,
                                };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </ClickAwayListener>
                      )}
                    </th>
                    <th className="border-r px-4 py-3 min-w-[10rem] text-left whitespace-nowrap">
                      Trip Date
                    </th>
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap">
                      Incident Time
                    </th>

                    {/* Loco No Filter Header */}
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Loco No</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "locoNo" ? null : "locoNo",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.locoId
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "locoNo" && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[260px] font-normal whitespace-normal text-left">
                          <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                            Filter Loco No
                          </div>
                          <Autocomplete<LocoItem, false, false, true>
                            freeSolo
                            size="small"
                            options={locoOptions}
                            getOptionLabel={(option) =>
                              typeof option === "string"
                                ? option
                                : String(option.locoId)
                            }
                            loading={loadingLocoOptions}
                            value={locoOptions.find((loco) => loco.sno === draftLocoId) ?? null}
                            inputValue={locoSearchText}
                            onInputChange={(_, value) => {
                              setLocoSearchText(value);
                              if (value === "") {
                                setDraftLocoId(null);
                              }
                            }}
                            onChange={(_, value) => {
                              if (typeof value === "string") {
                                setDraftLocoId(null);
                                setLocoSearchText(value);
                              } else if (!value) {
                                setDraftLocoId(null);
                                setLocoSearchText("");
                              } else {
                                setDraftLocoId(value.sno);
                                setLocoSearchText(String(value.locoId));
                              }
                            }}
                            isOptionEqualToValue={(option, value) =>
                              typeof value !== "string" &&
                              option.sno === value.sno
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Loco No"
                                placeholder="All"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loadingLocoOptions ? (
                                        <CircularProgress
                                          color="inherit"
                                          size={20}
                                        />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            noOptionsText="No loco found"
                          />
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, locoId: null };
                                setFilters(newFilters);
                                setLocoSearchText("");
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, locoId: draftLocoId };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* Loco OEM Filter Header */}
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Loco OEM</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "locoOem"
                                ? null
                                : "locoOem",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.locoFirmId
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "locoOem" && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[200px] font-normal whitespace-normal text-left">
                          <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                            Filter Loco OEM
                          </div>
                          <select
                            value={draftLocoFirmId ?? ""}
                            onChange={(e) => setDraftLocoFirmId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full text-sm border rounded p-2 bg-white outline-none focus:border-blue-500"
                          >
                            <option value="">All OEMs</option>
                            {firms.map((firm: any) => (
                              <option key={firm.id} value={firm.id}>
                                {firm.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, locoFirmId: null };
                                setDraftLocoFirmId(null);
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, locoFirmId: draftLocoFirmId };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* Station Filter Header */}
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Station</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "station"
                                ? null
                                : "station",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.stationId
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "station" && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[260px] font-normal whitespace-normal text-left">
                          <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                            Filter Station
                          </div>
                          <Autocomplete<StationItem, false, false, true>
                            freeSolo
                            size="small"
                            options={stationOptions}
                            getOptionLabel={(option) =>
                              typeof option === "string"
                                ? option
                                : `${option.code} - ${option.name}`
                            }
                            loading={loadingStationOptions}
                            value={stationOptions.find((station) => station.id === draftStationId) ?? null}
                            inputValue={stationSearchText}
                            onInputChange={(_, value) => {
                              setStationSearchText(value);
                              if (value === "") {
                                setDraftStationId(null);
                              }
                            }}
                            onChange={(_, value) => {
                              if (typeof value === "string") {
                                setDraftStationId(null);
                                setStationSearchText(value);
                              } else if (!value) {
                                setDraftStationId(null);
                                setStationSearchText("");
                              } else {
                                setDraftStationId(value.id);
                                setStationSearchText(`${value.code} - ${value.name}`);
                              }
                            }}
                            isOptionEqualToValue={(option, value) =>
                              typeof value !== "string" &&
                              option.id === value.id
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Station"
                                placeholder="All"
                                size="small"
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loadingStationOptions ? (
                                        <CircularProgress
                                          color="inherit"
                                          size={20}
                                        />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            noOptionsText="No station found"
                          />
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, stationId: null };
                                setFilters(newFilters);
                                setStationSearchText("");
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(filters));
                                fetchIncidents(0, undefined, filters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* Station OEM Filter Header */}
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Station OEM</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "stationOem"
                                ? null
                                : "stationOem",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.stationFirmId
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "stationOem" && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[200px] font-normal whitespace-normal text-left">
                          <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                            Filter Station OEM
                          </div>
                          <select
                            value={draftStationFirmId ?? ""}
                            onChange={(e) => setDraftStationFirmId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full text-sm border rounded p-2 bg-white outline-none focus:border-blue-500"
                          >
                            <option value="">All OEMs</option>
                            {firms.map((firm: any) => (
                              <option key={firm.id} value={firm.id}>
                                {firm.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, stationFirmId: null };
                                setDraftStationFirmId(null);
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, stationFirmId: draftStationFirmId };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    <th className="border-r px-4 py-3 text-left">
                      Brief Description
                    </th>
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Incident Category</span>

                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "category"
                                ? null
                                : "category",
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>

                      {activeHeaderFilter === "category" && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border z-50 min-w-[250px]">
                          <select
                            value={draftIncidentCategoryId ?? ""}
                            onChange={(e) => setDraftIncidentCategoryId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full border rounded p-2"
                          >
                            <option value="">All Categories</option>

                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, incidentCategoryId: null };
                                setDraftIncidentCategoryId(null);
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>

                            <button
                              onClick={() => {
                                const newFilters = { ...filters, incidentCategoryId: draftIncidentCategoryId };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>
                    <th className="border-r px-4 py-3 text-left whitespace-nowrap relative">
                      <div className="flex items-center justify-between gap-2">
                        <span>Incident Sub Category</span>

                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "subCategory"
                                ? null
                                : "subCategory",
                            )
                          }
                        >
                          <Filter size={14} />
                        </button>
                      </div>

                      {activeHeaderFilter === "subCategory" && (
                        <div className="absolute top-full left-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border z-50 min-w-[250px]">
                          <select
                            value={draftIncidentSubCategoryId ?? ""}
                            onChange={(e) => setDraftIncidentSubCategoryId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full border rounded p-2"
                          >
                            <option value="">All Sub Categories</option>

                            {subCategories.map((sub: any) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, incidentSubCategoryId: null };
                                setDraftIncidentSubCategoryId(null);
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>

                            <button
                              onClick={() => {
                                const newFilters = { ...filters, incidentSubCategoryId: draftIncidentSubCategoryId };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* Criticality Level Filter Header */}
                    <th className="border-r px-4 py-3 text-center whitespace-nowrap relative">
                      <div className="flex items-center justify-center gap-2">
                        <span>Criticality Level</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "criticality"
                                ? null
                                : "criticality",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.criticalityLevel
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "criticality" && (
                        <div className="absolute top-full right-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[180px] font-normal whitespace-normal text-left">
                          <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                            Filter Criticality
                          </div>
                          <select
                            value={draftCriticalityLevel ?? ""}
                            onChange={(e) => setDraftCriticalityLevel(e.target.value || null)}
                            className="w-full text-sm border rounded p-2 bg-white outline-none focus:border-blue-500"
                          >
                            <option value="">All Levels</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, criticalityLevel: null };
                                setDraftCriticalityLevel(null);
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, criticalityLevel: draftCriticalityLevel };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* NMS Generated Filter Header */}
                    <th className="px-4 py-3 text-center whitespace-nowrap relative">
                      <div className="flex items-center justify-center gap-2">
                        <span>NMS Generated</span>
                        <button
                          onClick={() =>
                            setActiveHeaderFilter(
                              activeHeaderFilter === "nms" ? null : "nms",
                            )
                          }
                          className="hover:text-blue-200 transition p-0.5"
                        >
                          <Filter
                            size={14}
                            className={
                              filters.isNMSGenerated !== null
                                ? "fill-current text-yellow-300"
                                : ""
                            }
                          />
                        </button>
                      </div>
                      {activeHeaderFilter === "nms" && (
                        <div className="absolute top-full right-0 mt-1 p-3 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 min-w-[150px] font-normal whitespace-normal text-left">
                          <div className="mb-2 font-semibold text-xs text-gray-500 uppercase tracking-wider">
                            Filter NMS
                          </div>
                          <select
                            value={draftIsNMSGenerated === null ? "" : String(draftIsNMSGenerated)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftIsNMSGenerated(val === "" ? null : val === "true");
                            }}
                            className="w-full text-sm border rounded p-2 bg-white outline-none focus:border-blue-500"
                          >
                            <option value="">All</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, isNMSGenerated: null };
                                setDraftIsNMSGenerated(null);
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const newFilters = { ...filters, isNMSGenerated: draftIsNMSGenerated };
                                setFilters(newFilters);
                                setActiveHeaderFilter(null);
                                setFiltersApplied(computeHasActiveFilters(newFilters));
                                fetchIncidents(0, undefined, newFilters);
                              }}
                              className="text-xs bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </th>

                    {/* <th className="sticky right-0 top-0 z-[60] bg-blue-600 px-4 py-3 text-center whitespace-nowrap">
                      Action
                    </th> */}
                  </tr>
                </thead>

                <tbody>
                  {incidents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={15}
                        className="text-center py-8 text-gray-500"
                      >
                        No incidents found
                      </td>
                    </tr>
                  ) : (
                    incidents.map((incident, index) => (
                      <tr
                        key={incident.id}
                        className={
                          index % 2 === 0
                            ? "bg-white border-b border-gray-200"
                            : "bg-gray-50 border-b border-gray-200"
                        }
                      >
                        <td className="border-r px-4 py-3 font-medium text-blue-600">
                          {pagination.number * pagination.size + index + 1}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.mstStation?.division?.zone?.code ?? ""}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.mstStation?.division?.code ?? ""}
                        </td>
                        <td className="border-r px-4 py-3 min-w-[10rem]">
                          {formatTripDate(incident.tripDate)}
                        </td>
                        <td className="border-r px-4 py-3">
                          {extractTimeOnly(incident.incidentDateTime)}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.loco?.locoId ?? incident.locoNo}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.loco?.firm?.name ?? ""}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.mstStation?.code ?? ""}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.mstStation?.firm?.name ?? "-"}
                        </td>
                        <td className="border-r px-4 py-3 min-w-[48rem] whitespace-pre-wrap break-words text-gray-700">
                          {incident.briefDescription ?? ""}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.incidentCategory?.name ?? ""}
                        </td>
                        <td className="border-r px-4 py-3">
                          {incident.incidentSubCategory?.name ?? ""}
                        </td>
                        <td className="border-r px-4 py-3 text-center">
                          <CriticalityButton
                            level={incident.criticalityLevel ?? ""}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100">
                            {incident.NMSGenerated ? "Yes" : "No"}
                          </span>
                        </td>
                        <td
                          className={`sticky right-0 z-50 px-4 py-3 text-center border-l ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                        >
                          {/* <div className="flex items-center justify-center gap-2">
                            {incident.previousPktId && (
                              <button
                                onClick={() =>
                                  handlePacketPopup(
                                    incident.previousPktId!,
                                    "PREVIOUS",
                                  )
                                }
                                title="Previous Packet"
                                className="p-2 rounded-md bg-orange-100 text-orange-600 hover:bg-orange-200 transition"
                              >
                                <AlignEndVertical size={16} />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handlePacketPopup(
                                  incident.currentPktId,
                                  "CURRENT",
                                )
                              }
                              title="Current Packet"
                              className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                            >
                              <AlignEndHorizontal size={16} />
                            </button>
                          </div> */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* PAGINATION */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4 bg-white border-t">
          <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pagination.size}
                onChange={(e) =>
                  handleRowsPerPageChange(Number(e.target.value))
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
              >
                {ROWS_PER_PAGE_OPTIONS.map((sizeOption) => (
                  <option key={sizeOption} value={sizeOption}>
                    {sizeOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {pagination.totalElements === 0
                ? "0–0 of 0"
                : `${pagination.number * pagination.size + 1}–${Math.min(
                  (pagination.number + 1) * pagination.size,
                  pagination.totalElements,
                )} of ${pagination.totalElements}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={pagination.number === 0}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronsLeft size={18} />
            </button>

            <button
              onClick={() => handlePageChange(pagination.number - 1)}
              disabled={pagination.number === 0}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => handlePageChange(pagination.number + 1)}
              disabled={pagination.number >= pagination.totalPages - 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => handlePageChange(pagination.totalPages - 1)}
              disabled={pagination.number >= pagination.totalPages - 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER MODAL */}
      {openFilter && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[820px] max-w-[98vw] max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Filter Incidents</h2>
              <button
                onClick={() => setOpenFilter(false)}
                className="hover:text-red-500 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="xl:col-span-2">
                <Autocomplete<StationItem, false, false, true>
                  freeSolo
                  options={stationOptions}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.code} - ${option.name}`
                  }
                  loading={loadingStationOptions}
                  value={
                    stationOptions.find(
                      (station) => station.id === filters.stationId,
                    ) ?? null
                  }
                  inputValue={stationSearchText}
                  onInputChange={(_, value) => {
                    setStationSearchText(value);
                    if (value === "") {
                      setFilters({ ...filters, stationId: null });
                    }
                  }}
                  onChange={(_, value) => {
                    if (typeof value === "string") {
                      setFilters({ ...filters, stationId: null });
                      setStationSearchText(value);
                    } else if (!value) {
                      setFilters({ ...filters, stationId: null });
                      setStationSearchText("");
                    } else {
                      setFilters({ ...filters, stationId: value.id });
                      setStationSearchText(`${value.code} - ${value.name}`);
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    typeof value !== "string" && option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Station"
                      placeholder="All"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStationOptions ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  noOptionsText="No station found"
                />
              </div>

              <div className="xl:col-span-2">
                <Autocomplete<IncidentCategoryItem, false, false, true>
                  freeSolo
                  options={incidentCategoryOptions}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  loading={loadingIncidentCategoryOptions}
                  value={
                    incidentCategoryOptions.find(
                      (category) => category.id === filters.incidentCategoryId,
                    ) ?? null
                  }
                  inputValue={incidentCategorySearchText}
                  onInputChange={(_, value) => {
                    setIncidentCategorySearchText(value);
                    if (value === "") {
                      setFilters({ ...filters, incidentCategoryId: null });
                    }
                  }}
                  onChange={(_, value) => {
                    if (typeof value === "string") {
                      setFilters({ ...filters, incidentCategoryId: null });
                      setIncidentCategorySearchText(value);
                    } else if (!value) {
                      setFilters({ ...filters, incidentCategoryId: null });
                      setIncidentCategorySearchText("");
                    } else {
                      setFilters({ ...filters, incidentCategoryId: value.id });
                      setIncidentCategorySearchText(value.name);
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    typeof value !== "string" && option.id === value.id
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Incident Category"
                      placeholder="All"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingIncidentCategoryOptions ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  noOptionsText="No incident category found"
                />
              </div>

              <div className="xl:col-span-2">
                <Autocomplete<LocoItem, false, false, true>
                  freeSolo
                  options={locoOptions}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : String(option.locoId)
                  }
                  loading={loadingLocoOptions}
                  value={
                    locoOptions.find((loco) => loco.sno === filters.locoId) ??
                    null
                  }
                  inputValue={locoSearchText}
                  onInputChange={(_, value) => {
                    setLocoSearchText(value);
                    if (value === "") {
                      setFilters({ ...filters, locoId: null });
                    }
                  }}
                  onChange={(_, value) => {
                    if (typeof value === "string") {
                      setFilters({ ...filters, locoId: null });
                      setLocoSearchText(value);
                    } else if (!value) {
                      setFilters({ ...filters, locoId: null });
                      setLocoSearchText("");
                    } else {
                      setFilters({ ...filters, locoId: value.sno });
                      setLocoSearchText(String(value.locoId));
                    }
                  }}
                  isOptionEqualToValue={(option, value) =>
                    typeof value !== "string" && option.sno === value.sno
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Loco No"
                      placeholder="All"
                      size="small"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingLocoOptions ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  noOptionsText="No loco found"
                />
              </div>

              <div className="xl:col-span-2"></div>

              <div className="xl:col-span-2">
                <TextField
                  label="Trip Date From"
                  type="date"
                  value={filters.tripDateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, tripDateFrom: e.target.value })
                  }
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: MIN_DATE,
                    max: TODAY,
                  }}
                />
              </div>

              <div className="xl:col-span-2">
                <TextField
                  label="Trip Date To"
                  type="date"
                  value={filters.tripDateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, tripDateTo: e.target.value })
                  }
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: filters.tripDateFrom || MIN_DATE,
                    max: TODAY,
                  }}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t px-6 py-4 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleFilterReset}
                className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>

              <button
                onClick={handleFilterApply}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}


      {popupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            onClick={() => setPopupOpen(false)}
          />

          <div className="relative bg-white w-[950px] max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-5 py-3 flex justify-between items-center">
              <h2 className="text-sm font-semibold">
                {packetType === "CURRENT"
                  ? "Current Packet Details"
                  : "Previous Packet Details"}
              </h2>

              <button
                onClick={() => setPopupOpen(false)}
                className="bg-white text-indigo-600 px-3 py-1 rounded-md text-xs font-medium"
              >
                Close
              </button>
            </div>

            <div className="overflow-auto p-4 flex-1 bg-gray-50">
              {popupLoading ? (
                <div className="flex h-[500px] items-center justify-center">
                  <ContentLoading />
                </div>
              ) : (
                msg12Sections.map((section) => (
                  <div
                    key={section.title}
                    className="mb-5 bg-white rounded-2xl shadow border overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-4 py-2 text-sm font-semibold">
                      {section.title}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 p-4">
                      {section.fields.map((field) => (
                        <div
                          key={field}
                          className="border rounded-xl p-3 bg-gray-50"
                        >
                          <div className="text-xs text-gray-500 mb-1">
                            {field.replace(/_/g, " ")}
                          </div>

                          <div className="text-sm font-semibold text-gray-800 break-all">
                            {popupData?.[field] ?? "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidencesPage;
