import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  FilterList,
  Download,
  Refresh,
  Search,
  Close,
  ErrorOutline,
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

const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const LocoSpecificFault = () => {
  const { showAlert } = useNotify();

  // --- UI Layout States ---
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // --- Modal State ---
  const [selectedRowData, setSelectedRowData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // --- Filter Logic States (Server API Side) ---
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [selectedLocoId, setSelectedLocoId] = useState<string>("ALL");
  const [selectedStationId, setSelectedStationId] = useState<string>("ALL");

  // --- Client Side Column Specific Text Filters ---
  const [selectedMode, setSelectedMode] = useState<string[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string[]>([]);
  const [selectedStationName, setSelectedStationName] = useState<string[]>([]);

  // --- Dynamic Dropdown Selection Lists States ---
  const [locoIdsList, setLocoIdsList] = useState<any[]>([]);

  // --- Data States ---
  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);

  // --- Table Pagination States ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);

  // --- Extract Unique Header Options for Client-Side Filtering ---
  const uniqueModes = Array.from(
    new Set(masterRows.map((row) => row.mode).filter(Boolean)),
  ).sort();
  const uniqueDirections = Array.from(
    new Set(masterRows.map((row) => row.direction).filter(Boolean)),
  ).sort();
  const uniqueStationNames = Array.from(
    new Set(masterRows.map((row) => row.stationName).filter(Boolean)),
  ).sort();

  // --- Function to fetch Loco IDs dropdown filtered by Date Range ---
  const fetchLocoIds = async (from: Dayjs | null, to: Dayjs | null) => {
    try {
      const requestParams: any = {};
      if (from) {
        requestParams.fromDate = dayjs(from).format("DD-MM-YYYY HH:mm:ss");
      }
      if (to) {
        requestParams.toDate = dayjs(to).format("DD-MM-YYYY HH:mm:ss");
      }

      const response = await axiosInstance.get(
        "/api/loco-specific-fault-report/stationary-kavach-ids",
        { params: requestParams },
      );

      setLocoIdsList(response.data?.data || response.data || []);
    } catch (err) {
      showAlert("Failed loading master filter options.", "error");
    }
  };

  // --- Initial load for Loco ID options on mount ---
  useEffect(() => {
    fetchLocoIds(fromDate, toDate);
  }, []);

  // --- Sync Table View whenever client-side column header selections change ---
  useEffect(() => {
    let result = [...masterRows];

    if (selectedMode.length > 0) {
      result = result.filter((row) => selectedMode.includes(row.mode));
    }
    if (selectedDirection.length > 0) {
      result = result.filter((row) =>
        selectedDirection.includes(row.direction),
      );
    }
    if (selectedStationName.length > 0) {
      result = result.filter((row) =>
        selectedStationName.includes(row.stationName),
      );
    }

    setFilteredRows(result);
  }, [selectedMode, selectedDirection, selectedStationName, masterRows]);

  const clearData = () => {
    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    setSelectedLocoId("ALL");
    setSelectedStationId("ALL");
    setSelectedMode([]);
    setSelectedDirection([]);
    setSelectedStationName([]);
    setShowFilters(false);
    setPage(0);
  };

  // --- Core API Data Retrieval Processor Engine ---
  const handleFetchData = async (
    pageNo = 0,
    rowsPerPage = pageSize,
    useServerFilters = false,
  ) => {
    setLoading(true);

    if (!useServerFilters) {
      fetchLocoIds(fromDate, toDate);
    }

    const requestParams: any = {
      page: pageNo,
      size: rowsPerPage,
      fromDate: fromDate
        ? dayjs(fromDate).format("DD-MM-YYYY HH:mm:ss")
        : undefined,
      toDate: toDate ? dayjs(toDate).format("DD-MM-YYYY HH:mm:ss") : undefined,
    };

    if (useServerFilters) {
      if (selectedLocoId !== "ALL")
        requestParams.stationaryKavachId = selectedLocoId;
      if (selectedStationId !== "ALL")
        requestParams.stationId = selectedStationId;
    } else {
      setSelectedLocoId("ALL");
      setSelectedStationId("ALL");
    }

    setSelectedMode([]);
    setSelectedDirection([]);
    setSelectedStationName([]);

    try {
      const response = await axiosInstance.get(
        "/api/loco-specific-fault-report",
        {
          params: requestParams,
        },
      );

      let rawContent = response.data;
      if (rawContent && rawContent.data && Array.isArray(rawContent.data)) {
        rawContent = rawContent.data;
      } else if (
        rawContent &&
        rawContent.content &&
        Array.isArray(rawContent.content)
      ) {
        rawContent = rawContent.content;
      }

      const data = Array.isArray(rawContent) ? rawContent : [];

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        showAlert(
          "No movement data found matching your current filters",
          "info",
        );
        return;
      }

      // Step 1: Suppress raw arrays/nested objects & totalCount from default auto-generation
      const hiddenColumns = [
        "id",
        "faults",
        "faultCodes",
        "recoveryCodes",
        "faultData",
        "totalCount",
        "faultCount",
        "recoveryCount",
        "action",
      ];

      // Step 2: Create dynamic columns from API response keys
      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      const dynamicColumns = columnKeys.map((key) => ({
        field: key,
        headerName: formatHeader(key),
      }));

      // Step 3: Insert Total Count column immediately BEFORE 'pkt' column
      const totalCountCol = {
        field: "totalCount",
        headerName: "Total Count",
      };

      const pktIndex = dynamicColumns.findIndex(
        (col) => col.field.toLowerCase() === "pkt",
      );

      if (pktIndex !== -1) {
        dynamicColumns.splice(pktIndex, 0, totalCountCol);
      } else {
        dynamicColumns.push(totalCountCol);
      }

      const rowsWithId = data.map((row: any, index: number) => ({
        id: pageNo * rowsPerPage + index + 1,
        ...row,
      }));

      setColumns(dynamicColumns);
      setMasterRows(rowsWithId);
      setFilteredRows(rowsWithId);
      setTotalRecords(
        response.data.totalRecords ||
          response.data.totalElements ||
          response.data.total ||
          rowsWithId.length,
      );

      if (!useServerFilters) {
        setShowFilters(true);
      }
      setPage(pageNo);
    } catch (error: any) {
      showAlert(
        "An error occurred trying to query movement records from the server.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Control ---
  const handleOpenModal = (row: any) => {
    setSelectedRowData(row);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRowData(null);
  };

  // --- Export current loaded/filtered rows ---
  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert(
        "No logs are currently compiled to execute an Excel output.",
        "warning",
      );
      return;
    }

    const reportData = filteredRows.map(
      ({ id, faults, faultData, faultCodes, recoveryCodes, ...rest }) => rest,
    );
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Movement Logs");
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `Loco_Movement_Report_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
  };

  // --- Export ALL records from backend ---
  const exportAllToExcel = async () => {
    try {
      setLoading(true);

      const requestParams: any = {
        fromDate: fromDate
          ? dayjs(fromDate).format("DD-MM-YYYY HH:mm:ss")
          : undefined,
        toDate: toDate
          ? dayjs(toDate).format("DD-MM-YYYY HH:mm:ss")
          : undefined,
      };

      if (selectedLocoId !== "ALL") {
        requestParams.stationaryKavachId = selectedLocoId;
      }

      const response = await axiosInstance.get(
        "/api/loco-specific-fault-report/export",
        {
          params: requestParams,
        },
      );

      const reportData = Array.isArray(response.data)
        ? response.data
        : response.data?.content || [];

      if (!reportData.length) {
        showAlert(
          "No data found for Excel export with the selected filters.",
          "warning",
        );
        return;
      }

      const excelData = reportData.map((row: any) => {
        const { id, faults, faultData, faultCodes, recoveryCodes, ...rest } =
          row;
        return rest;
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "All Loco Fault Report");

      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `Loco_Specific_Fault_Report_ALL_${dayjs().format(
          "YYYYMMDD_HHmmss",
        )}.xlsx`,
      );

      showAlert(
        `All records exported successfully. Total records: ${excelData.length}`,
        "success",
      );
    } catch (error: any) {
      console.error("Export all Excel error:", error);
      showAlert("Failed to export all records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedValueForField = (field: string) => {
    if (field === "mode") return selectedMode;
    if (field === "direction") return selectedDirection;
    if (field === "stationName") return selectedStationName;
    return [];
  };

  // --- Truncate PKT string helper ---
  const formatPktString = (pkt: string) => {
    if (!pkt || typeof pkt !== "string") return "-";
    if (pkt.length <= 22) return pkt;
    return `${pkt.slice(0, 10)}...${pkt.slice(-10)}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Page Title Block --- */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#1565C0", fontSize: "1.5rem" }}
        >
          Loco Specific Fault Report
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: "2.5px", bgcolor: "#1565C0", mb: 3 }} />

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
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Box>
          <Box sx={{ width: 240 }}>
            <DateTimePicker
              label="To Date"
              value={toDate}
              onChange={setToDate}
              ampm={false}
              format="DD-MM-YYYY HH:mm:ss"
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => handleFetchData(0, pageSize, false)}
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

      {/* --- Sub Report Filters (Loco ID Basis) --- */}
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
                Filter
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
                startIcon={<Search sx={{ fontSize: 18 }} />}
                onClick={() => handleFetchData(0, pageSize, true)}
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
                  Total Rows
                </Typography>

                <Chip
                  color="primary"
                  variant="filled"
                  size="small"
                  label={`Total: ${totalRecords.toLocaleString()}`}
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<Download />}
                  variant="contained"
                  onClick={exportToExcel}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    bgcolor: "#1565C0",
                    "&:hover": {
                      bgcolor: "#0d47a1",
                    },
                  }}
                >
                  Export
                </Button>

                <Button
                  startIcon={<Download />}
                  variant="contained"
                  onClick={exportAllToExcel}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    bgcolor: "#1565C0",
                    "&:hover": {
                      bgcolor: "#0d47a1",
                    },
                  }}
                >
                  Export All
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
              <div className="overflow-auto" style={{ maxHeight: "550px" }}>
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
                      <tr className="bg-blue-600 border text-white">
                        {columns.map((col) => {
                          const isFilterable =
                            col.field === "mode" ||
                            col.field === "direction" ||
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
                                            Filter By {col.headerName}
                                          </div>

                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (col.field === "mode")
                                                setSelectedMode([]);
                                              else if (
                                                col.field === "direction"
                                              )
                                                setSelectedDirection([]);
                                              else setSelectedStationName([]);
                                              setActiveHeaderDropdown(null);
                                            }}
                                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                              getSelectedValueForField(
                                                col.field,
                                              ).length === 0
                                                ? "bg-blue-100 font-bold text-blue-700"
                                                : ""
                                            }`}
                                          >
                                            All Records
                                          </div>

                                          {(col.field === "mode"
                                            ? uniqueModes
                                            : col.field === "direction"
                                              ? uniqueDirections
                                              : uniqueStationNames
                                          ).map((opt) => (
                                            <div
                                              key={opt}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const setter =
                                                  col.field === "mode"
                                                    ? setSelectedMode
                                                    : col.field === "direction"
                                                      ? setSelectedDirection
                                                      : setSelectedStationName;

                                                setter((prev) =>
                                                  prev.includes(opt)
                                                    ? prev.filter(
                                                        (v) => v !== opt,
                                                      )
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
                              {col.field === "totalCount" ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleOpenModal(row)}
                                  sx={{
                                    minWidth: 50,
                                    fontWeight: 700,
                                    color: "#1565C0",
                                    borderColor: "#1565C0",
                                    borderRadius: "5px",
                                    "&:hover": {
                                      backgroundColor: "#e3f2fd",
                                      borderColor: "#0d47a1",
                                    },
                                  }}
                                >
                                  {row.totalCount ?? 0}
                                </Button>
                              ) : col.field.toLowerCase() === "pkt" ? (
                                <Tooltip
                                  title={row[col.field] || "-"}
                                  arrow
                                  placement="top"
                                >
                                  <span className="font-mono text-xs text-gray-700 cursor-pointer underline decoration-dotted">
                                    {formatPktString(row[col.field])}
                                  </span>
                                </Tooltip>
                              ) : col.field === "date" ? (
                                <span className="font-medium text-gray-600">
                                  {dayjs(row[col.field]).format("DD-MM-YYYY")}
                                </span>
                              ) : col.field === "time" ? (
                                <span className="text-blue-600 font-bold">
                                  {row[col.field]}
                                </span>
                              ) : col.field === "mode" && row[col.field] ? (
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
            <FilterList sx={{ fontSize: 40, color: "#1565C0" }} />
          </Box>
          <Typography
            variant="h6"
            fontWeight={700}
            color="#334155"
            gutterBottom
          >
            No Report Generated Yet
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Select Time Range and select <b>Apply</b>.
          </Typography>
        </Paper>
      )}

      {/* --- Modal Dialog displaying Fault Details --- */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ErrorOutline color="error" />
            <Typography variant="h6" fontWeight="bold">
              Fault Details (Loco: {selectedRowData?.locoId})
            </Typography>
          </Stack>
          <IconButton onClick={handleCloseModal}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedRowData?.faults && selectedRowData.faults.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Index</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Module ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Fault Code
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Fault Message
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Description
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedRowData.faults.map((fault: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{fault.index}</TableCell>
                      <TableCell>
                        <Chip
                          label={fault.type}
                          color={fault.type === "Fault" ? "error" : "success"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{fault.moduleId}</TableCell>
                      <TableCell>{fault.faultCode}</TableCell>
                      <TableCell sx={{ fontWeight: "medium" }}>
                        {fault.faultMsg}
                      </TableCell>
                      <TableCell>{fault.faultDescription || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" align="center" py={3}>
              No fault details available for this record.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseModal}
            variant="contained"
            sx={{ bgcolor: "#1565C0", "&:hover": { bgcolor: "#0d47a1" } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocoSpecificFault;
