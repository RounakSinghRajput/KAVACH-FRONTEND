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

// Formats camelCase keys to human-readable headers (e.g., activeRadio -> Active Radio)
const formatHeader = (key: string) => {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
};

const EBIssueReport = () => {
  const { showAlert } = useNotify();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // --- UI Layout States ---
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // --- Filter Logic States (Server API Side) ---
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [selectedStationId, setSelectedStationId] = useState<string>("ALL");
  const [selectedLocoId, setSelectedLocoId] = useState<string>("ALL");

  // --- Client Side Column Specific Text Filters ---
  const [selectedLocoMode, setSelectedLocoMode] = useState<string[]>([]);
  const [selectedMovementDirection, setSelectedMovementDirection] = useState<
    string[]
  >([]);
  const [selectedStationName, setSelectedStationName] = useState<string[]>([]);
  const [selectedBrakeApplied, setSelectedBrakeApplied] = useState<string[]>(
    [],
  );

  // --- Dynamic Dropdown Selection Lists States (Meta Fetch) ---
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

  // --- Extract Unique Header Options dynamically for Client-Side Filtering ---
  const uniqueLocoModes = Array.from(
    new Set(masterRows.map((row) => row.locoMode).filter(Boolean)),
  ).sort();
  const uniqueMovementDirections = Array.from(
    new Set(masterRows.map((row) => row.movementDirection).filter(Boolean)),
  ).sort();
  const uniqueStationNames = Array.from(
    new Set(masterRows.map((row) => row.stationName).filter(Boolean)),
  ).sort();
  const uniqueBrakeStatuses = Array.from(
    new Set(masterRows.map((row) => row.brakeApplied).filter(Boolean)),
  ).sort();

  // --- Global click listener to close custom table header dropdowns ---
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

  // --- Fetch Meta Filter Data initially when component mounts ---
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

  // --- Sync Table View whenever client-side column header selections change ---
  useEffect(() => {
    let result = [...masterRows];

    if (selectedLocoMode.length > 0) {
      result = result.filter((row) => selectedLocoMode.includes(row.locoMode));
    }
    if (selectedMovementDirection.length > 0) {
      result = result.filter((row) =>
        selectedMovementDirection.includes(row.movementDirection),
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

  // --- Core API Data Retrieval Engine ---
  const handleFetchData = async (
    pageNo = 0,
    rowsPerPage = pageSize,
    useServerFilters = false,
  ) => {
    setLoading(true);

    const requestParams: any = {
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

    // Reset client-side grid header filters on clean network parameters fetch
    setSelectedLocoMode([]);
    setSelectedMovementDirection([]);
    setSelectedStationName([]);
    setSelectedBrakeApplied([]);

    try {
      const response = await axiosInstance.get("/api/eb-issue-report/get", {
        params: requestParams,
      });

      let rawContent =
        response.data?.content || response.data?.data || response.data;
      const data = Array.isArray(rawContent) ? rawContent : [];

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        showAlert(
          "No Emergency Brake issue logs found matching your request criteria.",
          "info",
        );
        return;
      }

      // Hide exact internal IDs dynamically if necessary
      const hiddenColumns = ["id"];
      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      const columnOrder = [
        // Date & Time
        "dateTime",
        "frameNo",

        // Station
        "stationName",
        "stationCode",
        "stationId",
        "tagId",

        // Loco
        "locoId",
        "locoMode",
        "movementDirection",
        "trainSpeed",
        "locoAbsLocation",

        // EB Information
        "brakeApplied",
        "emergencyStatus",
        "trainIntegrity",
        "activeRadio",
        "sourceLocoVersion",
      ];

      const orderedKeys = [
        ...columnOrder.filter((key) => columnKeys.includes(key)),
        ...columnKeys.filter((key) => !columnOrder.includes(key)),
      ];

      const dynamicColumns = orderedKeys.map((key) => ({
        field: key,
        headerName: formatHeader(key),
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
        "An error occurred trying to fetch Emergency Brake records from the server.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert(
        "No logs are currently compiled to execute an Excel output.",
        "warning",
      );
      return;
    }
    const reportData = filteredRows.map(({ id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_json(ws, reportData, { origin: "A1" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EB Issue Logs");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `EB_Issue_Report_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
  };

  const getSelectedValueForField = (field: string) => {
    if (field === "locoMode") return selectedLocoMode;
    if (field === "movementDirection") return selectedMovementDirection;
    if (field === "stationName") return selectedStationName;
    if (field === "brakeApplied") return selectedBrakeApplied;
    return [];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Page Title Block --- */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#1976D2", fontSize: "1.5rem" }}
        >
          Emergency Brake (EB) Issue Report
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: "2.5px", bgcolor: "#1976D2", mb: 3 }} />

      {/* --- Main Inline Date Filters Setup --- */}
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
          <Box sx={{ width: 240 }}>
            <DateTimePicker
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              ampm={false}
              format="DD-MM-YYYY HH:mm:ss"
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
          <Box sx={{ width: 240 }}>
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
              bgcolor: "#1976D2",
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#1565C0" },
            }}
          >
            Apply
          </Button>

          <Tooltip title="Clear and Reset Options" arrow>
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
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </LocalizationProvider>

      {/* --- Sub Report Filters Panel (Station and Loco Basis Dropdowns) --- */}
      <Collapse in={showFilters}>
        <Card
          sx={{
            borderRadius: "24px",
            mb: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <FilterList sx={{ fontSize: 20, color: "#1e293b" }} />
              <Typography
                sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}
              >
                Report Filters Panel
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* 1. Station Filter Dropdown */}
              {/* <Box sx={{ width: 240 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="station-select-label">Station Basis</InputLabel>
                  <Select
                    labelId="station-select-label"
                    value={selectedStationId}
                    label="Station Basis"
                    onChange={(e) => setSelectedStationId(e.target.value)}
                  >
                    <MenuItem value="ALL">All Stations</MenuItem>
                    {stationsList.map((st, i) => {
                      const idVal = st.stationId || st.id || st;
                      const displayName = st.stationName ? `${st.stationName} (${st.stationCode || idVal})` : idVal;
                      return (
                        <MenuItem key={idVal || i} value={idVal}>
                          {displayName}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box> */}

              {/* 2. Loco ID Filter Dropdown */}
              <Box sx={{ width: 220 }}>
                <Autocomplete
                  options={locoIdsList}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : option.locoId || option.id || ""
                  }
                  value={
                    locoIdsList.find(
                      (loco) =>
                        (typeof loco === "string"
                          ? loco
                          : loco.locoId || loco.id) === selectedLocoId,
                    ) || null
                  }
                  onChange={(event, newValue) => {
                    setSelectedLocoId(
                      newValue
                        ? typeof newValue === "string"
                          ? newValue
                          : newValue.locoId || newValue.id
                        : "ALL",
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Loco ID" size="small" />
                  )}
                  fullWidth
                  clearOnEscape
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<Search sx={{ fontSize: 18 }} />}
                onClick={() => handleFetchData(0, pageSize, true)}
                sx={{
                  height: 40,
                  px: 3,
                  fontWeight: "bold",
                  bgcolor: "#1976D2",
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#1565C0" },
                }}
              >
                Get Report
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* --- Table Grid Output Display --- */}
      {loading || masterRows.length > 0 ? (
        <Card
          sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              flexWrap="wrap"
              gap={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#1f2937" }}
                >
                  EB Issue Records Logs
                </Typography>
                <Chip
                  variant="filled"
                  size="small"
                  label={`Rows Found: ${filteredRows.length.toLocaleString()}`}
                  sx={{ fontWeight: "bold", bgcolor: "#1976D2", color: "#fff" }}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                  onClick={exportToExcel}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    color: "#1976D2",
                    borderColor: "#1976D2",
                    "&:hover": {
                      borderColor: "#1565C0",
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
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
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
                    style={{ minWidth: `${columns.length * 190}px` }}
                  >
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-[#1E60D5] border text-white">
                        {columns.map((col) => {
                          const isFilterable =
                            col.field === "locoMode" ||
                            col.field === "movementDirection" ||
                            col.field === "stationName" ||
                            col.field === "brakeApplied";

                          return (
                            <th
                              key={col.field}
                              className="relative border border-blue-600/40 px-4 py-3 text-left text-sm font-bold whitespace-nowrap tracking-wider"
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
                                        color:
                                          activeHeaderDropdown === col.field
                                            ? "#fff"
                                            : "rgba(255,255,255,0.7)",
                                        backgroundColor:
                                          activeHeaderDropdown === col.field
                                            ? "rgba(255,255,255,0.2)"
                                            : "transparent",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(255,255,255,0.3)",
                                        },
                                      }}
                                    >
                                      <FilterList
                                        style={{ fontSize: "16px" }}
                                      />
                                    </IconButton>

                                    {activeHeaderDropdown === col.field && (
                                      <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-xl z-50 text-gray-800 font-normal py-1 max-h-60 overflow-y-auto">
                                        <div className="px-3 py-1.5 text-xs font-semibold border-b bg-gray-50 text-gray-500 sticky top-0 z-10">
                                          Filter By {col.headerName}
                                        </div>

                                        <div
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (col.field === "locoMode")
                                              setSelectedLocoMode([]);
                                            else if (
                                              col.field === "movementDirection"
                                            )
                                              setSelectedMovementDirection([]);
                                            else if (
                                              col.field === "stationName"
                                            )
                                              setSelectedStationName([]);
                                            else setSelectedBrakeApplied([]);
                                            setActiveHeaderDropdown(null);
                                          }}
                                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50/60 ${
                                            getSelectedValueForField(col.field)
                                              .length === 0
                                              ? "bg-blue-50 font-bold text-blue-600"
                                              : ""
                                          }`}
                                        >
                                          All Records
                                        </div>

                                        {(col.field === "locoMode"
                                          ? uniqueLocoModes
                                          : col.field === "movementDirection"
                                            ? uniqueMovementDirections
                                            : col.field === "stationName"
                                              ? uniqueStationNames
                                              : uniqueBrakeStatuses
                                        ).map((opt) => (
                                          <div
                                            key={opt}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const setter =
                                                col.field === "locoMode"
                                                  ? setSelectedLocoMode
                                                  : col.field ===
                                                      "movementDirection"
                                                    ? setSelectedMovementDirection
                                                    : col.field ===
                                                        "stationName"
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
                                            className={`px-4 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-blue-50/60 ${
                                              getSelectedValueForField(
                                                col.field,
                                              ).includes(opt)
                                                ? "bg-blue-50 font-bold text-blue-600"
                                                : ""
                                            }`}
                                          >
                                            <Checkbox
                                              size="small"
                                              sx={{
                                                color: "#1976D2",
                                                "&.Mui-checked": {
                                                  color: "#1976D2",
                                                },
                                              }}
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
                          className={`hover:bg-blue-50/20 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.field}
                              className="border border-gray-200 px-4 py-2.5 text-sm whitespace-nowrap text-gray-800"
                            >
                              {col.field === "dateTime" ? (
                                <span className="font-medium text-gray-600">
                                  {dayjs(row[col.field]).format("DD-MM-YYYY")} |{" "}
                                  <span className="text-blue-600 font-bold">
                                    {dayjs(row[col.field]).format("HH:mm:ss")}
                                  </span>
                                </span>
                              ) : col.field === "locoMode" && row[col.field] ? (
                                <span className="bg-green-50 text-green-800 font-bold px-2 py-1 rounded border border-green-200 text-xs">
                                  {row[col.field]}
                                </span>
                              ) : col.field === "brakeApplied" &&
                                !row[col.field]
                                  ?.toLowerCase()
                                  .includes("no brakes") ? (
                                <span className="bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded border border-amber-200 text-xs">
                                  {row[col.field]}
                                </span>
                              ) : col.field === "time" ||
                                col.field === "dateTime" ? (
                                <span className="text-blue-600 font-bold">
                                  {(row[col.field] ?? "-").toString()}
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

              {/* --- Table Footer Pagination --- */}
              <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    Rows per page:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      setPage(0);
                      handleFetchData(0, newSize, showFilters);
                    }}
                    className="rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold outline-none text-gray-700 focus:border-blue-600 cursor-pointer"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm font-medium text-gray-700 tracking-wide">
                  {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, totalRecords)} of{" "}
                  <span className="font-bold text-blue-600">
                    {totalRecords}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFetchData(0, pageSize, showFilters)}
                    disabled={page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleFetchData(page - 1, pageSize, showFilters)
                    }
                    disabled={page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      handleFetchData(page + 1, pageSize, showFilters)
                    }
                    disabled={(page + 1) * pageSize >= totalRecords}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
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
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>
              </div>
            </Paper>
          </CardContent>
        </Card>
      ) : (
        <Paper
          sx={{
            minHeight: 400,
            borderRadius: 4,
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
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "rgba(25,118,210,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <FilterList sx={{ fontSize: 40, color: "#1976D2" }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={700}
            color="#334155"
            gutterBottom
          >
            No Date Selected yet
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Select a date range and click <b>Apply</b>.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default EBIssueReport;
