import React, { useEffect, useRef, useState } from "react";
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
  Autocomplete,
} from "@mui/material";
import {
  FilterList,
  Download,
  Search,
  Refresh,
} from "@mui/icons-material";
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

const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const DmiEventSummaryReport = () => {
  const { showAlert } = useNotify();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // --- UI states ---
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<string | null>(
    null,
  );

  // --- Server filter states ---
  // Default = last 1 day: today 00:00:00 to current time.
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().subtract(1, "day"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [selectedLocoId, setSelectedLocoId] = useState<string>("ALL");

  // --- Table data states ---
  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [locoIdsList, setLocoIdsList] = useState<string[]>([]);

  // --- Pagination ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);

  // --- Close table header dropdown when clicking outside ---
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

  // Keep a useful Loco ID list from the records already returned by the server.
  // No additional metadata endpoint is assumed because only the DMI endpoint
  // was provided.
  useEffect(() => {
    const ids = Array.from(
      new Set(
        masterRows
          .map((row) => row.locoId)
          .filter((value) => value !== null && value !== undefined && value !== "")
          .map((value) => String(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    setLocoIdsList((previous) => {
      const merged = Array.from(new Set([...previous, ...ids]));
      return merged.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
    });
  }, [masterRows]);

  const clearData = () => {
    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    setLocoIdsList([]);
    setSelectedLocoId("ALL");
    setShowFilters(false);
    setActiveHeaderDropdown(null);
    setPage(0);
    setTotalRecords(0);

    // Reset to the default 1-day range.
    setFromDate(dayjs().subtract(1, "day"));
    setToDate(dayjs());
  };

  const handleFetchData = async (
    pageNo = 0,
    rowsPerPage = pageSize,
  ) => {
    if (fromDate && toDate && fromDate.isAfter(toDate)) {
      showAlert("From Date cannot be after To Date.", "warning");
      return;
    }

    setLoading(true);
    setActiveHeaderDropdown(null);

    const requestParams: any = {
      page: pageNo,
      size: rowsPerPage,
      fromDate: fromDate
        ? dayjs(fromDate).format("DD-MM-YYYY HH:mm:ss")
        : undefined,
      toDate: toDate
        ? dayjs(toDate).format("DD-MM-YYYY HH:mm:ss")
        : undefined,
    };

    if (selectedLocoId !== "ALL" && selectedLocoId.trim()) {
      requestParams.locoId = selectedLocoId.trim();
    }

    try {
      const response = await axiosInstance.get(
        "/dmi-event-summary-report",
        {
          params: requestParams,
        },
      );

      const responseData = response.data || {};

      const rawContent =
        responseData?.content ||
        responseData?.data ||
        [];

      const data = Array.isArray(rawContent) ? rawContent : [];

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        setColumns([]);
        setTotalRecords(0);
        setPage(pageNo);
        setShowFilters(true);

        showAlert(
          "No DMI Event Summary records found for the selected filters.",
          "info",
        );
        return;
      }

      const hiddenColumns = ["id"];

      // Keep a stable report column order based on the supplied API response.
      const columnOrder = [
        "dateTime",
        "locoId",
        "oem",
        "locoShed",
        "trainTypeSelection",
        "promptMessageOnDmi",
        "SoS/EBInformation",
        "LPAckCondition",
      ];

      const headerMap: Record<string, string> = {
        dateTime: "Date & Time",
        locoId: "Loco ID",
        oem: "OEM",
        locoShed: "Loco Shed",
        trainTypeSelection: "Train Type Selection",
        promptMessageOnDmi: "Prompt Message on DMI",
        "SoS/EBInformation": "SoS / EB Information",
        LPAckCondition: "LP Ack Condition",
      };

      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      const orderedKeys = [
        ...columnOrder.filter((key) => columnKeys.includes(key)),
        ...columnKeys.filter((key) => !columnOrder.includes(key)),
      ];

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
        responseData.totalRecords ||
          responseData.totalElements ||
          responseData.total ||
          0,
      );

      setShowFilters(true);
      setPage(pageNo);
    } catch (error: any) {
      console.error("DMI Event Summary Report error:", error);

      setMasterRows([]);
      setFilteredRows([]);
      setColumns([]);
      setTotalRecords(0);

      showAlert(
        "An error occurred while fetching DMI Event Summary records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial report load with the default 1-day date range.
  useEffect(() => {
    handleFetchData(0, pageSize);
    // Intentionally run only once on component mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert(
        "No records are currently available for Excel export.",
        "warning",
      );
      return;
    }

    const reportData = filteredRows.map(({ id, ...rest }) => {
      const formatted: any = {};

      columns.forEach((column) => {
        const value = rest[column.field];
        formatted[column.headerName] =
          value === null || value === undefined || value === ""
            ? "-"
            : value;
      });

      return formatted;
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "DMI Event Summary",
    );

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(
      blob,
      `DMI_Event_Summary_Report_${dayjs().format(
        "YYYYMMDD_HHmmss",
      )}.xlsx`,
    );
  };

  // --- Export ALL matching records ---
  // Uses the same DMI endpoint and keeps the selected date range + Loco ID.
  // It fetches all pages from the backend, so the Excel file contains the
  // complete filtered dataset rather than only the currently visible page.
  const exportAllToExcel = async () => {
    if (fromDate && toDate && fromDate.isAfter(toDate)) {
      showAlert("From Date cannot be after To Date.", "warning");
      return;
    }

    setLoading(true);

    try {
      const baseParams: any = {
        fromDate: fromDate
          ? dayjs(fromDate).format("DD-MM-YYYY HH:mm:ss")
          : undefined,
        toDate: toDate
          ? dayjs(toDate).format("DD-MM-YYYY HH:mm:ss")
          : undefined,
      };

      if (selectedLocoId !== "ALL" && selectedLocoId.trim()) {
        baseParams.locoId = selectedLocoId.trim();
      }

      // First request gets the totalRecords and the first page.
      const firstPageSize = 1000;

      const firstResponse = await axiosInstance.get(
        "/dmi-event-summary-report/export",
        {
          params: {
            ...baseParams,
            page: 0,
            size: firstPageSize,
          },
        },
      );

      const firstResponseData = firstResponse.data || {};
      const firstContent = Array.isArray(firstResponseData?.content)
        ? firstResponseData.content
        : Array.isArray(firstResponseData?.data)
          ? firstResponseData.data
          : [];

      const total = Number(
        firstResponseData.totalRecords ||
          firstResponseData.totalElements ||
          firstResponseData.total ||
          firstContent.length,
      );

      if (!total && !firstContent.length) {
        showAlert(
          "No data found for Excel export with the selected filters.",
          "warning",
        );
        return;
      }

      const allRows: any[] = [...firstContent];

      // Fetch remaining pages.
      const totalPages = Math.ceil(total / firstPageSize);

      for (let currentPage = 1; currentPage < totalPages; currentPage++) {
        const response = await axiosInstance.get(
          "/surakshaApi/dmi-event-summary-report",
          {
            params: {
              ...baseParams,
              page: currentPage,
              size: firstPageSize,
            },
          },
        );

        const responseData = response.data || {};
        const content = Array.isArray(responseData?.content)
          ? responseData.content
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

        allRows.push(...content);
      }

      if (!allRows.length) {
        showAlert(
          "No data found for Excel export with the selected filters.",
          "warning",
        );
        return;
      }

      const reportData = allRows.map((row: any) => {
        const formatted: any = {};

        columns.forEach((column) => {
          const value = row[column.field];

          if (
            column.field === "dateTime" &&
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            const parsed = dayjs(value);
            formatted[column.headerName] = parsed.isValid()
              ? parsed.format("DD-MM-YYYY HH:mm:ss")
              : value;
          } else {
            formatted[column.headerName] =
              value === null || value === undefined || value === ""
                ? "-"
                : value;
          }
        });

        return formatted;
      });

      const ws = XLSX.utils.json_to_sheet(reportData);

      // Make long DMI message columns easier to read in Excel.
      const headerRow = columns.map((column) => column.headerName);
      const promptColumnIndex = headerRow.indexOf("Prompt Message on DMI");
      const sosColumnIndex = headerRow.indexOf("SoS / EB Information");
      const lpAckColumnIndex = headerRow.indexOf("LP Ack Condition");

      ws["!cols"] = headerRow.map((header, index) => {
        if (index === promptColumnIndex) return { wch: 55 };
        if (index === sosColumnIndex) return { wch: 35 };
        if (index === lpAckColumnIndex) return { wch: 30 };
        return { wch: Math.max(15, Math.min(header.length + 5, 30)) };
      });

      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        "DMI Event Summary",
      );

      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const locoPart =
        selectedLocoId !== "ALL"
          ? `_Loco_${selectedLocoId}`
          : "_ALL_Locos";

      saveAs(
        blob,
        `DMI_Event_Summary_Report_ALL${locoPart}_${dayjs().format(
          "YYYYMMDD_HHmmss",
        )}.xlsx`,
      );

      showAlert(
        `All matching records exported successfully. Total records: ${allRows.length}`,
        "success",
      );
    } catch (error: any) {
      console.error("DMI Event Summary Export All error:", error);

      showAlert(
        "Failed to export all DMI Event Summary records.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (field === "dateTime") {
      const parsed = dayjs(value);

      if (!parsed.isValid()) {
        return String(value);
      }

      return (
        <span className="font-medium text-gray-600">
          {parsed.format("DD-MM-YYYY")}{" "}
          <span className="text-blue-600 font-bold">
            {parsed.format("HH:mm:ss")}
          </span>
        </span>
      );
    }

    if (field === "locoId") {
      return (
        <span className="font-bold text-blue-700">
          {String(value)}
        </span>
      );
    }

    if (field === "promptMessageOnDmi") {
      return (
        <span className="whitespace-normal leading-5">
          {String(value)}
        </span>
      );
    }

    return String(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Page Title --- */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1565C0",
            fontSize: "1.5rem",
          }}
        >
          DMI Event Summary Report
        </Typography>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: "2.5px",
          bgcolor: "#1565C0",
          mb: 3,
        }}
      />

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
            onClick={() => handleFetchData(0, pageSize)}
            disabled={loading}
            sx={{
              height: 40,
              px: 4,
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

          <Tooltip title="Clear and Reset Options" arrow>
            <IconButton
              onClick={clearData}
              disabled={loading}
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
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              mb={1.5}
            >
              <FilterList
                sx={{
                  fontSize: 20,
                  color: "#1e293b",
                }}
              />
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#1e293b",
                  fontSize: "0.95rem",
                }}
              >
                Report Filter
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
              <Box sx={{ width: 240 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={["ALL", ...locoIdsList]}
                  value={selectedLocoId === "ALL" ? "ALL" : selectedLocoId}
                  onChange={(_, newValue) => {
                    setSelectedLocoId(
                      newValue ? String(newValue) : "ALL",
                    );
                  }}
                  onInputChange={(_, newInputValue, reason) => {
                    if (reason === "input") {
                      setSelectedLocoId(newInputValue || "ALL");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Loco ID"
                      placeholder="Search / enter Loco ID"
                    />
                  )}
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<Search sx={{ fontSize: 18 }} />}
                onClick={() => handleFetchData(0, pageSize)}
                disabled={loading}
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
                Get Report
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* --- Report Table --- */}
      {loading || masterRows.length > 0 ? (
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
                  DMI Event Summary Records
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
                  variant="outlined"
                  onClick={exportToExcel}
                  disabled={loading || !filteredRows.length}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    color: "#1565C0",
                    borderColor: "#1565C0",
                    "&:hover": {
                      borderColor: "#0d47a1",
                      bgcolor: "rgba(21,101,192,0.04)",
                    },
                  }}
                >
                  Export
                </Button>

                <Button
                  startIcon={<Download />}
                  variant="contained"
                  onClick={exportAllToExcel}
                  disabled={loading || !totalRecords}
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
                    style={{
                      minWidth: `${Math.max(columns.length, 1) * 190}px`,
                    }}
                  >
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-blue-600 border text-white">
                        {columns.map((col) => (
                          <th
                            key={col.field}
                            className="relative border border-blue-700 px-4 py-3 text-left text-sm font-bold whitespace-nowrap tracking-wider"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{col.headerName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((row, index) => (
                        <tr
                          key={row.id || index}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50"
                          }`}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.field}
                              className={`border border-gray-200 px-4 py-2.5 text-sm text-gray-800 ${
                                col.field === "promptMessageOnDmi" ||
                                col.field === "SoS/EBInformation" ||
                                col.field === "LPAckCondition"
                                  ? "whitespace-normal min-w-[300px]"
                                  : "whitespace-nowrap"
                              }`}
                            >
                              {formatCellValue(
                                col.field,
                                row[col.field],
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
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      setPage(0);
                      handleFetchData(0, newSize);
                    }}
                    disabled={loading}
                    className="rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold outline-none text-gray-700 focus:border-blue-500 cursor-pointer"
                  >
                    {[10, 25, 50, 100, 200].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm font-medium text-gray-700 tracking-wide">
                  {totalRecords === 0
                    ? 0
                    : page * pageSize + 1}
                  –
                  {Math.min(
                    (page + 1) * pageSize,
                    totalRecords,
                  )}{" "}
                  of{" "}
                  <span className="font-bold text-blue-600">
                    {totalRecords.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleFetchData(0, pageSize)}
                    disabled={loading || page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronsLeft size={18} />
                  </button>

                  <button
                    onClick={() =>
                      handleFetchData(page - 1, pageSize)
                    }
                    disabled={loading || page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={() =>
                      handleFetchData(page + 1, pageSize)
                    }
                    disabled={
                      loading ||
                      (page + 1) * pageSize >= totalRecords
                    }
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <button
                    onClick={() =>
                      handleFetchData(
                        Math.max(
                          Math.ceil(totalRecords / pageSize) - 1,
                          0,
                        ),
                        pageSize,
                      )
                    }
                    disabled={
                      loading ||
                      totalRecords === 0 ||
                      (page + 1) * pageSize >= totalRecords
                    }
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
              bgcolor: "rgba(21,101,192,0.06)",
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
            No Report Generated Yet
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
            textAlign="center"
          >
            The report is loaded for the default 1-day range.
            Use the date range and Loco ID filters above.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DmiEventSummaryReport;