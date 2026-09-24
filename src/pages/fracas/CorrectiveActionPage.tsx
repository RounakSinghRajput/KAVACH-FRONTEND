import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { api } from '../../services/api';
import type { FracasRecord } from '../../types';

export const CorrectiveActionPage: React.FC = () => {
  const [records, setRecords] = useState<FracasRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FracasRecord | null>(null);
  const [formData, setFormData] = useState({
    corrective_action: '',
    responsible_party: 'RAILWAY' as 'RAILWAY' | 'OEM',
    closure_remarks: '',
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.fracas.getAll({ status: 'IN_PROGRESS' });
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleAction = (record: FracasRecord) => {
    setSelectedRecord(record);
    setFormData({
      corrective_action: record.corrective_action || '',
      responsible_party: record.responsible_party || 'RAILWAY',
      closure_remarks: record.closure_remarks || '',
    });
  };

  const handleSubmit = async () => {
    if (!selectedRecord) return;

    try {
      await api.fracas.update(selectedRecord.id, {
        ...formData,
        status: 'CLOSED',
        resolved_at: new Date().toISOString(),
      });
      setSelectedRecord(null);
      loadRecords();
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'fracas_number', headerName: 'Report Number', width: 180 },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} color={params.value === 'CRITICAL' ? 'error' : 'warning'} size="small" />
      ),
    },
    { field: 'failure_description', headerName: 'Description', flex: 1, minWidth: 200 },
    { field: 'root_cause', headerName: 'Root Cause', width: 200 },
    {
      field: 'reported_at',
      headerName: 'Reported At',
      width: 180,
      valueFormatter: (params) => format(new Date(params), 'yyyy-MM-dd HH:mm'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button size="small" onClick={() => handleAction(params.row)}>
          Take Action
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Corrective Action
      </Typography>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={records}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={!!selectedRecord} onClose={() => setSelectedRecord(null)} maxWidth="md" fullWidth>
        <DialogTitle>Corrective Action</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Report Number"
                value={selectedRecord.fracas_number}
                disabled
                fullWidth
              />
              <TextField
                label="Root Cause"
                value={selectedRecord.root_cause || ''}
                disabled
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Corrective Action"
                value={formData.corrective_action}
                onChange={(e) =>
                  setFormData({ ...formData, corrective_action: e.target.value })
                }
                multiline
                rows={3}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>Responsible Party</InputLabel>
                <Select
                  value={formData.responsible_party}
                  label="Responsible Party"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsible_party: e.target.value as 'RAILWAY' | 'OEM',
                    })
                  }
                >
                  <MenuItem value="RAILWAY">Railway</MenuItem>
                  <MenuItem value="OEM">OEM</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Closure Remarks"
                value={formData.closure_remarks}
                onChange={(e) =>
                  setFormData({ ...formData, closure_remarks: e.target.value })
                }
                multiline
                rows={3}
                fullWidth
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.corrective_action || !formData.closure_remarks}
          >
            Close Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
