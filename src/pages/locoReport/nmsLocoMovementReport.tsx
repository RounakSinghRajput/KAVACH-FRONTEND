import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Checkbox,
  Alert,
} from "@mui/material";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { FilterList, Download, Refresh } from "@mui/icons-material";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import dayjs, { Dayjs } from "dayjs";

import { axiosInstance } from "../../services/axios";

import { ContentLoading } from "../../components/common/LoadingScreen";

// ============================================================
// TYPES
// ============================================================

type ReportRow = Record<string, any>;

interface ReportResponse {
  content?: ReportRow[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
}

interface ReportTypeOption {
  label: string;
  value: string;
}

interface KavachOption {
  label: string;
  value: string;
}

// Helper to strip spaces and underscores for key comparisons
const normalizeKey = (key: string) => {
  return (key || "").toLowerCase().replace(/[\s_]+/g, "");
};

// ============================================================
// COMPONENT
// ============================================================

const NmsLocoMovementReport: React.FC = () => {
  // ============================================================
  // DEFAULT DATE RANGE
  // ============================================================

  const defaultFromDate = dayjs().subtract(7, "day").startOf("day").toDate();

  const defaultToDate = dayjs().endOf("day").toDate();

  // ============================================================
  // FILTER STATES (SERVER & COLUMN LEVEL)
  // ============================================================

  const [fromDate, setFromDate] = useState<Date | null>(defaultFromDate);
  const [toDate, setToDate] = useState<Date | null>(defaultToDate);
  const [selectedKavachId, setSelectedKavachId] = useState("");
  const [selectedReportType, setSelectedReportType] = useState("");

  // Column level filter selections
  const [selectedSourceLocoIds, setSelectedSourceLocoIds] = useState<string[]>(
    [],
  );
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // ============================================================
  // DROPDOWN DATA
  // ============================================================

  const [reportTypes, setReportTypes] = useState<ReportTypeOption[]>([]);
  const [kavachIds, setKavachIds] = useState<KavachOption[]>([]);
  const [loadingReportTypes, setLoadingReportTypes] = useState(false);
  const [loadingKavachIds, setLoadingKavachIds] = useState(false);

  // ============================================================
  // REPORT DATA
  // ============================================================

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);

  // ============================================================
  // PAGINATION & UI STATES
  // ============================================================

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  // ============================================================
  // HELPER VALUE EXTRACTORS
  // ============================================================

  const getRowValue = (row: ReportRow, keyType: "sourceLocoId" | "firm") => {
    if (!row) return "";
    if (keyType === "sourceLocoId") {
      return (
        row.SOURCE_LOCO_ID ??
        row.sourceLocoId ??
        row.source_loco_id ??
        ""
      )?.toString();
    }
    if (keyType === "firm") {
      return (
        row.firmName ??
        row.firm ??
        row.FIRM_NAME ??
        row.firm_name ??
        ""
      )?.toString();
    }
    return "";
  };

  // Derive unique options dynamically from raw rows
  const uniqueSourceLocoIds = useMemo(() => {
    return Array.from(
      new Set(
        rows.map((row) => getRowValue(row, "sourceLocoId")).filter(Boolean),
      ),
    ).sort();
  }, [rows]);

  const uniqueFirms = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => getRowValue(row, "firm")).filter(Boolean)),
    ).sort();
  }, [rows]);

  // Client-side Filtered Rows Engine
  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (selectedSourceLocoIds.length > 0) {
      result = result.filter((row) =>
        selectedSourceLocoIds.includes(getRowValue(row, "sourceLocoId")),
      );
    }

    if (selectedFirms.length > 0) {
      result = result.filter((row) =>
        selectedFirms.includes(getRowValue(row, "firm")),
      );
    }

    return result;
  }, [rows, selectedSourceLocoIds, selectedFirms]);

  // ============================================================
  // DATE FORMAT FOR API
  // ============================================================
  //
  // Date ke saath time bhi user choose karta hai, isliye
  // startOf/endOf day force nahi kiya jaata - jo picker par
  // dikh raha hai wahi API ko jaata hai.

  const formatApiDate = (date: Date | null, _isFromDate?: boolean): string => {
    if (!date) return "";
    return dayjs(date).format("DD-MM-YYYY HH:mm:ss");
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const formatColumnLabel = (key: string): string => {
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  };

  // ============================================================
  // LOAD REPORT TYPES & KAVACH IDS
  // ============================================================

  const loadReportTypes = useCallback(async () => {
    setLoadingReportTypes(true);
    try {
      const response =
        await axiosInstance.get<ReportTypeOption[]>("/api/reports/types");
      const data = response.data;
      const mapped: ReportTypeOption[] = Array.isArray(data)
        ? data
            .filter(
              (item) => item && item.value !== undefined && item.value !== null,
            )
            .map((item) => ({
              label: String(item.label ?? item.value),
              value: String(item.value),
            }))
        : [];
      setReportTypes(mapped);
    } catch (err: any) {
      setReportTypes([]);
      setError(err?.response?.data?.message || "Unable to load Report Types.");
    } finally {
      setLoadingReportTypes(false);
    }
  }, []);

  const loadKavachIds = useCallback(async () => {
    setLoadingKavachIds(true);
    try {
      const response = await axiosInstance.get(
        "/api/reports/onboard-kavach-ids",
      );
      const data = response.data;
      let list: any[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.content)) list = data.content;

      const mapped: KavachOption[] = list
        .map((item: any) => {
          if (typeof item === "number" || typeof item === "string") {
            return { label: String(item), value: String(item) };
          }
          const value =
            item?.onboardKavachId ??
            item?.onboardKavachID ??
            item?.id ??
            item?.value ??
            item?.code;
          if (value === undefined || value === null) return null;
          return {
            label: String(item?.label ?? item?.name ?? value),
            value: String(value),
          };
        })
        .filter(Boolean) as KavachOption[];

      setKavachIds(mapped);
    } catch (err: any) {
      setKavachIds([]);
      setError(
        err?.response?.data?.message || "Unable to load Onboard Kavach IDs.",
      );
    } finally {
      setLoadingKavachIds(false);
    }
  }, []);

  // ============================================================
  // LOAD REPORT API
  // ============================================================

  const loadReport = useCallback(
    async (requestedPage: number = 0, requestedSize: number = rowsPerPage) => {
      if (!selectedReportType) {
        setError("Please select Report Type.");
        return;
      }

      if (!selectedKavachId) {
        setError("Please select Onboard Kavach ID.");
        return;
      }

      if (fromDate && toDate && dayjs(fromDate).isAfter(dayjs(toDate))) {
        setError("From Date cannot be greater than To Date.");
        return;
      }

      setLoading(true);
      setError("");

      // Reset column filters when fetching a new set of data
      setSelectedSourceLocoIds([]);
      setSelectedFirms([]);

      try {
        const params: Record<string, string | number> = {
          reportType: selectedReportType,
          onboardKavachId: Number(selectedKavachId),
          page: requestedPage,
          size: requestedSize,
        };

        if (fromDate) params.fromDate = formatApiDate(fromDate, true);
        if (toDate) params.toDate = formatApiDate(toDate, false);

        const response = await axiosInstance.get<ReportResponse>(
          "/api/reports/1a",
          { params },
        );
        const data = response.data;
        const content = Array.isArray(data?.content) ? data.content : [];

        setRows(content);
        const totalElements = Number(data?.totalElements ?? 0);
        setTotalCount(totalElements);
        setTotalPages(
          Number(data?.totalPages ?? Math.ceil(totalElements / requestedSize)),
        );
        setPage(Number(data?.page ?? requestedPage));
        setFiltersApplied(true);
      } catch (err: any) {
        setRows([]);
        setTotalCount(0);
        setTotalPages(0);
        setError(
          err?.response?.data?.message ||
            "Unable to load Loco Movement Report.",
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedReportType, selectedKavachId, fromDate, toDate, rowsPerPage],
  );

  useEffect(() => {
    loadReportTypes();
    loadKavachIds();
  }, [loadReportTypes, loadKavachIds]);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  const handleReportTypeChange = (value: string) => {
    setSelectedReportType(value);
    setSelectedKavachId("");
    setRows([]);
    setTotalCount(0);
    setTotalPages(0);
    setPage(0);
    setFiltersApplied(false);
    setError("");
  };

  const handleKavachIdChange = (value: string) => {
    setSelectedKavachId(value);
    setRows([]);
    setTotalCount(0);
    setTotalPages(0);
    setPage(0);
    setFiltersApplied(false);
    setError("");
  };

  const handleFromDateChange = (value: Dayjs | null) => {
    setFromDate(value ? value.toDate() : null);
    setFiltersApplied(false);
    setError("");
  };

  const handleToDateChange = (value: Dayjs | null) => {
    setToDate(value ? value.toDate() : null);
    setFiltersApplied(false);
    setError("");
  };

  const handleClear = () => {
    setFromDate(dayjs().subtract(7, "day").startOf("day").toDate());
    setToDate(dayjs().endOf("day").toDate());
    setSelectedKavachId("");
    setSelectedReportType("");
    setSelectedSourceLocoIds([]);
    setSelectedFirms([]);
    setRows([]);
    setTotalCount(0);
    setTotalPages(0);
    setPage(0);
    setFiltersApplied(false);
    setError("");
  };

  const handleApply = () => {
    setError("");
    if (!selectedReportType) {
      setError("Please select Report Type.");
      return;
    }
    if (!selectedKavachId) {
      setError("Please select Onboard Kavach ID.");
      return;
    }
    if (fromDate && toDate && dayjs(fromDate).isAfter(dayjs(toDate))) {
      setError("From Date cannot be greater than To Date.");
      return;
    }
    setPage(0);
    loadReport(0, rowsPerPage);
  };

  const handleRefresh = () => {
    if (loading || exporting) return;
    loadReportTypes();
    loadKavachIds();
    if (filtersApplied && selectedReportType && selectedKavachId) {
      loadReport(page, rowsPerPage);
    }
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newSize = Number(event.target.value);
    setRowsPerPage(newSize);
    setPage(0);
    if (filtersApplied && selectedReportType && selectedKavachId) {
      loadReport(0, newSize);
    }
  };

  const exportExcel = async () => {
    if (!selectedReportType || !selectedKavachId || !filtersApplied) return;
    setExporting(true);
    setError("");
    try {
      const params: Record<string, string | number> = {
        reportType: selectedReportType,
        onboardKavachId: Number(selectedKavachId),
      };
      if (fromDate) params.fromDate = formatApiDate(fromDate, true);
      if (toDate) params.toDate = formatApiDate(toDate, false);

      const response = await axiosInstance.get("/api/reports/1a/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Loco_Movement_Report_${selectedReportType.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Unable to export report.");
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // DYNAMIC COLUMNS & COLUMN-LEVEL FILTER CONFIG
  // ============================================================

  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keys: string[] = [];
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!keys.includes(key)) keys.push(key);
      });
    });
    return keys;
  }, [rows]);

  const isFieldFilterable = (field: string) => {
    const norm = normalizeKey(field);
    return norm === "sourcelocoid" || norm === "firmname" || norm === "firm";
  };

  const getOptionsForField = (field: string) => {
    const norm = normalizeKey(field);
    if (norm === "sourcelocoid") return uniqueSourceLocoIds;
    if (norm === "firmname" || norm === "firm") return uniqueFirms;
    return [];
  };

  const getSelectedValueForField = (field: string) => {
    const norm = normalizeKey(field);
    if (norm === "sourcelocoid") return selectedSourceLocoIds;
    if (norm === "firmname" || norm === "firm") return selectedFirms;
    return [];
  };

  const getSetterForField = (field: string) => {
    const norm = normalizeKey(field);
    if (norm === "sourcelocoid") return setSelectedSourceLocoIds;
    return setSelectedFirms;
  };

  const startRecord = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const endRecord =
    totalCount === 0 ? 0 : Math.min((page + 1) * rowsPerPage, totalCount);

  const selectedReportLabel =
    reportTypes.find((item) => item.value === selectedReportType)?.label ||
    "No report selected";

  const isBusy = loading || exporting;

  const selectedKavachOption =
    kavachIds.find((item) => item.value === selectedKavachId) ?? null;

  return (
    <Box sx={{ p: 3 }}>
      {/* ------------------------------------------------ */}
      {/* PAGE TITLE */}
      {/* ------------------------------------------------ */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1565C0",
            fontSize: "1.5rem",
          }}
        >
          Loco Movement Report (Loco)
        </Typography>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh" arrow>
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={
                  loading || exporting || loadingKavachIds || loadingReportTypes
                }
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
            </span>
          </Tooltip>

          <Tooltip title={showFilters ? "Hide filters" : "Show filters"} arrow>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                height: 40,
                width: 40,
                color: showFilters ? "#1565C0" : "#64748b",
                bgcolor: showFilters ? "rgba(21,101,192,0.08)" : "transparent",
              }}
            >
              <FilterList sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        sx={{
          width: "100%",
          height: "2.5px",
          bgcolor: "#1565C0",
          mb: 3,
        }}
      />

      {/* ------------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------------ */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{
            mb: 2,
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {error}
        </Alert>
      )}

      {/* ------------------------------------------------ */}
      {/* PRIMARY FILTERS */}
      {/* ------------------------------------------------ */}
      {showFilters && (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            {/* REPORT TYPE */}
            <Box sx={{ width: 230 }}>
              <FormControl
                fullWidth
                size="small"
                required
                error={!selectedReportType}
              >
                <InputLabel id="report-type-label">Report Type</InputLabel>
                <Select
                  labelId="report-type-label"
                  value={selectedReportType}
                  label="Report Type"
                  disabled={loadingReportTypes || isBusy}
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                >
                  {reportTypes.map((report) => (
                    <MenuItem key={report.value} value={report.value}>
                      {report.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* LOCO ID */}
            <Box sx={{ width: 200 }}>
              <Autocomplete
                size="small"
                options={kavachIds}
                value={selectedKavachOption}
                loading={loadingKavachIds}
                disabled={!selectedReportType || loadingKavachIds || isBusy}
                onChange={(_event, option) =>
                  handleKavachIdChange(option ? option.value : "")
                }
                getOptionLabel={(option) => String(option.label)}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="LOCO ID *"
                    error={!selectedKavachId}
                    placeholder={
                      !selectedReportType
                        ? "Select report type first"
                        : "LOCO ID"
                    }
                  />
                )}
              />
            </Box>

            {/* FROM DATE */}
            <Box sx={{ width: 205 }}>
              <DateTimePicker
                label="From Date"
                value={fromDate ? dayjs(fromDate) : null}
                onChange={handleFromDateChange}
                disabled={!selectedKavachId || isBusy}
                ampm={false}
                format="DD-MM-YY HH:mm"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            {/* TO DATE */}
            <Box sx={{ width: 205 }}>
              <DateTimePicker
                label="To Date"
                value={toDate ? dayjs(toDate) : null}
                onChange={handleToDateChange}
                disabled={!selectedKavachId || isBusy}
                ampm={false}
                format="DD-MM-YY HH:mm"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            {/* APPLY */}
            <Tooltip
              title={
                !selectedReportType
                  ? "Select a report type"
                  : !selectedKavachId
                    ? "Select a loco ID"
                    : ""
              }
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  disabled={isBusy || !selectedReportType || !selectedKavachId}
                  onClick={handleApply}
                  sx={{
                    height: 40,
                    px: 3,
                    fontWeight: "bold",
                    bgcolor: "#1565C0",
                    textTransform: "none",
                    borderRadius: "8px",
                    "&:hover": {
                      bgcolor: "#0d47a1",
                    },
                  }}
                >
                  Apply
                </Button>
              </span>
            </Tooltip>

            {/* CLEAR */}
            <Tooltip title="Clear and reset filters" arrow>
              <span>
                <IconButton
                  onClick={handleClear}
                  disabled={isBusy}
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
              </span>
            </Tooltip>
          </Box>
        </LocalizationProvider>
      )}

      {/* ------------------------------------------------ */}
      {/* TABLE */}
      {/* ------------------------------------------------ */}
      {loading || rows.length > 0 ? (
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
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
                  sx={{
                    fontWeight: 700,
                    color: "#1f2937",
                  }}
                >
                  Report Data
                </Typography>

                <Chip
                  color="primary"
                  variant="filled"
                  size="small"
                  label={`Rows Found: ${totalCount.toLocaleString()}`}
                  sx={{ fontWeight: "bold" }}
                />

                <Chip
                  color="primary"
                  variant="outlined"
                  size="small"
                  label={selectedReportLabel}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>

              <Button
                startIcon={<Download />}
                variant="contained"
                onClick={exportExcel}
                disabled={
                  isBusy || !filtersApplied || filteredRows.length === 0
                }
                sx={{
                  textTransform: "none",
                  borderRadius: "6px",
                  bgcolor: "#1565C0",
                  color: "#fff",
                  "&:hover": {
                    bgcolor: "#0d47a1",
                  },
                }}
              >
                {exporting ? "Exporting..." : "ExportAll"}
              </Button>
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
                style={{
                  maxHeight: "550px",
                }}
              >
                {loading ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <ContentLoading />
                  </div>
                ) : (
                  <table
                    className="border-collapse w-full"
                    style={{
                      minWidth: `${Math.max(columns.length, 1) * 180}px`,
                    }}
                  >
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-blue-600 border text-white">
                        <th className="sticky left-0 z-30 bg-blue-600 border border-blue-700 px-4 py-3 text-left text-sm font-bold whitespace-nowrap tracking-wider">
                          S.N
                        </th>

                        {columns.map((column) => {
                          const filterable = isFieldFilterable(column);
                          const isDropdownOpen = activeHeaderDropdown === column;

                          return (
                            <th
                              key={column}
                              className="relative border border-blue-700 px-4 py-3 text-left text-sm font-bold whitespace-nowrap tracking-wider"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span>{formatColumnLabel(column)}</span>

                                {filterable && (
                                  <div className="relative inline-block">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveHeaderDropdown(
                                          isDropdownOpen ? null : column,
                                        );
                                      }}
                                      sx={{
                                        color: isDropdownOpen
                                          ? "#fff"
                                          : "rgba(255,255,255,0.7)",
                                        backgroundColor: isDropdownOpen
                                          ? "rgba(255,255,255,0.2)"
                                          : "transparent",
                                      }}
                                    >
                                      <FilterList
                                        style={{
                                          fontSize: "16px",
                                        }}
                                      />
                                    </IconButton>

                                    {isDropdownOpen && (
                                      <>
                                        <div
                                          className="fixed inset-0 z-40"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveHeaderDropdown(null);
                                          }}
                                        />

                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-xl z-50 text-gray-800 font-normal py-1 max-h-60 overflow-y-auto">
                                          <div className="px-3 py-1.5 text-xs font-semibold border-b bg-gray-50 text-gray-500 sticky top-0 z-10">
                                            Filter By{" "}
                                            {formatColumnLabel(column)}
                                          </div>

                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              getSetterForField(column)([]);
                                              setActiveHeaderDropdown(null);
                                            }}
                                            className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                          >
                                            All Records
                                          </div>

                                          {getOptionsForField(column).map(
                                            (opt) => {
                                              const stringOpt = opt.toString();

                                              return (
                                                <div
                                                  key={stringOpt}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const setter =
                                                      getSetterForField(column);
                                                    setter((prev) =>
                                                      prev.includes(stringOpt)
                                                        ? prev.filter(
                                                            (v) =>
                                                              v !== stringOpt,
                                                          )
                                                        : [...prev, stringOpt],
                                                    );
                                                  }}
                                                  className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-blue-50"
                                                >
                                                  <Checkbox
                                                    size="small"
                                                    checked={getSelectedValueForField(
                                                      column,
                                                    ).includes(stringOpt)}
                                                  />
                                                  <span className="truncate">
                                                    {stringOpt}
                                                  </span>
                                                </div>
                                              );
                                            },
                                          )}
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
                          key={row?.id ?? row?.ID ?? index}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="sticky left-0 z-10 border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-800 bg-inherit">
                            {page * rowsPerPage + index + 1}
                          </td>

                          {columns.map((column) => (
                            <td
                              key={column}
                              className="border border-gray-200 px-4 py-2.5 text-sm whitespace-nowrap text-gray-800"
                              title={formatValue(row[column])}
                            >
                              {formatValue(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {!filteredRows.length && !loading && (
                        <tr>
                          <td
                            colSpan={columns.length + 1}
                            className="text-center py-8 text-gray-500"
                          >
                            No records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ------------------------------------------------ */}
              {/* PAGINATION */}
              {/* ------------------------------------------------ */}
              <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    Rows per page:
                  </span>

                  <select
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    disabled={isBusy}
                    className="rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold outline-none text-gray-700 focus:border-blue-500 cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm font-medium text-gray-700 tracking-wide">
                  {startRecord}
                  {" – "}
                  {endRecord}
                  {" of "}
                  <span className="font-bold text-blue-600">
                    {totalCount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadReport(0, rowsPerPage)}
                    disabled={page === 0 || isBusy}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsLeft size={18} />
                  </button>

                  <button
                    onClick={() => loadReport(page - 1, rowsPerPage)}
                    disabled={page <= 0 || isBusy}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={() => loadReport(page + 1, rowsPerPage)}
                    disabled={totalPages === 0 || page >= totalPages - 1 || isBusy}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <button
                    onClick={() => loadReport(totalPages - 1, rowsPerPage)}
                    disabled={totalPages === 0 || page >= totalPages - 1 || isBusy}
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
            <FilterList
              sx={{
                fontSize: 40,
                color: "#1565C0",
              }}
            />
          </Box>

          <Typography
            variant="h6"
            fontWeight={700}
            color="#334155"
            gutterBottom
          >
            {filtersApplied ? "No Records Found" : "Select filters to run the report"}
          </Typography>

          <Typography color="text.secondary" variant="body2" textAlign="center">
            {filtersApplied
              ? "No report data was returned for the selected filters."
              : "Choose a report type and loco ID, set the date and time range, then click Apply."}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default NmsLocoMovementReport;
