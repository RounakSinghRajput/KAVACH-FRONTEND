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
  Collapse,
  Chip,
  Stack,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FilterList,
  Download,
  PictureAsPdf,
  Search,
  Refresh,
} from "@mui/icons-material";
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

const RadioCommunicationReportPage = () => {
  const { showAlert } = useNotify();

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
  const [selectedLocoId, setSelectedLocoId] = useState<string>("ALL");
  const [selectedStationId, setSelectedStationId] = useState<string>("ALL");

  // --- Client Side Column Specific Multi-Select Dropdown Filters ---
  const [selectedActiveRadio, setSelectedActiveRadio] = useState<string[]>([]);
  const [selectedRadio1Health, setSelectedRadio1Health] = useState<string[]>(
    [],
  );
  const [selectedRadio2Health, setSelectedRadio2Health] = useState<string[]>(
    [],
  );
  const [selectedStationName, setSelectedStationName] = useState<string[]>([]);

  // --- Dynamic Dropdown Selection Lists States ---
  const [locoIdsList, setLocoIdsList] = useState<any[]>([]);
  const [stationsList, setStationsList] = useState<any[]>([]);

  // --- Data States ---
  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);

  // --- Table Pagination States ---
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);

  // --- Extract Unique Header Options for Client-Side Column Header Filtering ---
  const uniqueActiveRadios = Array.from(
    new Set(
      masterRows
        .map((row) => row.activeRadioNumber)
        .filter((v) => v !== undefined && v !== null),
    ),
  )
    .map(String)
    .sort();

  const uniqueRadio1Health = Array.from(
    new Set(
      masterRows
        .map((row) => row.radio1Health)
        .filter((v) => v !== undefined && v !== null),
    ),
  )
    .map(String)
    .sort();

  const uniqueRadio2Health = Array.from(
    new Set(
      masterRows
        .map((row) => row.radio2Health)
        .filter((v) => v !== undefined && v !== null),
    ),
  )
    .map(String)
    .sort();

  const uniqueStationNames = Array.from(
    new Set(masterRows.map((row) => row.stationName).filter(Boolean)),
  ).sort();

  // --- Fetch Meta Filter Data initially when component mounts ---
  useEffect(() => {
    const fetchFilterMetaData = async () => {
      try {
        const [locoRes, stationRes] = await Promise.all([
          axiosInstance
            .get("/api/eb-issue-report/unique_loco")
            .catch(() => ({ data: [] })),
          axiosInstance
            .get("/api/radio-communication/meta/stations")
            .catch(() => ({ data: [] })),
        ]);

        setLocoIdsList(locoRes.data?.data || locoRes.data || []);
        setStationsList(stationRes.data?.data || stationRes.data || []);
      } catch (err) {
        showAlert("Failed loading master filter options.", "error");
      }
    };
    fetchFilterMetaData();
  }, []);

  // --- Sync Table View whenever client-side column header selections change ---
  useEffect(() => {
    let result = [...masterRows];

    if (selectedActiveRadio.length > 0) {
      result = result.filter((row) =>
        selectedActiveRadio.includes(String(row.activeRadioNumber)),
      );
    }
    if (selectedRadio1Health.length > 0) {
      result = result.filter((row) =>
        selectedRadio1Health.includes(String(row.radio1Health)),
      );
    }
    if (selectedRadio2Health.length > 0) {
      result = result.filter((row) =>
        selectedRadio2Health.includes(String(row.radio2Health)),
      );
    }
    if (selectedStationName.length > 0) {
      result = result.filter((row) =>
        selectedStationName.includes(row.stationName),
      );
    }

    setFilteredRows(result);
  }, [
    selectedActiveRadio,
    selectedRadio1Health,
    selectedRadio2Health,
    selectedStationName,
    masterRows,
  ]);

  const clearData = () => {
    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    setSelectedLocoId("ALL");
    setSelectedStationId("ALL");
    setSelectedActiveRadio([]);
    setSelectedRadio1Health([]);
    setSelectedRadio2Health([]);
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

    const requestParams: any = {
      page: pageNo,
      size: rowsPerPage,
      fromDate: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined,
      toDate: toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined,
    };

    if (useServerFilters) {
      if (selectedLocoId !== "ALL") requestParams.locoId = selectedLocoId;
      if (selectedStationId !== "ALL")
        requestParams.stationId = selectedStationId;
    } else {
      setSelectedLocoId("ALL");
      setSelectedStationId("ALL");
    }

    // Reset column filter states on a completely new global request refresh
    setSelectedActiveRadio([]);
    setSelectedRadio1Health([]);
    setSelectedRadio2Health([]);
    setSelectedStationName([]);

    try {
      const response = await axiosInstance.get("/api/radio-communication", {
        params: requestParams,
      });

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
          "No communication packets found matching your criteria",
          "info",
        );
        return;
      }

      const hiddenColumns = ["id"];

      const columnKeys = Object.keys(data[0]).filter(
        (key) => !hiddenColumns.includes(key),
      );

      const dynamicColumns = columnKeys.map((key) => ({
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

      if (!useServerFilters) {
        setShowFilters(true);
      }
      setPage(pageNo);
    } catch (error: any) {
      showAlert(
        "An error occurred trying to query radio metrics from the server location.",
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
    XLSX.utils.book_append_sheet(wb, ws, "Radio Communication Logs");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `Radio_Communication_Report_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
  };

  const getSelectedValueForField = (field: string) => {
    if (field === "activeRadioNumber") return selectedActiveRadio;
    if (field === "radio1Health") return selectedRadio1Health;
    if (field === "radio2Health") return selectedRadio2Health;
    if (field === "stationName") return selectedStationName;
    return [];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Page Title Block --- */}
      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#1565C0", fontSize: "1.5rem" }}
        >
          Radio Communication Reports
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

      {/* --- Sub Report Filters (Loco ID and Station Basis) --- */}
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
                Communication Filter Configuration
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
              {/* 1. Loco ID Dropdown */}
              <Box sx={{ width: 220 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="loco-id-select-label">Loco ID</InputLabel>
                  <Select
                    labelId="loco-id-select-label"
                    value={selectedLocoId}
                    label="Loco ID"
                    onChange={(e) => setSelectedLocoId(e.target.value)}
                  >
                    <MenuItem value="ALL">All Locomotives</MenuItem>
                    {locoIdsList.map((loco, i) => {
                      const idVal = loco.locoId || loco.id || loco;
                      return (
                        <MenuItem key={idVal || i} value={idVal}>
                          {idVal}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              {/* 2. Station Dropdown */}
              <Box sx={{ width: 220 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="station-basis-select-label">
                    Station Basis
                  </InputLabel>
                  <Select
                    labelId="station-basis-select-label"
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
                  Telemetry & Communication Logs
                </Typography>
                <Chip
                  color="primary"
                  variant="filled"
                  size="small"
                  label={`Rows Found: ${filteredRows.length.toLocaleString()}`}
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                  onClick={exportToExcel}
                  sx={{ textTransform: "none", borderRadius: "6px" }}
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
              <div className="overflow-auto" style={{ maxHeight: "550px" }}>
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
                      <tr className="bg-blue-600 border text-white">
                        {columns.map((col) => {
                          const isFilterable =
                            col.field === "activeRadioNumber" ||
                            col.field === "radio1Health" ||
                            col.field === "radio2Health" ||
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
                                              if (
                                                col.field ===
                                                "activeRadioNumber"
                                              )
                                                setSelectedActiveRadio([]);
                                              else if (
                                                col.field === "radio1Health"
                                              )
                                                setSelectedRadio1Health([]);
                                              else if (
                                                col.field === "radio2Health"
                                              )
                                                setSelectedRadio2Health([]);
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

                                          {(col.field === "activeRadioNumber"
                                            ? uniqueActiveRadios
                                            : col.field === "radio1Health"
                                              ? uniqueRadio1Health
                                              : col.field === "radio2Health"
                                                ? uniqueRadio2Health
                                                : uniqueStationNames
                                          ).map((opt) => (
                                            <div
                                              key={opt}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const setter =
                                                  col.field ===
                                                  "activeRadioNumber"
                                                    ? setSelectedActiveRadio
                                                    : col.field ===
                                                        "radio1Health"
                                                      ? setSelectedRadio1Health
                                                      : col.field ===
                                                          "radio2Health"
                                                        ? setSelectedRadio2Health
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
                          className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
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
                              ) : col.field === "activeRadioNumber" ? (
                                <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200 text-xs">
                                  Radio {row[col.field]}
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
            No Radio Logs Rendered
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Select standard operation timelines and select <b>Apply</b>.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default RadioCommunicationReportPage;
