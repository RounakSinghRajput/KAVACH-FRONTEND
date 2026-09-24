import React, { useState, useEffect, useMemo } from "react";
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
} from "@mui/material";
import { FilterList, Download, Search, Refresh } from "@mui/icons-material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
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

/**
 * The movement API sends stationId as "12000" while mstStation returns both
 * `id` (master PK) and `kavachSubSystemId`. Flip this key if the backend
 * expects a different one.
 */
const STATION_ID_KEY = "kavachSubSystemId";
const getStationId = (station: any) =>
  station?.[STATION_ID_KEY] ?? station?.id ?? "";

// Big master lists — cap how many options the dropdown renders per keystroke.
const autoFilter = createFilterOptions<any>({ limit: 200 });

const LocoMovementReport = () => {
  const { showAlert } = useNotify();

  // --- UI Layout States ---
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // --- Filter Logic States (Server API Side) ---
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
const [fromDate, setFromDate] = useState<Dayjs | null>(
  dayjs().subtract(1, "hour"),
);
  const [selectedLocoId, setSelectedLocoId] = useState<string>("");
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<any | null>(null);

  // Typed text kept separately so a free-typed value survives blur.
  const [locoInput, setLocoInput] = useState("");
  const [divisionInput, setDivisionInput] = useState("");
  const [stationInput, setStationInput] = useState("");

  // --- Client Side Column Specific Text Filters ---
  const [selectedMode, setSelectedMode] = useState<string[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string[]>([]);
  const [selectedStationName, setSelectedStationName] = useState<string[]>([]);

  // --- Dynamic Dropdown Selection Lists States ---
  const [locoIdsList, setLocoIdsList] = useState<any[]>([]);
  const [divisionsList, setDivisionsList] = useState<any[]>([]);
  const [stationsList, setStationsList] = useState<any[]>([]);

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

  // --- Fetch Meta Filter Data (Loco IDs, Divisions, Stations) on mount ---
  useEffect(() => {
    const fetchFilterMetaData = async () => {
      try {
        const [locoRes, divisionRes, stationRes] = await Promise.all([
          axiosInstance
            .get("/api/eb-issue-report/unique_loco")
            .catch(() => ({ data: [] })),
          axiosInstance.get("/division/").catch(() => ({ data: [] })),
          axiosInstance.get("/mstStation/").catch(() => ({ data: [] })),
        ]);

        setLocoIdsList(locoRes.data?.data || locoRes.data || []);
        setDivisionsList(divisionRes.data?.data || divisionRes.data || []);
        setStationsList(stationRes.data?.data || stationRes.data || []);
      } catch (err) {
        showAlert("Failed loading master filter options.", "error");
      }
    };
    fetchFilterMetaData();
  }, []);

  // --- Stations narrow down to the chosen division ---
  const stationOptions = useMemo(() => {
    if (!selectedDivision) return stationsList;
    return stationsList.filter(
      (st) =>
        (st?.division?.name || "").toLowerCase() ===
        selectedDivision.toLowerCase(),
    );
  }, [stationsList, selectedDivision]);

  // --- Sync Table View whenever client-side column header selections change ---
  useEffect(() => {
    let result = [...masterRows];

    if (selectedMode.length > 0) {
      result = result.filter((row) => selectedMode.includes(row.mode));
    }
    if (selectedDirection.length > 0) {
      result = result.filter((row) => selectedDirection.includes(row.direction));
    }
    if (selectedStationName.length > 0) {
      result = result.filter((row) =>
        selectedStationName.includes(row.stationName),
      );
    }

    setFilteredRows(result);
  }, [selectedMode, selectedDirection, selectedStationName, masterRows]);

  const resetServerFilters = () => {
    setSelectedLocoId("");
    setSelectedDivision("");
    setSelectedStation(null);
    setLocoInput("");
    setDivisionInput("");
    setStationInput("");
  };

  const clearData = () => {
    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    resetServerFilters();
    setSelectedMode([]);
    setSelectedDirection([]);
    setSelectedStationName([]);
    setShowFilters(false);
    setPage(0);
    setTotalRecords(0);
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
      const locoValue = (selectedLocoId || locoInput).trim();
      const divisionValue = (selectedDivision || divisionInput).trim();
      const stationValue = selectedStation
        ? getStationId(selectedStation)
        : stationInput.trim();

      if (locoValue) requestParams.locoId = locoValue;
      if (divisionValue) requestParams.division = divisionValue;
      if (stationValue) requestParams.stationId = stationValue;
    } else {
      resetServerFilters();
    }

    // Reset column filters when fetching fresh global criteria
    setSelectedMode([]);
    setSelectedDirection([]);
    setSelectedStationName([]);

    try {
      const response = await axiosInstance.get("/api/loco-movement", {
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
        rawContent = rawContent.content; // Maps to your "content" array field
      }

      const data = Array.isArray(rawContent) ? rawContent : [];

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        setTotalRecords(0);
        showAlert("No movement data found matching your current filters", "info");
        if (!useServerFilters) setShowFilters(true);
        return;
      }

      // Hide internal structural identifiers if desired
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
        "An error occurred trying to query movement records from the server.",
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
    XLSX.utils.book_append_sheet(wb, ws, "Movement Logs");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `Loco_Movement_Report_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
  };

  const getSelectedValueForField = (field: string) => {
    if (field === "mode") return selectedMode;
    if (field === "direction") return selectedDirection;
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
          Loco Movement Report(NMS)
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

      {/* --- Sub Report Filters (Loco ID / Division / Station) --- */}
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
                Movement Filter Panel
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
              {/* Loco ID — pick from the list or type any number */}
              <Box sx={{ width: 220 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={locoIdsList}
                  filterOptions={autoFilter}
                  getOptionLabel={(option: any) =>
                    typeof option === "string"
                      ? option
                      : String(option?.locoId ?? option?.id ?? "")
                  }
                  inputValue={locoInput}
                  onInputChange={(e, val) => setLocoInput(val)}
                  onChange={(event, newValue: any) => {
                    const val =
                      typeof newValue === "string"
                        ? newValue
                        : String(newValue?.locoId ?? newValue?.id ?? "");
                    setSelectedLocoId(val);
                    setLocoInput(val);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Loco ID"
                      placeholder="Search or type Loco ID"
                    />
                  )}
                />
              </Box>

              {/* Division — pick from master or type a name */}
              <Box sx={{ width: 220 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={divisionsList}
                  filterOptions={autoFilter}
                  getOptionLabel={(option: any) =>
                    typeof option === "string" ? option : option?.name ?? ""
                  }
                  renderOption={(props, option: any) => (
                    <li {...props} key={option.id}>
                      {option.name}
                      {option.code ? (
                        <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                          ({option.code})
                        </span>
                      ) : null}
                    </li>
                  )}
                  inputValue={divisionInput}
                  onInputChange={(e, val) => setDivisionInput(val)}
                  onChange={(event, newValue: any) => {
                    const name =
                      typeof newValue === "string"
                        ? newValue
                        : (newValue?.name ?? "");
                    setSelectedDivision(name);
                    setDivisionInput(name);
                    // Station belongs to a division, so drop a stale pick.
                    setSelectedStation(null);
                    setStationInput("");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Division"
                      placeholder="Search or type division"
                    />
                  )}
                />
              </Box>

              {/* Station — list narrows to the chosen division */}
              <Box sx={{ width: 260 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={stationOptions}
                  filterOptions={autoFilter}
                  getOptionLabel={(option: any) =>
                    typeof option === "string"
                      ? option
                      : option?.name
                        ? `${option.name}${option.code ? ` (${option.code})` : ""}`
                        : ""
                  }
                  renderOption={(props, option: any) => (
                    <li {...props} key={option.id}>
                      {option.name}
                      {option.code ? (
                        <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                          ({option.code})
                        </span>
                      ) : null}
                    </li>
                  )}
                  isOptionEqualToValue={(option: any, value: any) =>
                    option?.id === value?.id
                  }
                  value={selectedStation}
                  inputValue={stationInput}
                  onInputChange={(e, val) => setStationInput(val)}
                  onChange={(event, newValue: any) => {
                    if (typeof newValue === "string" || !newValue) {
                      setSelectedStation(null);
                      return;
                    }
                    setSelectedStation(newValue);
                    // Keep division in sync when a station is picked directly.
                    if (!selectedDivision && newValue?.division?.name) {
                      setSelectedDivision(newValue.division.name);
                      setDivisionInput(newValue.division.name);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Station"
                      placeholder={
                        selectedDivision
                          ? `Stations in ${selectedDivision}`
                          : "Search or type station"
                      }
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

              {(selectedLocoId || selectedDivision || selectedStation) && (
                <Button
                  variant="text"
                  onClick={resetServerFilters}
                  sx={{ textTransform: "none", color: "#64748b" }}
                >
                  Clear filters
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* --- Table Grid Output Display --- */}
      {loading || masterRows.length > 0 ? (
        <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
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
                  Movement Logs Records
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
                                            Filter By {col.headerName}
                                          </div>

                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (col.field === "mode")
                                                setSelectedMode([]);
                                              else if (col.field === "direction")
                                                setSelectedDirection([]);
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
                          className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.field}
                              className="border border-gray-200 px-4 py-2.5 text-sm whitespace-nowrap text-gray-800"
                            >
                              {col.field === "date" ? (
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
                  <span className="font-bold text-blue-600">{totalRecords}</span>
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
                    onClick={() => handleFetchData(page - 1, pageSize, showFilters)}
                    disabled={page === 0}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => handleFetchData(page + 1, pageSize, showFilters)}
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
          <Typography variant="h6" fontWeight={700} color="#334155" gutterBottom>
            No Movement Logs Rendered
          </Typography>
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Select standard operation timelines and select <b>Apply</b>.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default LocoMovementReport;
