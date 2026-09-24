import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
  Autocomplete,
  TextField,
  Select,
  MenuItem,
  Collapse,
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
import dayjs from "dayjs";
import * as XLSX from "xlsx-js-style";

import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

export interface StationHealthBaseReportProps {
  title: string;
  endpoint: string;
}

export interface DivisionOption {
  id: string | number;
  name: string;
  code?: string;
}

export interface StationOption {
  id: string | number;
  name: string;
  code?: string;
  divisionId?: string | number;
  kavachSubSystemId?: string;
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
    // camelCase → camel Case
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    // GPSStatus → GPS Status
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const StationHealthBaseReport: React.FC<
  StationHealthBaseReportProps
> = ({ title, endpoint }) => {
  // Primary Date Inputs State - Initialized relative to current execution time
  const [fromDate, setFromDate] = useState(dayjs().subtract(24, "hour"));
  const [toDate, setToDate] = useState(dayjs());

  // Secondary Sub-Filter Inputs State
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("");

  // Options Data
  const [divisionOptions, setDivisionOptions] = useState<DivisionOption[]>([]);
  const [stationOptions, setStationOptions] = useState<StationOption[]>([]);

  // State Execution Controls
  const [hasAppliedInitialFilter, setHasAppliedInitialFilter] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Active Query Parameters Snapshot
  const [appliedParams, setAppliedParams] = useState<{
    fromDate: string;
    toDate: string;
    divisionId: string;
    stationId: string;
  }>({
    fromDate: dayjs().subtract(24, "hour").format("YYYY-MM-DD"),
    toDate: dayjs().format("YYYY-MM-DD"),
    divisionId: "",
    stationId: "",
  });

  // Table Data & Pagination States
  const [tableData, setTableData] = useState<ReportItem[]>([]);
  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const divisionRes = await axiosInstance.get("/division/");
        setDivisionOptions(divisionRes.data.data || divisionRes.data || []);
      } catch (error) {
        console.error("Error fetching division options:", error);
      }
    };
    fetchDivisions();
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      if (!selectedDivision) {
        setStationOptions([]);
        setSelectedStation("");
        return;
      }

      try {
        const stationRes = await axiosInstance.get(
          `/mstStation/getAllStationsByDivision/${selectedDivision}`,
        );
        setStationOptions(stationRes.data.data || stationRes.data || []);
      } catch (error) {
        console.error("Error fetching station options:", error);
        setStationOptions([]);
      }
    };

    fetchStations();
  }, [selectedDivision]);

  useEffect(() => {
    if (!hasAppliedInitialFilter) return;
    fetchReportData(page);
  }, [page, pageSize, appliedParams]);

  const fetchReportData = async (
    currentPage: number = page,
    overrideSize?: number,
  ) => {
    setLoading(true);
    const activeSize = overrideSize ?? pageSize;

    const params = {
      page: currentPage,
      size: activeSize,
      ...(appliedParams.fromDate && { fromDate: appliedParams.fromDate }),
      ...(appliedParams.toDate && { toDate: appliedParams.toDate }),
      ...(appliedParams.divisionId && { divisionId: appliedParams.divisionId }),
      ...(appliedParams.stationId && { stationId: appliedParams.stationId }),
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
      console.error("Error loading station health report:", error);
      setTableData([]);
      setDynamicHeaders([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyMainFilter = () => {
    setAppliedParams((prev) => ({
      ...prev,
      fromDate: fromDate ? fromDate.format("YYYY-MM-DD") : "",
      toDate: toDate ? toDate.format("YYYY-MM-DD") : "",
    }));

    if (!hasAppliedInitialFilter) {
      setHasAppliedInitialFilter(true);
    }

    if (page !== 0) {
      setPage(0);
    }
  };

  const handleApplySubFilter = () => {
    setAppliedParams((prev) => ({
      ...prev,
      divisionId: selectedDivision,
      stationId: selectedStation,
    }));

    if (page !== 0) {
      setPage(0);
    }
  };

  // Fixed Reset Function aligned with active time and state defaults
  const handleResetFilters = () => {
    const defaultFrom = dayjs().subtract(24, "hour");
    const defaultTo = dayjs();

    setFromDate(defaultFrom);
    setToDate(defaultTo);
    setSelectedDivision("");
    setSelectedStation("");

    setAppliedParams({
      fromDate: defaultFrom.format("YYYY-MM-DD"),
      toDate: defaultTo.format("YYYY-MM-DD"),
      divisionId: "",
      stationId: "",
    });

    setPage(0);
    setHasAppliedInitialFilter(false);
    setTableData([]);
    setDynamicHeaders([]);
    setTotalRecords(0);
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) return;

    const headers = dynamicHeaders.map((header) => formatColumnHeader(header));
    const rows = tableData.map((row) =>
      dynamicHeaders.map((header) => {
        const val = row[header];
        return val === null || val === undefined || val === "" ? "-" : val;
      }),
    );

    const wsData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    dynamicHeaders.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "1C64D9" } },
          font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
    });

    worksheet["!cols"] = dynamicHeaders.map(() => ({ wch: 22 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Station Health Data");
    XLSX.writeFile(
      workbook,
      `${title.replace(/\s+/g, "_")}_Station_Health.xlsx`,
    );
  };

  const renderCellContent = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return "-";

    const keyLower = key.toLowerCase();
    const strVal = String(value);

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

    if (
      strVal.toLowerCase() === "healthy" ||
      strVal.toLowerCase() === "online" ||
      strVal.toLowerCase() === "active"
    ) {
      return (
        <Chip
          label={strVal}
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
      keyLower.includes("status") ||
      strVal.toLowerCase().includes("fail") ||
      strVal.toLowerCase().includes("offline") ||
      strVal.toLowerCase().includes("error")
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
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h2"
            sx={{ color: "#1C64D9", fontWeight: 700, pb: 0.5 }}
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

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            mb: 1,
            border: "1px solid #E2E8F0",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 1.5 } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                {/* Compact From Date Picker */}
                <Box sx={{ width: { xs: "100%", sm: "220px" } }}>
                  <DateTimePicker
                    label="From Date"
                    value={fromDate}
                    onChange={(newValue) => {
                      if (newValue) {
                        setFromDate(newValue);
                      }
                    }}
                    format="DD-MM-YYYY HH:mm:ss"
                    ampm={false}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          "& .MuiInputBase-root": {
                            height: "40px",
                            fontSize: "0.85rem",
                          },
                        },
                      },
                    }}
                  />
                </Box>

                {/* Compact To Date Picker */}
                <Box sx={{ width: { xs: "100%", sm: "220px" } }}>
                  <DateTimePicker
                    label="To Date"
                    value={toDate}
                    onChange={(newValue) => {
                      if (newValue) {
                        setToDate(newValue);
                      }
                    }}
                    format="DD-MM-YYYY HH:mm:ss"
                    ampm={false}
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: {
                          "& .MuiInputBase-root": {
                            height: "40px",
                            fontSize: "0.85rem",
                          },
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyMainFilter}
                    sx={{
                      backgroundColor: "#1C64D9",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      height: "40px",
                      px: 2.5,
                      "&:hover": { backgroundColor: "#1552B5" },
                    }}
                  >
                    Apply Date
                  </Button>
                  <IconButton
                    onClick={handleResetFilters}
                    sx={{
                      border: "1px solid #CBD5E1",
                      borderRadius: "6px",
                      height: "40px",
                      width: "40px",
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={hasAppliedInitialFilter}>
                <Box
                  sx={{
                    pt: 2,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "center",
                    justifyContent: "flex-start",
                    borderTop: "1px dashed #E2E8F0",
                  }}
                >
                  <FormControl
                    size="small"
                    sx={{ width: { xs: "100%", sm: "220px" } }}
                  >
                    <Autocomplete
                      size="small"
                      options={divisionOptions}
                      getOptionLabel={(option) => option.name}
                      value={
                        divisionOptions.find(
                          (d) => String(d.id) === String(selectedDivision),
                        ) || null
                      }
                      onChange={(_, newValue) => {
                        setSelectedDivision(
                          newValue ? String(newValue.id) : "",
                        );
                        setSelectedStation("");
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Division"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "40px",
                              fontSize: "0.85rem",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>

                  <FormControl
                    size="small"
                    sx={{ width: { xs: "100%", sm: "220px" } }}
                  >
                    <Autocomplete
                      size="small"
                      options={stationOptions}
                      getOptionLabel={(option) =>
                        option.name
                          ? `${option.name} (${option.code || option.kavachSubSystemId})`
                          : String(option.id)
                      }
                      value={
                        stationOptions.find(
                          (s) =>
                            String(s.kavachSubSystemId) ===
                            String(selectedStation),
                        ) || null
                      }
                      disabled={!selectedDivision}
                      onChange={(_, newValue) => {
                        setSelectedStation(
                          newValue ? String(newValue.kavachSubSystemId) : "",
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Station"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "40px",
                              fontSize: "0.85rem",
                            },
                          }}
                        />
                      )}
                    />
                  </FormControl>

                  <Button
                    variant="outlined"
                    onClick={handleApplySubFilter}
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
              </Collapse>
            </Box>
          </CardContent>
        </Card>

        {!hasAppliedInitialFilter ? (
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
              No Filter Applied
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Select a Date Range and click <strong>Apply Date</strong> to load
              the records and enable Division & Station sub-filters.
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
                  Station Health Logs
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

              <Button
                variant="outlined"
                size="small"
                onClick={handleExportExcel}
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
            </Box>

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
                            No station health records found.
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
