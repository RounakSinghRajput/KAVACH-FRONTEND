import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Chip,
  Stack,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Checkbox,
} from "@mui/material";
import {
  FilterList,
  Download,
  PictureAsPdf,
  Search,
  Refresh,
} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { useNotify } from "../../context/notification-context";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

// Formats API object keys to readable visual text headers
const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

// Available sub-exception report configurations mapping to the query parameters
const REPORT_TYPES = [
  { label: "Mode Degradation", value: "MODE_DEGRADATION" },
  { label: "Mode Restored Data", value: "MODE_RESTORE" },
  { label: "Foreign RFID", value: "FOREIGN_RFID" },
  {
    label: "Invalid Combination of Signal Aspect",
    value: "INVALID_SIGNAL_COMBINATION",
  },
  { label: "Signal Aspect Combination", value: "SIGNAL_ASPECT_COMBINATION" },
  { label: "TOC NMS Module", value: "TOC_NMS_MODULE" },
  { label: "Both Tags Missed", value: "BOTH_TAGS_MISSED" },
];
const columnOrder = [
  // Date & Time
  "dateTime",
  "date",
  "time",
  "frameNo",
  "locoFrameNo",

  // Station Details
  "stationName",
  "stationCode",
  "stationId",

  // Tag Details
  "tagId",
  "Tag",
  "lastRfidTag",
  "tagDuplicate",
  "tagLinkInfo",

  // Loco Details
  "locoId",
  "locoMode",
  "mode",
  "modeOfLoco",
  "direction",
  "movementDirection",
  "trainSpeed",
  "trainLength",
  "absLocation",
  "locoAbsLocation",

  // Status Information
  "brakeApplied",
  "brakeStatus",
  "emergencyStatus",
  "activeRadio",
  "trainIntegrity",
  "sourceLocoVersion",

  // Fault Information
  "faultMessage",
];

const ExceptionReportEngine = () => {
  const { showAlert } = useNotify();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // --- UI Layout States ---
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // --- Master Report Type Picker State ---
  const [selectedReportType, setSelectedReportType] =
    useState<string>("MODE_DEGRADATION");

  // --- Filter Logic States (Server API Side Parameters) ---
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [selectedStationId, setSelectedStationId] = useState<string>("ALL");
  const [selectedLocoId, setSelectedLocoId] = useState<string>("ALL");

  // --- Client Side Column Specific Dropdown Grid Filters ---
  const [selectedLocoMode, setSelectedLocoMode] = useState<string[]>([]);
  const [selectedMovementDirection, setSelectedMovementDirection] = useState<
    string[]
  >([]);
  const [selectedStationName, setSelectedStationName] = useState<string[]>([]);
  const [selectedBrakeApplied, setSelectedBrakeApplied] = useState<string[]>(
    [],
  );

  // --- Dynamic Dropdown Auto Options Lists States (Meta Sync) ---
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [locoIdsList, setLocoIdsList] = useState<any[]>([]);

  // --- Data States ---
  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);

  // --- Table Pagination States ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // --- Safely extract unique options dynamically out of payload content for client filtering ---
  const uniqueLocoModes = Array.from(
    new Set(masterRows.map((row) => row.locoMode || row.mode).filter(Boolean)),
  ).sort();
  const uniqueMovementDirections = Array.from(
    new Set(
      masterRows
        .map((row) => row.movementDirection || row.movementDir || row.direction)
        .filter(Boolean),
    ),
  ).sort();
  const uniqueStationNames = Array.from(
    new Set(masterRows.map((row) => row.stationName).filter(Boolean)),
  ).sort();
  const uniqueBrakeStatuses = Array.from(
    new Set(masterRows.map((row) => row.brakeApplied).filter(Boolean)),
  ).sort();

  // --- Close header dropdown filters when mouse clicks outside ---
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveHeaderDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // --- Load Master Metadata Dropdown Values ---
  useEffect(() => {
    const fetchFilterMetaData = async () => {
      try {
        const [stationRes, locoRes] = await Promise.all([
          axiosInstance
            .get("/missing-tags/meta/stations")
            .catch(() => ({ data: [] })),
          axiosInstance
            .get("/api/eb-issue-report/unique_loco")
            .catch(() => ({ data: [] })),
        ]);
        setStationsList(stationRes.data?.data || stationRes.data || []);
        setLocoIdsList(locoRes.data?.data || locoRes.data || []);
      } catch (err) {
        showAlert("Failed loading master filter options.", "error");
      }
    };
    fetchFilterMetaData();
  }, []);

  // --- Execute Dynamic Client Grid Row Calculations ---
  useEffect(() => {
    let result = [...masterRows];

    if (selectedLocoMode.length > 0) {
      result = result.filter((row) =>
        selectedLocoMode.includes(row.locoMode || row.mode),
      );
    }
    if (selectedMovementDirection.length > 0) {
      result = result.filter((row) =>
        selectedMovementDirection.includes(
          row.movementDirection || row.movementDir || row.direction,
        ),
      );
    }
    if (selectedStationName.length > 0) {
      result = result.filter((row) =>
        selectedStationName.includes(row.stationName),
      );
    }
    if (selectedBrakeApplied.length > 0) {
      result = result.filter((row) =>
        selectedBrakeApplied.includes(row.brakeApplied),
      );
    }

    setFilteredRows(result);
  }, [
    selectedLocoMode,
    selectedMovementDirection,
    selectedStationName,
    selectedBrakeApplied,
    masterRows,
  ]);

  const clearData = () => {
    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    setSelectedStationId("ALL");
    setSelectedLocoId("ALL");
    setSelectedLocoMode([]);
    setSelectedMovementDirection([]);
    setSelectedStationName([]);
    setSelectedBrakeApplied([]);
    setShowFilters(false);
    setPage(0);
  };

  // --- Fetch Core Data Pipeline ---
  const handleFetchData = async (
    pageNo = 0,
    rowsPerPage = pageSize,
    useServerFilters = false,
  ) => {
    if (!selectedReportType) {
      showAlert(
        "Please choose a valid Report Type before querying records.",
        "warning",
      );
      return;
    }

    setLoading(true);

    const requestParams: any = {
      reportType: selectedReportType,
      page: pageNo,
      size: rowsPerPage,
      fromDate: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined,
      toDate: toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined,
    };

    if (useServerFilters) {
      if (selectedStationId !== "ALL")
        requestParams.stationId = selectedStationId;
      if (selectedLocoId !== "ALL") requestParams.locoId = selectedLocoId;
    }

    setSelectedLocoMode([]);
    setSelectedMovementDirection([]);
    setSelectedStationName([]);
    setSelectedBrakeApplied([]);

    try {
      const response = await axiosInstance.get("/api/exception-report", {
        params: requestParams,
      });

      let rawContent =
        response.data?.content || response.data?.data || response.data;
      const data = Array.isArray(rawContent) ? rawContent : [];

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        showAlert("No records matched the selected query metrics.", "info");
        return;
      }

      const hiddenColumns = ["id"];
      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      const orderedKeys = [
        ...columnOrder.filter((key) => columnKeys.includes(key)),
        ...columnKeys.filter((key) => !columnOrder.includes(key)),
      ];

      const headerMap: Record<string, string> = {
        dateTime: "Date & Time",
        date: "Date",
        time: "Time",
        frameNo: "Frame Time",
        locoFrameNo: "Frame Time",

        stationName: "Station",
        stationCode: "Station Code",
        stationId: "Station ID",

        tagId: "Tag ID",
        Tag: "Tag ID",
        lastRfidTag: "Last RFID Tag",
        tagDuplicate: "Tag Type",
        tagLinkInfo: "Tag Link Info",

        locoId: "Loco ID",
        locoMode: "Loco Mode",
        mode: "Loco Mode",
        modeOfLoco: "Loco Mode",

        direction: "Direction",
        movementDirection: "Direction",

        trainSpeed: "Train Speed",
        trainLength: "Train Length",

        absLocation: "Loco Location",
        locoAbsLocation: "Loco Location",

        brakeApplied: "Brake Status",
        brakeStatus: "Brake Status",

        emergencyStatus: "Emergency Status",
        activeRadio: "Active Radio",
        trainIntegrity: "Train Integrity",
        sourceLocoVersion: "Kavach Version",

        faultMessage: "Fault Message",
      };

      const dynamicColumns = orderedKeys.map((key) => ({
        field: key,
        headerName: headerMap[key] || formatHeader(key),
      }));

      const rowsWithId = data.map((row: any, index: number) => ({
        id: pageNo * rowsPerPage + index + 1,
        ...row,
      }));

      setColumns(dynamicColumns);
      setMasterRows(rowsWithId);
      setFilteredRows(rowsWithId);
      setTotalRecords(
        response.data.totalElements || response.data.total || rowsWithId.length,
      );

      setShowFilters(true);
      setPage(pageNo);
    } catch (error: any) {
      showAlert(
        "An error occurred trying to parse exception logs from the backend module.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert(
        "No report rows are present to execute an Excel compile.",
        "warning",
      );
      return;
    }
    const reportData = filteredRows.map(({ id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_json(ws, reportData, { origin: "A1" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exception Logs");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    const activeReportLabel =
      REPORT_TYPES.find((r) => r.value === selectedReportType)?.label ||
      "Report";
    saveAs(
      blob,
      `${activeReportLabel.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
  };

  const getSelectedValueForField = (field: string) => {
    if (field === "locoMode" || field === "mode") return selectedLocoMode;
    if (
      field === "movementDirection" ||
      field === "movementDir" ||
      field === "direction"
    )
      return selectedMovementDirection;
    if (field === "stationName") return selectedStationName;
    if (field === "brakeApplied") return selectedBrakeApplied;
    return [];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Main Application Report Title --- */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1976D2",
            fontSize: "1.5rem",
          }}
        >
          {REPORT_TYPES.find((r) => r.value === selectedReportType)?.label ||
            "Exception"}{" "}
          Issue Reports
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: "2.5px", bgcolor: "#1976d2", mb: 4 }} />

      {/* --- Main Action Parameter Bar --- */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            mb: 3,
          }}
        >
          <Box sx={{ width: 280 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="report-type-select-label">
                Select Report Target
              </InputLabel>
              <Select
                labelId="report-type-select-label"
                value={selectedReportType}
                label="Select Report Target"
                onChange={(e) => {
                  setSelectedReportType(e.target.value);
                  clearData();
                }}
              >
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ width: 210 }}>
            <DateTimePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              ampm={false}
              format="DD-MM-YYYY HH:mm:ss"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
          <Box sx={{ width: 210 }}>
            <DateTimePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              ampm={false}
              format="DD-MM-YYYY HH:mm:ss"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => handleFetchData(0, pageSize, false)}
            sx={{
              height: 40,
              px: 4,
              fontWeight: "bold",
              bgcolor: "#1976d2",
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Apply
          </Button>

          <Tooltip title="Reset View" arrow>
            <IconButton
              onClick={clearData}
              sx={{
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                height: 40,
                width: 40,
                color: "#64748b",
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </LocalizationProvider>

      {/* --- Filter Pipeline Header Panel --- */}
      <Collapse in={showFilters}>
        <Card
          elevation={0}
          sx={{
            borderRadius: "24px",
            mb: 4,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <FilterList sx={{ fontSize: 18, color: "#334155" }} />
              <Typography
                sx={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}
              >
                Report Filters Panel
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* <Box sx={{ width: 240 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="station-select-label">
                    Station Basis
                  </InputLabel>
                  <Select
                    labelId="station-select-label"
                    value={selectedStationId}
                    label="Station Basis"
                    onChange={(e) => setSelectedStationId(e.target.value)}
                  >
                    <MenuItem value="ALL">All Stations</MenuItem>
                    {stationsList.map((st, i) => {
                      const idVal = st.stationId || st.id || st;
                      const displayName = st.stationName
                        ? `${st.stationName} (${st.stationCode || idVal})`
                        : idVal;
                      return (
                        <MenuItem key={idVal || i} value={idVal}>
                          {displayName}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box> */}

              <Box sx={{ width: 220 }}>
                <Autocomplete
                  size="small"
                  options={[{ locoId: "ALL" }, ...locoIdsList]}
                  getOptionLabel={(option) =>
                    option.locoId || option.id || option.toString()
                  }
                  value={
                    selectedLocoId === "ALL"
                      ? { locoId: "ALL" }
                      : locoIdsList.find(
                          (loco) =>
                            (loco.locoId || loco.id || loco) === selectedLocoId,
                        ) || null
                  }
                  onChange={(event, newValue) => {
                    setSelectedLocoId(
                      newValue
                        ? newValue.locoId || newValue.id || newValue
                        : "ALL",
                    );
                  }}
                  isOptionEqualToValue={(option, value) =>
                    (option.locoId || option.id || option) ===
                    (value?.locoId || value?.id || value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Loco ID"
                      placeholder="Search Loco..."
                    />
                  )}
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<Search sx={{ fontSize: 16 }} />}
                onClick={() => handleFetchData(0, pageSize, true)}
                sx={{
                  height: 40,
                  px: 3,
                  fontWeight: "bold",
                  bgcolor: "#1976d2",
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#1565c0" },
                }}
              >
                Get Report
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* --- Master Data Display Segment --- */}
      {loading || masterRows.length > 0 ? (
        <Card elevation={0} sx={{ border: "none", bgcolor: "transparent" }}>
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              flexWrap="wrap"
              gap={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                {/* <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#000" }}
                >
                  {
                    REPORT_TYPES.find((r) => r.value === selectedReportType)
                      ?.label
                  }{" "}
                  Records Logs
                </Typography> */}
                <Chip
                  variant="filled"
                  size="small"
                  label={`Rows Found: ${filteredRows.length}`}
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "#1976d2",
                    color: "#fff",
                    height: 22,
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  variant="outlined"
                  size="small"
                  onClick={exportToExcel}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    color: "#1976d2",
                    borderColor: "#1976d2",
                    fontWeight: "medium",
                    "&:hover": {
                      borderColor: "#1565c0",
                      bgcolor: "rgba(25,118,210,0.04)",
                    },
                  }}
                >
                  Excel
                </Button>
              </Stack>
            </Stack>

            <Paper
              sx={{
                width: "100%",
                overflow: "hidden",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                boxShadow: "none",
              }}
            >
              <div
                className="overflow-auto"
                style={{ maxHeight: "550px" }}
                ref={dropdownRef}
              >
                {loading ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <ContentLoading />
                  </div>
                ) : (
                  <table
                    className="border-collapse w-full"
                    style={{ minWidth: `${columns.length * 170}px` }}
                  >
                    <thead className="sticky top-0 z-20">
                      {/* Standard Application Vibrant Royal Blue Header Line */}
                      <tr className="bg-[#1976d2] text-white">
                        {columns.map((col) => {
                          const targetField = col.field.toLowerCase();
                          const isFilterable =
                            targetField.includes("mode") ||
                            targetField.includes("direction") ||
                            targetField.includes("stationname") ||
                            targetField.includes("brakeapplied");

                          return (
                            <th
                              key={col.field}
                              className="relative border border-white/20 px-4 py-3 text-left text-sm font-semibold tracking-wide whitespace-nowrap"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{col.headerName}</span>

                                {isFilterable && (
                                  <div className="relative inline-block">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveHeaderDropdown(
                                          activeHeaderDropdown === col.field
                                            ? null
                                            : col.field,
                                        );
                                      }}
                                      sx={{
                                        color: "#fff",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(255,255,255,0.15)",
                                        },
                                      }}
                                    >
                                      <FilterList
                                        style={{ fontSize: "15px" }}
                                      />
                                    </IconButton>

                                    {activeHeaderDropdown === col.field && (
                                      <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded shadow-lg z-50 text-gray-800 font-normal py-1 max-h-60 overflow-y-auto">
                                        <div className="px-3 py-1.5 text-xs font-semibold border-b bg-gray-50 text-gray-500 sticky top-0 z-10">
                                          Filter By {col.headerName}
                                        </div>

                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (targetField.includes("mode"))
                                              setSelectedLocoMode([]);
                                            else if (
                                              targetField.includes("direction")
                                            )
                                              setSelectedMovementDirection([]);
                                            else if (
                                              targetField.includes(
                                                "stationname",
                                              )
                                            )
                                              setSelectedStationName([]);
                                            else setSelectedBrakeApplied([]);
                                            setActiveHeaderDropdown(null);
                                          }}
                                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                                            getSelectedValueForField(col.field)
                                              .length === 0
                                              ? "bg-gray-50 font-bold text-[#1976d2]"
                                              : ""
                                          }`}
                                        >
                                          All Options
                                        </div>

                                        {(targetField.includes("mode")
                                          ? uniqueLocoModes
                                          : targetField.includes("direction")
                                            ? uniqueMovementDirections
                                            : targetField.includes(
                                                  "stationname",
                                                )
                                              ? uniqueStationNames
                                              : uniqueBrakeStatuses
                                        ).map((opt) => (
                                          <div
                                            key={opt}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const setter =
                                                targetField.includes("mode")
                                                  ? setSelectedLocoMode
                                                  : targetField.includes(
                                                        "direction",
                                                      )
                                                    ? setSelectedMovementDirection
                                                    : targetField.includes(
                                                          "stationname",
                                                        )
                                                      ? setSelectedStationName
                                                      : setSelectedBrakeApplied;

                                              setter((prev) =>
                                                prev.includes(opt)
                                                  ? prev.filter(
                                                      (v) => v !== opt,
                                                    )
                                                  : [...prev, opt],
                                              );
                                            }}
                                            className={`px-4 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-gray-100 ${
                                              getSelectedValueForField(
                                                col.field,
                                              ).includes(opt)
                                                ? "bg-gray-50 font-bold text-[#1976d2]"
                                                : ""
                                            }`}
                                          >
                                            <Checkbox
                                              size="small"
                                              color="primary"
                                              checked={getSelectedValueForField(
                                                col.field,
                                              ).includes(opt)}
                                            />
                                            <span className="text-xs whitespace-normal">
                                              {opt}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, index) => (
                        <tr
                          key={row.id || index}
                          className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.field}
                              className="border border-gray-200 px-4 py-3 text-sm whitespace-nowrap text-gray-700"
                            >
                              {col.field.toLowerCase() === "datetime" ||
                              col.field.toLowerCase() === "timestamp" ? (
                                <span className="font-normal text-gray-800">
                                  {dayjs(row[col.field]).format("DD-MM-YYYY")} |{" "}
                                  <span className="text-[#1976d2] font-bold">
                                    {dayjs(row[col.field]).format("HH:mm:ss")}
                                  </span>
                                </span>
                              ) : col.field.toLowerCase().includes("mode") &&
                                row[col.field] ? (
                                <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded border border-green-200 text-xs">
                                  {row[col.field]}
                                </span>
                              ) : (
                                (row[col.field] ?? "-").toString()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* --- Table Footer Pagination Alignment --- */}
              <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      setPage(0);
                      handleFetchData(0, newSize, showFilters);
                    }}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none text-gray-700 focus:border-blue-500 cursor-pointer"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, totalRecords)} of{" "}
                  <span className="font-semibold text-gray-900">
                    {totalRecords}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFetchData(0, pageSize, showFilters)}
                    disabled={page === 0}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleFetchData(page - 1, pageSize, showFilters)
                    }
                    disabled={page === 0}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleFetchData(page + 1, pageSize, showFilters)
                    }
                    disabled={(page + 1) * pageSize >= totalRecords}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleFetchData(
                        Math.ceil(totalRecords / pageSize) - 1,
                        pageSize,
                        showFilters,
                      )
                    }
                    disabled={(page + 1) * pageSize >= totalRecords}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </Paper>
          </Box>
        </Card>
      ) : (
        <Paper
          elevation={0}
          sx={{
            minHeight: 360,
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            mt: 2,
            border: "1px dashed #cbd5e1",
            bgcolor: "#f8fafc",
            p: 4,
          }}
        >
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              bgcolor: "rgba(25,118,210,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <FilterList sx={{ fontSize: 32, color: "#1976d2" }} />
          </Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="#334155"
            gutterBottom
          >
            No Exception Report Type And date range selected yet
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Select an Exception Report Type and a date range, then click{" "}
            <b>Apply</b>.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ExceptionReportEngine;
