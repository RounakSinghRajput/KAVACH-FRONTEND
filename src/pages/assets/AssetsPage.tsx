import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  IconButton,
  Collapse,
  Alert,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { format } from 'date-fns';
import {
  Plus,
  Filter,
  X,
  Search,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Download,
  RefreshCw,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Asset, Zone, Division, AssetType, AssetHealthStatus } from '../../types';

interface AssetsPageProps {
  title: string;
  assetTypeName: string;
}

interface AssetFilters {
  zoneId?: string;
  divisionId?: string;
  healthStatus?: string;
  searchTerm?: string;
}

const healthColors = {
  HEALTHY: 'success',
  WARNING: 'warning',
  CRITICAL: 'error',
  OFFLINE: 'default',
} as const;

const healthStatusOptions: AssetHealthStatus[] = ['HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE'];

export const AssetsPage: React.FC<AssetsPageProps> = ({ title, assetTypeName }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filteredDivisions, setFilteredDivisions] = useState<Division[]>([]);
  const [assetType, setAssetType] = useState<AssetType | null>(null);

  const [filters, setFilters] = useState<AssetFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBasicFilters, setShowBasicFilters] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterPresets, setFilterPresets] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [assetTypeName]);

  useEffect(() => {
    if (filters.zoneId) {
      setFilteredDivisions(divisions.filter(d => d.zone_id === filters.zoneId));
    } else {
      setFilteredDivisions(divisions);
    }
  }, [filters.zoneId, divisions]);

  const loadInitialData = async () => {
    try {
      const [zonesData, divisionsData, typesData, presetsData] = await Promise.all([
        api.zones.getAll(),
        api.divisions.getAll(),
        api.assetTypes.getAll(),
        api.filterPresets.getAll(),
      ]);

      setZones(zonesData);
      setDivisions(divisionsData);
      setFilteredDivisions(divisionsData);
      setFilterPresets(presetsData || []);

      const foundType = typesData.find((t) => t.name === assetTypeName);
      setAssetType(foundType || null);

      if (foundType) {
        loadAssets(foundType.id, {});
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showSnackbar('Failed to load initial data', 'error');
    }
  };

  const loadAssets = async (assetTypeId: string, appliedFilters: AssetFilters) => {
    setLoading(true);
    try {
      const data = await api.assets.getAll({
        assetTypeId,
        ...appliedFilters,
      });
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
      showSnackbar('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (assetType) {
      loadAssets(assetType.id, filters);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    if (assetType) {
      loadAssets(assetType.id, {});
    }
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
    if (assetType) {
      loadAssets(assetType.id, preset.filters);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit' | 'view', asset?: Asset) => {
    setDialogMode(mode);
    setSelectedAsset(asset || null);

    if (mode === 'add') {
      setFormData({
        asset_type_id: assetType?.id,
        health_status: 'HEALTHY',
      });
    } else if (asset) {
      setFormData(asset);
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAsset(null);
    setFormData({});
  };

  const handleSaveAsset = async () => {
    try {
      if (dialogMode === 'add') {
        await api.assets.create(formData);
        showSnackbar('Asset created successfully', 'success');
      } else if (dialogMode === 'edit' && selectedAsset) {
        await api.assets.update(selectedAsset.id, formData);
        showSnackbar('Asset updated successfully', 'success');
      }
      handleCloseDialog();
      if (assetType) {
        loadAssets(assetType.id, filters);
      }
    } catch (error) {
      console.error('Failed to save asset:', error);
      showSnackbar('Failed to save asset', 'error');
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;

    try {
      await api.assets.delete(assetToDelete.id);
      showSnackbar('Asset deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setAssetToDelete(null);
      if (assetType) {
        loadAssets(assetType.id, filters);
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      showSnackbar('Failed to delete asset', 'error');
    }
  };

  const handleExportData = () => {
    const csv = [
      ['Asset ID', 'Health Status', 'Last Communication', 'Created At'],
      ...assets.map(a => [
        a.asset_id,
        a.health_status,
        a.last_communication ? format(new Date(a.last_communication), 'yyyy-MM-dd HH:mm') : 'Never',
        format(new Date(a.created_at), 'yyyy-MM-dd HH:mm'),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assetTypeName}_assets_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const columns: GridColDef[] = [
    {
      field: 'asset_id',
      headerName: 'Asset ID',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'health_status',
      headerName: 'Health Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={healthColors[params.value as keyof typeof healthColors]}
          size="small"
        />
      ),
    },
    {
      field: 'last_communication',
      headerName: 'Last Communication',
      width: 180,
      valueFormatter: (params) =>
        params ? format(new Date(params), 'yyyy-MM-dd HH:mm') : 'Never',
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
            setAssetToDelete(params.row);
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
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={() => assetType && loadAssets(assetType.id, filters)}
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
            Add Asset
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: showBasicFilters || showAdvancedFilters ? 2 : 0 }}>
          <TextField
            placeholder="Search by Asset ID..."
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
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Health Status"
                size="small"
                value={filters.healthStatus || ''}
                onChange={(e) => setFilters({ ...filters, healthStatus: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {healthStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
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
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Health Status"
                size="small"
                value={filters.healthStatus || ''}
                onChange={(e) => setFilters({ ...filters, healthStatus: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                {healthStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
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

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={assets}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Asset' : dialogMode === 'edit' ? 'Edit Asset' : 'Asset Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Asset ID"
                value={formData.asset_id || ''}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Health Status"
                value={formData.health_status || 'HEALTHY'}
                onChange={(e) => setFormData({ ...formData, health_status: e.target.value as AssetHealthStatus })}
                disabled={dialogMode === 'view'}
              >
                {healthStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Zone"
                value={formData.zone_id || ''}
                onChange={(e) => setFormData({ ...formData, zone_id: e.target.value, division_id: '' })}
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
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Division"
                value={formData.division_id || ''}
                onChange={(e) => setFormData({ ...formData, division_id: e.target.value })}
                disabled={dialogMode === 'view' || !formData.zone_id}
                required
              >
                {divisions
                  .filter(d => d.zone_id === formData.zone_id)
                  .map((division) => (
                    <MenuItem key={division.id} value={division.id}>
                      {division.name}
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
            <Button variant="contained" onClick={handleSaveAsset}>
              {dialogMode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete asset "{assetToDelete?.asset_id}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteAsset}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export const RFIDTagsPage: React.FC = () => (
  <AssetsPage title="RFID Tags" assetTypeName="RFID_TAG" />
);

export const TowersPage: React.FC = () => (
  <AssetsPage title="Towers / Radios" assetTypeName="TOWER" />
);

export const TracksidePage: React.FC = () => (
  <AssetsPage title="Trackside Equipment" assetTypeName="TRACKSIDE" />
);

export const OnboardPage: React.FC = () => (
  <AssetsPage title="Onboard (LOCO) Units" assetTypeName="ONBOARD" />
);
