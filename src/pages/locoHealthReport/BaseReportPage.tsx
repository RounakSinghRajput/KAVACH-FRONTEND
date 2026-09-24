import React, { useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import * as XLSX from "xlsx-js-style";

import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

export type FilterMode = "LOCO" | "SHED";

export interface BaseReportPageProps {
  title: string;
  endpoint: string;
  exportEndpoint: string;
  locoDropdownEndpoint: string;
  shedDropdownEndpoint: string;
}

export interface ShedOption {
  id: string | number;
  name: string;
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

const formatColumnHeader = (key: string): string => {
  const result = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const BaseReportPage: React.FC<BaseReportPageProps> = ({
  title,
  endpoint,
  exportEndpoint,
  locoDropdownEndpoint,
  shedDropdownEndpoint,
}) => {
  // Date States
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs().endOf("day"));
  const [isDateRangeApplied, setIsDateRangeApplied] = useState<boolean>(false);

  // Sub-Filter States
  const [filterMode, setFilterMode] = useState<FilterMode>("LOCO");
  const [selectedShed, setSelectedShed] = useState<string>("");
  const [selectedLocoId, setSelectedLocoId] = useState<string>("");

  // Dropdown Options
  const [shedOptions, setShedOptions] = useState<ShedOption[]>([]);
  const [locoOptions, setLocoOptions] = useState<string[]>([]);

  // Execution & Loading States
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  // Table Data & Pagination States
  const [tableData, setTableData] = useState<ReportItem[]>([]);
  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const fetchReportData = async (
    currentPage: number = page,
    overrideSize?: number,
    appliedFilters = {
      mode: filterMode,
      locoId: selectedLocoId,
      shed: selectedShed,
    },
  ) => {
    setLoading(true);
    const activeSize = overrideSize ?? pageSize;

    const params = {
      page: currentPage,
      size: activeSize,
      ...(fromDate && { fromDate: fromDate.format("YYYY-MM-DD HH:mm:ss") }),
      ...(toDate && { toDate: toDate.format("YYYY-MM-DD HH:mm:ss") }),
      ...(appliedFilters.mode === "LOCO" &&
        appliedFilters.locoId && { locoId: appliedFilters.locoId }),
      ...(appliedFilters.mode === "SHED" &&
        appliedFilters.shed && { shed: appliedFilters.shed }),
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

  const fetchDropdownData = async () => {
    try {
      const params = {
        ...(fromDate && { fromDate: fromDate.format("YYYY-MM-DD HH:mm:ss") }),
        ...(toDate && { toDate: toDate.format("YYYY-MM-DD HH:mm:ss") }),
      };

      const [locoRes, shedRes] = await Promise.all([
        axiosInstance.get(locoDropdownEndpoint, { params }),
        axiosInstance.get(shedDropdownEndpoint, { params }),
      ]);

      setLocoOptions(locoRes.data || []);
      setShedOptions(
        (shedRes.data || []).map((name: string) => ({
          id: name,
          name: name,
        })),
      );
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  const handleApplyDateRange = async () => {
    setIsDateRangeApplied(true);
    setPage(0);
    setSelectedLocoId("");
    setSelectedShed("");

    await Promise.all([
      fetchReportData(0, pageSize, {
        mode: filterMode,
        locoId: "",
        shed: "",
      }),
      fetchDropdownData(),
    ]);
  };

  const handleApplySubFilters = () => {
    setPage(0);
    fetchReportData(0);
  };

  const handleResetFilters = () => {
    setFromDate(dayjs().startOf("day"));
    setToDate(dayjs().endOf("day"));
    setIsDateRangeApplied(false);
    setSelectedShed("");
    setSelectedLocoId("");
    setTableData([]);
    setDynamicHeaders([]);
    setPage(0);
  };

  const generateAndDownloadExcel = (
    dataToExport: ReportItem[],
    fileSuffix: string,
  ) => {
    if (!dataToExport || dataToExport.length === 0) return;

    const headersList =
      dynamicHeaders.length > 0 ? dynamicHeaders : Object.keys(dataToExport[0]);
    const headers = headersList.map((header) => formatColumnHeader(header));
    const rows = dataToExport.map((row) =>
      headersList.map((header) => {
        const val = row[header];
        return val === null || val === undefined || val === "" ? "-" : val;
      }),
    );

    const wsData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    headersList.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "1C64D9" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    worksheet["!cols"] = headersList.map(() => ({ wch: 22 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
    XLSX.writeFile(
      workbook,
      `${title.replace(/\s+/g, "_")}_${fileSuffix}.xlsx`,
    );
  };

  const handleExportPageExcel = () => {
    generateAndDownloadExcel(tableData, "Current_Page");
  };

  // Direct export API call using the explicitly passed exportEndpoint prop
  const handleExportAllExcel = async () => {
    setExporting(true);

    try {
      const params = {
        ...(fromDate && {
          fromDate: fromDate.format("YYYY-MM-DD HH:mm:ss"),
        }),
        ...(toDate && {
          toDate: toDate.format("YYYY-MM-DD HH:mm:ss"),
        }),
        ...(filterMode === "LOCO" &&
          selectedLocoId && {
            locoId: selectedLocoId,
          }),
        ...(filterMode === "SHED" &&
          selectedShed && {
            shed: selectedShed,
          }),
      };

      const response = await axiosInstance.get(exportEndpoint, { params });

      const fullData = Array.isArray(response.data)
        ? response.data
        : response.data?.content || response.data?.records || [];

      if (fullData.length > 0) {
        generateAndDownloadExcel(fullData, "Full_Export");
      } else {
        alert("No records found to export.");
      }
    } catch (error) {
      console.error("Error exporting all data:", error);
    } finally {
      setExporting(false);
    }
  };

  const renderCellContent = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return "-";
    const keyLower = key.toLowerCase();
    let strVal = String(value);

    if (
      keyLower.includes("date") ||
      keyLower.includes("time") ||
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(strVal)
    ) {
      strVal = strVal.replace("T", " ");
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
        {/* Header Title */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h2"
            sx={{
              color: "#1C64D9",
              fontWeight: 700,
              pb: 0.5,
              fontSize: "1.75rem",
            }}
          >
            {title}
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

        {/* Dynamic Filters Container */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            mb: 3,
            border: "1px solid #E2E8F0",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            {/* ROW 1: Date Range Controls */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              <Box sx={{ width: { xs: "100%", sm: "240px" } }}>
                <DateTimePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => {
                    setFromDate(newValue);
                    setIsDateRangeApplied(false);
                  }}
                  format="DD-MM-YYYY HH:mm:ss"
                  ampm={false}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Box>

              <Box sx={{ width: { xs: "100%", sm: "240px" } }}>
                <DateTimePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => {
                    setToDate(newValue);
                    setIsDateRangeApplied(false);
                  }}
                  format="DD-MM-YYYY HH:mm:ss"
                  ampm={false}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleApplyDateRange}
                  sx={{
                    backgroundColor: "#1C64D9",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "6px",
                    px: 3,
                    "&:hover": { backgroundColor: "#1552B5" },
                  }}
                >
                  Apply Date Range
                </Button>
                <IconButton
                  onClick={handleResetFilters}
                  sx={{ border: "1px solid #CBD5E1", borderRadius: "6px" }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* ROW 2: Sub-Filters */}
            {isDateRangeApplied && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <FormControl
                    size="small"
                    sx={{ width: { xs: "100%", sm: "240px" } }}
                  >
                    <InputLabel>Filter By</InputLabel>
                    <Select
                      value={filterMode}
                      label="Filter By"
                      onChange={(e: SelectChangeEvent) => {
                        setFilterMode(e.target.value as FilterMode);
                        setSelectedLocoId("");
                        setSelectedShed("");
                      }}
                    >
                      <MenuItem value="LOCO">Loco Wise</MenuItem>
                      <MenuItem value="SHED">Shed Wise</MenuItem>
                    </Select>
                  </FormControl>
                  {filterMode === "LOCO" ? (
                    <FormControl
                      size="small"
                      sx={{ width: { xs: "100%", sm: "240px" } }}
                    >
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
                          <MenuItem key={loco} value={loco}>
                            {loco}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <FormControl
                      size="small"
                      sx={{ width: { xs: "100%", sm: "240px" } }}
                    >
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
                          <MenuItem key={shed.id} value={shed.name}>
                            {shed.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <Button
                    variant="outlined"
                    onClick={handleApplySubFilters}
                    sx={{
                      backgroundColor: "#1C64D9",
                      color: "#FFFFFF",
                      borderColor: "#1C64D9",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#1552B5",
                        borderColor: "#1552B5",
                      },
                    }}
                  >
                    Apply Filters
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Content Section */}
        {!isDateRangeApplied ? (
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
              Select Date Range First
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Choose your date range and click <strong>Apply Date Range</strong>{" "}
              to load records and sub-filters
            </Typography>
          </Paper>
        ) : (
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
            {/* Action Bar */}
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
                  onClick={handleExportPageExcel}
                  startIcon={<FileDownloadIcon sx={{ color: "#1C64D9" }} />}
                  sx={{
                    textTransform: "none",
                    color: "#1C64D9",
                    borderColor: "#1C64D9",
                    fontWeight: 600,
                  }}
                >
                  Excel (Page)
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  disabled={exporting || totalRecords === 0}
                  onClick={handleExportAllExcel}
                  startIcon={
                    exporting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FileDownloadIcon />
                    )
                  }
                  sx={{
                    backgroundColor: "#16A34A",
                    textTransform: "none",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    "&:hover": { backgroundColor: "#15803D" },
                  }}
                >
                  {exporting ? "Exporting..." : "Export All"}
                </Button>
              </Box>
            </Box>

            {/* Dynamic Data Table */}
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

            {/* Pagination */}
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
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setPage(0);
                    fetchReportData(0, newSize);
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
