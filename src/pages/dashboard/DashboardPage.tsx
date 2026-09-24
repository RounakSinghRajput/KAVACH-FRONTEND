import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  useTheme,
  Autocomplete,
  TextField,
  Chip,
  alpha,
  Drawer,
  IconButton,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Search,
  SlidersHorizontal,
  Save,
  BookmarkPlus,
  Star,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import {
  setSelectedZone,
  setSelectedDivision,
  loadZones,
  loadDivisions,
} from "../../store/slices/appSlice";
import { api } from "../../services/api";
import type { DashboardStats, Division } from "../../types";
import { EChart } from "../../components/charts/EChart";

interface StatCardProps {
  title: string;
  value: number | string;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, gradient }) => (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      borderRadius: 3,
      background: gradient,
      position: "relative",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "radial-gradient(circle at top right, rgba(255,255,255,0.15) 0%, transparent 60%)",
        opacity: 0,
        transition: "opacity 0.4s",
      },
      "&:hover": {
        transform: "translateY(-8px) scale(1.02)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
        "&::before": {
          opacity: 1,
        },
      },
    }}
  >
    <CardContent
      sx={{ p: 3, position: "relative", zIndex: 1, "&:last-child": { pb: 3 } }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "rgba(255, 255, 255, 0.9)",
          fontWeight: 600,
          fontSize: "0.95rem",
          mb: 1.5,
          lineHeight: 1.4,
          letterSpacing: "0.3px",
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="h3"
        sx={{
          color: "white",
          fontWeight: 800,
          fontSize: "2.5rem",
          lineHeight: 1.1,
          letterSpacing: "-0.5px",
          textShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const COLORS = [
  "#1565C0",
  "#F57C00",
  "#388E3C",
  "#D32F2F",
  "#00838F",
  "#0288D1",
];
const CHART_COLORS = {
  primary: "#1565C0",
  secondary: "#F57C00",
  success: "#388E3C",
  error: "#D32F2F",
  warning: "#F57C00",
  info: "#0288D1",
};

export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { zones, divisions, selectedZone, selectedDivision } = useAppSelector(
    (state) => state.app
  );
  const [stats, setStats] = useState<DashboardStats>({
    totalFailures: 0,
    openFracas: 0,
    criticalAlarms: 0,
    communicationFailures: 0,
    mttr: 0,
    mtbf: 0,
  });
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetMenuAnchor, setPresetMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState<
    Array<{ id: string; name: string; filters: any }>
  >([]);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    severity: "",
    searchText: "",
    assetType: "",
    failureType: "",
    station: "",
    assetId: "",
    reportType: "",
    priority: "",
  });

  const assetTypes = ["RFID Tags", "Towers", "Trackside", "Onboard"];
  const failureTypes = ["Hardware", "Software", "Communication", "Power"];
  const severityLevels = ["Critical", "High", "Medium", "Low"];
  const statusOptions = ["Open", "In Progress", "Closed", "Resolved"];
  const reportTypes = ["Incident", "Failure", "Maintenance", "Inspection"];
  const priorityLevels = ["P1", "P2", "P3", "P4"];

  const advancedFilterCount = [
    filters.assetType,
    filters.failureType,
    filters.station,
    filters.assetId,
    filters.reportType,
    filters.priority,
  ].filter(Boolean).length;

  const getActiveFilters = () => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    if (selectedZone) {
      const zone = zones.find((z) => z.id === selectedZone);
      if (zone) active.push({ key: "zone", label: "Zone", value: zone.name });
    }
    if (selectedDivision) {
      const division = filteredDivisions.find((d) => d.id === selectedDivision);
      if (division)
        active.push({
          key: "division",
          label: "Division",
          value: division.name,
        });
    }
    if (filters.fromDate)
      active.push({ key: "fromDate", label: "From", value: filters.fromDate });
    if (filters.toDate)
      active.push({ key: "toDate", label: "To", value: filters.toDate });
    if (filters.status)
      active.push({ key: "status", label: "Status", value: filters.status });
    if (filters.severity)
      active.push({
        key: "severity",
        label: "Severity",
        value: filters.severity,
      });
    if (filters.searchText)
      active.push({
        key: "searchText",
        label: "Search",
        value: filters.searchText,
      });
    if (filters.assetType)
      active.push({
        key: "assetType",
        label: "Asset Type",
        value: filters.assetType,
      });
    if (filters.failureType)
      active.push({
        key: "failureType",
        label: "Failure Type",
        value: filters.failureType,
      });
    if (filters.station)
      active.push({ key: "station", label: "Station", value: filters.station });
    if (filters.assetId)
      active.push({
        key: "assetId",
        label: "Asset ID",
        value: filters.assetId,
      });
    if (filters.reportType)
      active.push({
        key: "reportType",
        label: "Report Type",
        value: filters.reportType,
      });
    if (filters.priority)
      active.push({
        key: "priority",
        label: "Priority",
        value: filters.priority,
      });

    return active;
  };

  const removeFilter = (key: string) => {
    if (key === "zone") {
      dispatch(setSelectedZone(null));
    } else if (key === "division") {
      dispatch(setSelectedDivision(null));
    } else {
      setFilters({ ...filters, [key]: "" });
    }
  };

  const loadPreset = (preset: any) => {
    setFilters({ ...filters, ...preset.filters });
    setPresetMenuAnchor(null);
  };

  const loadPresets = async () => {
    try {
      const data = await api.filterPresets.getAll();
      setSavedPresets(data);
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  };

  const saveCurrentPreset = async () => {
    if (!presetName.trim()) return;

    try {
      const newPreset = await api.filterPresets.create({
        name: presetName,
        filters: { ...filters },
      });

      setSavedPresets([...savedPresets, newPreset]);
      setSaveDialogOpen(false);
      setPresetName("");
    } catch (error) {
      console.error("Failed to save preset:", error);
    }
  };

  useEffect(() => {
    dispatch(loadZones());
    dispatch(loadDivisions());
    loadPresets();
  }, [dispatch]);

  useEffect(() => {
    if (selectedZone) {
      const filtered = divisions.filter((d) => d.zone_id === selectedZone);
      setFilteredDivisions(filtered);
      if (
        selectedDivision &&
        !filtered.find((d) => d.id === selectedDivision)
      ) {
        dispatch(setSelectedDivision(null));
      }
    } else {
      setFilteredDivisions([]);
    }
  }, [selectedZone, divisions, selectedDivision, dispatch]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.dashboard.getStats({
          zoneId: selectedZone || undefined,
          divisionId: selectedDivision || undefined,
        });
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats:", error);
      }
    };

    loadStats();
  }, [selectedZone, selectedDivision]);

  const failuresByZone = [
    { name: "Central", failures: 45, target: 50 },
    { name: "Western", failures: 32, target: 40 },
    { name: "Northern", failures: 28, target: 35 },
    { name: "Southern", failures: 19, target: 30 },
    { name: "Eastern", failures: 15, target: 25 },
  ];

  const failuresByAssetType = [
    { name: "RFID Tags", value: 35, percentage: 35 },
    { name: "Towers", value: 28, percentage: 28 },
    { name: "Trackside", value: 22, percentage: 22 },
    { name: "Onboard", value: 15, percentage: 15 },
  ];

  const trendData = [
    { month: "Jan", alarms: 120, resolved: 95 },
    { month: "Feb", alarms: 98, resolved: 88 },
    { month: "Mar", alarms: 145, resolved: 130 },
    { month: "Apr", alarms: 87, resolved: 82 },
    { month: "May", alarms: 110, resolved: 105 },
    { month: "Jun", alarms: 95, resolved: 90 },
  ];

  const fracasStatus = [
    { name: "Open", value: 45, color: CHART_COLORS.error },
    { name: "In Progress", value: 32, color: CHART_COLORS.warning },
    { name: "Closed", value: 89, color: CHART_COLORS.success },
  ];

  const canSelectZone =
    user && ["SUPER_ADMIN", "RAILWAY_BOARD", "RDSO"].includes(user.role);
  const canSelectDivision =
    user &&
    ["SUPER_ADMIN", "RAILWAY_BOARD", "RDSO", "ZONE_USER"].includes(user.role);

  const trendChartOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e0e0",
      borderWidth: 1,
      textStyle: { color: "#333" },
      axisPointer: { type: "cross" },
    },
    legend: {
      data: ["Alarms", "Resolved"],
      bottom: 0,
      textStyle: { color: theme.palette.text.primary },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: trendData.map((d) => d.month),
      axisLine: { lineStyle: { color: "#666" } },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#666" } },
      splitLine: { lineStyle: { color: "#e0e0e0", type: "dashed" } },
    },
    series: [
      {
        name: "Alarms",
        type: "line",
        smooth: true,
        data: trendData.map((d) => d.alarms),
        itemStyle: { color: CHART_COLORS.error },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS.error}cc` },
              { offset: 1, color: `${CHART_COLORS.error}00` },
            ],
          },
        },
        lineStyle: { width: 3 },
      },
      {
        name: "Resolved",
        type: "line",
        smooth: true,
        data: trendData.map((d) => d.resolved),
        itemStyle: { color: CHART_COLORS.success },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS.success}cc` },
              { offset: 1, color: `${CHART_COLORS.success}00` },
            ],
          },
        },
        lineStyle: { width: 3 },
      },
    ],
  };

  const pieChartOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e0e0",
      borderWidth: 1,
      textStyle: { color: "#333" },
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      textStyle: { color: theme.palette.text.primary },
    },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["40%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: theme.palette.background.paper,
          borderWidth: 3,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: "bold",
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        data: fracasStatus.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  const zoneBarChartOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e0e0",
      borderWidth: 1,
      textStyle: { color: "#333" },
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Failures", "Target"],
      bottom: 0,
      textStyle: { color: theme.palette.text.primary },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: failuresByZone.map((d) => d.name),
      axisLine: { lineStyle: { color: "#666" } },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#666" } },
      splitLine: { lineStyle: { color: "#e0e0e0", type: "dashed" } },
    },
    series: [
      {
        name: "Failures",
        type: "bar",
        data: failuresByZone.map((d) => d.failures),
        itemStyle: {
          color: CHART_COLORS.primary,
          borderRadius: [8, 8, 0, 0],
        },
        barMaxWidth: 50,
      },
      {
        name: "Target",
        type: "bar",
        data: failuresByZone.map((d) => d.target),
        itemStyle: {
          color: CHART_COLORS.secondary,
          borderRadius: [8, 8, 0, 0],
        },
        barMaxWidth: 50,
      },
    ],
  };

  const assetBarChartOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e0e0e0",
      borderWidth: 1,
      textStyle: { color: "#333" },
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#666" } },
      splitLine: { lineStyle: { color: "#e0e0e0", type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: failuresByAssetType.map((d) => d.name),
      axisLine: { lineStyle: { color: "#666" } },
    },
    series: [
      {
        type: "bar",
        data: failuresByAssetType.map((d, index) => ({
          value: d.value,
          itemStyle: {
            color: COLORS[index % COLORS.length],
            borderRadius: [0, 8, 8, 0],
          },
        })),
        barMaxWidth: 35,
      },
    ],
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        pb: 4,
      }}
    >
      <Box
        sx={{
          mb: { xs: 3, sm: 4, md: 5 },
          display: "flex",
          flexDirection: "column",
          gap: 3,
          pb: { xs: 2, sm: 3 },
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              mb: 0.5,
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" },
              background: "linear-gradient(135deg, #1565C0 0%, #0288D1 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard Overview
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.875rem", sm: "0.9375rem" },
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            Real-time monitoring and analytics for railway safety systems
          </Typography>
        </Box>

        {getActiveFilters().length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: alpha("#1565C0", 0.02),
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
                sx={{ mr: 1 }}
              >
                Active Filters:
              </Typography>
              {getActiveFilters().map((filter) => (
                <Chip
                  key={filter.key}
                  label={`${filter.label}: ${filter.value}`}
                  onDelete={() => removeFilter(filter.key)}
                  size="small"
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 600,
                    "& .MuiChip-deleteIcon": {
                      color: "rgba(255, 255, 255, 0.7)",
                      "&:hover": {
                        color: "white",
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.secondary"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.75rem",
              }}
            >
              Filter Dashboard Data
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                startIcon={<Star size={16} />}
                onClick={(e) => setPresetMenuAnchor(e.currentTarget)}
                sx={{ fontWeight: 600, textTransform: "none" }}
              >
                Saved Views
              </Button>
              <Button
                size="small"
                startIcon={<BookmarkPlus size={16} />}
                onClick={() => setSaveDialogOpen(true)}
                disabled={getActiveFilters().length === 0}
                sx={{ fontWeight: 600, textTransform: "none" }}
              >
                Save Current
              </Button>
            </Box>
          </Box>
          <Grid container spacing={2} alignItems="center">
            {canSelectZone && (
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  options={zones}
                  getOptionLabel={(option) => option.name}
                  value={zones.find((z) => z.id === selectedZone) || null}
                  onChange={(_, newValue) =>
                    dispatch(setSelectedZone(newValue?.id || null))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Zone"
                      placeholder="Select zone"
                    />
                  )}
                />
              </Grid>
            )}

            {canSelectDivision && (
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  options={filteredDivisions}
                  getOptionLabel={(option) => option.name}
                  value={
                    filteredDivisions.find((d) => d.id === selectedDivision) ||
                    null
                  }
                  onChange={(_, newValue) =>
                    dispatch(setSelectedDivision(newValue?.id || null))
                  }
                  disabled={!selectedZone}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Division"
                      placeholder="Select division"
                    />
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                size="small"
                options={statusOptions}
                value={filters.status || null}
                onChange={(_, newValue) =>
                  setFilters({ ...filters, status: newValue || "" })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Status"
                    placeholder="Select status"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                size="small"
                options={severityLevels}
                value={filters.severity || null}
                onChange={(_, newValue) =>
                  setFilters({ ...filters, severity: newValue || "" })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Severity Level"
                    placeholder="Select severity"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Text"
                placeholder="Asset ID, Station..."
                value={filters.searchText}
                onChange={(e) =>
                  setFilters({ ...filters, searchText: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <Search
                      size={18}
                      style={{ marginRight: 8, color: "#666" }}
                    />
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SlidersHorizontal size={18} />}
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    fontWeight: 600,
                    borderColor:
                      advancedFilterCount > 0 ? "primary.main" : "divider",
                    color:
                      advancedFilterCount > 0
                        ? "primary.main"
                        : "text.secondary",
                    bgcolor:
                      advancedFilterCount > 0
                        ? alpha("#1565C0", 0.08)
                        : "transparent",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: alpha("#1565C0", 0.12),
                    },
                  }}
                >
                  Advanced{" "}
                  {advancedFilterCount > 0 && `(${advancedFilterCount})`}
                </Button>

                {(selectedZone ||
                  selectedDivision ||
                  Object.values(filters).some((v) => v !== "")) && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      dispatch(setSelectedZone(null));
                      dispatch(setSelectedDivision(null));
                      setFilters({
                        fromDate: "",
                        toDate: "",
                        status: "",
                        severity: "",
                        searchText: "",
                        assetType: "",
                        failureType: "",
                        station: "",
                        assetId: "",
                        reportType: "",
                        priority: "",
                      });
                    }}
                    sx={{
                      minWidth: "auto",
                      px: 2,
                    }}
                  >
                    <X size={18} />
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="Total Failures"
              value={stats.totalFailures}
              gradient="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="Open Reports"
              value={stats.openFracas}
              gradient="linear-gradient(135deg, #EF5350 0%, #D32F2F 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="Critical Alarms"
              value={stats.criticalAlarms}
              gradient="linear-gradient(135deg, #E91E63 0%, #C2185B 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="Communication Status"
              value="98.5%"
              gradient="linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="MTTR (hours)"
              value={stats.mttr.toFixed(1)}
              gradient="linear-gradient(135deg, #42A5F5 0%, #1565C0 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="MTBF (hours)"
              value={stats.mtbf.toFixed(1)}
              gradient="linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="Active Assets"
              value="1,247"
              gradient="linear-gradient(135deg, #26C6DA 0%, #00838F 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="System Uptime"
              value="99.9%"
              gradient="linear-gradient(135deg, #29B6F6 0%, #0288D1 100%)"
            />
          </Grid>

          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5 },
                height: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#ffffff",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 0.5, fontSize: "1.125rem" }}
                >
                  Failure Trends & Resolution Rate
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                >
                  Monthly comparison of alarms vs resolved cases
                </Typography>
              </Box>
              <EChart
                option={trendChartOption}
                style={{ height: "340px", width: "100%" }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5 },
                height: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#ffffff",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 0.5, fontSize: "1.125rem" }}
                >
                  Report Status
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                >
                  Distribution of report states
                </Typography>
              </Box>
              <EChart
                option={pieChartOption}
                style={{ height: "340px", width: "100%" }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#ffffff",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 0.5, fontSize: "1.125rem" }}
                >
                  Failures by Zone
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                >
                  Zone-wise failure count vs target threshold
                </Typography>
              </Box>
              <EChart
                option={zoneBarChartOption}
                style={{ height: "340px", width: "100%" }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "#ffffff",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                },
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ mb: 0.5, fontSize: "1.125rem" }}
                >
                  Failures by Asset Type
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", lineHeight: 1.5 }}
                >
                  Distribution across different asset categories
                </Typography>
              </Box>
              <EChart
                option={assetBarChartOption}
                style={{ height: "340px", width: "100%" }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 400 },
            p: 3,
          },
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha("#1565C0", 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
              }}
            >
              <SlidersHorizontal size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Advanced Filters
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fine-tune your search criteria
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}
            >
              Location
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Station Name"
              value={filters.station}
              onChange={(e) =>
                setFilters({ ...filters, station: e.target.value })
              }
              placeholder="Enter station name"
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}
            >
              Category
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Autocomplete
                size="small"
                options={assetTypes}
                value={filters.assetType || null}
                onChange={(_, newValue) => {
                  setFilters({
                    ...filters,
                    assetType: newValue || "",
                    failureType: "",
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Asset Type"
                    placeholder="Select type"
                  />
                )}
              />
              {filters.assetType && (
                <Autocomplete
                  size="small"
                  options={failureTypes}
                  value={filters.failureType || null}
                  onChange={(_, newValue) =>
                    setFilters({ ...filters, failureType: newValue || "" })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Failure Type"
                      placeholder="Select type"
                    />
                  )}
                />
              )}
            </Box>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}
            >
              Source System
            </Typography>
            <Autocomplete
              size="small"
              options={reportTypes}
              value={filters.reportType || null}
              onChange={(_, newValue) =>
                setFilters({ ...filters, reportType: newValue || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Source Report Type"
                  placeholder="Select type"
                />
              )}
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, fontWeight: 700, color: "text.primary" }}
            >
              Custom Attributes
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Asset ID"
                value={filters.assetId}
                onChange={(e) =>
                  setFilters({ ...filters, assetId: e.target.value })
                }
                placeholder="Enter asset ID"
              />
              {filters.status !== "Closed" && (
                <Autocomplete
                  size="small"
                  options={priorityLevels}
                  value={filters.priority || null}
                  onChange={(_, newValue) =>
                    setFilters({ ...filters, priority: newValue || "" })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Priority Level"
                      placeholder="Select priority"
                    />
                  )}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 2,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setFilters({
                ...filters,
                assetType: "",
                failureType: "",
                station: "",
                assetId: "",
                reportType: "",
                priority: "",
              });
            }}
          >
            Reset Filters
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setDrawerOpen(false)}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      <Menu
        anchorEl={presetMenuAnchor}
        open={Boolean(presetMenuAnchor)}
        onClose={() => setPresetMenuAnchor(null)}
        PaperProps={{
          sx: { minWidth: 240 },
        }}
      >
        <MenuItem disabled>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Saved Views
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {savedPresets.map((preset) => (
          <MenuItem key={preset.id} onClick={() => loadPreset(preset)}>
            <ListItemIcon>
              <Star size={18} />
            </ListItemIcon>
            <ListItemText primary={preset.name} />
          </MenuItem>
        ))}
      </Menu>

      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha("#1565C0", 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "primary.main",
              }}
            >
              <BookmarkPlus size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Save Filter Preset
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Save your current filters for quick access
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Preset Name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="e.g., High Priority Issues"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveCurrentPreset}
            disabled={!presetName.trim()}
          >
            Save Preset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
