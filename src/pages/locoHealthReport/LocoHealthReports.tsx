import React, { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  SelectChangeEvent,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

// MUI X Date Time Picker Imports
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

// ==========================================
// Types & Interfaces
// ==========================================

export type ReportType =
  | "RADIO"
  | "KMS"
  | "CONFIG"
  | "SOS"
  | "BRAKE"
  | "OVK"
  | "DMI"
  | "GPS";

export interface ShedOption {
  id: string | number;
  name: string;
}

export interface LocoOption {
  id: string | number;
  locoNo: string | number;
}

export interface ReportItem {
  [key: string]: any;
}

export interface PaginatedResponse {
  content?: ReportItem[];
  records?: ReportItem[];
  totalElements?: number;
  totalRecords?: number;
}

const REPORT_ENDPOINTS: Record<ReportType, string> = {
  RADIO: "/locoHealth/radio",
  KMS: "/loco-health/kms-health",
  CONFIG: "/loco-health/configuration-status",
  SOS: "/loco-health/sos-health",
  BRAKE: "/loco-health/brake-status",
  OVK: "/loco-health/ovk-hardware-card",
  DMI: "/loco-health/dmi",
  GPS: "/locoHealth/gps",
};

// Helper function to format header titles from key names
const formatColumnHeader = (key: string): string => {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// ==========================================
// Main Component
// ==========================================

const LocoHealthReports: React.FC = () => {
  // Filter States
  const [reportType, setReportType] = useState<ReportType>("RADIO");
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs("2026-07-01T00:00:00"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(
    dayjs("2026-07-22T14:47:23"),
  );
  const [selectedShed, setSelectedShed] = useState<string>("");
  const [selectedLocoId, setSelectedLocoId] = useState<string>("");

  // Options States
  const [shedOptions, setShedOptions] = useState<ShedOption[]>([]);
  const [locoOptions, setLocoOptions] = useState<LocoOption[]>([]);

  // Page Flow Control States
  const [hasAppliedFilter, setHasAppliedFilter] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Table Data & Dynamic Header States
  const [tableData, setTableData] = useState<ReportItem[]>([]);
  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Load Dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [shedRes, locoRes] = await Promise.all([
          axiosInstance.get<ShedOption[]>("/api/shed"),
          axiosInstance.get<LocoOption[]>("/api/eb-issue-report/unique_loco"),
        ]);
        setShedOptions(shedRes.data || []);
        setLocoOptions(locoRes.data || []);
      } catch (error) {
        console.error("Error fetching dropdown options:", error);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch API Report Records
  const fetchReportData = async (currentPage: number = page) => {
    setLoading(true);
    const endpoint = REPORT_ENDPOINTS[reportType];

    const params = {
      page: currentPage,
      size: pageSize,
      ...(selectedLocoId && { locoId: selectedLocoId }),
      ...(selectedShed && { shed: selectedShed }),
      ...(fromDate && { fromDate: fromDate.format("YYYY-MM-DD HH:mm:ss") }),
      ...(toDate && { toDate: toDate.format("YYYY-MM-DD HH:mm:ss") }),
    };

    try {
      const response = await axiosInstance.get<PaginatedResponse>(endpoint, {
        params,
      });
      const data = response.data;
      const records = data.content || data.records || [];

      setTableData(records);
      setTotalRecords(
        data.totalElements || data.totalRecords || records.length || 0,
      );

      if (records.length > 0) {
        setDynamicHeaders(Object.keys(records[0]));
      } else {
        setDynamicHeaders([]);
      }
    } catch (error) {
      console.error("Error loading report:", error);
      setTableData([]);
      setDynamicHeaders([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setHasAppliedFilter(true);
    setPage(0);
    fetchReportData(0);
  };

  const handleResetFilters = () => {
    setFromDate(dayjs("2026-07-01T00:00:00"));
    setToDate(dayjs("2026-07-22T14:47:23"));
    setSelectedShed("");
    setSelectedLocoId("");
    setHasAppliedFilter(false);
    setTableData([]);
    setDynamicHeaders([]);
    setPage(0);
  };

  // Render Table Cell Value dynamically with exact color styles
  const renderCellContent = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return "-";

    const keyLower = key.toLowerCase();
    const strVal = String(value);

    // Format Date & Time cell (Date in gray, Time in blue bold)
    if (keyLower.includes("date") || keyLower.includes("time")) {
      const parts = strVal.split(" ");
      if (parts.length > 1) {
        return (
          <Box component="span">
            <Typography
              component="span"
              variant="body2"
              sx={{ color: "#475569" }}
            >
              {parts[0]} |{" "}
            </Typography>
            <Typography
              component="span"
              variant="body2"
              sx={{ color: "#1C64D9", fontWeight: 700 }}
            >
              {parts[1]}
            </Typography>
          </Box>
        );
      }
    }

    // Format Mode & Status Badges
    if (strVal === "Full_Supervision") {
      return (
        <Chip
          label="Full_Supervision"
          size="small"
          sx={{
            backgroundColor: "#F0FDF4",
            color: "#16A34A",
            border: "1px solid #DCFCE7",
            fontWeight: 600,
            fontSize: "0.75rem",
            borderRadius: "6px",
          }}
        />
      );
    }

    if (
      keyLower.includes("fault") ||
      keyLower.includes("alarm") ||
      strVal.toLowerCase().includes("fail") ||
      strVal.toLowerCase().includes("weak")
    ) {
      return (
        <Chip
          label={strVal}
          size="small"
          sx={{
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            fontWeight: 600,
            fontSize: "0.75rem",
            borderRadius: "6px",
          }}
        />
      );
    }

    return strVal;
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
        {/* IMAGE 1: Header Title with Blue Accent Underline */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h2"
            sx={{ color: "#1C64D9", fontWeight: 700, pb: 0.5 }}
          >
            Loco Health Reports
          </Typography>
          <Box
            sx={{
              height: "3px",
              backgroundColor: "#1C64D9",
              width: "100%",
              borderRadius: "2px",
            }}
          />
        </Box>

        {/* Filters Box */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            mb: 3,
            border: "1px solid #E2E8F0",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(6, 1fr)",
                },
                gap: 2,
                alignItems: "center",
              }}
            >
              {/* Report Type Selector */}
              <FormControl size="small" fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e: SelectChangeEvent) => {
                    setReportType(e.target.value as ReportType);
                    setHasAppliedFilter(false);
                  }}
                >
                  <MenuItem value="RADIO">Radio Health</MenuItem>
                  <MenuItem value="KMS">Kms Health</MenuItem>
                  <MenuItem value="CONFIG">Configuration Status</MenuItem>
                  <MenuItem value="SOS">SOS Health</MenuItem>
                  <MenuItem value="BRAKE">Brake Status</MenuItem>
                  <MenuItem value="OVK">OVK Hardware Card</MenuItem>
                  <MenuItem value="DMI">DMI Health</MenuItem>
                  <MenuItem value="GPS">GPS Health</MenuItem>
                </Select>
              </FormControl>

              {/* IMAGE 2: MUI DateTime Picker (24H Format: DD-MM-YYYY HH:mm:ss) */}
              <DateTimePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                format="DD-MM-YYYY HH:mm:ss"
                ampm={false}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />

              <DateTimePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                format="DD-MM-YYYY HH:mm:ss"
                ampm={false}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />

              {/* Shed Dropdown */}
              <FormControl size="small" fullWidth>
                <InputLabel>Shed</InputLabel>
                <Select
                  value={selectedShed}
                  label="Shed"
                  onChange={(e: SelectChangeEvent) =>
                    setSelectedShed(e.target.value)
                  }
                >
                  <MenuItem value="">All Sheds</MenuItem>
                  {shedOptions.map((shed) => (
                    <MenuItem key={shed.id} value={shed.id}>
                      {shed.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Loco ID Dropdown */}
              <FormControl size="small" fullWidth>
                <InputLabel>Loco Id</InputLabel>
                <Select
                  value={selectedLocoId}
                  label="Loco Id"
                  onChange={(e: SelectChangeEvent) =>
                    setSelectedLocoId(e.target.value)
                  }
                >
                  <MenuItem value="">All Locos</MenuItem>
                  {locoOptions.map((loco) => (
                    <MenuItem key={loco.id} value={loco.id}>
                      {loco.locoNo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Apply & Reset Buttons */}
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyFilter}
                  sx={{
                    backgroundColor: "#1C64D9",
                    textTransform: "none",
                    fontWeight: 600,
                    flexGrow: 1,
                    borderRadius: "6px",
                    "&:hover": { backgroundColor: "#1552B5" },
                  }}
                >
                  Apply
                </Button>
                <IconButton
                  onClick={handleResetFilters}
                  sx={{ border: "1px solid #CBD5E1", borderRadius: "6px" }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {!hasAppliedFilter ? (
          /* IMAGE 3: State Before Filter Apply */
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 4,
              borderStyle: "dashed",
              borderColor: "#E2E8F0",
              backgroundColor: "#F8FAFC",
              py: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#E0F2FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <FilterListIcon sx={{ color: "#0284C7", fontSize: 28 }} />
            </Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "#1E293B", mb: 0.5 }}
            >
              No Date Selected yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Select a date range and click <strong>Apply</strong>
            </Typography>
          </Paper>
        ) : (
          /* IMAGE 4 & 5: Table Shell & Design */
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              p: 2,
            }}
          >
            {/* Table Action Top Bar */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A" }}
                >
                  Data Records Logs
                </Typography>
                <Chip
                  label={`Rows Found: ${totalRecords}`}
                  size="small"
                  sx={{
                    backgroundColor: "#1C64D9",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    borderRadius: "12px",
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon sx={{ color: "#1C64D9" }} />}
                  sx={{
                    textTransform: "none",
                    color: "#1C64D9",
                    borderColor: "#1C64D9",
                    fontWeight: 600,
                  }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdfIcon sx={{ color: "#1C64D9" }} />}
                  sx={{
                    textTransform: "none",
                    color: "#1C64D9",
                    borderColor: "#1C64D9",
                    fontWeight: 600,
                  }}
                >
                  PDF
                </Button>
              </Box>
            </Box>

            {/* Table Grid / Loading State */}
            <Box sx={{ minHeight: "350px", position: "relative" }}>
              {loading ? (
                <Box
                  sx={{
                    py: 12,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ContentLoading />
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: "60vh", maxWidth: "100%" }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {dynamicHeaders.map((headerKey) => (
                          <TableCell
                            key={headerKey}
                            sx={{
                              backgroundColor: "#1C64D9",
                              color: "#FFFFFF",
                              fontWeight: 600,
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                              borderRight: "1px solid #3B82F6",
                              "&:last-child": { borderRight: "none" },
                            }}
                          >
                            {formatColumnHeader(headerKey)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={dynamicHeaders.length || 1}
                            align="center"
                            sx={{ py: 8, color: "#64748B" }}
                          >
                            No records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((row, rowIndex) => (
                          <TableRow
                            key={rowIndex}
                            hover
                            sx={{ "&:hover": { backgroundColor: "#F8FAFC" } }}
                          >
                            {dynamicHeaders.map((headerKey) => (
                              <TableCell
                                key={headerKey}
                                sx={{
                                  borderRight: "1px solid #F1F5F9",
                                  whiteSpace: "nowrap",
                                  fontSize: "0.85rem",
                                  py: 1.2,
                                }}
                              >
                                {renderCellContent(headerKey, row[headerKey])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Pagination Controls Matching Image 4 & 5 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 3,
                pt: 1,
                px: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ color: "#475569" }}>
                  Rows per page:
                </Typography>
                <Select
                  value={pageSize}
                  size="small"
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                    fetchReportData(0);
                  }}
                  sx={{ height: 32, fontSize: "0.85rem" }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </Box>

              <Typography variant="body2" sx={{ color: "#475569" }}>
                {totalRecords > 0 ? page * pageSize + 1 : 0}–
                {Math.min((page + 1) * pageSize, totalRecords)} of{" "}
                <strong style={{ color: "#1C64D9" }}>{totalRecords}</strong>
              </Typography>

              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton
                  size="small"
                  disabled={page === 0}
                  onClick={() => {
                    setPage(0);
                    fetchReportData(0);
                  }}
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={page === 0}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchReportData(p);
                  }}
                >
                  <KeyboardArrowLeft fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={(page + 1) * pageSize >= totalRecords}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    fetchReportData(p);
                  }}
                >
                  <KeyboardArrowRight fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={(page + 1) * pageSize >= totalRecords}
                  onClick={() => {
                    const p = totalPages - 1;
                    setPage(p);
                    fetchReportData(p);
                  }}
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default LocoHealthReports;
