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
  Alert,
  Snackbar,
  Tooltip,
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
} from 'lucide-react';
import { api } from '../../services/api';
import type { Zone } from '../../types';

export const ZonesPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState<Partial<Zone>>({});

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await api.zones.getAll();
      setZones(data);
    } catch (error) {
      console.error('Failed to load zones:', error);
      showSnackbar('Failed to load zones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', zone?: Zone) => {
    setDialogMode(mode);
    setSelectedZone(zone || null);
    setFormData(mode === 'add' ? {} : zone || {});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedZone(null);
    setFormData({});
  };

  const handleSaveZone = async () => {
    try {
      if (dialogMode === 'add') {
        await api.zones.create(formData);
        showSnackbar('Zone created successfully', 'success');
      } else if (dialogMode === 'edit' && selectedZone) {
        await api.zones.update(selectedZone.id, formData);
        showSnackbar('Zone updated successfully', 'success');
      }
      handleCloseDialog();
      loadZones();
    } catch (error) {
      console.error('Failed to save zone:', error);
      showSnackbar('Failed to save zone', 'error');
    }
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;

    try {
      await api.zones.delete(zoneToDelete.id);
      showSnackbar('Zone deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setZoneToDelete(null);
      loadZones();
    } catch (error) {
      console.error('Failed to delete zone:', error);
      showSnackbar('Failed to delete zone', 'error');
    }
  };

  const handleExportData = () => {
    const csv = [
      ['Zone Name', 'Code', 'Created At'],
      ...zones.map(z => [
        z.name,
        z.code,
        format(new Date(z.created_at), 'yyyy-MM-dd HH:mm'),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zones_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredZones = zones.filter(
    zone =>
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Zone Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 150,
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
            setZoneToDelete(params.row);
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
          Zone Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={loadZones}
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
            Add Zone
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          placeholder="Search by zone name or code..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search size={18} style={{ marginRight: 8, color: '#999' }} />,
          }}
        />
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredZones}
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
          {dialogMode === 'add' ? 'Add New Zone' : dialogMode === 'edit' ? 'Edit Zone' : 'Zone Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zone Name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zone Code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleSaveZone}>
              {dialogMode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete zone "{zoneToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteZone}>
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
