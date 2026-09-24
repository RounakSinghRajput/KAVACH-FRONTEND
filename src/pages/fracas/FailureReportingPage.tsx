import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector } from '../../hooks/useRedux';
import { api } from '../../services/api';
import type { FracasRecord, Asset, Loco, Section } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { AdvancedFilterPanel, FilterConfig } from '../../components/common/AdvancedFilterPanel';

export const FailureReportingPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [records, setRecords] = useState<FracasRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FracasRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [formData, setFormData] = useState({
    asset_id: '',
    severity: 'MEDIUM',
    failure_description: '',
    loco_id: '',
    section_id: '',
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.fracas.getAll();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load FRACAS records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const data = await api.assets.getAll();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  useEffect(() => {
    loadRecords();
    loadAssets();
  }, []);

  useEffect(() => {
    let filtered = [...records];

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.fracas_number?.toLowerCase().includes(searchLower) ||
          record.failure_description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.severity) {
      filtered = filtered.filter((record) => record.severity === filters.severity);
    }

    if (filters.status) {
      filtered = filtered.filter((record) => record.status === filters.status?.toUpperCase());
    }

    if (filters.fromDate) {
      filtered = filtered.filter((record) => new Date(record.reported_at) >= new Date(filters.fromDate!));
    }

    if (filters.toDate) {
      filtered = filtered.filter((record) => new Date(record.reported_at) <= new Date(filters.toDate!));
    }

    setFilteredRecords(filtered);
  }, [records, filters]);

  const handleSubmit = async () => {
    if (!user) return;

    try {
      await api.fracas.create({
        ...formData,
        reported_by: user.id,
        loco_id: formData.loco_id || null,
        section_id: formData.section_id || null,
      });
      setOpen(false);
      setFormData({
        asset_id: '',
        severity: 'MEDIUM',
        failure_description: '',
        loco_id: '',
        section_id: '',
      });
      loadRecords();
    } catch (error) {
      console.error('Failed to create FRACAS record:', error);
    }
  };

  const statusColors = {
    OPEN: 'error',
    IN_PROGRESS: 'warning',
    CLOSED: 'success',
  } as const;

  const columns: GridColDef[] = [
    {
      field: 'fracas_number',
      headerName: 'Report Number',
      width: 180,
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={params.value === 'CRITICAL' ? 'error' : 'warning'} size="small" />
      ),
    },
    {
      field: 'failure_description',
      headerName: 'Description',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={statusColors[params.value as keyof typeof statusColors]}
          size="small"
        />
      ),
    },
    {
      field: 'reported_at',
      headerName: 'Reported At',
      width: 180,
      valueFormatter: (params) => format(new Date(params), 'yyyy-MM-dd HH:mm'),
    },
  ];

  const canCreate = user && !['VIEW_ONLY', 'RDSO'].includes(user.role);

  const handleFilterChange = (newFilters: FilterConfig) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <Box>
      <PageHeader
        title="Failure Reporting"
        description="Create and manage failure reports for KAVACH system assets"
        action={
          canCreate
            ? {
                label: 'Report Failure',
                icon: <Plus size={20} />,
                onClick: () => setOpen(true),
              }
            : undefined
        }
      />

      <AdvancedFilterPanel filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />

      <Paper
        elevation={0}
        sx={{
          height: 600,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={filteredRecords}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'background.default',
              borderBottom: '2px solid',
              borderColor: 'divider',
              fontWeight: 700,
            },
          }}
        />
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
              }}
            >
              <FileText size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Report New Failure
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Document asset failure for analysis and resolution
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Asset</InputLabel>
              <Select
                value={formData.asset_id}
                label="Asset"
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              >
                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.asset_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Severity</InputLabel>
              <Select
                value={formData.severity}
                label="Severity"
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Failure Description"
              value={formData.failure_description}
              onChange={(e) =>
                setFormData({ ...formData, failure_description: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.asset_id || !formData.failure_description}
            sx={{
              fontWeight: 700,
              px: 3,
              boxShadow: '0 4px 12px rgba(21, 101, 192, 0.25)',
            }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
