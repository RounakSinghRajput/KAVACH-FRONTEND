import React from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Autocomplete,
  Typography,
  Drawer,
  IconButton,
  Divider,
  alpha,
  Chip,
} from '@mui/material';
import { SlidersHorizontal, X, Search } from 'lucide-react';

export interface FilterConfig {
  fromDate?: string;
  toDate?: string;
  status?: string;
  severity?: string;
  searchText?: string;
  assetType?: string;
  failureType?: string;
  station?: string;
  assetId?: string;
  reportType?: string;
  priority?: string;
  healthStatus?: string;
  zoneId?: string;
  divisionId?: string;
}

interface AdvancedFilterPanelProps {
  filters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  onReset: () => void;
  zones?: Array<{ id: string; name: string }>;
  divisions?: Array<{ id: string; name: string }>;
  showZoneDivision?: boolean;
  additionalFilters?: React.ReactNode;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  zones = [],
  divisions = [],
  showZoneDivision = false,
  additionalFilters,
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const statusOptions = ['Open', 'In Progress', 'Closed', 'Resolved'];
  const severityLevels = ['Critical', 'High', 'Medium', 'Low'];
  const priorityLevels = ['P1', 'P2', 'P3', 'P4'];
  const healthStatusOptions = ['HEALTHY', 'WARNING', 'CRITICAL', 'OFFLINE'];

  const updateFilter = (key: keyof FilterConfig, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const advancedFilterCount = Object.values(filters).filter((v) => v && v !== '').length;

  const activeFilters = Object.entries(filters)
    .filter(([_, value]) => value && value !== '')
    .map(([key, value]) => ({ key, value: value as string }));

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}
          >
            Filter Data
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          {showZoneDivision && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  options={zones}
                  getOptionLabel={(option) => option.name}
                  value={zones.find((z) => z.id === filters.zoneId) || null}
                  onChange={(_, newValue) => updateFilter('zoneId', newValue?.id || '')}
                  renderInput={(params) => <TextField {...params} label="Zone" placeholder="Select zone" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  options={divisions}
                  getOptionLabel={(option) => option.name}
                  value={divisions.find((d) => d.id === filters.divisionId) || null}
                  onChange={(_, newValue) => updateFilter('divisionId', newValue?.id || '')}
                  disabled={!filters.zoneId}
                  renderInput={(params) => <TextField {...params} label="Division" placeholder="Select division" />}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={filters.fromDate || ''}
              onChange={(e) => updateFilter('fromDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={filters.toDate || ''}
              onChange={(e) => updateFilter('toDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Search records..."
              value={filters.searchText || ''}
              onChange={(e) => updateFilter('searchText', e.target.value)}
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8, color: '#666' }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SlidersHorizontal size={18} />}
                onClick={() => setDrawerOpen(true)}
                sx={{
                  fontWeight: 600,
                  borderColor: advancedFilterCount > 0 ? 'primary.main' : 'divider',
                  color: advancedFilterCount > 0 ? 'primary.main' : 'text.secondary',
                  bgcolor: advancedFilterCount > 0 ? alpha('#1565C0', 0.08) : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha('#1565C0', 0.12),
                  },
                }}
              >
                Advanced {advancedFilterCount > 0 && `(${advancedFilterCount})`}
              </Button>

              {advancedFilterCount > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={onReset}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                  }}
                >
                  <X size={18} />
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {activeFilters.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mr: 1 }}>
              Active Filters:
            </Typography>
            {activeFilters.map((filter) => (
              <Chip
                key={filter.key}
                label={`${filter.key}: ${filter.value}`}
                onDelete={() => updateFilter(filter.key as keyof FilterConfig, '')}
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      color: 'white',
                    },
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 3,
          },
        }}
      >
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha('#1565C0', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
              }}
            >
              <SlidersHorizontal size={20} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Advanced Filters
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Refine your search criteria
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <X size={20} />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
              Status & Priority
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                size="small"
                options={statusOptions}
                value={filters.status || null}
                onChange={(_, newValue) => updateFilter('status', newValue || '')}
                renderInput={(params) => <TextField {...params} label="Status" placeholder="Select status" />}
              />
              <Autocomplete
                size="small"
                options={severityLevels}
                value={filters.severity || null}
                onChange={(_, newValue) => updateFilter('severity', newValue || '')}
                renderInput={(params) => <TextField {...params} label="Severity" placeholder="Select severity" />}
              />
              <Autocomplete
                size="small"
                options={priorityLevels}
                value={filters.priority || null}
                onChange={(_, newValue) => updateFilter('priority', newValue || '')}
                renderInput={(params) => <TextField {...params} label="Priority" placeholder="Select priority" />}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
              Location & Assets
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Station"
                value={filters.station || ''}
                onChange={(e) => updateFilter('station', e.target.value)}
                placeholder="Enter station name"
              />
              <TextField
                fullWidth
                size="small"
                label="Asset ID"
                value={filters.assetId || ''}
                onChange={(e) => updateFilter('assetId', e.target.value)}
                placeholder="Enter asset ID"
              />
              <Autocomplete
                size="small"
                options={healthStatusOptions}
                value={filters.healthStatus || null}
                onChange={(_, newValue) => updateFilter('healthStatus', newValue || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Health Status" placeholder="Select health status" />
                )}
              />
            </Box>
          </Box>

          {additionalFilters}
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2 }}>
          <Button fullWidth variant="outlined" onClick={onReset}>
            Reset All
          </Button>
          <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>
            Apply Filters
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};
