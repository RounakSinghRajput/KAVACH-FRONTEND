import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Divider,
  TextField,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";

import {
  FilterList,
  Download,
  Refresh,
  Search,
} from "@mui/icons-material";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import dayjs, { Dayjs } from "dayjs";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { saveAs } from "file-saver";

import { useNotify } from "../../context/notification-context";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

/* -------------------------------------------------------------------------- */
/*                              REPORT CONFIG                                 */
/* -------------------------------------------------------------------------- */

const REPORT_TYPES = [
  {
    label: "EB Report",
    value: "EB_REPORT",
    endpoint: "/api/new-exception/be",
    exportEndpoint: "/api/new-exception/be/export",
  },
  {
    label: "Tag Missing",
    value: "TAG_MISSING",
    endpoint: "/api/new-exception/tag-missing",
    exportEndpoint: "/api/new-exception/tag-missing/export",
  },
  {
    label: "Mode Degradation",
    value: "MODE_DEGRADATION",
    endpoint: "/api/new-exception/mode-degradation",
    exportEndpoint: "/api/new-exception/mode-degradation/export",
  },
  {
    label: "Collision Detection",
    value: "COLLISION_DETECTION",
    endpoint: "/api/new-exception/collision-detection",
    exportEndpoint: "/api/new-exception/collision-detection/export",
  },
];

/* -------------------------------------------------------------------------- */
/*                              TYPES                                         */
/* -------------------------------------------------------------------------- */

interface ReportColumn {
  field: string;
  headerName: string;
}

interface ReportRow {
  id: number;
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/*                         HEADER FORMATTER                                   */
/* -------------------------------------------------------------------------- */

const formatHeader = (key: string): string => {
  if (!key) return "";

  const specialHeaders: Record<string, string> = {
    locoId: "Loco ID",
    locoFrameNo: "Loco Frame No",
    locoAbsLocation: "Loco ABS Location",
    stationId: "Station ID",
    stationCode: "Station Code",
    division: "Division",
    trainLength: "Train Length",
    trainSpeed: "Train Speed",
    locoMode: "Loco Mode",
    movementDirection: "Movement Direction",
    brakeApplied: "Brake Applied",
    emergencyStatus: "Emergency Status",
    lastRfidTagId: "Last RFID Tag ID",
    trackIdentificationNo: "Track Identification No",
    infoAck: "Info ACK",
    lengthDoubtOver: "Length Doubt Over",
    lengthDoubtUnder: "Length Doubt Under",
    tagDup: "Tag Duplicate",
    tagLinkInfo: "Tag Link Info",
    signalOverride: "Signal Override",
    refProfileNum: "Reference Profile No",
    lastRefRfid: "Last Reference RFID",
    distPktStart: "Distance Packet Start",
  };

  if (specialHeaders[key]) {
    return specialHeaders[key];
  }

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

/* -------------------------------------------------------------------------- */
/*                         VALUE FORMATTER                                    */
/* -------------------------------------------------------------------------- */

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

/* -------------------------------------------------------------------------- */
/*                         MAIN COMPONENT                                     */
/* -------------------------------------------------------------------------- */

const NewExceptionReport = () => {
  const { showAlert } = useNotify();

  /* ---------------------------- Report Type ---------------------------- */

  const [selectedReportType, setSelectedReportType] =
    useState<string>("EB_REPORT");

  /* ------------------------------ Filters ------------------------------ */

  // Default report window: current time and previous 1 hour.
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().subtract(1, "hour"),
  );

  const [toDate, setToDate] = useState<Dayjs | null>(
    dayjs(),
  );

  // Division is mandatory.
  const [division, setDivision] = useState<string>("");

  const [locoId, setLocoId] = useState<string>("");

  // Searchable Division / Loco dropdown data.
  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);
  const [locoOptions, setLocoOptions] = useState<string[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingLocos, setLoadingLocos] = useState(false);

  /* ------------------------------- Data -------------------------------- */

  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);

  /* ----------------------------- Loading ------------------------------- */

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* ---------------------------- Pagination ---------------------------- */

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* ---------------------------------------------------------------------- */
  /*                         GET SELECTED REPORT                            */
  /* ---------------------------------------------------------------------- */

  const getSelectedReport = () => {
    return REPORT_TYPES.find(
      (report) => report.value === selectedReportType,
    );
  };

  /* ---------------------------------------------------------------------- */
  /*                    DIVISION / LOCO DROPDOWN APIs                      */
  /* ---------------------------------------------------------------------- */

  const fetchDivisions = async () => {
    setLoadingDivisions(true);

    try {
      const response = await axiosInstance.get(
        "/mt11OnboardStation/divisions",
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.content || response.data?.data || [];

      setDivisionOptions(
        data
          .map((item: any) => String(item))
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b)),
      );
    } catch (error: any) {
      console.error("Division API Error:", error);
      setDivisionOptions([]);
      showAlert(
        error?.response?.data?.message ||
          "Unable to load divisions.",
        "error",
      );
    } finally {
      setLoadingDivisions(false);
    }
  };

  const fetchLocos = async (selectedDivision: string) => {
    if (!selectedDivision) {
      setLocoOptions([]);
      return;
    }

    setLoadingLocos(true);

    try {
      const response = await axiosInstance.get(
        "/mt11OnboardStation/locos",
        {
          params: {
            division: selectedDivision,
          },
        },
      );

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.content || response.data?.data || [];

      setLocoOptions(
        data
          .map((item: any) => String(item))
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b)),
      );
    } catch (error: any) {
      console.error("Loco API Error:", error);
      setLocoOptions([]);
      showAlert(
        error?.response?.data?.message ||
          "Unable to load loco IDs.",
        "error",
      );
    } finally {
      setLoadingLocos(false);
    }
  };

  // Load divisions when the page opens.
  useEffect(() => {
    fetchDivisions();
  }, []);

  // Loco list depends on the selected division.
  useEffect(() => {
    setLocoId("");

    if (division) {
      fetchLocos(division);
    } else {
      setLocoOptions([]);
    }
  }, [division]);

  /* ---------------------------------------------------------------------- */
  /*                             CLEAR DATA                                  */
  /* ---------------------------------------------------------------------- */

  const clearData = () => {
    setRows([]);
    setColumns([]);
    setTotalRecords(0);
    setTotalPages(0);
    setPage(0);
  };

  /* ---------------------------------------------------------------------- */
  /*                            RESET FILTERS                                */
  /* ---------------------------------------------------------------------- */

  const resetFilters = () => {
    setSelectedReportType("EB_REPORT");

    setFromDate(dayjs().subtract(1, "hour"));
    setToDate(dayjs());

    setDivision("");
    setLocoId("");
    setLocoOptions([]);

    clearData();
  };

  /* ---------------------------------------------------------------------- */
  /*                         BUILD COMMON PARAMS                            */
  /* ---------------------------------------------------------------------- */

  const buildRequestParams = () => {
    const params: Record<string, any> = {};

    if (fromDate) {
      params.fromDate = fromDate.format(
        "YYYY-MM-DD HH:mm:ss",
      );
    }

    if (toDate) {
      params.toDate = toDate.format(
        "YYYY-MM-DD HH:mm:ss",
      );
    }

    if (division.trim()) {
      params.division = division.trim();
    }

    if (locoId.trim()) {
      params.locoId = locoId.trim();
    }

    return params;
  };

  /* ---------------------------------------------------------------------- */
  /*                            VALIDATION                                  */
  /* ---------------------------------------------------------------------- */

  const validateFilters = (): boolean => {
    if (!fromDate || !toDate) {
      showAlert(
        "Please select From Date and To Date.",
        "warning",
      );

      return false;
    }

    if (fromDate.isAfter(toDate)) {
      showAlert(
        "From Date cannot be greater than To Date.",
        "warning",
      );

      return false;
    }

    if (!division.trim()) {
      showAlert(
        "Division is required.",
        "warning",
      );

      return false;
    }

    return true;
  };

  /* ---------------------------------------------------------------------- */
  /*                              FETCH REPORT                              */
  /* ---------------------------------------------------------------------- */

  const fetchReport = async (
    pageNo = 0,
    size = pageSize,
  ) => {
    const report = getSelectedReport();

    if (!report) {
      showAlert(
        "Please select a valid Report Type.",
        "warning",
      );

      return;
    }

    if (!validateFilters()) {
      return;
    }

    setLoading(true);

    try {
      const params = {
        page: pageNo,
        size,
        ...buildRequestParams(),
      };

      const response = await axiosInstance.get(
        report.endpoint,
        {
          params,
        },
      );

      const responseData = response.data;

      const content =
        responseData?.content ||
        responseData?.data ||
        [];

      const data: any[] = Array.isArray(content)
        ? content
        : [];

      /* --------------------------- No Data --------------------------- */

      if (!data.length) {
        setRows([]);
        setColumns([]);

        setTotalRecords(
          Number(responseData?.totalElements || 0),
        );

        setTotalPages(
          Number(responseData?.totalPages || 0),
        );

        setPage(pageNo);

        showAlert(
          "No records found for the selected filters.",
          "info",
        );

        return;
      }

      /* ----------------------- Dynamic Columns ----------------------- */

      const hiddenColumns = ["id"];

      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      const dynamicColumns: ReportColumn[] =
        columnKeys.map((key) => ({
          field: key,
          headerName: formatHeader(key),
        }));

      /* ---------------------------- Rows ----------------------------- */

      const mappedRows: ReportRow[] = data.map(
        (item: any, index: number) => ({
          id:
            pageNo * size +
            index +
            1,
          ...item,
        }),
      );

      setColumns(dynamicColumns);
      setRows(mappedRows);

      setTotalRecords(
        Number(responseData?.totalElements || 0),
      );

      setTotalPages(
        Number(responseData?.totalPages || 0),
      );

      setPage(
        Number(responseData?.page ?? pageNo),
      );
    } catch (error: any) {
      console.error(
        "New Exception Report API Error:",
        error,
      );

      setRows([]);
      setColumns([]);
      setTotalRecords(0);
      setTotalPages(0);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "An error occurred while loading the Exception Report.";

      showAlert(message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                         EXPORT ALL REPORT                              */
  /* ---------------------------------------------------------------------- */

  const exportToExcel = async () => {
    const report = getSelectedReport();

    if (!report) {
      showAlert(
        "Please select a valid Report Type.",
        "warning",
      );

      return;
    }

    if (!validateFilters()) {
      return;
    }

    setExporting(true);

    try {
      /*
       * Export API intentionally does NOT send:
       * page
       * size
       *
       * because export is for all matching records.
       */

      const params = buildRequestParams();

      const response = await axiosInstance.get(
        report.exportEndpoint,
        {
          params,
          responseType: "blob",
        },
      );

      const contentType =
        response.headers?.["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob(
        [response.data],
        {
          type: contentType,
        },
      );

      const fileName =
        `${report.label.replace(/\s+/g, "_")}_` +
        `${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;

      saveAs(blob, fileName);

      showAlert(
        `${report.label} exported successfully.`,
        "success",
      );
    } catch (error: any) {
      console.error(
        "Exception Report Export Error:",
        error,
      );

      showAlert(
        "An error occurred while exporting the report.",
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                         PAGINATION                                     */
  /* ---------------------------------------------------------------------- */

  const goToFirstPage = () => {
    if (page === 0) {
      return;
    }

    fetchReport(0, pageSize);
  };

  const goToPreviousPage = () => {
    if (page <= 0) {
      return;
    }

    fetchReport(page - 1, pageSize);
  };

  const goToNextPage = () => {
    if (page + 1 >= totalPages) {
      return;
    }

    fetchReport(page + 1, pageSize);
  };

  const goToLastPage = () => {
    if (totalPages <= 0) {
      return;
    }

    fetchReport(
      totalPages - 1,
      pageSize,
    );
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newSize = Number(
      event.target.value,
    );

    setPageSize(newSize);
    setPage(0);

    fetchReport(0, newSize);
  };

  /* ---------------------------------------------------------------------- */
  /*                              UI DATA                                   */
  /* ---------------------------------------------------------------------- */

  const selectedReport = getSelectedReport();

  const startRecord =
    totalRecords === 0
      ? 0
      : page * pageSize + 1;

  const endRecord = Math.min(
    (page + 1) * pageSize,
    totalRecords,
  );

  /* ---------------------------------------------------------------------- */
  /*                              RETURN                                    */
  /* ---------------------------------------------------------------------- */

  return (
    <Box sx={{ p: 3 }}>

      {/* ================================================================== */}
      {/* PAGE HEADER                                                        */}
      {/* ================================================================== */}

      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1976D2",
            fontSize: "1.5rem",
          }}
        >
          New Exception Report
        </Typography>
      </Box>

      <Box
        sx={{
          width: "100%",
          height: "2.5px",
          bgcolor: "#1976d2",
          mb: 4,
        }}
      />

      {/* ================================================================== */}
      {/* FILTER SECTION                                                     */}
      {/* ================================================================== */}

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
      >
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              mb={2}
            >
              <FilterList
                sx={{
                  fontSize: 20,
                  color: "#334155",
                }}
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                Report Filters
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

              {/* ======================================================== */}
              {/* REPORT TYPE                                               */}
              {/* ======================================================== */}

              <Box sx={{ width: 250 }}>
                <FormControl
                  fullWidth
                  size="small"
                >
                  <InputLabel>
                    Report Type
                  </InputLabel>

                  <Select
                    value={selectedReportType}
                    label="Report Type"
                    onChange={(event) => {
                      setSelectedReportType(
                        event.target.value,
                      );

                      clearData();
                    }}
                  >
                    {REPORT_TYPES.map(
                      (report) => (
                        <MenuItem
                          key={report.value}
                          value={report.value}
                        >
                          {report.label}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </FormControl>
              </Box>

              {/* ======================================================== */}
              {/* FROM DATE                                                 */}
              {/* ======================================================== */}

              <Box sx={{ width: 225 }}>
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

              {/* ======================================================== */}
              {/* TO DATE                                                   */}
              {/* ======================================================== */}

              <Box sx={{ width: 225 }}>
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

              {/* ======================================================== */}
              {/* DIVISION                                                  */}
              {/* ======================================================== */}

              <Box sx={{ width: 240 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={divisionOptions}
                  value={division || null}
                  loading={loadingDivisions}
                  onChange={(_, value) => {
                    setDivision(value || "");
                    setLocoId("");
                    clearData();
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option === value
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Division"
                      placeholder="Search division"
                      InputLabelProps={{
                        ...params.InputLabelProps,
                        required: true,
                      }}
                    />
                  )}
                />
              </Box>

              {/* ======================================================== */}
              {/* LOCO ID                                                   */}
              {/* ======================================================== */}

              <Box sx={{ width: 210 }}>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={locoOptions}
                  value={locoId || null}
                  loading={loadingLocos}
                  disabled={!division}
                  onChange={(_, value) => {
                    setLocoId(value || "");
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option === value
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Loco ID"
                      placeholder={
                        division
                          ? "Search Loco ID"
                          : "Select Division first"
                      }
                    />
                  )}
                />
              </Box>

              {/* ======================================================== */}
              {/* GET REPORT                                                */}
              {/* ======================================================== */}

              <Button
                variant="contained"
                startIcon={
                  <Search
                    sx={{ fontSize: 17 }}
                  />
                }
                onClick={() =>
                  fetchReport(
                    0,
                    pageSize,
                  )
                }
                disabled={loading}
                sx={{
                  height: 40,
                  px: 3,
                  fontWeight: "bold",
                  bgcolor: "#1976d2",
                  textTransform: "none",
                  borderRadius: "8px",
                  "&:hover": {
                    bgcolor: "#1565c0",
                  },
                }}
              >
                Get Report
              </Button>

              {/* ======================================================== */}
              {/* RESET                                                     */}
              {/* ======================================================== */}

              <Tooltip
                title="Reset Filters"
                arrow
              >
                <IconButton
                  onClick={resetFilters}
                  disabled={
                    loading || exporting
                  }
                  sx={{
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "8px",
                    height: 40,
                    width: 40,
                    color: "#64748b",
                  }}
                >
                  <Refresh
                    sx={{ fontSize: 18 }}
                  />
                </IconButton>
              </Tooltip>

            </Box>
          </CardContent>
        </Card>
      </LocalizationProvider>

      {/* ================================================================== */}
      {/* REPORT TABLE                                                      */}
      {/* ================================================================== */}

      {loading || rows.length > 0 ? (
        <Card
          elevation={0}
          sx={{
            border: "none",
            bgcolor: "transparent",
          }}
        >

          {/* ============================================================ */}
          {/* TABLE HEADER                                                 */}
          {/* ============================================================ */}

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
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {selectedReport?.label ||
                  "Exception Report"}
              </Typography>

              <Chip
                size="small"
                label={`Total Records: ${totalRecords}`}
                sx={{
                  fontWeight: "bold",
                  bgcolor: "#1976d2",
                  color: "#fff",
                  height: 24,
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                }}
              />
            </Stack>

            {/* ======================================================== */}
            {/* EXPORT ALL                                                */}
            {/* ======================================================== */}

            <Button
              startIcon={
                <Download
                  sx={{ fontSize: 16 }}
                />
              }
              variant="outlined"
              size="small"
              onClick={exportToExcel}
              disabled={
                loading || exporting
              }
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                color: "#1976d2",
                borderColor: "#1976d2",
                fontWeight: "medium",
                "&:hover": {
                  borderColor: "#1565c0",
                  bgcolor:
                    "rgba(25,118,210,0.04)",
                },
              }}
            >
              {exporting
                ? "Exporting..."
                : "Export All"}
            </Button>
          </Stack>

          {/* ============================================================ */}
          {/* TABLE                                                        */}
          {/* ============================================================ */}

          <Paper
            sx={{
              width: "100%",
              overflow: "hidden",
              border:
                "1px solid #cbd5e1",
              borderRadius: "8px",
              boxShadow: "none",
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
                    minWidth: `${Math.max(
                      columns.length * 170,
                      1000,
                    )}px`,
                  }}
                >

                  {/* ================================================== */}
                  {/* TABLE HEADER                                         */}
                  {/* ================================================== */}

                  <thead className="sticky top-0 z-20">
                    <tr className="bg-[#1976d2] text-white">

                      {columns.map(
                        (column) => (
                          <th
                            key={
                              column.field
                            }
                            className="border border-white/20 px-4 py-3 text-left text-sm font-semibold tracking-wide whitespace-nowrap"
                          >
                            {
                              column.headerName
                            }
                          </th>
                        ),
                      )}

                    </tr>
                  </thead>

                  {/* ================================================== */}
                  {/* TABLE BODY                                           */}
                  {/* ================================================== */}

                  <tbody>

                    {rows.map(
                      (row, rowIndex) => (
                        <tr
                          key={
                            row.id ||
                            rowIndex
                          }
                          className={`hover:bg-gray-50 transition-colors ${
                            rowIndex % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50/60"
                          }`}
                        >

                          {columns.map(
                            (column) => {
                              const value =
                                row[
                                  column.field
                                ];

                              const field =
                                column.field.toLowerCase();

                              const isMode =
                                field.includes(
                                  "mode",
                                );

                              const isDate =
                                field ===
                                  "date" ||
                                field ===
                                  "datetime";

                              const isTime =
                                field ===
                                "time";

                              return (
                                <td
                                  key={
                                    column.field
                                  }
                                  className="border border-gray-200 px-4 py-3 text-sm whitespace-nowrap text-gray-700"
                                >

                                  {isMode &&
                                  value ? (
                                    <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded border border-green-200 text-xs">
                                      {formatCellValue(
                                        value,
                                      )}
                                    </span>
                                  ) : isDate ? (
                                    <span className="font-medium">
                                      {formatCellValue(
                                        value,
                                      )}
                                    </span>
                                  ) : isTime ? (
                                    <span className="text-[#1976d2] font-semibold">
                                      {formatCellValue(
                                        value,
                                      )}
                                    </span>
                                  ) : (
                                    formatCellValue(
                                      value,
                                    )
                                  )}

                                </td>
                              );
                            },
                          )}

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>
              )}

            </div>

            {/* ========================================================== */}
            {/* PAGINATION                                                 */}
            {/* ========================================================== */}

            <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">

              {/* ======================================================== */}
              {/* PAGE SIZE                                                */}
              {/* ======================================================== */}

              <div className="flex items-center gap-3">

                <span className="text-sm text-gray-500">
                  Rows per page:
                </span>

                <select
                  value={pageSize}
                  onChange={
                    handlePageSizeChange
                  }
                  disabled={loading}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none text-gray-700 focus:border-blue-500 cursor-pointer"
                >
                  {[10, 20, 50, 100].map(
                    (size) => (
                      <option
                        key={size}
                        value={size}
                      >
                        {size}
                      </option>
                    ),
                  )}
                </select>

              </div>

              {/* ======================================================== */}
              {/* RECORD RANGE                                              */}
              {/* ======================================================== */}

              <div className="text-sm text-gray-600">
                {startRecord}–{endRecord} of{" "}
                <span className="font-semibold text-gray-900">
                  {totalRecords}
                </span>
              </div>

              {/* ======================================================== */}
              {/* PAGINATION BUTTONS                                        */}
              {/* ======================================================== */}

              <div className="flex items-center gap-1">

                {/* First */}

                <button
                  onClick={
                    goToFirstPage
                  }
                  disabled={
                    page === 0 ||
                    loading
                  }
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronsLeft
                    size={16}
                  />
                </button>

                {/* Previous */}

                <button
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    page === 0 ||
                    loading
                  }
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft
                    size={16}
                  />
                </button>

                {/* Next */}

                <button
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    page + 1 >=
                      totalPages ||
                    loading
                  }
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight
                    size={16}
                  />
                </button>

                {/* Last */}

                <button
                  onClick={
                    goToLastPage
                  }
                  disabled={
                    page + 1 >=
                      totalPages ||
                    loading
                  }
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronsRight
                    size={16}
                  />
                </button>

              </div>
            </div>
          </Paper>
        </Card>
      ) : (

        /* ================================================================ */
        /* EMPTY STATE                                                     */
        /* ================================================================ */

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
            border:
              "1px dashed #cbd5e1",
            bgcolor: "#f8fafc",
            p: 4,
          }}
        >

          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              bgcolor:
                "rgba(25,118,210,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <FilterList
              sx={{
                fontSize: 32,
                color: "#1976d2",
              }}
            />
          </Box>

          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="#334155"
            gutterBottom
          >
            No Exception Report Selected
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
            textAlign="center"
          >
            Select Report Type, Division and date
            range, then click{" "}
            <b>Get Report</b>.
          </Typography>

        </Paper>
      )}

    </Box>
  );
};

export default NewExceptionReport;