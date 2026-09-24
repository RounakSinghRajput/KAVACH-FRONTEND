import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Collapse,
  Chip,
  Alert,
  Snackbar,
  Menu,
  ListItemText,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Bookmark,
  TrendingUp,
  BarChart3,
  AlertCircle,
  ArrowLeft,
  Eye,
  Activity,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { api } from '../../services/api';
import type { FracasRecord, NMSLog, Zone, Division } from '../../types';

interface ReportFilters {
  zoneId?: string;
  divisionId?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '24px' }}>
    {value === index && children}
  </div>
);

type ReportType = 'fracas' | 'nms' | 'zone_performance' | 'asset_health';

export const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBasicFilters, setShowBasicFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [fracasRecords, setFracasRecords] = useState<FracasRecord[]>([]);
  const [nmsLogs, setNmsLogs] = useState<NMSLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterPresets, setFilterPresets] = useState<any[]>([]);

  const [liveStats, setLiveStats] = useState({
    openIncidents: 0,
    criticalAlerts: 0,
    healthyAssets: 0,
    mttr: 0,
    fracasOpen: 0,
    fracasOverdue: 0,
    nmsCritical: 0,
    nmsCommLoss: 0,
    worstZone: '',
    mtbfChange: 0,
    assetsAtRisk: 0,
    healthPercentage: 0,
  });

  useEffect(() => {
    loadInitialData();
    loadLiveStats();
  }, []);

  useEffect(() => {
    if (filters.zoneId) {
      setFilteredDivisions(divisions.filter(d => d.zone_id === filters.zoneId));
    } else {
      setFilteredDivisions(divisions);
    }
  }, [filters.zoneId, divisions]);

  const loadInitialData = async () => {
    try {
      const [zonesData, divisionsData, presetsData] = await Promise.all([
        api.zones.getAll(),
        api.divisions.getAll(),
        api.filterPresets.getAll(),
      ]);

      setZones(zonesData);
      setDivisions(divisionsData);
      setFilteredDivisions(divisionsData);
      setFilterPresets(presetsData || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showSnackbar('Failed to load initial data', 'error');
    }
  };

  const loadLiveStats = async () => {
    try {
      const [fracasData, nmsData] = await Promise.all([
        api.fracas.getAll({}),
        api.nmsLogs.getAll({}),
      ]);

      const openFracas = fracasData.filter(f => f.status === 'open' || f.status === 'in_progress').length;
      const overdueFracas = fracasData.filter(f => {
        if (f.target_close_date && f.status !== 'closed') {
          return new Date(f.target_close_date) < new Date();
        }
        return false;
      }).length;

      const criticalNms = nmsData.filter(n => n.severity === 'critical' &&
        new Date(n.timestamp) > subDays(new Date(), 1)).length;
      const commLossNms = nmsData.filter(n => n.log_type === 'comm_loss').length;

      setLiveStats({
        openIncidents: openFracas,
        criticalAlerts: criticalNms,
        healthyAssets: 156,
        mttr: 4.2,
        fracasOpen: openFracas,
        fracasOverdue: overdueFracas,
        nmsCritical: criticalNms,
        nmsCommLoss: commLossNms,
        worstZone: 'CR',
        mtbfChange: -12,
        assetsAtRisk: 18,
        healthPercentage: 98,
      });
    } catch (error) {
      console.error('Failed to load live stats:', error);
    }
  };

  const loadReportData = async (appliedFilters: ReportFilters) => {
    setLoading(true);
    try {
      const [fracasData, nmsData] = await Promise.all([
        api.fracas.getAll({
          zoneId: appliedFilters.zoneId,
          divisionId: appliedFilters.divisionId,
          status: appliedFilters.status,
          severity: appliedFilters.severity,
        }),
        api.nmsLogs.getAll({
          zoneId: appliedFilters.zoneId,
          divisionId: appliedFilters.divisionId,
          severity: appliedFilters.severity,
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
        }),
      ]);

      setFracasRecords(fracasData);
      setNmsLogs(nmsData);
    } catch (error) {
      console.error('Failed to load report data:', error);
      showSnackbar('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportType: ReportType, prefilter?: Partial<ReportFilters>) => {
    setSelectedReport(reportType);
    const appliedFilters = prefilter ? { ...filters, ...prefilter } : filters;
    if (prefilter) {
      setFilters(appliedFilters);
    }
    loadReportData(appliedFilters);
  };

  const handleKpiClick = (kpiType: string) => {
    if (kpiType === 'open_incidents') {
      handleViewReport('fracas', { status: 'open' });
    } else if (kpiType === 'critical_alerts') {
      handleViewReport('nms', {
        severity: 'critical',
        startDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  };

  const handleBackToOverview = () => {
    setSelectedReport(null);
    setShowAdvancedFilters(false);
    setShowBasicFilters(false);
  };

  const handleApplyFilters = () => {
    loadReportData(filters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    };
    setFilters(defaultFilters);
    loadReportData(defaultFilters);
  };

  const handleSaveFilterPreset = async () => {
    const name = prompt('Enter preset name:');
    if (name) {
      try {
        await api.filterPresets.create({ name, filters });
        const presetsData = await api.filterPresets.getAll();
        setFilterPresets(presetsData || []);
        showSnackbar('Filter preset saved', 'success');
      } catch (error) {
        showSnackbar('Failed to save filter preset', 'error');
      }
    }
  };

  const handleLoadFilterPreset = (preset: any) => {
    setFilters(preset.filters);
    setMenuAnchor(null);
    loadReportData(preset.filters);
  };

  const handleExportCSV = (data: any[], filename: string, headers: string[]) => {
    const csv = [
      headers,
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/ /g, '_');
        const value = row[key];
        if (value instanceof Date) return format(value, 'yyyy-MM-dd HH:mm');
        return value || '';
      })),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const fracasColumns: GridColDef[] = [
    {
      field: 'fracas_number',
      headerName: 'FRACAS No.',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => {
        const colors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
          CRITICAL: 'error',
          HIGH: 'warning',
          MEDIUM: 'info',
          LOW: 'default',
        };
        return (
          <Chip
            label={params.value}
            color={colors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const colors: Record<string, 'success' | 'warning' | 'default'> = {
          CLOSED: 'success',
          IN_PROGRESS: 'warning',
          OPEN: 'default',
        };
        return (
          <Chip
            label={params.value}
            color={colors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'failure_description',
      headerName: 'Description',
      flex: 2,
      minWidth: 250,
    },
    {
      field: 'reported_at',
      headerName: 'Reported At',
      width: 180,
      valueFormatter: (params) => params ? format(new Date(params), 'yyyy-MM-dd HH:mm') : '',
    },
    {
      field: 'resolved_at',
      headerName: 'Resolved At',
      width: 180,
      valueFormatter: (params) => params ? format(new Date(params), 'yyyy-MM-dd HH:mm') : 'Pending',
    },
  ];

  const nmsColumns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueFormatter: (params) => format(new Date(params), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => {
        const colors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
          EMERGENCY: 'error',
          CRITICAL: 'error',
          WARNING: 'warning',
          INFO: 'info',
        };
        return (
          <Chip
            label={params.value}
            color={colors[params.value] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 150,
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      minWidth: 300,
    },
  ];

  const reportCards = [
    {
      id: 'fracas' as ReportType,
      title: 'FRACAS Reports',
      description: 'Comprehensive failure analysis and corrective action system reports',
      icon: <TrendingUp size={32} />,
      color: '#1976d2',
      bgGradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      group: 'operations',
      buttonText: 'Analyze',
      stats: [
        { label: 'Open', value: liveStats.fracasOpen, color: '#d32f2f' },
        { label: 'Overdue', value: liveStats.fracasOverdue, color: '#ff9800' },
      ],
    },
    {
      id: 'nms' as ReportType,
      title: 'NMS Logs & Alerts',
      description: 'Network management system logs, critical events and alarm history',
      icon: <AlertCircle size={32} />,
      color: '#d32f2f',
      bgGradient: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
      group: 'operations',
      buttonText: 'View Logs',
      stats: [
        { label: 'Critical (24h)', value: liveStats.nmsCritical, color: '#d32f2f' },
        { label: 'Comm Loss', value: liveStats.nmsCommLoss, color: '#ff9800' },
      ],
    },
    {
      id: 'zone_performance' as ReportType,
      title: 'Zone Performance',
      description: 'Performance metrics, trends and analysis across all zones',
      icon: <BarChart3 size={32} />,
      color: '#388e3c',
      group: 'performance',
      buttonText: 'Open Dashboard',
      stats: [
        { label: `Worst Zone: ${liveStats.worstZone}`, value: '', color: '#d32f2f' },
        { label: `MTBF ↓ ${Math.abs(liveStats.mtbfChange)}%`, value: '', color: '#ff9800' },
      ],
      bgGradient: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
    },
    {
      id: 'asset_health' as ReportType,
      title: 'Asset Health',
      description: 'Current health status and maintenance predictions for all assets',
      icon: <Activity size={32} />,
      color: '#f57c00',
      bgGradient: 'linear-gradient(135deg, #f57c00 0%, #ef6c00 100%)',
      group: 'performance',
      buttonText: 'View Details',
      stats: [
        { label: 'At Risk', value: liveStats.assetsAtRisk, color: '#d32f2f' },
        { label: `${liveStats.healthPercentage}% Healthy`, value: '', color: '#4caf50' },
      ],
    },
  ];

  if (!selectedReport) {
    const filteredCards = reportCards.filter((card) =>
      card.title.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(reportSearchTerm.toLowerCase())
    );

    const operationsCards = filteredCards.filter(c => c.group === 'operations');
    const performanceCards = filteredCards.filter(c => c.group === 'performance');

    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              color: '#d84315',
              mb: 3,
            }}
          >
            Reports & Analytics
          </Typography>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Zone"
                  value={filters.zoneId || ''}
                  onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                >
                  <MenuItem value="">All Zones</MenuItem>
                  {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      {zone.code} - {zone.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Division"
                  value={filters.divisionId || ''}
                  onChange={(e) => setFilters({ ...filters, divisionId: e.target.value })}
                  disabled={!filters.zoneId && filteredDivisions.length === 0}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                >
                  <MenuItem value="">All Divisions</MenuItem>
                  {filteredDivisions.map((division) => (
                    <MenuItem key={division.id} value={division.id}>
                      {division.code} - {division.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                onClick={() => handleKpiClick('open_incidents')}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '2px solid #d32f2f20',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    border: '2px solid #d32f2f40',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  🔴 Open Incidents
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#d32f2f">
                  {liveStats.openIncidents}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                  {liveStats.openIncidents > 0 && '↑ 2 from yesterday • '}View details
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                onClick={() => handleKpiClick('critical_alerts')}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '2px solid #ff980020',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    border: '2px solid #ff980040',
                  },
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  🟠 Critical Alerts
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#ff9800">
                  {liveStats.criticalAlerts}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Last 24 hours • View details
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', border: '2px solid #4caf5020' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  🟢 Healthy Assets
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#4caf50">
                  {liveStats.healthyAssets}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {liveStats.healthPercentage}% operational
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', border: '2px solid #1976d220' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ⏱ MTTR (hrs)
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#1976d2">
                  {liveStats.mttr}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                  ↓ 8% • Last 30 days
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search reports..."
              size="small"
              value={reportSearchTerm}
              onChange={(e) => setReportSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search size={20} style={{ marginRight: 8, color: '#999' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            />
          </Paper>

          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d32f2f' }} />
              <Typography variant="caption" color="text.secondary">
                Critical
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff9800' }} />
              <Typography variant="caption" color="text.secondary">
                Warning
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50' }} />
              <Typography variant="caption" color="text.secondary">
                Normal
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2, color: 'text.primary' }}
          >
            Operations
          </Typography>
          <Grid container spacing={3}>
            {operationsCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#d84315',
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {card.title}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {card.stats?.map((stat, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: stat.color,
                        }}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {stat.value ? `${stat.value} ${stat.label}` : stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    flexGrow: 1,
                    lineHeight: 1.6,
                  }}
                >
                  {card.description}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleViewReport(card.id)}
                  sx={{
                    bgcolor: '#1976d2',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: '#1565c0',
                    },
                  }}
                >
                  {card.buttonText}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ mb: 2, color: 'text.primary' }}
          >
            Performance
          </Typography>
          <Grid container spacing={3}>
            {performanceCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#d84315',
                    fontWeight: 600,
                    mb: 2,
                  }}
                >
                  {card.title}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {card.stats?.map((stat, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: stat.color,
                        }}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {stat.value ? `${stat.value} ${stat.label}` : stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    flexGrow: 1,
                    lineHeight: 1.6,
                  }}
                >
                  {card.description}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleViewReport(card.id)}
                  sx={{
                    bgcolor: '#1976d2',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: '#1565c0',
                    },
                  }}
                >
                  {card.buttonText}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
        </Box>
      </Box>
    );
  }

  const currentReport = reportCards.find(r => r.id === selectedReport);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={18} />}
            onClick={handleBackToOverview}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {currentReport?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentReport?.description}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={() => loadReportData(filters)}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={() => {
              if (selectedReport === 'fracas' || (selectedReport === 'nms' && tabValue === 0)) {
                handleExportCSV(fracasRecords, 'fracas_report', ['FRACAS No.', 'Severity', 'Status', 'Description', 'Reported At']);
              } else {
                handleExportCSV(nmsLogs, 'nms_logs_report', ['Timestamp', 'Severity', 'Source', 'Message']);
              }
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: showBasicFilters || showAdvancedFilters ? 2 : 0 }}>
          <TextField
            placeholder="Search..."
            size="small"
            value={filters.searchTerm || ''}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            InputProps={{
              startAdornment: <Search size={18} style={{ marginRight: 8, color: '#999' }} />,
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant={showBasicFilters ? 'contained' : 'outlined'}
            startIcon={<Filter size={18} />}
            onClick={() => {
              setShowBasicFilters(!showBasicFilters);
              setShowAdvancedFilters(false);
            }}
          >
            Basic Filter
          </Button>
          <Button
            variant={showAdvancedFilters ? 'contained' : 'outlined'}
            startIcon={<Filter size={18} />}
            endIcon={showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            onClick={() => {
              setShowAdvancedFilters(!showAdvancedFilters);
              setShowBasicFilters(false);
            }}
          >
            Advanced Filter
          </Button>
          <Button
            variant="outlined"
            startIcon={<Bookmark size={18} />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            Presets
          </Button>
        </Box>

        <Collapse in={showBasicFilters}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Severity"
                size="small"
                value={filters.severity || ''}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="INFO">Info</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                size="small"
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button variant="contained" onClick={handleApplyFilters}>
                  Apply
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>

        <Collapse in={showAdvancedFilters}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Zone"
                size="small"
                value={filters.zoneId || ''}
                onChange={(e) => setFilters({ ...filters, zoneId: e.target.value, divisionId: '' })}
              >
                <MenuItem value="">All Zones</MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Division"
                size="small"
                value={filters.divisionId || ''}
                onChange={(e) => setFilters({ ...filters, divisionId: e.target.value })}
                disabled={!filters.zoneId}
              >
                <MenuItem value="">All Divisions</MenuItem>
                {filteredDivisions.map((division) => (
                  <MenuItem key={division.id} value={division.id}>
                    {division.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Severity"
                size="small"
                value={filters.severity || ''}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<Bookmark size={18} />}
                  onClick={handleSaveFilterPreset}
                >
                  Save Preset
                </Button>
                <Button variant="outlined" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button variant="contained" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      {(selectedReport === 'fracas' || selectedReport === 'nms') && (
        <Paper>
          {selectedReport === 'nms' && (
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                px: 2,
              }}
            >
              <Tab label={`FRACAS Records (${fracasRecords.length})`} />
              <Tab label={`NMS Logs (${nmsLogs.length})`} />
            </Tabs>
          )}

          {selectedReport === 'fracas' && (
            <Box sx={{ height: 600, p: 2 }}>
              <DataGrid
                rows={fracasRecords}
                columns={fracasColumns}
                loading={loading}
                pageSizeOptions={[25, 50, 100]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell:focus': {
                    outline: 'none',
                  },
                }}
              />
            </Box>
          )}

          {selectedReport === 'nms' && (
            <>
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ height: 500, px: 2, pb: 2 }}>
                  <DataGrid
                    rows={fracasRecords}
                    columns={fracasColumns}
                    loading={loading}
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                    }}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box sx={{ height: 500, px: 2, pb: 2 }}>
                  <DataGrid
                    rows={nmsLogs}
                    columns={nmsColumns}
                    loading={loading}
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    sx={{
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                    }}
                  />
                </Box>
              </TabPanel>
            </>
          )}
        </Paper>
      )}

      {(selectedReport === 'zone_performance' || selectedReport === 'asset_health') && (
        <Paper sx={{ p: 4, textAlign: 'center', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This report type will be available in a future update
            </Typography>
          </Box>
        </Paper>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {filterPresets.length === 0 ? (
          <MenuItem disabled>No saved presets</MenuItem>
        ) : (
          filterPresets.map((preset) => (
            <MenuItem key={preset.id} onClick={() => handleLoadFilterPreset(preset)}>
              <ListItemText>{preset.name}</ListItemText>
            </MenuItem>
          ))
        )}
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
