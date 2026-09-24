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
import type { Division, Zone } from '../../types';

export const DivisionsPage: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZoneId, setFilterZoneId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [formData, setFormData] = useState<Partial<Division>>({});

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState<Division | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [divisionsData, zonesData] = await Promise.all([
        api.divisions.getAll(),
        api.zones.getAll(),
      ]);
      setDivisions(divisionsData);
      setZones(zonesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', division?: Division) => {
    setDialogMode(mode);
    setSelectedDivision(division || null);
    setFormData(mode === 'add' ? {} : division || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDivision(null);
    setFormData({});
  };

  const handleSaveDivision = async () => {
    try {
      if (dialogMode === 'add') {
        await api.divisions.create(formData);
        showSnackbar('Division created successfully', 'success');
      } else if (dialogMode === 'edit' && selectedDivision) {
        await api.divisions.update(selectedDivision.id, formData);
        showSnackbar('Division updated successfully', 'success');
      }
      handleCloseDialog();
      loadInitialData();
    } catch (error) {
      console.error('Failed to save division:', error);
      showSnackbar('Failed to save division', 'error');
    }
  };

  const handleDeleteDivision = async () => {
    if (!divisionToDelete) return;

    try {
      await api.divisions.delete(divisionToDelete.id);
      showSnackbar('Division deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setDivisionToDelete(null);
      loadInitialData();
    } catch (error) {
      console.error('Failed to delete division:', error);
      showSnackbar('Failed to delete division', 'error');
    }
  };

  const handleExportData = () => {
    const csv = [
      ['Division Name', 'Code', 'Zone', 'Created At'],
      ...filteredDivisions.map(d => {
        const zone = zones.find(z => z.id === d.zone_id);
        return [
          d.name,
          d.code,
          zone?.name || '',
          format(new Date(d.created_at), 'yyyy-MM-dd HH:mm'),
        ];
      }),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `divisions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredDivisions = divisions.filter(division => {
    const matchesSearch =
      division.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      division.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = !filterZoneId || division.zone_id === filterZoneId;
    return matchesSearch && matchesZone;
  });

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Division Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
    },
    {
      field: 'zone_id',
      headerName: 'Zone',
      width: 200,
      valueGetter: (params) => {
        const zone = zones.find(z => z.id === params);
        return zone?.name || 'Unknown';
      },
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
            setDivisionToDelete(params.row);
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
          Division Management
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
            Add Division
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: showFilters ? 2 : 0 }}>
          <TextField
            placeholder="Search by division name or code..."
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
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Zone"
                size="small"
                value={filterZoneId}
                onChange={(e) => setFilterZoneId(e.target.value)}
              >
                <MenuItem value="">All Zones</MenuItem>
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setFilterZoneId('')}>
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredDivisions}
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
          {dialogMode === 'add' ? 'Add New Division' : dialogMode === 'edit' ? 'Edit Division' : 'Division Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Division Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Division Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Zone"
                value={formData.zone_id || ''}
                onChange={(e) => setFormData({ ...formData, zone_id: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              >
                {zones.map((zone) => (
                  <MenuItem key={zone.id} value={zone.id}>
                    {zone.name}
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
            <Button variant="contained" onClick={handleSaveDivision}>
              {dialogMode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete division "{divisionToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteDivision}>
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
