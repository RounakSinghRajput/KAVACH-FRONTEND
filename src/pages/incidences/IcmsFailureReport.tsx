import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Divider,
  SelectChangeEvent,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import dayjs, { Dayjs } from "dayjs";

import * as XLSX from "xlsx-js-style";

import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

export interface BaseIcmsFailureReportProps {
  title: string;
  endpoint: string;
  divisionEndpoint: string;
}

export interface ReportItem {
  [key: string]: any;
}

export interface PaginatedResponse {
  data: ReportItem[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

const formatColumnHeader = (key: string) => {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const BaseIcmsFailureReport: React.FC = () => {
  const title = "ICMS Response Register";

  const endpoint = "/api/icms-failure-report";

  const divisionEndpoint = "/api/icms-failure-report/divisions";

  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );

  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());

  const [selectedDivision, setSelectedDivision] = useState("");

  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  const [tableData, setTableData] = useState<ReportItem[]>([]);

  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] = useState(10);

  const [totalRecords, setTotalRecords] = useState(0);

  const totalPages = Math.ceil(totalRecords / pageSize);

  const fetchDivisionDropdown = async () => {
    try {
      const response = await axiosInstance.get(divisionEndpoint);

      setDivisionOptions(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDivisionDropdown();
  }, []);

  useEffect(() => {
    if (hasAppliedFilter) {
      fetchReportData(page);
    }
  }, [page, pageSize]);

  const fetchReportData = async (
    currentPage: number = page,
    overrideSize?: number,
  ) => {
    setLoading(true);

    const activeSize = overrideSize ?? pageSize;

    try {
      const params = {
        page: currentPage,
        size: activeSize,

        ...(selectedDivision && {
          division: selectedDivision,
        }),

        ...(fromDate && {
          fromDate: fromDate.format("YYYY-MM-DD HH:mm:ss"),
        }),

        ...(toDate && {
          toDate: toDate.format("YYYY-MM-DD HH:mm:ss"),
        }),
      };

      const response = await axiosInstance.get<PaginatedResponse>(endpoint, {
        params,
      });

      const data = response.data;

      const records = data.data || [];

      setTableData(records);

      setTotalRecords(data.total);

      if (records.length > 0) {
        setDynamicHeaders(Object.keys(records[0]));
      } else {
        setDynamicHeaders([]);
      }
    } catch (error) {
      console.error(error);

      setTableData([]);
      setDynamicHeaders([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setHasAppliedFilter(true);

    setPage(0);

    fetchReportData(0);
  };

  const handleReset = () => {
    setSelectedDivision("");

    setFromDate(dayjs().startOf("day"));

    setToDate(dayjs());

    setTableData([]);

    setDynamicHeaders([]);

    setPage(0);

    setHasAppliedFilter(false);
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) return;

    const headers = dynamicHeaders.map(formatColumnHeader);

    const rows = tableData.map((row) =>
      dynamicHeaders.map((header) => {
        const value = row[header];

        return value === null || value === undefined || value === ""
          ? "-"
          : value;
      }),
    );

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    dynamicHeaders.forEach((_, columnIndex) => {
      const address = XLSX.utils.encode_cell({
        r: 0,
        c: columnIndex,
      });

      if (worksheet[address]) {
        worksheet[address].s = {
          fill: {
            fgColor: {
              rgb: "1C64D9",
            },
          },
          font: {
            bold: true,
            color: {
              rgb: "FFFFFF",
            },
          },
          alignment: {
            horizontal: "center",
          },
        };
      }
    });

    worksheet["!cols"] = dynamicHeaders.map(() => ({
      wch: 25,
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "ICMS Response Register");

    XLSX.writeFile(workbook, "ICMS_Response_Register.xlsx");
  };

  const renderCellContent = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const keyLower = key.toLowerCase();
    const str = String(value);

    if (keyLower.includes("date") || keyLower.includes("time")) {
      const d = dayjs(str);

      if (d.isValid()) {
        return (
          <Box>
            <Typography component="div" fontSize={12} color="#64748B">
              {d.format("DD-MM-YYYY")}
            </Typography>

            <Typography
              component="div"
              fontSize={12}
              fontWeight={700}
              color="#1C64D9"
            >
              {d.format("HH:mm:ss")}
            </Typography>
          </Box>
        );
      }
    }

    return str;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          p: 3,
          backgroundColor: "#F8FAFC",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h2"
            sx={{
              color: "#1C64D9",
              fontWeight: 700,
              pb: 0.5,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              height: "3px",
              backgroundColor: "#1C64D9",
              borderRadius: "2px",
              width: "100%",
            }}
          />
        </Box>

        {/* Filter Card */}
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(4,1fr)",
                },
                gap: 2,
                alignItems: "center",
              }}
            >
              {/* From Date */}
              <DateTimePicker
                label="From Date"
                value={fromDate}
                onChange={(value) => setFromDate(value)}
                format="DD-MM-YYYY HH:mm:ss"
                ampm={false}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />

              {/* To Date */}
              <DateTimePicker
                label="To Date"
                value={toDate}
                onChange={(value) => setToDate(value)}
                format="DD-MM-YYYY HH:mm:ss"
                ampm={false}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />

              {/* Division */}
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>

                <Select
                  value={selectedDivision}
                  label="Division"
                  onChange={(e: SelectChangeEvent) =>
                    setSelectedDivision(e.target.value)
                  }
                >
                  <MenuItem value="">All Divisions</MenuItem>

                  {divisionOptions.map((division) => (
                    <MenuItem key={division} value={division}>
                      {division}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleApplyFilter}
                  sx={{
                    backgroundColor: "#1C64D9",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "#174EA6",
                    },
                  }}
                >
                  Apply
                </Button>

                <IconButton
                  onClick={handleReset}
                  sx={{
                    border: "1px solid #CBD5E1",
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {!hasAppliedFilter ? (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderStyle: "dashed",
              borderColor: "#CBD5E1",
              py: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "#E0F2FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <FilterListIcon
                sx={{
                  color: "#0284C7",
                  fontSize: 30,
                }}
              />
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              No Filter Applied
            </Typography>

            <Typography color="text.secondary">
              Select filters and click Apply
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              p: 2,
            }}
          >
            {/* Toolbar */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  ICMS Failure Records
                </Typography>

                <Chip
                  label={`Rows : ${totalRecords}`}
                  sx={{
                    backgroundColor: "#1C64D9",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                />
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
              >
                Excel
              </Button>
            </Box>

            {/* Table */}
            <Box
              sx={{
                minHeight: 350,
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    py: 10,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <ContentLoading />
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    maxHeight: "60vh",
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {dynamicHeaders.map((header) => (
                          <TableCell
                            key={header}
                            sx={{
                              backgroundColor: "#1d1ae2",
                              color: "#FFFFFF",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatColumnHeader(header)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={dynamicHeaders.length || 1}
                            align="center"
                            sx={{
                              py: 8,
                            }}
                          >
                            No Records Found
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((row, rowIndex) => (
                          <TableRow hover key={rowIndex}>
                            {dynamicHeaders.map((header) => (
                              <TableCell key={header}>
                                {renderCellContent(header, row[header])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Pagination */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 3,
                pt: 1,
                px: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: "#475569" }}>
                  Rows per page:
                </Typography>

                <Select
                  value={pageSize}
                  size="small"
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setPage(0);
                  }}
                  sx={{
                    height: 32,
                    fontSize: "0.85rem",
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </Box>

              <Typography variant="body2" sx={{ color: "#475569" }}>
                {totalRecords > 0 ? page * pageSize + 1 : 0}–
                {Math.min((page + 1) * pageSize, totalRecords)} of{" "}
                <strong
                  style={{
                    color: "#1C64D9",
                  }}
                >
                  {totalRecords}
                </strong>
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                >
                  <FirstPageIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <KeyboardArrowLeftIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  disabled={(page + 1) * pageSize >= totalRecords}
                  onClick={() => setPage(page + 1)}
                >
                  <KeyboardArrowRightIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  disabled={(page + 1) * pageSize >= totalRecords}
                  onClick={() => {
                    const lastPage = totalPages - 1;
                    setPage(lastPage);
                  }}
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default BaseIcmsFailureReport;
