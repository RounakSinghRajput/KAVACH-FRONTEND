import React, { useEffect, useRef, useState } from "react";

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
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";

import { FilterList, Download, Refresh } from "@mui/icons-material";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import dayjs, { Dayjs } from "dayjs";

import { useNotify } from "../../context/notification-context";

import { saveAs } from "file-saver";

import { LocalizationProvider } from "@mui/x-date-pickers";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { axiosInstance } from "../../services/axios";

import { ContentLoading } from "../../components/common/LoadingScreen";

import CloseIcon from "@mui/icons-material/Close";
import TrainIcon from "@mui/icons-material/Train";
import * as XLSX from "xlsx-js-style";

/*
 * ===========================================================
 * FILTER RULES (NAYA VERSION)
 * ===========================================================
 *
 * 1. Division MANDATORY hai. Baaki sab optional.
 * 2. Date range par koi limit nahi - user jitne din
 *    chahe select kar sakta hai, na warning na error.
 * 3. Default range = last 1 hour, aur To Date hamesha
 *    "abhi ka time" rehta hai jab tak user khud na badle.
 * 4. Division / Shed / Loco - teeno list ab API se
 *    aati hai, koi hardcoded array nahi.
 * ===========================================================
 */

const API_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

const DEFAULT_RANGE_HOURS = 1;

const ENDPOINTS = {
  summary: "/mt11OnboardStation/summary",
  export: "/mt11OnboardStation/summary/export",
  divisions: "/mt11OnboardStation/divisions",
  sheds: "/mt11OnboardStation/sheds",
  locos: "/mt11OnboardStation/locos",
};

const REPORT_COLUMNS = [
  { field: "firstPacketDate", headerName: "Packet Date" },
  { field: "messageSequence", headerName: "Msg Sequence" },
  { field: "division", headerName: "Division" },
  { field: "locoId", headerName: "Loco Id" },
  { field: "faults", headerName: "Fault Message" },
  { field: "locoFrameNum", headerName: "Loco Frame Num" },
  { field: "absLoc", headerName: "Abs Loc" },
  { field: "speed", headerName: "Speed" },
  { field: "locoMode", headerName: "Loco Mode" },
  { field: "emrStatus", headerName: "EMR Status" },
  { field: "rfid", headerName: "RFID" },
  { field: "shed", headerName: "Shed" },
];

/*
 * Applied filters = wo filters jinka data abhi
 * table mein dikh raha hai. Pagination aur export
 * yahi use karte hain, live UI state nahi - warna
 * user filter badal ke "next page" dabaye to
 * mismatch data aa jaata hai.
 */
type AppliedFilters = {
  fromDate: string;
  toDate: string;
  division: string;
  shed: string | null;
  locoId: string | null;
};

/*
 * Teeno lookup API plain string array deti hain,
 * lekin kal ko object aa gaya to bhi na toote.
 */
const toStringList = (payload: any): string[] => {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const values = raw
    .map((item: any) => {
      if (item === null || item === undefined) return "";

      if (typeof item === "string" || typeof item === "number") {
        return String(item);
      }

      return String(
        item.name ??
          item.locoId ??
          item.locoID ??
          item.LOCO_ID ??
          item.loco_id ??
          item.shed ??
          item.division ??
          item.id ??
          "",
      );
    })
    .filter((value: string) => value.trim() !== "");

  return Array.from(new Set<string>(values)).sort();
};

const LocoFaultReportPage = () => {
  const { showAlert } = useNotify();

  /*
   * ---------------------------------------------------------
   * UI STATES
   * ---------------------------------------------------------
   */

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<
    string | null
  >(null);

  /*
   * ---------------------------------------------------------
   * SERVER FILTERS
   * ---------------------------------------------------------
   */

  const [fromDate, setFromDate] = useState<Dayjs | null>(() =>
    dayjs().subtract(DEFAULT_RANGE_HOURS, "hour"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(() => dayjs());

  /*
   * Jab tak user dates ko haath nahi lagata, range
   * "last 1 hour till now" par chipka rehta hai aur
   * har Apply par refresh ho jaata hai.
   */
  const [datesDirty, setDatesDirty] = useState(false);

  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedShed, setSelectedShed] = useState<string | null>(null);
  const [selectedLoco, setSelectedLoco] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * COLUMN FILTERS
   * ---------------------------------------------------------
   */

  const [selectedTableShed, setSelectedTableShed] = useState<string[]>([]);
  const [selectedMsgFault, setSelectedMsgFault] = useState<string[]>([]);
  const [selectedLocoMode, setSelectedLocoMode] = useState<string[]>([]);

  /*
   * ---------------------------------------------------------
   * DROPDOWN DATA (sab API se)
   * ---------------------------------------------------------
   */

  const [divisionsList, setDivisionsList] = useState<string[]>([]);
  const [shedsList, setShedsList] = useState<string[]>([]);
  const [locoList, setLocoList] = useState<string[]>([]);

  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingDependents, setLoadingDependents] = useState(false);

  /*
   * Ek request chal rahi ho to doosri na chale.
   * setLoading async hai, isliye ref se lock lagta hai -
   * double click / tez click par duplicate call nahi jaayegi.
   */
  const requestLock = useRef(false);

  /*
   * ---------------------------------------------------------
   * TABLE DATA
   * ---------------------------------------------------------
   */

  const [columns, setColumns] = useState<any[]>([]);
  const [masterRows, setMasterRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(
    null,
  );

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalRecords, setTotalRecords] = useState(0);

  /*
   * ---------------------------------------------------------
   * DETAIL POPUP
   * ---------------------------------------------------------
   */

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRows, setDetailRows] = useState<any[]>([]);

  /*
   * =========================================================
   * LOOKUP LIST - DIVISIONS (page load par ek baar)
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadDivisions = async () => {
      setLoadingDivisions(true);

      try {
        const response = await axiosInstance.get(ENDPOINTS.divisions);

        if (cancelled) return;

        setDivisionsList(toStringList(response.data));
      } catch (error) {
        if (cancelled) return;

        console.error("Division list failed:", error);
        showAlert("Unable to load the division list.", "error");
        setDivisionsList([]);
      } finally {
        if (!cancelled) setLoadingDivisions(false);
      }
    };

    loadDivisions();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * =========================================================
   * LOOKUP LISTS - SHED / LOCO
   * =========================================================
   *
   * Ye dono sirf division chunne ke BAAD load hote hain,
   * aur division ke saath hi reset bhi ho jaate hain.
   * Division param bheja ja raha hai - backend agar ignore
   * kare to poori list aayegi, koi dikkat nahi.
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    /* Division badla/hata -> purani selection valid nahi */
    setSelectedShed(null);
    setSelectedLoco(null);

    if (!selectedDivision) {
      setShedsList([]);
      setLocoList([]);
      setLoadingDependents(false);
      return;
    }

    const loadDependents = async () => {
      setLoadingDependents(true);

      const params = { division: selectedDivision };

      const [shedRes, locoRes] = await Promise.allSettled([
        axiosInstance.get(ENDPOINTS.sheds, { params }),
        axiosInstance.get(ENDPOINTS.locos, { params }),
      ]);

      if (cancelled) return;

      if (shedRes.status === "fulfilled") {
        setShedsList(toStringList(shedRes.value.data));
      } else {
        console.error("Shed list failed:", shedRes.reason);
        showAlert("Unable to load the shed list.", "error");
        setShedsList([]);
      }

      if (locoRes.status === "fulfilled") {
        setLocoList(toStringList(locoRes.value.data));
      } else {
        console.error("Loco list failed:", locoRes.reason);
        showAlert("Unable to load the loco list.", "error");
        setLocoList([]);
      }

      setLoadingDependents(false);
    };

    loadDependents();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivision]);

  /*
   * =========================================================
   * DATE RANGE HELPERS
   * =========================================================
   */

  /*
   * User ne dates chhui hi nahi -> hamesha taaza
   * "last 1 hour" range banao aur pickers bhi update
   * kar do, taaki screen par wahi dikhe jo bheja gaya.
   */
  const resolveRange = (): { from: Dayjs | null; to: Dayjs | null } => {
    if (datesDirty) {
      return { from: fromDate, to: toDate };
    }

    const to = dayjs();
    const from = to.subtract(DEFAULT_RANGE_HOURS, "hour");

    setFromDate(from);
    setToDate(to);

    return { from, to };
  };

  /*
   * =========================================================
   * VALIDATION - sirf do cheezein
   * =========================================================
   *
   * 1. To Date > From Date
   * 2. Division select hona chahiye
   *
   * Range kitni bhi lambi ho, koi rok tok nahi.
   * =========================================================
   */

  const buildFilters = (): AppliedFilters | null => {
    const { from, to } = resolveRange();

    if (!from || !to) {
      showAlert("Select both From Date and To Date.", "warning");
      return null;
    }

    if (!to.isAfter(from)) {
      showAlert("To Date must be later than From Date.", "warning");
      return null;
    }

    if (!selectedDivision) {
      showAlert("Select a division to run the report.", "warning");
      return null;
    }

    return {
      fromDate: from.format(API_DATE_FORMAT),
      toDate: to.format(API_DATE_FORMAT),
      division: selectedDivision,
      shed: selectedShed && selectedShed.trim() !== "" ? selectedShed : null,
      locoId: selectedLoco && selectedLoco.trim() !== "" ? selectedLoco : null,
    };
  };

  const toRequestParams = (filters: AppliedFilters) => {
    const params: any = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      division: filters.division,
    };

    if (filters.shed) {
      params.shed = filters.shed;
    }

    if (filters.locoId) {
      params.locoId = filters.locoId;
    }

    return params;
  };

  const extractApiError = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message;

    if (typeof message === "string" && message.trim() !== "") {
      return message;
    }

    return fallback;
  };

  /*
   * Export blob mode mein chalta hai, isliye error body
   * bhi Blob aata hai - use padhna padta hai.
   */
  const extractBlobError = async (
    error: any,
    fallback: string,
  ): Promise<string> => {
    const data = error?.response?.data;

    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);

        if (parsed?.message) {
          return String(parsed.message);
        }
      } catch {
        // blob JSON nahi tha - fallback hi sahi
      }
    }

    return extractApiError(error, fallback);
  };

  /*
   * =========================================================
   * FETCH REPORT
   * =========================================================
   */

  const fetchReport = async (
    filters: AppliedFilters,
    pageNo: number,
    rowsPerPage: number,
  ) => {
    /*
     * Pehli call ka response aane tak doosri call
     * bilkul nahi jaayegi.
     */
    if (requestLock.current) {
      return;
    }

    requestLock.current = true;
    setLoading(true);

    try {
      const response = await axiosInstance.get(ENDPOINTS.summary, {
        params: {
          ...toRequestParams(filters),
          page: pageNo,
          size: rowsPerPage,
        },
      });

      const responseData = response.data || {};

      const data = Array.isArray(responseData.data)
        ? responseData.data
        : Array.isArray(responseData.content)
          ? responseData.content
          : Array.isArray(responseData)
            ? responseData
            : [];

      /*
       * Naya data = purane column filters bekaar,
       * kyunki options is page ke rows se bante hain.
       */
      setSelectedMsgFault([]);
      setSelectedLocoMode([]);
      setSelectedTableShed([]);

      setAppliedFilters(filters);
      setColumns(REPORT_COLUMNS);
      setPage(pageNo);

      if (!data.length) {
        setMasterRows([]);
        setFilteredRows([]);
        setTotalRecords(
          typeof responseData.total === "number" ? responseData.total : 0,
        );
        showAlert("No records found for the selected filters.", "info");
        return;
      }

      const rowsWithId = data.map((row: any, index: number) => ({
        id: `${pageNo}-${index}-${row.eventId ?? index}`,
        serial: pageNo * rowsPerPage + index + 1,
        ...row,
      }));

      setMasterRows(rowsWithId);
      setFilteredRows(rowsWithId);
      setTotalRecords(
        responseData.total ?? responseData.totalElements ?? rowsWithId.length,
      );
    } catch (error: any) {
      console.error("Loco fault report error:", error);

      showAlert(
        extractApiError(
          error,
          "Unable to load the Loco Fault Report. Please try again.",
        ),
        "error",
      );
    } finally {
      requestLock.current = false;
      setLoading(false);
    }
  };

  /*
   * Apply button - live UI state se filters banao
   */
  const handleApply = (rowsPerPage = pageSize) => {
    const filters = buildFilters();

    if (!filters) return;

    fetchReport(filters, 0, rowsPerPage);
  };

  /*
   * Pagination - jo filters apply ho chuke hain wahi
   */
  const handlePageChange = (pageNo: number, rowsPerPage = pageSize) => {
    if (!appliedFilters) {
      showAlert("Apply the filters before changing pages.", "warning");
      return;
    }

    fetchReport(appliedFilters, pageNo, rowsPerPage);
  };

  /*
   * =========================================================
   * RESET
   * =========================================================
   *
   * Sab kuch default par: dates, dropdowns, column
   * filters, table data, pagination.
   * =========================================================
   */

  const handleReset = () => {
    const to = dayjs();

    setFromDate(to.subtract(DEFAULT_RANGE_HOURS, "hour"));
    setToDate(to);
    setDatesDirty(false);

    setSelectedDivision("");
    setSelectedShed(null);
    setSelectedLoco(null);

    setSelectedMsgFault([]);
    setSelectedLocoMode([]);
    setSelectedTableShed([]);
    setActiveHeaderDropdown(null);

    setColumns([]);
    setMasterRows([]);
    setFilteredRows([]);
    setAppliedFilters(null);

    setPage(0);
    setPageSize(100);
    setTotalRecords(0);

    showAlert("Filters reset to default.", "info");
  };

  /*
   * =========================================================
   * COLUMN FILTER OPTIONS + CLIENT SIDE FILTERING
   * =========================================================
   */

  const uniqueMsgFaults: string[] = Array.from(
    new Set<string>(
      masterRows
        .flatMap((row) => (Array.isArray(row.faults) ? row.faults : []))
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort();

  const uniqueLocoModes: string[] = Array.from(
    new Set<string>(
      masterRows
        .map((row) => (row.locoMode ? String(row.locoMode) : ""))
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort();

  const uniqueTableSheds: string[] = Array.from(
    new Set<string>(
      masterRows
        .map((row) => (row.shed ? String(row.shed) : ""))
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort();

  useEffect(() => {
    let result = [...masterRows];

    if (selectedTableShed.length > 0) {
      result = result.filter((row) => selectedTableShed.includes(row.shed));
    }

    if (selectedMsgFault.length > 0) {
      result = result.filter((row) => {
        const faults = row.faults || [];
        return selectedMsgFault.some((fault) => faults.includes(fault));
      });
    }

    if (selectedLocoMode.length > 0) {
      result = result.filter((row) => selectedLocoMode.includes(row.locoMode));
    }

    setFilteredRows(result);
  }, [selectedMsgFault, selectedLocoMode, selectedTableShed, masterRows]);

  const getSelectedValueForField = (field: string) => {
    if (field === "faults") return selectedMsgFault;
    if (field === "locoMode") return selectedLocoMode;
    if (field === "shed") return selectedTableShed;
    return [];
  };

  const clearColumnFilter = (field: string) => {
    if (field === "faults") setSelectedMsgFault([]);
    else if (field === "locoMode") setSelectedLocoMode([]);
    else if (field === "shed") setSelectedTableShed([]);
  };

  const toggleColumnFilter = (field: string, option: string) => {
    const toggle = (prev: string[]) =>
      prev.includes(option)
        ? prev.filter((v) => v !== option)
        : [...prev, option];

    if (field === "faults") setSelectedMsgFault(toggle);
    else if (field === "locoMode") setSelectedLocoMode(toggle);
    else if (field === "shed") setSelectedTableShed(toggle);
  };

  const loadEventDetails = (row: any) => {
    setDetailRows(row.occurrences || []);
    setDetailOpen(true);
  };

  /*
   * =========================================================
   * EXCEL EXPORT
   * =========================================================
   */

  const createExcelFile = (data: any[], fileName: string) => {
    if (!data.length) {
      showAlert("No records available to export.", "warning");
      return;
    }

    const reportData: Record<string, any>[] = data.map((row: any) => ({
      "Packet Date": row.firstPacketDate ?? "",
      "Msg Sequence": row.messageSequence ?? "",
      Division: row.division ?? "",
      "Loco ID": row.locoId ?? "",
      "Fault Message": Array.isArray(row.faults)
        ? row.faults.join(", ")
        : (row.faults ?? ""),
      "Occurrence Count": row.count ?? "",
      "Loco Frame Num": row.locoFrameNum ?? "",
      "Abs Loc": row.absLoc ?? "",
      Speed: row.speed ?? "",
      "Loco Mode": row.locoMode ?? "",
      "EMR Status": row.emrStatus ?? "",
      RFID: row.rfid ?? "",
      Shed: row.shed ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(reportData, { origin: "A3" } as any);
    XLSX.utils.sheet_add_aoa(ws, [["LOCO FAULT REPORT"]], { origin: "A1" });

    const totalColumns = Object.keys(reportData[0]).length;

    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: totalColumns - 1 },
      },
    ];

    ws["A1"].s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1565C0" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    const headerRow = 2;

    for (let col = 0; col < totalColumns; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
          fill: { fgColor: { rgb: "1565C0" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "0D47A1" } },
            bottom: { style: "thin", color: { rgb: "0D47A1" } },
            left: { style: "thin", color: { rgb: "0D47A1" } },
            right: { style: "thin", color: { rgb: "0D47A1" } },
          },
        };
      }
    }

    ws["!rows"] = [{ hpt: 28 }, { hpt: 8 }, { hpt: 25 }];

    const columnWidths = Object.keys(reportData[0]).map((key) => ({
      wch: Math.min(
        40,
        Math.max(
          key.length,
          ...reportData.map(
            (row: Record<string, any>) => String(row[key] ?? "").length,
          ),
        ) + 2,
      ),
    }));

    ws["!cols"] = columnWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fault Logs");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, fileName);
  };

  const exportToExcel = () => {
    if (!filteredRows.length) {
      showAlert("No records available to export.", "warning");
      return;
    }

    createExcelFile(
      filteredRows,
      `Loco_Fault_Report_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
    );
  };

  const exportAllToExcel = async () => {
    /*
     * Jo filters table par lage hain wahi export honge.
     * Abhi tak kuch apply nahi hua to live filters se
     * bana lo (validation wahi ka wahi).
     */
    const filters = appliedFilters ?? buildFilters();

    if (!filters) return;

    try {
      setExporting(true);

      const response = await axiosInstance.get(ENDPOINTS.export, {
        params: toRequestParams(filters),
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `Loco_Fault_Report_All_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
      );

      showAlert("All records exported successfully.", "success");
    } catch (error: any) {
      console.error("Export All Error:", error);

      const message = await extractBlobError(
        error,
        "Unable to export all records. Please try again.",
      );

      showAlert(message, "error");
    } finally {
      setExporting(false);
    }
  };

  /*
   * =========================================================
   * DERIVED UI FLAGS
   * =========================================================
   */

  const isDivisionMissing = !selectedDivision;

  const isDateRangeInvalid = Boolean(
    !fromDate || !toDate || !toDate.isAfter(fromDate),
  );

  /*
   * Koi bhi request chal rahi ho to saare filters lock.
   */
  const isBusy = loading || exporting || loadingDependents;

  const isApplyBlocked = isDivisionMissing || isDateRangeInvalid || isBusy;

  const hasResults = masterRows.length > 0;

  const showTable = loading || hasResults || Boolean(appliedFilters);

  const lastPageIndex = Math.max(0, Math.ceil(totalRecords / pageSize) - 1);

  return (
    <>
      <Box sx={{ p: 3 }}>
        {/* PAGE TITLE */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#1565C0",
              fontSize: "1.5rem",
            }}
          >
            Loco Fault Report
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "2.5px",
            bgcolor: "#1565C0",
            mb: 3,
          }}
        />

        {/* ------------------------------------------------ */}
        {/* PRIMARY FILTERS */}
        {/* ------------------------------------------------ */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            {/* FROM DATE */}
            <Box sx={{ width: 205 }}>
              <DateTimePicker
                label="From Date"
                value={fromDate}
                disabled={isBusy}
                onChange={(value) => {
                  setFromDate(value);
                  setDatesDirty(true);
                }}
                ampm={false}
                format="DD-MM-YY HH:mm"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            {/* TO DATE */}
            <Box sx={{ width: 205 }}>
              <DateTimePicker
                label="To Date"
                value={toDate}
                disabled={isBusy}
                onChange={(value) => {
                  setToDate(value);
                  setDatesDirty(true);
                }}
                ampm={false}
                format="DD-MM-YY HH:mm"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Box>

            {/* DIVISION - MANDATORY, API SE */}
            <Box sx={{ width: 200 }}>
              <FormControl
                fullWidth
                size="small"
                required
                error={isDivisionMissing}
              >
                <InputLabel id="division-label">Division</InputLabel>
                <Select
                  labelId="division-label"
                  value={selectedDivision}
                  label="Division"
                  disabled={loadingDivisions || isBusy}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                >
                  {divisionsList.map((division) => (
                    <MenuItem key={division} value={division}>
                      {division}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* SHED - API SE, OPTIONAL */}
            <Box sx={{ width: 185 }}>
              <Autocomplete
                size="small"
                options={shedsList}
                value={selectedShed}
                loading={loadingDependents}
                disabled={isDivisionMissing || loadingDependents || isBusy}
                onChange={(_event, value) => setSelectedShed(value)}
                getOptionLabel={(option) => String(option)}
                isOptionEqualToValue={(option, value) =>
                  String(option) === String(value)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Shed"
                    placeholder={
                      isDivisionMissing ? "Select division first" : "All sheds"
                    }
                  />
                )}
              />
            </Box>

            {/* LOCO ID - API SE, OPTIONAL */}
            <Box sx={{ width: 195 }}>
              <Autocomplete
                size="small"
                options={locoList}
                value={selectedLoco}
                loading={loadingDependents}
                disabled={isDivisionMissing || loadingDependents || isBusy}
                onChange={(_event, value) => setSelectedLoco(value)}
                getOptionLabel={(option) => String(option)}
                isOptionEqualToValue={(option, value) =>
                  String(option) === String(value)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Loco ID"
                    placeholder={
                      isDivisionMissing ? "Select division first" : "All locos"
                    }
                  />
                )}
              />
            </Box>

            {/* APPLY */}
            <Tooltip
              title={
                isDivisionMissing
                  ? "Select a division"
                  : isDateRangeInvalid
                    ? "To Date must be later than From Date"
                    : ""
              }
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  disabled={isApplyBlocked}
                  onClick={() => handleApply(pageSize)}
                  sx={{
                    height: 40,
                    px: 3,
                    fontWeight: "bold",
                    bgcolor: "#1565C0",
                    textTransform: "none",
                    borderRadius: "8px",
                    "&:hover": {
                      bgcolor: "#0d47a1",
                    },
                  }}
                >
                  Apply
                </Button>
              </span>
            </Tooltip>

            {/* RESET */}
            <Tooltip title="Reset filters" arrow>
              <IconButton
                onClick={handleReset}
                disabled={isBusy}
                sx={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  height: 40,
                  width: 40,
                  color: "#64748b",
                }}
              >
                <Refresh sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </LocalizationProvider>

        {/* ------------------------------------------------ */}
        {/* TABLE */}
        {/* ------------------------------------------------ */}
        {showTable ? (
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
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
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#1f2937",
                    }}
                  >
                    Loco Fault Records
                  </Typography>

                  <Chip
                    color="primary"
                    variant="filled"
                    size="small"
                    label={`Rows Found: ${totalRecords.toLocaleString()}`}
                    sx={{
                      fontWeight: "bold",
                    }}
                  />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  {/* EXPORT CURRENT PAGE */}
                  <Button
                    startIcon={<Download />}
                    variant="contained"
                    onClick={exportToExcel}
                    disabled={isBusy || !hasResults}
                    sx={{
                      textTransform: "none",
                      borderRadius: "6px",
                      bgcolor: "#1565C0",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "#0d47a1",
                      },
                    }}
                  >
                    Excel
                  </Button>

                  {/* EXPORT ALL */}
                  <Button
                    startIcon={<Download />}
                    variant="contained"
                    onClick={exportAllToExcel}
                    disabled={isBusy || isDivisionMissing}
                    sx={{
                      textTransform: "none",
                      borderRadius: "6px",
                      bgcolor: "#1565C0",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "#0d47a1",
                      },
                    }}
                  >
                    {exporting ? "Exporting..." : "Export All"}
                  </Button>
                </Stack>
              </Stack>

              <Paper
                sx={{
                  width: "100%",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              >
                <div
                  className="overflow-auto"
                  style={{
                    maxHeight: "550px",
                  }}
                >
                  {loading ? (
                    <div className="flex h-[400px] items-center justify-center">
                      <ContentLoading />
                    </div>
                  ) : (
                    <table
                      className="border-collapse w-full"
                      style={{
                        minWidth: `${Math.max(columns.length, 1) * 180}px`,
                      }}
                    >
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-blue-600 border text-white">
                          {columns.map((col) => {
                            const isFilterable =
                              col.field === "faults" ||
                              col.field === "locoMode" ||
                              col.field === "shed";

                            return (
                              <th
                                key={col.field}
                                className="relative border border-blue-700 px-4 py-3 text-left text-sm font-bold whitespace-nowrap tracking-wider"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span>{col.headerName}</span>

                                  {isFilterable && (
                                    <div className="relative inline-block">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveHeaderDropdown(
                                            activeHeaderDropdown === col.field
                                              ? null
                                              : col.field,
                                          );
                                        }}
                                        sx={{
                                          color:
                                            activeHeaderDropdown === col.field
                                              ? "#fff"
                                              : "rgba(255,255,255,0.7)",
                                          backgroundColor:
                                            activeHeaderDropdown === col.field
                                              ? "rgba(255,255,255,0.2)"
                                              : "transparent",
                                        }}
                                      >
                                        <FilterList
                                          style={{
                                            fontSize: "16px",
                                          }}
                                        />
                                      </IconButton>

                                      {activeHeaderDropdown === col.field && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-40"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveHeaderDropdown(null);
                                            }}
                                          />

                                          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-xl z-50 text-gray-800 font-normal py-1 max-h-60 overflow-y-auto">
                                            <div className="px-3 py-1.5 text-xs font-semibold border-b bg-gray-50 text-gray-500 sticky top-0 z-10">
                                              Filter By {col.headerName}
                                            </div>

                                            <div
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                clearColumnFilter(col.field);
                                                setActiveHeaderDropdown(null);
                                              }}
                                              className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                            >
                                              All Records
                                            </div>

                                            {(col.field === "faults"
                                              ? uniqueMsgFaults
                                              : col.field === "locoMode"
                                                ? uniqueLocoModes
                                                : uniqueTableSheds
                                            ).map((opt) => (
                                              <div
                                                key={opt}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleColumnFilter(
                                                    col.field,
                                                    opt,
                                                  );
                                                }}
                                                className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-blue-50"
                                              >
                                                <Checkbox
                                                  size="small"
                                                  checked={getSelectedValueForField(
                                                    col.field,
                                                  ).includes(opt)}
                                                />
                                                <span>{opt}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRows.map((row, index) => (
                          <tr
                            key={row.id || index}
                            className={`hover:bg-blue-50 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            {columns.map((col) => (
                              <td
                                key={col.field}
                                className="border border-gray-200 px-4 py-2.5 text-sm whitespace-nowrap text-gray-800"
                              >
                                {col.field === "firstPacketDate" ? (
                                  <span className="font-medium text-gray-600">
                                    {dayjs(row.firstPacketDate).format(
                                      "DD-MM-YYYY",
                                    )}
                                    {" | "}
                                    <span className="text-blue-600 font-bold">
                                      {dayjs(row.firstPacketDate).format(
                                        "HH:mm:ss",
                                      )}
                                    </span>
                                  </span>
                                ) : col.field === "faults" ? (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.8,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded border border-red-200">
                                      {Array.isArray(row.faults)
                                        ? row.faults.join(", ")
                                        : "-"}
                                    </span>

                                    {row.count > 1 && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => loadEventDetails(row)}
                                        sx={{
                                          minWidth: 42,
                                          height: 30,
                                          px: 1.5,
                                          fontWeight: 700,
                                          textTransform: "none",
                                          borderRadius: "6px",
                                          bgcolor: "#40c240",
                                          color: "#0a0a0a",
                                          "&:hover": {
                                            bgcolor: "#07f007",
                                          },
                                        }}
                                      >
                                        {row.count}
                                      </Button>
                                    )}
                                  </Box>
                                ) : (
                                  (row[col.field] ?? "-")
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}

                        {!filteredRows.length && !loading && (
                          <tr>
                            <td
                              colSpan={Math.max(columns.length, 1)}
                              className="text-center py-8 text-gray-500"
                            >
                              No records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* ------------------------------------------------ */}
                {/* PAGINATION */}
                {/* ------------------------------------------------ */}
                <div className="flex items-center justify-end gap-6 border-t bg-white px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">
                      Rows per page:
                    </span>

                    <select
                      value={pageSize}
                      disabled={isBusy}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPageSize(newSize);
                        setPage(0);

                        if (appliedFilters) {
                          fetchReport(appliedFilters, 0, newSize);
                        }
                      }}
                      className="rounded border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold outline-none text-gray-700 focus:border-blue-500 cursor-pointer"
                    >
                      {[25, 50, 100, 200, 500].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm font-medium text-gray-700 tracking-wide">
                    {totalRecords === 0 ? 0 : page * pageSize + 1}
                    {" – "}
                    {Math.min((page + 1) * pageSize, totalRecords)}
                    {" of "}
                    <span className="font-bold text-blue-600">
                      {totalRecords.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(0)}
                      disabled={page === 0 || isBusy}
                      className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronsLeft size={18} />
                    </button>

                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0 || isBusy}
                      className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={(page + 1) * pageSize >= totalRecords || isBusy}
                      className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronRight size={18} />
                    </button>

                    <button
                      onClick={() => handlePageChange(lastPageIndex)}
                      disabled={
                        totalRecords === 0 ||
                        (page + 1) * pageSize >= totalRecords ||
                        isBusy
                      }
                      className="rounded p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
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
              minHeight: 400,
              borderRadius: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mt: 2,
              border: "1px dashed #cbd5e1",
              bgcolor: "#f8fafc",
              p: 4,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "rgba(25,118,210,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <FilterList
                sx={{
                  fontSize: 40,
                  color: "#1565C0",
                }}
              />
            </Box>

            <Typography
              variant="h6"
              fontWeight={700}
              color="#334155"
              gutterBottom
            >
              Select filters to run the report
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
              textAlign="center"
            >
              Choose a division and click Apply. Shed and Loco ID are optional,
              and the date range has no limit.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* ====================================================== */}
      {/* EVENT DETAILS POPUP */}
      {/* ====================================================== */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#1565C0",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
            px: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <TrainIcon />
            <Typography variant="h6" fontWeight={700}>
              Fault Event Details
            </Typography>
          </Box>

          <IconButton
            onClick={() => setDetailOpen(false)}
            sx={{ color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ maxHeight: 500 }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f4f6f8" }}>
                    Packet Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f4f6f8" }}>
                    Msg Sequence
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f4f6f8" }}>
                    Loco
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f4f6f8" }}>
                    Fault
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f4f6f8" }}>
                    Division
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: "#f4f6f8" }}>
                    Shed
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {detailRows.map((row: any, index: number) => (
                  <TableRow
                    key={row.id || index}
                    hover
                    sx={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafafa",
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>
                        {dayjs(row.packetDate).format("DD-MM-YYYY HH:mm:ss")}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={600} color="text.secondary">
                        {row.messageSequence ?? "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={row.locoId}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      {Array.isArray(row.faults) ? (
                        row.faults.map((fault: string) => (
                          <Chip
                            key={fault}
                            label={fault}
                            size="small"
                            color="error"
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              fontWeight: 600,
                            }}
                          />
                        ))
                      ) : (
                        <Chip label={row.faults} color="error" size="small" />
                      )}
                    </TableCell>

                    <TableCell>{row.division}</TableCell>

                    <TableCell>
                      <Chip
                        label={row.shed}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {detailRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        No records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Typography
            sx={{
              flexGrow: 1,
              color: "text.secondary",
              fontWeight: 500,
            }}
          >
            Total Packets : {detailRows.length}
          </Typography>

          <Button variant="contained" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LocoFaultReportPage;
