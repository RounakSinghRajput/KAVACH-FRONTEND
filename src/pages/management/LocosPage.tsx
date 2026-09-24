import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Collapse,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Loco, Zone, Division, LocoStatus } from '../../types';

const statusColors = {
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  INACTIVE: 'default',
} as const;

const statusOptions: LocoStatus[] = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'];

export const LocosPage: React.FC = () => {
  const [locos, setLocos] = useState<Loco[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterZoneId, setFilterZoneId] = useState('');
  const [filterDivisionId, setFilterDivisionId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedLoco, setSelectedLoco] = useState<Loco | null>(null);
  const [formData, setFormData] = useState<Partial<Loco>>({});

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [locoToDelete, setLocoToDelete] = useState<Loco | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filterZoneId) {
      setFilteredDivisions(divisions.filter(d => d.zone_id === filterZoneId));
    } else {
      setFilteredDivisions(divisions);
    }
  }, [filterZoneId, divisions]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locosData, zonesData, divisionsData] = await Promise.all([
        api.locos.getAll(),
        api.zones.getAll(),
        api.divisions.getAll(),
      ]);
      setLocos(locosData);
      setZones(zonesData);
      setDivisions(divisionsData);
      setFilteredDivisions(divisionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', loco?: Loco) => {
    setDialogMode(mode);
    setSelectedLoco(loco || null);
    setFormData(mode === 'add' ? { status: 'ACTIVE' } : loco || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLoco(null);
    setFormData({});
  };

  const handleSaveLoco = async () => {
    try {
      if (dialogMode === 'add') {
        await api.locos.create(formData);
        showSnackbar('Locomotive created successfully', 'success');
      } else if (dialogMode === 'edit' && selectedLoco) {
        await api.locos.update(selectedLoco.id, formData);
        showSnackbar('Locomotive updated successfully', 'success');
      }
      handleCloseDialog();
      loadInitialData();
    } catch (error) {
      console.error('Failed to save locomotive:', error);
      showSnackbar('Failed to save locomotive', 'error');
    }
  };

  const handleDeleteLoco = async () => {
    if (!locoToDelete) return;

    try {
      await api.locos.delete(locoToDelete.id);
      showSnackbar('Locomotive deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setLocoToDelete(null);
      loadInitialData();
    } catch (error) {
      console.error('Failed to delete locomotive:', error);
      showSnackbar('Failed to delete locomotive', 'error');
    }
  };

  const handleExportData = () => {
    const csv = [
      ['Loco Number', 'Division', 'Zone', 'Status', 'Created At'],
      ...filteredLocos.map(l => {
        const division = divisions.find(d => d.id === l.division_id);
        const zone = zones.find(z => z.id === division?.zone_id);
        return [
          l.loco_number,
          division?.name || '',
          zone?.name || '',
          l.status,
          format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
        ];
      }),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locomotives_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredLocos = locos.filter(loco => {
    const matchesSearch = loco.loco_number.toLowerCase().includes(searchTerm.toLowerCase());

    const division = divisions.find(d => d.id === loco.division_id);
    const matchesZone = !filterZoneId || division?.zone_id === filterZoneId;
    const matchesDivision = !filterDivisionId || loco.division_id === filterDivisionId;
    const matchesStatus = !filterStatus || loco.status === filterStatus;

    return matchesSearch && matchesZone && matchesDivision && matchesStatus;
  });

  const columns: GridColDef[] = [
    {
      field: 'loco_number',
      headerName: 'Loco Number',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'division_id',
      headerName: 'Division',
      width: 200,
      valueGetter: (params) => {
        const division = divisions.find(d => d.id === params);
        return division?.name || 'Unknown';
      },
    },
    {
      field: 'zone',
      headerName: 'Zone',
      width: 180,
      valueGetter: (_, row) => {
        const division = divisions.find(d => d.id === row.division_id);
        const zone = zones.find(z => z.id === division?.zone_id);
        return zone?.name || 'Unknown';
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value as keyof typeof statusColors]}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      width: 180,
      valueFormatter: (params) => format(new Date(params), 'yyyy-MM-dd HH:mm'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Tooltip title="View"><Eye size={18} color="#1976d2" /></Tooltip>}
          label="View"
          onClick={() => handleOpenDialog('view', params.row)}
          sx={{ color: '#1976d2' }}
        />,
        <GridActionsCellItem
          icon={<Tooltip title="Edit"><Pencil size={18} color="#f57c00" /></Tooltip>}
          label="Edit"
          onClick={() => handleOpenDialog('edit', params.row)}
          sx={{ color: '#f57c00' }}
        />,
        <GridActionsCellItem
          icon={<Tooltip title="Delete"><Trash2 size={18} color="#d32f2f" /></Tooltip>}
          label="Delete"
          onClick={() => {
            setLocoToDelete(params.row);
            setDeleteConfirmOpen(true);
          }}
          sx={{ color: '#d32f2f' }}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          LOCO Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={loadInitialData}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleExportData}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Locomotive
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: showFilters ? 2 : 0 }}>
          <TextField
            placeholder="Search by loco number..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search size={18} style={{ marginRight: 8, color: '#999' }} />,
            }}
            sx={{ flex: 1 }}
          />
          <Button
            variant={showFilters ? 'contained' : 'outlined'}
            startIcon={<Filter size={18} />}
            endIcon={showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>
        </Box>

        <Collapse in={showFilters}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Zone"
                size="small"
                value={filterZoneId}
                onChange={(e) => {
                  setFilterZoneId(e.target.value);
                  setFilterDivisionId('');
                }}
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
                value={filterDivisionId}
                onChange={(e) => setFilterDivisionId(e.target.value)}
                disabled={!filterZoneId}
              >
                <MenuItem value="">All Divisions</MenuItem>
                {filteredDivisions.map((division) => (
                  <MenuItem key={division.id} value={division.id}>
                    {division.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                size="small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilterZoneId('');
                    setFilterDivisionId('');
                    setFilterStatus('');
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredLocos}
          columns={columns}
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
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Locomotive' : dialogMode === 'edit' ? 'Edit Locomotive' : 'Locomotive Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Loco Number"
                value={formData.loco_number || ''}
                onChange={(e) => setFormData({ ...formData, loco_number: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Division"
                value={formData.division_id || ''}
                onChange={(e) => setFormData({ ...formData, division_id: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              >
                {divisions.map((division) => (
                  <MenuItem key={division.id} value={division.id}>
                    {division.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LocoStatus })}
                disabled={dialogMode === 'view'}
                required
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleSaveLoco}>
              {dialogMode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete locomotive "{locoToDelete?.loco_number}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteLoco}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
