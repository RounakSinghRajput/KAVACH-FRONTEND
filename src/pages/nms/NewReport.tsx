import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Chip,
  Stack,
  Divider,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Radio,
  Train,
  Router,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { useNotify } from "../../context/notification-context";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";
import {
  Search,
  FilterList,
  Download,
  PictureAsPdf,
  Refresh,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface Packet {
  id: number;
  name: string;
  hasSubPacket: boolean;
}

interface SubPacket {
  id: number;
  packetId: number;
  name: string;
}
const subPacketApiMap: Record<number, string> = {
  // 1: "/msgType14/msg-names",
  3: "/msgType12/accessRequest",
  2: "/msgType12/onboardStation",
  4: "/api/messages",
  5: "/msgType11/temporary-speed",
  6: "/msgType11/gradient-profile",
  7: "/msgType11/lc-gate-profile",
  8: "/msgType11/station-movement",
  9: "/msgType11/ssp",
  10: "/msgType11/tag-link-info",
  11: "/msgType11/turnout-speed-profile",
  12: "/msgType11/track-condition",
  13: "/msgType14/report?msgName=Heart Beat",
  14: "/msgType14/report?msgName=Field Elements Status",
  15: "/msgType14/report?msgName=Field Elements Status Request",
  16: "/msgType14/report?msgName=Train Length Acknowledgement",
  17: "/msgType14/report?msgName=Train Length Information",
  18: "/msgType11/additional",
};

const packets: Packet[] = [
  {
    id: 1,
    name: "Station Regular Packets",
    hasSubPacket: true,
  },
  {
    id: 2,
    name: "Loco Regular Packets",
    hasSubPacket: true,
  },
  {
    id: 3,
    name: "Adjacent Kavach Information",
    hasSubPacket: true,
  },
];

const subPackets: SubPacket[] = [
  {
    id: 1,
    packetId: 1,
    name: "Station Header Data",
  },
  {
    id: 2,
    packetId: 2,
    name: "Onboard Station",
  },
  {
    id: 3,
    packetId: 2,
    name: "Access Request Packets",
  },

  {
    id: 5,
    packetId: 1,
    name: "Temporary Speed Profile",
  },
  {
    id: 6,
    packetId: 1,
    name: "Gradient Profile",
  },
  {
    id: 7,
    packetId: 1,
    name: "LC Gate Profile",
  },
  {
    id: 8,
    packetId: 1,
    name: "Station Movement",
  },
  {
    id: 9,
    packetId: 1,
    name: "Static Speed Profile",
  },
  {
    id: 10,
    packetId: 1,
    name: "Tag Link Info",
  },
  {
    id: 11,
    packetId: 1,
    name: "Turnout Speed Profile",
  },

  {
    id: 12,
    packetId: 1,
    name: "Track Condition",
  },
  {
    id: 13,
    packetId: 3,
    name: "HeartBeat",
  },
  {
    id: 14,
    packetId: 3,
    name: "Field Elements Status",
  },
  {
    id: 15,
    packetId: 3,
    name: "Field Elements Status Request",
  },
  {
    id: 16,
    packetId: 3,
    name: "Train Length Acknowledgement",
  },
  {
    id: 17,
    packetId: 3,
    name: "Train Length Information",
  },
  {
    id: 18,
    packetId: 1,
    name: "Additional Emergency",
  },
];
const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};
const divisions = [
  "Secunderabad",
  "Hyderabad",
  "Vadodara",
  "Agra",
  "Delhi",
  "Kota",
  "Din Dayal Upadhyay",
  "Howrah",
  "Asansol",
];

const NMSReportPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { showAlert, confirm } = useNotify();

  const [packet, setPacket] = useState("");
  const [subPacket, setSubPacket] = useState("");

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);

  const [columns, setColumns] = useState<GridColDef[]>([]);
  // const [rows, setRows] = useState<any[]>([]);
  // const [reportType, setReportType] = useState(0);

  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs());

  const [allRows, setAllRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);

  const [selectedDivision, setSelectedDivision] = useState("");

  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());

  const selectedPacket = packets.find((item) => item.id === Number(packet));

  const handleApplyDateFilter = () => {
  setPage(0);
  setShowFilters(true);

  if (subPacket) {
    handleGenerateReport();
  }
};

  useEffect(() => {
    if (subPacket) {
      handleGenerateReport();
    }
  }, [page, pageSize]);

  useEffect(() => {
    const storedDivision = localStorage.getItem("selectedDivision");

    if (storedDivision) {
      setSelectedDivision(storedDivision);
    }
  }, []);
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);

    localStorage.setItem("selectedDivision", division);

    setAllRows([]);
    setFilteredRows([]);
    setColumns([]);
    setPage(0);
  };
  const handleGenerateReport = async () => {
    setLoading(true);
    if (!selectedDivision) {
      setLoading(false);
      showAlert("Please select division", "warning");
      return;
    }

    try {
      if (!subPacket) {
        showAlert("Please select a Sub Packet", "warning");
        return;
      }

      const endpoint = subPacketApiMap[Number(subPacket)];

      const response = await axiosInstance.get(endpoint, {
  params: {
    page,
    size: pageSize,
    division: selectedDivision || null,
    fromDate: fromDate?.toISOString(),
    toDate: toDate?.toISOString(),
  },
});

      const data = response.data.content || response.data.data || [];
      if (!data.length) {
        setAllRows([]);

        setFilteredRows([]);
        setColumns([]);

        showAlert("No records found", "info");
        return;
      }
      let columnKeys = Object.keys(data[0]);

      if (Number(packet) === 3) {
        columnKeys = columnKeys.filter((key) =>
          data.some(
            (row: any) =>
              row[key] !== null && row[key] !== undefined && row[key] !== "",
          ),
        );
      }

      const dynamicColumns = columnKeys.map((key) => ({
        field: key,
        headerName: formatHeader(key),
        width: 180,
      }));

      const rowsWithId = data.map((row: any, index: number) => ({
        id: index + 1,
        ...row,
      }));

      setColumns(dynamicColumns);

setAllRows(rowsWithId);
setFilteredRows(rowsWithId);   // <-- ADD THIS

console.log("API DATA =>", rowsWithId);

setTotalRecords(response.data.totalRecords || 0);
      showAlert(` records loaded successfully`, "success");
    } catch (error: any) {
      showAlert(
        // error?.response?.data?.message ||
        "Failed to load report",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert("No data available to export", "warning");
      return;
    }

    const reportData = filteredRows.map(({ id, ...rest }) => rest);

    const ws = XLSX.utils.json_to_sheet([]);

    // Header Information
    XLSX.utils.sheet_add_aoa(ws, [
      ["INDIAN RAILWAYS - KAVACH NMS REPORT"],
      [""],
      // ["User Name", user?.username || "Admin"],
      // ["Report Name", selectedSubPacket?.name || ""],
      [
        "Date Range",
        `${fromDate?.format("DD-MM-YYYY HH:mm")} To ${toDate?.format(
          "DD-MM-YYYY HH:mm",
        )}`,
      ],
      ["Generated On", dayjs().format("DD-MM-YYYY HH:mm:ss")],
      [""],
    ]);

    XLSX.utils.sheet_add_json(ws, reportData, {
      origin: "A8",
    });

    // Column width auto
    const cols = Object.keys(reportData[0]).map(() => ({
      wch: 25,
    }));

    ws["!cols"] = cols;

    // Freeze Header
    ws["!freeze"] = {
      xSplit: 0,
      ySplit: 8,
    };

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "NMS Report");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, `NMS_Report_${dayjs().format("DDMMYYYY_HHmmss")}.xlsx`);
  };
  const handleRefresh = async () => {
    if (!subPacket) {
      showAlert("Please select a report first", "warning");
      return;
    }

    await handleGenerateReport();

    showAlert("Report refreshed successfully", "success");
  };
  const getDivision = (row: any) => {
    return row.DIVISION || row.division || row.Division || null;
  };

  // const applyFrontendFilters = () => {
  //   console.log("All Rows Count =", allRows.length);
  //     console.log("First Row =", allRows[0]);

  //   setFilteredRows(allRows);
  //   setTotalRecords(allRows.length);
  // };
 const paginatedRows = filteredRows;
  const selectedSubPacket = subPackets.find(
    (item) => item.id === Number(subPacket),
  );

  return (
    <>
      <Box sx={{ p: 3 }}>
        {/* PAGE HEADER */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#1565C0",
              lineHeight: 1.2,
            }}
          >
            NMS Packet Reports
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "primary.main",
          }}
        ></Paper>
        {/* DATE FILTER */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 2 }}>
              <DateTimePicker
                label="From Date"
                value={fromDate}
                onChange={setFromDate}
                format="DD-MM-YY HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <DateTimePicker
                label="To Date"
                value={toDate}
                onChange={setToDate}
                format="DD-MM-YY HH:mm"
                ampm={false}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>

                <Select
                  value={selectedDivision}
                  label="Division"
                  onChange={(e) => handleDivisionChange(e.target.value)}
                >
                  {divisions.map((division) => (
                    <MenuItem key={division} value={division}>
                      {division}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  height: 40,
                }}
                onClick={handleApplyDateFilter}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
        {/* FILTER PANEL */}
        <Collapse in={showFilters}>
          <Card
            sx={{
              borderRadius: 4,
              mb: 2,
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <FilterList />
                <Typography fontWeight={700}>Report Filters</Typography>
              </Stack>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Packet</InputLabel>

                    <Select
                      value={packet}
                      label="Packet"
                      onChange={(e) => {
                        setPacket(e.target.value);
                        setSubPacket("");
                        setAllRows([]);
                        setFilteredRows([]);
                        setColumns([]);
                      }}
                    >
                      {packets.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {selectedPacket?.hasSubPacket && (
                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sub Packet</InputLabel>

                      <Select
                        value={subPacket}
                        label="Sub Packet"
                        onChange={(e) => {
                          setSubPacket(e.target.value);
                          setAllRows([]);
                          setFilteredRows([]);
                          setColumns([]);
                        }}
                      >
                        {subPackets
                          .filter((s) => s.packetId === Number(packet))
                          .map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    fullWidth
                    size="medium"
                    variant="contained"
                    startIcon={<Search />}
                    onClick={handleGenerateReport}
                  >
                    Get Report
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>

        {loading || filteredRows.length > 0 ? (
          <Card
            sx={{
              borderRadius: 4,
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={2}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#1565C0",
                    }}
                  >
                    {selectedSubPacket?.name}
                  </Typography>

                  <Chip
                    color="primary"
                    label={`Total Records : ${totalRecords.toLocaleString()}`}
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    startIcon={<Download />}
                    variant="outlined"
                    onClick={exportToExcel}
                  >
                    Excel
                  </Button>

                  <Button
                    startIcon={<Refresh />}
                    variant="outlined"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Stack>

              <Paper
                sx={{
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  className="overflow-auto"
                  style={{
                    maxHeight: "500px",
                  }}
                >
                  {loading ? (
                    <div className="flex h-[400px] items-center justify-center">
                      <ContentLoading />
                    </div>
                  ) : (
                    <table className="border-collapse min-w-max w-full">
                      <thead className="sticky top-0 z-20 ">
                        <tr className="bg-blue-600 border rounded-t-full">
                          {columns.map((col) => (
                            <th
                              key={col.field}
                              className="border border-blue-700 px-4 py-3 text-left text-sm font-bold text-white whitespace-nowrap"
                            >
                              {col.headerName}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedRows.map((row, index) => (
                          <tr
                            key={row.id}
                            className={`hover:bg-blue-50 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            {columns.map((col) => (
                              <td
                                key={col.field}
                                className="border border-gray-200 px-3 py-2 text-sm whitespace-nowrap"
                              >
                                {col.field === "dateTime"
                                  ? `${dayjs(row[col.field]).format("DD-MM-YYYY")} | ${dayjs(
                                      row[col.field],
                                    ).format("HH:mm:ss")}`
                                  : (row[col.field] ?? "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                  {/* Rows Per Page */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">
                      Rows per page:
                    </span>

                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm outline-none"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </select>
                  </div>

                  {/* Showing Records */}
                  <div className="text-sm text-gray-700">
                    {page * pageSize + 1}–
                    {Math.min((page + 1) * pageSize, totalRecords)} of{" "}
                    {totalRecords}
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(0)}
                      disabled={page === 0}
                      className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronsLeft size={18} />
                    </button>

                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * pageSize >= totalRecords}
                      className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>

                    <button
                      onClick={() =>
                        setPage(
                          Math.max(Math.ceil(totalRecords / pageSize) - 1, 0),
                        )
                      }
                      disabled={(page + 1) * pageSize >= totalRecords}
                      className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              </Paper>
            </CardContent>
          </Card>
        ) : (
          <Paper
            sx={{
              minHeight: 420,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mt: 2,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                bgcolor: "rgba(25,118,210,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <FilterList
                sx={{
                  fontSize: 50,
                  color: "#1565C0",
                }}
              />
            </Box>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              No Report Generated Yet
            </Typography>

            <Typography color="text.secondary" textAlign="center">
              Select Date Range, Packet and Sub Packet then click
              <b> Generate Report </b>
              to view report data.
            </Typography>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default NMSReportPage;
