import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Collapse,
  Chip,
  Stack,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  FilterList,
  Download,
  Search,
  Refresh,
  TableView,
  Description,
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
import Checkbox from "@mui/material/Checkbox";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

// ================= CONSTANTS =================

// Backend date + time dono samajhta hai; time bhejna zaroori hai
const API_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";
const UI_DATE_FORMAT = "DD-MM-YYYY HH:mm:ss";
const DEFAULT_WINDOW_HOURS = 2;
const MAX_RANGE_DAYS = 31; // backend limit ke barabar

const REPORT_URL = "/api/missing-tags";
const EXPORT_JSON_URL = "/api/missing-tags/export";
const EXPORT_CSV_URL = "/api/missing-tags/export/csv";

// Report ke filters jo server ko jaate hain (jis par report bani, wahi pagination/export me)
type AppliedFilters = {
  fromDate: string;
  toDate: string;
  locoId?: string;
};

const formatHeader = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

// Blob error response se backend ka message nikalna (export ke liye)
const readBlobError = async (error: any): Promise<string | null> => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return json.message || json.reason || json.error || null;
    } catch {
      return null;
    }
  }
  return data?.message || data?.reason || null;
};

const MissingTagsReport = () => {
  const { showAlert } = useNotify();

  // --- UI Layout States ---
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<null | "excel" | "csv">(null);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // --- Date Filters ---
  // Default: To = abhi, From = abhi se 2 ghante pehle
  const [fromDate, setFromDate] = useState<Dayjs | null>(() =>
    dayjs().subtract(DEFAULT_WINDOW_HOURS, "hour"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(() => dayjs());

  // User ne khud date badli ya nahi.
  // Nahi badli to har Apply par To = current time, From = current - 2h
  const [fromTouched, setFromTouched] = useState(false);
  const [toTouched, setToTouched] = useState(false);

  // --- Server Filter ---
  const [selectedLocoId, setSelectedLocoId] = useState<string>("ALL");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(
    null,
  );
  const [appliedRangeLabel, setAppliedRangeLabel] = useState<string>("");

  // --- Client Side Column Filters (sirf current page par) ---
  const [selectedLocoMode, setSelectedLocoMode] = useState<string[]>([]);
  const [selectedMovementDir, setSelectedMovementDir] = useState<string[]>([]);
  const [selectedStationName, setSelectedStationName] = useState<string[]>([]);

  // --- Dropdown Lists ---
  const [locoIdsList, setLocoIdsList] = useState<any[]>([]);

  // --- Data States ---
  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);

  // --- Pagination ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);

  // Purani (slow) request ka response nayi request ko overwrite na kare
  const requestIdRef = useRef(0);

  const clientFilterActive =
    selectedLocoMode.length > 0 ||
    selectedMovementDir.length > 0 ||
    selectedStationName.length > 0;

  // --- Header filter options ---
  const uniqueLocoModes = Array.from(
    new Set(masterRows.map((row) => row.locoMode).filter(Boolean)),
  ).sort();
  const uniqueMovementDirs = Array.from(
    new Set(masterRows.map((row) => row.movementDir).filter(Boolean)),
  ).sort();
  const uniqueStationNames = Array.from(
    new Set(masterRows.map((row) => row.stationName).filter(Boolean)),
  ).sort();

  // --- Loco list (mount par ek baar) ---
  useEffect(() => {
    const fetchLocoList = async () => {
      try {
        const locoRes = await axiosInstance.get(
          "/api/eb-issue-report/unique_loco",
        );
        setLocoIdsList(locoRes.data?.data || locoRes.data || []);
      } catch {
        showAlert("Failed loading Loco ID list.", "error");
      }
    };
    fetchLocoList();
  }, []);

  // --- Client side header filters ---
  useEffect(() => {
    let result = [...masterRows];

    if (selectedLocoMode.length > 0) {
      result = result.filter((row) => selectedLocoMode.includes(row.locoMode));
    }
    if (selectedMovementDir.length > 0) {
      result = result.filter((row) =>
        selectedMovementDir.includes(row.movementDir),
      );
    }
    if (selectedStationName.length > 0) {
      result = result.filter((row) =>
        selectedStationName.includes(row.stationName),
      );
    }

    setFilteredRows(result);
  }, [selectedLocoMode, selectedMovementDir, selectedStationName, masterRows]);

  // ================= FILTER BUILD =================

  /**
   * Picker ki values se server filters banata hai.
   * Date na badli ho to rolling window: To = abhi, From = abhi - 2h.
   */
  const buildFilters = (): AppliedFilters | null => {
    const now = dayjs();

    const to = toTouched && toDate ? toDate : now;
    const from =
      fromTouched && fromDate
        ? fromDate
        : now.subtract(DEFAULT_WINDOW_HOURS, "hour");

    if (!from.isValid() || !to.isValid()) {
      showAlert("Please select valid From and To date.", "warning");
      return null;
    }

    if (from.isAfter(to)) {
      showAlert("From Date, To Date se pehle honi chahiye.", "warning");
      return null;
    }

    if (to.diff(from, "day", true) > MAX_RANGE_DAYS) {
      showAlert(
        `Maximum ${MAX_RANGE_DAYS} din ka data ek baar mein mil sakta hai.`,
        "warning",
      );
      return null;
    }

    // Picker me bhi wahi dikhe jo server ko ja raha hai
    if (!toTouched) setToDate(to);
    if (!fromTouched) setFromDate(from);

    const filters: AppliedFilters = {
      fromDate: from.format(API_DATE_FORMAT),
      toDate: to.format(API_DATE_FORMAT),
    };

    if (selectedLocoId && selectedLocoId !== "ALL") {
      filters.locoId = selectedLocoId;
    }

    return filters;
  };

  // ================= DATA FETCH =================

  const fetchPage = async (
    filters: AppliedFilters,
    pageNo: number,
    rowsPerPage: number,
  ) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);

    // Naya data aane par header filters reset
    setSelectedLocoMode([]);
    setSelectedMovementDir([]);
    setSelectedStationName([]);

    try {
      const response = await axiosInstance.get(REPORT_URL, {
        params: { ...filters, page: pageNo, size: rowsPerPage },
      });

      if (requestId !== requestIdRef.current) return; // purana response

      const body = response.data || {};
      const data: any[] = Array.isArray(body.content)
        ? body.content
        : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

      setShowFilters(true);
      setPage(pageNo);
      setTotalRecords(Number(body.totalElements ?? body.total ?? data.length));
      setAppliedRangeLabel(
        body.fromDate && body.toDate ? `${body.fromDate}  →  ${body.toDate}` : "",
      );

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        showAlert(
          "No missing tags data found for the selected filters.",
          "info",
        );
        return;
      }

      const hiddenColumns = ["id"];
      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      setColumns(
        columnKeys.map((key) => ({ field: key, headerName: formatHeader(key) })),
      );

      const rowsWithId = data.map((row: any, index: number) => ({
        id: pageNo * rowsPerPage + index + 1,
        ...row,
      }));

      setMasterRows(rowsWithId);
      setFilteredRows(rowsWithId);
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.reason ||
        "Server se missing tags data laane me error aaya.";
      showAlert(msg, "error");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  // Apply / Get Report: dono me picker ki date + chuna hua Loco jaata hai
  const handleApply = () => {
    const filters = buildFilters();
    if (!filters) return;

    setAppliedFilters(filters);
    fetchPage(filters, 0, pageSize);
  };

  // Pagination hamesha usi filter par jis par report bani thi
  const goToPage = (pageNo: number, rowsPerPage = pageSize) => {
    if (!appliedFilters) return;
    fetchPage(appliedFilters, pageNo, rowsPerPage);
  };

  const clearData = () => {
    requestIdRef.current++; // chal rahi request ignore
    const now = dayjs();

    setFromDate(now.subtract(DEFAULT_WINDOW_HOURS, "hour"));
    setToDate(now);
    setFromTouched(false);
    setToTouched(false);

    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    setSelectedLocoId("ALL");
    setSelectedLocoMode([]);
    setSelectedMovementDir([]);
    setSelectedStationName([]);
    setAppliedFilters(null);
    setAppliedRangeLabel("");
    setTotalRecords(0);
    setShowFilters(false);
    setPage(0);
    setLoading(false);
  };

  // ================= EXPORTS =================

  // 1) Sirf current page (screen par dikh rahi rows, header filter ke baad)
  const exportCurrentPage = () => {
    if (!filteredRows.length) {
      showAlert("Export ke liye koi row nahi hai.", "warning");
      return;
    }

    const reportData = filteredRows.map(({ id, ...rest }) => {
      const out: Record<string, any> = {};
      Object.keys(rest).forEach((k) => (out[formatHeader(k)] = rest[k]));
      return out;
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Missing Tags (Page)");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Missing_Tags_Page${page + 1}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
  };

  // 2) Export All -> Excel (backend JSON endpoint, max 1 lakh rows)
  const exportAllExcel = async () => {
    if (!appliedFilters) {
      showAlert("Pehle Apply karke report load karein.", "warning");
      return;
    }

    setExporting("excel");
    try {
      const res = await axiosInstance.get(EXPORT_JSON_URL, {
        params: appliedFilters,
        timeout: 0, // bada data, timeout mat lagao
      });

      const rows: any[] = res.data?.content || [];
      if (!rows.length) {
        showAlert("Export ke liye koi data nahi mila.", "info");
        return;
      }

      if (res.data?.truncated) {
        showAlert(
          res.data?.message ||
            "Data bahut zyada hai, sirf pehli 1,00,000 rows export hui. Poore data ke liye CSV use karein.",
          "warning",
        );
      }

      const reportData = rows.map((row) => {
        const out: Record<string, any> = {};
        Object.keys(row).forEach((k) => (out[formatHeader(k)] = row[k]));
        return out;
      });

      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Missing Tags (All)");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      const from = dayjs(appliedFilters.fromDate).format("YYYYMMDD_HHmmss");
      const to = dayjs(appliedFilters.toDate).format("YYYYMMDD_HHmmss");

      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Missing_Tags_All_${from}_to_${to}.xlsx`,
      );
    } catch (error: any) {
      showAlert(
        (await readBlobError(error)) || "Excel export me error aaya.",
        "error",
      );
    } finally {
      setExporting(null);
    }
  };

  // 3) Export All -> CSV (backend streaming file, koi row limit nahi)
  const exportAllCsv = async () => {
    if (!appliedFilters) {
      showAlert("Pehle Apply karke report load karein.", "warning");
      return;
    }

    setExporting("csv");
    try {
      const res = await axiosInstance.get(EXPORT_CSV_URL, {
        params: appliedFilters,
        responseType: "blob",
        timeout: 0,
      });

      const disposition: string = res.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const fileName = match
        ? decodeURIComponent(match[1])
        : `Missing_Tags_All_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;

      saveAs(res.data, fileName);
    } catch (error: any) {
      showAlert(
        (await readBlobError(error)) || "CSV export me error aaya.",
        "error",
      );
    } finally {
      setExporting(null);
    }
  };

  const getSelectedValueForField = (field: string) => {
    if (field === "locoMode") return selectedLocoMode;
    if (field === "movementDir") return selectedMovementDir;
    if (field === "stationName") return selectedStationName;
    return [];
  };

  const lastPage = Math.max(Math.ceil(totalRecords / pageSize) - 1, 0);
  const rangeStart = totalRecords === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, totalRecords);

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Page Title --- */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#1565C0", fontSize: "1.5rem" }}
        >
          Missing Tags Report
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: "2.5px", bgcolor: "#1565C0", mb: 3 }} />

      {/* --- Date Filters --- */}
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
              onChange={(v) => {
                setFromDate(v);
                setFromTouched(true);
              }}
              ampm={false}
              views={["year", "month", "day", "hours", "minutes", "seconds"]}
              format={UI_DATE_FORMAT}
              disableFuture
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
          <Box sx={{ width: 240 }}>
            <DateTimePicker
              label="To Date"
              value={toDate}
              onChange={(v) => {
                setToDate(v);
                setToTouched(true);
              }}
              ampm={false}
              views={["year", "month", "day", "hours", "minutes", "seconds"]}
              format={UI_DATE_FORMAT}
              disableFuture
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={loading}
            sx={{
              height: 40,
              px: 4,
              fontWeight: "bold",
              bgcolor: "#1565C0",
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#0d47a1" },
            }}
          >
            Apply
          </Button>

          <Tooltip title="Reset (last 2 hours)" arrow>
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

      {/* --- Loco Filter --- */}
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
              <Box sx={{ width: 220 }}>
                <Autocomplete
                  size="small"
                  options={[{ locoId: "ALL" }, ...locoIdsList]}
                  getOptionLabel={(option: any) =>
                    String(option?.locoId ?? option?.id ?? option ?? "")
                  }
                  value={
                    selectedLocoId === "ALL"
                      ? { locoId: "ALL" }
                      : locoIdsList.find(
                          (loco) =>
                            String(loco?.locoId ?? loco?.id ?? loco) ===
                            selectedLocoId,
                        ) || { locoId: selectedLocoId }
                  }
                  onChange={(_, newValue: any) => {
                    const v = newValue
                      ? String(newValue.locoId ?? newValue.id ?? newValue)
                      : "ALL";
                    setSelectedLocoId(v || "ALL");
                  }}
                  isOptionEqualToValue={(option: any, value: any) =>
                    String(option?.locoId ?? option?.id ?? option) ===
                    String(value?.locoId ?? value?.id ?? value)
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
                startIcon={<Search sx={{ fontSize: 18 }} />}
                onClick={handleApply}
                disabled={loading}
                sx={{
                  height: 40,
                  px: 3,
                  fontWeight: "bold",
                  bgcolor: "#1565C0",
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#0d47a1" },
                }}
              >
                Get Report
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* --- Table --- */}
      {loading || masterRows.length > 0 || appliedFilters ? (
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
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#1f2937" }}
                >
                  Missing Tags Records
                </Typography>
                <Chip
                  color="primary"
                  size="small"
                  label={`Total Rows: ${totalRecords.toLocaleString()}`}
                  sx={{ fontWeight: "bold" }}
                />
                {clientFilterActive && (
                  <Chip
                    color="warning"
                    size="small"
                    label={`Showing on this page: ${filteredRows.length.toLocaleString()}`}
                    sx={{ fontWeight: "bold" }}
                  />
                )}
                {appliedRangeLabel && (
                  <Chip
                    variant="outlined"
                    size="small"
                    label={appliedRangeLabel}
                    sx={{ fontWeight: 600 }}
                  />
                )}
                {appliedFilters?.locoId && (
                  <Chip
                    variant="outlined"
                    size="small"
                    label={`Loco: ${appliedFilters.locoId}`}
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Tooltip title="Sirf is page ki dikh rahi rows" arrow>
                  <span>
                    <Button
                      startIcon={<Download />}
                      variant="outlined"
                      onClick={exportCurrentPage}
                      disabled={!filteredRows.length || exporting !== null}
                      sx={{ textTransform: "none", borderRadius: "6px" }}
                    >
                      Excel (This Page)
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Selected range ka saara data (max 1 lakh rows)" arrow>
                  <span>
                    <Button
                      startIcon={
                        exporting === "excel" ? (
                          <CircularProgress size={16} />
                        ) : (
                          <TableView />
                        )
                      }
                      variant="contained"
                      onClick={exportAllExcel}
                      disabled={!appliedFilters || totalRecords === 0 || exporting !== null}
                      sx={{
                        textTransform: "none",
                        borderRadius: "6px",
                        bgcolor: "#2e7d32",
                        "&:hover": { bgcolor: "#1b5e20" },
                      }}
                    >
                      {exporting === "excel" ? "Exporting..." : "Export All (Excel)"}
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip title="Selected range ka saara data, bina limit (Excel me khulta hai)" arrow>
                  <span>
                    <Button
                      startIcon={
                        exporting === "csv" ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Description />
                        )
                      }
                      variant="contained"
                      onClick={exportAllCsv}
                      disabled={!appliedFilters || totalRecords === 0 || exporting !== null}
                      sx={{ textTransform: "none", borderRadius: "6px" }}
                    >
                      {exporting === "csv" ? "Exporting..." : "Export All (CSV)"}
                    </Button>
                  </span>
                </Tooltip>
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
              <div className="overflow-auto" style={{ maxHeight: "550px" }}>
                {loading ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <ContentLoading />
                  </div>
                ) : masterRows.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">
                    Selected filters ke liye koi record nahi mila.
                  </div>
                ) : (
                  <table
                    className="border-collapse w-full"
                    style={{ minWidth: `${columns.length * 190}px` }}
                  >
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-blue-600 border text-white">
                        {columns.map((col) => {
                          const isFilterable =
                            col.field === "locoMode" ||
                            col.field === "movementDir" ||
                            col.field === "stationName";

                          return (
                            <th
                              key={col.field}
                              className="relative border border-blue-700 px-4 py-3 text-left text-sm font-bold whitespace-nowrap tracking-wider"
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
                                          activeHeaderDropdown === col.field ||
                                          getSelectedValueForField(col.field)
                                            .length > 0
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
                                      <FilterList style={{ fontSize: "16px" }} />
                                    </IconButton>

                                    {activeHeaderDropdown === col.field && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-40 cursor-default"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveHeaderDropdown(null);
                                          }}
                                        />

                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-xl z-50 text-gray-800 font-normal py-1 max-h-60 overflow-y-auto">
                                          <div className="px-3 py-1.5 text-xs font-semibold border-b bg-gray-50 text-gray-500 sticky top-0 z-10">
                                            Filter By {col.headerName} (this page)
                                          </div>

                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (col.field === "locoMode")
                                                setSelectedLocoMode([]);
                                              else if (col.field === "movementDir")
                                                setSelectedMovementDir([]);
                                              else setSelectedStationName([]);
                                              setActiveHeaderDropdown(null);
                                            }}
                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                              getSelectedValueForField(col.field)
                                                .length === 0
                                                ? "bg-blue-100 font-bold text-blue-700"
                                                : ""
                                            }`}
                                          >
                                            All Records
                                          </div>

                                          {(col.field === "locoMode"
                                            ? uniqueLocoModes
                                            : col.field === "movementDir"
                                              ? uniqueMovementDirs
                                              : uniqueStationNames
                                          ).map((opt) => (
                                            <div
                                              key={opt}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const setter =
                                                  col.field === "locoMode"
                                                    ? setSelectedLocoMode
                                                    : col.field === "movementDir"
                                                      ? setSelectedMovementDir
                                                      : setSelectedStationName;

                                                setter((prev) =>
                                                  prev.includes(opt)
                                                    ? prev.filter((v) => v !== opt)
                                                    : [...prev, opt],
                                                );
                                              }}
                                              className={`px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-blue-50 ${
                                                getSelectedValueForField(
                                                  col.field,
                                                ).includes(opt)
                                                  ? "bg-blue-100 font-bold text-blue-700"
                                                  : ""
                                              }`}
                                            >
                                              <Checkbox
                                                size="small"
                                                checked={getSelectedValueForField(
                                                  col.field,
                                                ).includes(opt)}
                                              />
                                              <span>{opt}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </>
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
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.field}
                              className="border border-gray-200 px-4 py-2.5 text-sm whitespace-nowrap text-gray-800"
                            >
                              {col.field === "dateTime" && row[col.field] ? (
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

              {/* --- Pagination --- */}
              <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    Rows per page:
                  </span>
                  <select
                    value={pageSize}
                    disabled={loading}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      goToPage(0, newSize);
                    }}
                    className="rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold outline-none text-gray-700 focus:border-blue-500 cursor-pointer"
                  >
                    {[25, 50, 100, 200, 500].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm font-medium text-gray-700 tracking-wide">
                  {rangeStart}–{rangeEnd} of{" "}
                  <span className="font-bold text-blue-600">
                    {totalRecords.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(0)}
                    disabled={loading || page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsLeft size={18} />
                  </button>
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={loading || page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={loading || page >= lastPage}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => goToPage(lastPage)}
                    disabled={loading || page >= lastPage}
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
            <FilterList sx={{ fontSize: 40, color: "#1565C0" }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="#334155" gutterBottom>
            No Missing Tag Logs Rendered
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Default range last 2 hours hai. Date select karke <b>Apply</b> dabayein.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MissingTagsReport;
