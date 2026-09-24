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
  Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { api } from '../../services/api';
import type { FracasRecord } from '../../types';

export const FailureAnalysisPage: React.FC = () => {
  const [records, setRecords] = useState<FracasRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FracasRecord | null>(null);
  const [rootCause, setRootCause] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.fracas.getAll({ status: 'OPEN' });
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

  const handleAnalyze = (record: FracasRecord) => {
    setSelectedRecord(record);
    setRootCause(record.root_cause || '');
  };

  const handleSubmit = async () => {
    if (!selectedRecord) return;

    try {
      await api.fracas.update(selectedRecord.id, {
        root_cause: rootCause,
        status: 'IN_PROGRESS',
      });
      setSelectedRecord(null);
      setRootCause('');
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
    { field: 'failure_description', headerName: 'Description', flex: 1, minWidth: 250 },
    {
      field: 'reported_at',
      headerName: 'Reported At',
      width: 180,
      valueFormatter: (params) => format(new Date(params), 'yyyy-MM-dd HH:mm'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button size="small" onClick={() => handleAnalyze(params.row)}>
          Analyze
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Failure Analysis
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
        <DialogTitle>Root Cause Analysis</DialogTitle>
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
                label="Failure Description"
                value={selectedRecord.failure_description}
                disabled
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Root Cause Analysis"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                multiline
                rows={4}
                fullWidth
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!rootCause}>
            Save Analysis
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
