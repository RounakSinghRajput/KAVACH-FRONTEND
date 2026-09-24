import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  Checkbox,
  Tabs,
  Tab,
  TablePagination,
} from "@mui/material";
import {
  FilterList,
  Download,
  PictureAsPdf,
  Refresh,
  Assessment,
  Equalizer,
  PieChart as PieIcon,
  DirectionsRailway,
  Speed,
  Percent,
  Build,
  Today,
  DateRange,
  TableChart,
} from "@mui/icons-material";

import { AltRoute, CalendarToday, AccessTime, East } from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";
import { useNotify } from "../../context/notification-context";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const LocoRunningReportDetailsPage = () => {
  const { showAlert } = useNotify();

  // --- Active Tab State (0: Loco Details, 1: Month Availability, 2: Section Availability) ---
  const [activeTab, setActiveTab] = useState(0);

  // --- UI Layout States ---
  const [loading, setLoading] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  // --- Shared Filter Logic States ---
  const [locoIdInput, setLocoIdInput] = useState<string>("37146");
  const [locoIdsList, setLocoIdsList] = useState<any[]>([]);

  // --- Date Filters ---
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs);
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  // --- Tab 1 Response States ---
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);

  // --- Tab 2 Response States (Month Availability) ---
  const [monthAvailabilityLoading, setMonthAvailabilityLoading] =
    useState(false);
  const [monthAvailabilityData, setMonthAvailabilityData] = useState<any[]>([]);

  // --- Tab 3 Response States (Section Availability) ---
  const [sectionAvailabilityLoading, setSectionAvailabilityLoading] =
    useState(false);
  const [sectionAvailabilityData, setSectionAvailabilityData] = useState<any[]>(
    [],
  );
  const [sectionPage, setSectionPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const uniqueModes = Array.from(
    new Set(masterRows.map((row) => row.mode).filter(Boolean)),
  ).sort();

  useEffect(() => {
    let result = [...masterRows];
    if (selectedModes.length > 0) {
      result = result.filter((row) => selectedModes.includes(row.mode));
    }
    setFilteredRows(result);
  }, [selectedModes, masterRows]);

  const clearData = () => {
    setSummaryData(null);
    setBarChartData([]);
    setPieChartData([]);
    setMasterRows([]);
    setFilteredRows([]);
    setColumns([]);
    setSelectedModes([]);
    setMonthAvailabilityData([]);
    setSectionAvailabilityData([]);
  };

  const fetchLocos = async () => {
    try {
      const res = await axiosInstance.get("/api/eb-issue-report/unique_loco");
      setLocoIdsList(res.data?.data || res.data || []);
    } catch {
      showAlert("Unable to load loco list.", "error");
    }
  };

  useEffect(() => {
    if (activeTab !== 0) {
      fetchLocos();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 0 && selectedDate) {
      setLocoIdInput("");
      fetchLocosByDate(selectedDate);
    }
  }, [selectedDate, activeTab]);
  const fetchLocosByDate = async (date: Dayjs | null) => {
    if (!date) return;

    try {
      const formattedDate = dayjs(date).format("DD-MM-YYYY");

      const res = await axiosInstance.get(
        "/api/loco-running-report/loco-dropdown",
        {
          params: {
            fromDate: formattedDate,
            toDate: formattedDate,
          },
        },
      );

      setLocoIdsList(res.data?.data || res.data || []);
    } catch {
      showAlert("Unable to load loco list.", "error");
    }
  };

  // --- Tab 1 Fetch: Loco Running Details ---
  const fetchLocoRunningDetails = async () => {
    if (!locoIdInput.trim()) {
      showAlert("Please insert a valid Locomotive ID.", "warning");
      return;
    }

    setLoading(true);
    const queryDate = selectedDate
      ? dayjs(selectedDate).format("DD-MM-YYYY")
      : dayjs().format("DD-MM-YYYY");

    try {
      const response = await axiosInstance.get(
        "/api/loco-running-report/details",
        {
          params: {
            locoId: locoIdInput.trim(),
            date: queryDate,
          },
        },
      );

      const payload = response.data || {};
      setSummaryData(payload.summary || null);
      setBarChartData(payload.barChart || []);
      setPieChartData(payload.pieChart || []);

      const rawTableData = payload.table || [];
      if (!rawTableData.length) {
        setMasterRows([]);
        setFilteredRows([]);
        showAlert("No metrics logs found matching your criteria.", "info");
      } else {
        const columnKeys = [
          "srNo",
          "date",
          "locoNo",
          "mode",
          "runningKm",
          "percentage",
        ];
        setColumns(
          columnKeys.map((key) => ({
            field: key,
            headerName: formatHeader(key),
          })),
        );

        const rowsWithId = rawTableData.map((row: any, index: number) => ({
          id: index + 1,
          ...row,
        }));

        setMasterRows(rowsWithId);
        setFilteredRows(rowsWithId);
      }
    } catch (error: any) {
      showAlert("An error occurred trying to parse data.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Tab 2 Fetch: Month Availability Report ---
  const fetchMonthAvailabilityReport = async () => {
    if (!locoIdInput.trim()) {
      showAlert("Please insert a valid Locomotive ID.", "warning");
      return;
    }
    if (!fromDate || !toDate) {
      showAlert("Please select both From Date and To Date.", "warning");
      return;
    }

    setMonthAvailabilityLoading(true);
    try {
      const formattedFrom = fromDate.format("DD-MM-YYYY");
      const formattedTo = toDate.format("DD-MM-YYYY");

      const res = await axiosInstance.get(`/api/month-availability-report`, {
        params: {
          locoId: locoIdInput.trim(),
          fromDate: formattedFrom,
          toDate: formattedTo,
        },
      });
      setMonthAvailabilityData(res.data?.rows || res.data || []);
    } catch (error) {
      showAlert("Failed to load Month Availability Report.", "error");
    } finally {
      setMonthAvailabilityLoading(false);
    }
  };

  // --- Tab 3 Fetch: Availability Section Report ---
  const fetchSectionAvailabilityReport = async (
    page = 0,
    size = rowsPerPage,
  ) => {
    const formattedDate = selectedDate!.format("DD-MM-YYYY");

    const res = await axiosInstance.get("/api/availability-section-report/", {
      params: {
        fromDate: formattedDate,
        toDate: formattedDate,
        page,
        size,
      },
    });

    setSectionAvailabilityData(res.data.content);
    setTotalElements(res.data.totalElements);
    setTotalPages(res.data.totalPages);
  };

  // --- Unified Search Handler ---
  const handleFetchData = () => {
    if (activeTab === 0) {
      fetchLocoRunningDetails();
    } else if (activeTab === 1) {
      fetchMonthAvailabilityReport();
    } else if (activeTab === 2) {
      setSectionPage(1);
      fetchSectionAvailabilityReport(0);
    }
  };

  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert("No logs compiled to execute an Excel output.", "warning");
      return;
    }
    const reportData = filteredRows.map(({ id, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_json(ws, reportData, { origin: "A1" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loco Running Logs");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `Loco_Running_Report_${locoIdInput}_${dayjs().format("YYYYMMDD")}.xlsx`,
    );
  };

  const getModeColor = (mode: string) => {
    if (mode === "FS") return { bg: "bg-blue-600", hex: "#1565C0" };
    if (mode === "STAFF_RESPONSIBLE_MODE")
      return { bg: "bg-amber-500", hex: "#f59e0b" };
    if (mode === "TOTAL") return { bg: "bg-emerald-600", hex: "#059669" };
    return { bg: "bg-slate-500", hex: "#64748b" };
  };

  const getFsPercentage = () => {
    const fsEntry = pieChartData.find((item) => item.mode === "FS");
    return fsEntry ? `${fsEntry.percentage}%` : "N/A";
  };

  const getStaffModePercentage = () => {
    const staffEntry = pieChartData.find(
      (item) => item.mode === "STAFF_RESPONSIBLE_MODE",
    );
    return staffEntry ? `${staffEntry.percentage}%` : "N/A";
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* --- Page Header --- */}
      <Box sx={{ mb: 1.5, textAlign: "left" }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: "#1565C0", fontSize: "1.5rem" }}
        >
          Locomotive Running Diagnostics & Analytics
        </Typography>
      </Box>

      <Box sx={{ width: "100%", height: "2.5px", bgcolor: "#1565C0", mb: 2 }} />

      {/* --- Center Tab Navigation Bar --- */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          centered
          sx={{
            bgcolor: "#f1f5f9",
            p: 0.75,
            borderRadius: "14px",
            position: "relative",
            border: "1px solid #e2e8f0",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.92rem",
              borderRadius: "10px",
              minHeight: 44,
              px: 3,
              color: "#64748b",
              transition: "all 0.2s ease-in-out",
              zIndex: 1,
              "&:hover": {
                color: "#1e293b",
                bgcolor: "rgba(255, 255, 255, 0.4)",
              },
            },
            "& .Mui-selected": {
              bgcolor: "#ffffff",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
              color: "#0284c7 !important", // Sky blue primary text
              fontWeight: 700,
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              bgcolor: "#0284c7", // Matching accent underline bar
              bottom: 6,
            },
          }}
        >
          <Tab
            icon={<Assessment sx={{ fontSize: 19 }} />}
            iconPosition="start"
            label="Loco Running Analytics"
          />
          <Tab
            icon={<DateRange sx={{ fontSize: 19 }} />}
            iconPosition="start"
            label="Month Availability Report"
          />
          <Tab
            icon={<TableChart sx={{ fontSize: 19 }} />}
            iconPosition="start"
            label="Availability Section Report"
          />
        </Tabs>
      </Box>

      {/* --- Dynamic Filters Bar --- */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            // alignItems: "",
            // justifyContent: "center",
            flexWrap: "wrap",
            mb: 4,
            p: 2,
            bgcolor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          {activeTab === 0 && (
            <Box sx={{ width: 200 }}>
              <DatePicker
                label="Report Date"
                value={selectedDate}
                onChange={setSelectedDate}
                format="DD-MM-YYYY"
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Box>
          )}
          {/* Loco ID Filter (Present in ALL 3 Tabs) */}
          {activeTab !== 2 && (
            <Box sx={{ width: 220 }}>
              <Autocomplete
                size="small"
                options={locoIdsList}
                getOptionLabel={(option) =>
                  typeof option === "string"
                    ? option
                    : option.locoId || option.id || ""
                }
                value={
                  locoIdsList.find(
                    (item) =>
                      (typeof item === "string"
                        ? item
                        : item.locoId || item.id) === locoIdInput,
                  ) || null
                }
                onChange={(event, value) => {
                  setLocoIdInput(
                    value
                      ? typeof value === "string"
                        ? value
                        : value.locoId || value.id
                      : "",
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Loco ID"
                    placeholder="Search Loco..."
                  />
                )}
              />
            </Box>
          )}

          {/* TAB 1 FILTERS: Report Date */}

          {/* TAB 2 & TAB 3 FILTERS: From Date + To Date */}
          {activeTab === 1 && (
            <>
              <Box sx={{ width: 200 }}>
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={setFromDate}
                  format="DD-MM-YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Box>

              <Box sx={{ width: 200 }}>
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={setToDate}
                  format="DD-MM-YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Box>
            </>
          )}

          {activeTab === 2 && (
            <Box sx={{ width: 200 }}>
              <DatePicker
                label="Trip Date"
                value={selectedDate}
                onChange={setSelectedDate}
                format="DD-MM-YYYY"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          )}

          {/* Apply & Refresh Action Buttons */}
          <Button
            variant="contained"
            onClick={handleFetchData}
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

          <Tooltip title="Reset View" arrow>
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

      {/* ==================== TAB 1: LOCO RUNNING ANALYTICS ==================== */}
      {activeTab === 0 && (
        <Box>
          {summaryData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Column 1: Operational Mode Bar Chart */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={2}
                    >
                      <Equalizer color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Operational Mode
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barChartData}
                          margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="label"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            unit="%"
                          />
                          <ChartTooltip
                            formatter={(value: number | undefined) => [
                              `${value ?? 0}%`,
                              "Percentage",
                            ]}
                          />
                          <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                          >
                            {barChartData.map((entry, index) => {
                              const colorMap = getModeColor(entry.label);
                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={colorMap.hex}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Column 2: Share Breakdown Donut Chart */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={2}
                    >
                      <PieIcon color="secondary" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Share Breakdown
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />

                    <Box
                      sx={{
                        width: "100%",
                        height: 280,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <ResponsiveContainer width="100%" height="70%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="percentage"
                            nameKey="mode"
                          >
                            {pieChartData.map((entry, index) => {
                              const colorMap = getModeColor(entry.mode);
                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={colorMap.hex}
                                />
                              );
                            })}
                          </Pie>
                          <ChartTooltip
                            formatter={(value: number | undefined) => [
                              `${value ?? 0}%`,
                              "Percentage",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={2}
                        sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}
                      >
                        {pieChartData.map((entry, index) => {
                          const colorMap = getModeColor(entry.mode);
                          return (
                            <Stack
                              key={index}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  bgcolor: colorMap.hex,
                                }}
                              />
                              <Typography
                                variant="caption"
                                fontWeight="600"
                                color="textSecondary"
                              >
                                {entry.mode} ({entry.percentage}%)
                              </Typography>
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Column 3: Detailed Statistics Panel */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Card
                  sx={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={2}
                    >
                      <Assessment color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>
                        Detailed Statistics
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.2,
                          bgcolor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: "4px solid #1565C0",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DirectionsRailway
                            sx={{ fontSize: 18, color: "#1565C0" }}
                          />
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            Loco Number
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          color="#1565C0"
                        >
                          {summaryData.locoId}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.2,
                          bgcolor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: "4px solid #2e7d32",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Speed sx={{ fontSize: 18, color: "#2e7d32" }} />
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            Total Running KM
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          color="#2e7d32"
                        >
                          {summaryData.totalRunningKm} KM
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.2,
                          bgcolor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: "4px solid #0284c7",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Percent sx={{ fontSize: 18, color: "#0284c7" }} />
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            FS Percentage
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          color="#0284c7"
                        >
                          {getFsPercentage()}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.2,
                          bgcolor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: "4px solid #f59e0b",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Build sx={{ fontSize: 18, color: "#f59e0b" }} />
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            Staff Mode
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          color="#f59e0b"
                        >
                          {getStaffModePercentage()}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.2,
                          bgcolor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: "4px solid #ed6c02",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Percent sx={{ fontSize: 18, color: "#ed6c02" }} />
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            FS + OS Percentage
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          color="#ed6c02"
                        >
                          {summaryData.totalFsOsPercentage}%
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.2,
                          bgcolor: "#f8fafc",
                          borderRadius: "8px",
                          borderLeft: "4px solid #64748b",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Today sx={{ fontSize: 18, color: "#64748b" }} />
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            fontWeight={600}
                          >
                            Report Date
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body1"
                          fontWeight={800}
                          color="#475569"
                        >
                          {summaryData.date}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

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
                      Detailed Operational Mode Table
                    </Typography>
                    <Chip
                      color="primary"
                      variant="filled"
                      size="small"
                      label={`Records: ${filteredRows.length}`}
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
                      <div className="flex h-[300px] items-center justify-center">
                        <ContentLoading />
                      </div>
                    ) : (
                      <table className="border-collapse w-full">
                        <thead className="sticky top-0 z-20">
                          <tr className="bg-blue-600 border text-white">
                            {columns.map((col) => {
                              const isFilterable = col.field === "mode";

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
                                                  setSelectedModes([]);
                                                  setActiveHeaderDropdown(null);
                                                }}
                                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedModes.length === 0 ? "bg-blue-100 font-bold text-blue-700" : ""}`}
                                              >
                                                All Modes
                                              </div>

                                              {uniqueModes.map((opt) => (
                                                <div
                                                  key={opt}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedModes((prev) =>
                                                      prev.includes(opt)
                                                        ? prev.filter(
                                                            (v) => v !== opt,
                                                          )
                                                        : [...prev, opt],
                                                    );
                                                  }}
                                                  className={`px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-blue-50 ${selectedModes.includes(opt) ? "bg-blue-100 font-bold text-blue-700" : ""}`}
                                                >
                                                  <Checkbox
                                                    size="small"
                                                    checked={selectedModes.includes(
                                                      opt,
                                                    )}
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
                                  {col.field === "mode" ? (
                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                                      {row[col.field]}
                                    </span>
                                  ) : col.field === "percentage" ? (
                                    <span className="font-bold text-emerald-700">
                                      {row[col.field]}%
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

                  <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                    <div className="text-sm font-medium text-gray-700 tracking-wide">
                      Showing 1–{filteredRows.length} of{" "}
                      <span className="font-bold text-blue-600">
                        {filteredRows.length}
                      </span>{" "}
                      records
                    </div>
                  </div>
                </Paper>
              </CardContent>
            </Card>
          ) : (
            <Paper
              sx={{
                minHeight: 350,
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
                <Assessment sx={{ fontSize: 40, color: "#1565C0" }} />
              </Box>
              <Typography
                variant="h6"
                fontWeight={700}
                color="#334155"
                gutterBottom
              >
                No Loco Selected
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                textAlign="center"
              >
                Select a Loco ID and Report Date, then click <b>Apply</b>.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* ==================== TAB 2: MONTH AVAILABILITY REPORT ==================== */}
      {activeTab === 1 && (
        <Card
          sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <DateRange color="primary" />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: "#1f2937" }}
              >
                Month Availability Report
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Paper
              sx={{
                width: "100%",
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            >
              <div className="overflow-auto" style={{ maxHeight: "500px" }}>
                {monthAvailabilityLoading ? (
                  <div className="flex h-[250px] items-center justify-center">
                    <ContentLoading />
                  </div>
                ) : monthAvailabilityData.length > 0 ? (
                  <table className="border-collapse w-full">
                    <thead className="sticky top-0 z-10 bg-blue-700 text-white">
                      <tr>
                        {Object.keys(monthAvailabilityData[0]).map((key) => (
                          <th
                            key={key}
                            className="border border-slate-700 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider"
                          >
                            {formatHeader(key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthAvailabilityData.map((row, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          {Object.keys(row).map((key) => (
                            <td
                              key={key}
                              className="border border-gray-200 px-4 py-2 text-sm text-gray-800"
                            >
                              {row[key]?.toString() ?? "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Box sx={{ p: 5, textAlign: "center", color: "#64748b" }}>
                    No Month Availability Report logs loaded. Please select a{" "}
                    <b>Loco ID</b>, <b>From Date</b>, and <b>To Date</b>, then
                    click <b>Apply</b>.
                  </Box>
                )}
              </div>
            </Paper>
          </CardContent>
        </Card>
      )}

      {/* ==================== TAB 3: AVAILABILITY SECTION REPORT ==================== */}
      {activeTab === 2 && (
        <Card
          sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <CardContent>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TableChart color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Availability Section Report
                </Typography>

                <Chip
                  label={`Records : ${sectionAvailabilityData.length}`}
                  color="primary"
                  size="small"
                />
              </Stack>

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  const ws = XLSX.utils.json_to_sheet(sectionAvailabilityData);

                  const wb = XLSX.utils.book_new();

                  XLSX.utils.book_append_sheet(wb, ws, "Availability Report");

                  const excelBuffer = XLSX.write(wb, {
                    bookType: "xlsx",
                    type: "array",
                  });

                  const blob = new Blob([excelBuffer], {
                    type: "application/octet-stream",
                  });

                  saveAs(
                    blob,
                    `Availability_Section_Report_${dayjs().format("YYYYMMDD")}.xlsx`,
                  );
                }}
              >
                Excel
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Paper
              sx={{
                overflow: "hidden",
                borderRadius: "10px",
                border: "1px solid #dbe2ea",
              }}
            >
              <div className="overflow-auto" style={{ maxHeight: "600px" }}>
                {sectionAvailabilityLoading ? (
                  <div className="flex h-[250px] items-center justify-center">
                    <ContentLoading />
                  </div>
                ) : (
                  <table className="border-collapse w-full">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-blue-700 text-white">
                        {[
                          "srNo",
                          "tripDate",
                          "endTime",
                          "locoId",
                          "direction",
                          "fromStation",
                          "toStation",
                          "tripDistance",
                          "totalRunHours",
                          "availability",
                          "rfidTagsMissed",
                          "lsModeEvents",
                          "tripModeEvents",
                          "srModeEvents",
                          "socEvents",
                          "undesirableBraking",
                          "incorrectTlmCount",
                          "foreignTagDetection",
                        ].map((col) => (
                          <th
                            className="border border-blue-800 px-3 py-3 text-left whitespace-nowrap text-xs font-bold uppercase"
                            style={
                              col === "tripDate" ? { minWidth: "180px" } : {}
                            }
                          >
                            {formatHeader(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {sectionAvailabilityData.length === 0 ? (
                        <tr>
                          <td colSpan={18} className="text-center py-10">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        sectionAvailabilityData.map(
                          (row: any, index: number) => (
                            <tr
                              key={index}
                              className={`${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } hover:bg-blue-50`}
                            >
                              <td className="border px-3 py-2">{row.srNo}</td>

                              <td
                                className="border px-3 py-2 whitespace-nowrap"
                                style={{ minWidth: "180px" }}
                              >
                                {row.tripDate}
                              </td>

                              <td className="border px-3 py-2">
                                {row.endTime}
                              </td>

                              <td className="border px-3 py-2 font-bold text-blue-700">
                                {row.locoId}
                              </td>

                              <td className="border px-3 py-2">
                                {row.direction}
                              </td>

                              <td className="border px-3 py-2">
                                {row.fromStation}
                              </td>

                              <td className="border px-3 py-2">
                                {row.toStation}
                              </td>

                              <td className="border px-3 py-2 text-right">
                                {row.tripDistance}
                              </td>

                              <td className="border px-3 py-2 text-right">
                                {row.totalRunHours}
                              </td>

                              <td className="border px-3 py-2">
                                <Chip
                                  label={`${row.availability}%`}
                                  size="small"
                                  color={
                                    row.availability >= 90
                                      ? "success"
                                      : row.availability >= 70
                                        ? "warning"
                                        : "error"
                                  }
                                />
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.rfidTagsMissed}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.lsModeEvents}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.tripModeEvents}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.srModeEvents}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.socEvents}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.undesirableBraking}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.incorrectTlmCount}
                              </td>

                              <td className="border px-3 py-2 text-center">
                                {row.foreignTagDetection}
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
              >
                <Typography variant="body2">
                  Showing{" "}
                  {totalElements === 0
                    ? 0
                    : (sectionPage - 1) * rowsPerPage + 1}
                  -{Math.min(sectionPage * rowsPerPage, totalElements)}
                  of {totalElements}
                </Typography>

                <TablePagination
                  component="div"
                  count={totalElements}
                  page={sectionPage - 1}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[20, 50, 100]}
                  showFirstButton
                  showLastButton
                  onPageChange={(event, newPage) => {
                    setSectionPage(newPage + 1);
                    fetchSectionAvailabilityReport(newPage, rowsPerPage);
                  }}
                  onRowsPerPageChange={(event) => {
                    const newSize = parseInt(event.target.value, 10);

                    setRowsPerPage(newSize);
                    setSectionPage(1);

                    fetchSectionAvailabilityReport(0, newSize);
                  }}
                  sx={{
                    borderTop: "1px solid #e0e0e0",
                    ".MuiTablePagination-toolbar": {
                      minHeight: 56,
                    },
                    ".MuiTablePagination-selectLabel": {
                      fontWeight: 500,
                    },
                    ".MuiTablePagination-displayedRows": {
                      fontWeight: 500,
                    },
                  }}
                />
              </Box>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LocoRunningReportDetailsPage;
