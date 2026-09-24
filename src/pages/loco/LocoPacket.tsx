import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Typography,
  Box,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Search,
  SlidersHorizontal,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Train,
  Eye,
  Check,
} from "lucide-react";
import { axiosInstance } from "../../services/axios";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

// --- EXPORTED CONTENT LOADING SCREEN COMPONENT ---
export const ContentLoading: React.FC = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: "450px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Train size={48} color="#1565C0" />
      <CircularProgress sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading Report...
      </Typography>
    </Box>
  );
};

// --- INTERFACES ---
interface FaultDetail {
  faultCodeType: string;
  moduleId: number;
  faultCode: number;
  faultMessage: string;
}

interface EventDetail {
  ID: number;
  eventId: string;
  eventField: string;
  eventValue: string;
  PARENT_ID: number;
}

interface RadioRssiInfo {
  DRefRFID: number;
  RefRFIDTag: number;
  AbsRefRFIDTag: number;
  RSSIValue: number;
}

interface DmiEventJson {
  [key: string]: string | number | boolean | null;
}

interface PacketData {
  _rowId: number;
  id: number;
  dateTimeFormatted: string | null;
  msgTime: string;
  stationaryKavachId?: string;
  firmName?: string;
  systemVersion: string | null;
  locoId?: number | null;
  kavachSubsystemType?: string;
  totalFaultCodesF?: string;
  faultData?: FaultDetail[];
  eventCount?: string;
  events?: EventDetail[];
  sof?: string;
  messageType?: string;
  messageLength?: string;
  messageSequence?: string;
  locoTcasId?: string;
  nmsSystemId?: string;
  macCode?: string;
  crc?: string;
  pkt?: string;
  locoVersion?: string;
  eventSeq?: number;
  dmiEventId?: number;
  eventJson?: DmiEventJson;

  // Type 20 Specific Fields
  locoKavachId?: string;
  section?: string;
  divisionName?: string;
  zoneName?: string;
  nmsIpAddress?: string;

  radio1SampleCount?: string;
  radio2SampleCount?: string;

  radio1Info?: RadioRssiInfo[];
  radio2Info?: RadioRssiInfo[];
  // Type 1A Specific Fields
  onboardKavachId?: string;
  nmsIpId?: string;
}

type ApiType = "19" | "18" | "1C" | "20" | "1A";

interface Type1ASubReports {
  stnRegular: any[];
  accessAuthority: any[];
  additionalEmergency: any[];
  accessRequest: any[];
  onboardReguler: any[];
}

export default function PacketDashboard() {
  const [packets, setPackets] = useState<PacketData[]>([]);
  const [locoIds, setLocoIds] = useState<any[]>([]);
  const [locoId, setLocoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [apiType, setApiType] = useState<ApiType>("19");
  const [openFilter, setOpenFilter] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PacketData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Sub-reports state for Type 1A modal
  const [subReports1A, setSubReports1A] = useState<Type1ASubReports>({
    stnRegular: [],
    accessAuthority: [],
    additionalEmergency: [],
    accessRequest: [],
    onboardReguler: [],
  });
  const [loading1ADetails, setLoading1ADetails] = useState(false);
  const [activeTab1A, setActiveTab1A] = useState(0);

  const [fromDateInput, setFromDateInput] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );

  const [toDateInput, setToDateInput] = useState<Dayjs | null>(
    dayjs().endOf("day"),
  );

  const [appliedFromDate, setAppliedFromDate] = useState<Dayjs | null>(
    dayjs().startOf("day"),
  );

  const [appliedToDate, setAppliedToDate] = useState<Dayjs | null>(
    dayjs().endOf("day"),
  );

  // Fetch Dropdown Loco IDs using COMMON API across all packet types
  useEffect(() => {
    const loadCommonLocoIds = async () => {
      try {
        const response = await axiosInstance.get(
          "/msgType19Loco/getStationaryKavachIds",
        );
        const fetchedIds = response.data.data || response.data || [];
        setLocoIds(fetchedIds);
      } catch (error) {
        console.error("Failed to load common loco ids", error);
        setLocoIds([]);
      }
    };
    loadCommonLocoIds();
  }, []);

  // Primary Synchronized API Stream Hook
  useEffect(() => {
    let active = true;

    const fetchPackets = async () => {
      setLoading(true);
      try {
        let endpointTarget = "";

        if (apiType === "19") {
          const formattedFrom = appliedFromDate
            ? appliedFromDate.format("DD-MM-YYYY HH:mm:ss")
            : "";
          const formattedTo = appliedToDate
            ? appliedToDate.format("DD-MM-YYYY HH:mm:ss")
            : "";
          endpointTarget = `/msgType19Loco/getData?page=${page}&size=${pageSize}&stationaryKavachId=${locoId}&fromDate=${encodeURIComponent(formattedFrom)}&toDate=${encodeURIComponent(formattedTo)}`;
        } else if (apiType === "18") {
          const formattedFrom = appliedFromDate
            ? appliedFromDate.format("YYYY-MM-DD HH:mm:ss")
            : "";
          const formattedTo = appliedToDate
            ? appliedToDate.format("YYYY-MM-DD HH:mm:ss")
            : "";
          endpointTarget = `/api/msg-type-18?page=${page}&size=${pageSize}&stationaryKavachId=${locoId}&fromDate=${encodeURIComponent(formattedFrom)}&toDate=${encodeURIComponent(formattedTo)}`;
        } else if (apiType === "1C") {
          const formattedFrom = appliedFromDate
            ? appliedFromDate.format("DD-MM-YYYY HH:mm:ss")
            : "";
          const formattedTo = appliedToDate
            ? appliedToDate.format("DD-MM-YYYY HH:mm:ss")
            : "";
          endpointTarget = `/mt1c-dmi-event/getAll?page=${page}&size=${pageSize}&fromDate=${encodeURIComponent(formattedFrom)}&toDate=${encodeURIComponent(formattedTo)}${locoId ? `&locoId=${locoId}` : ""}`;
        } else if (apiType === "20") {
          const formattedFrom = appliedFromDate
            ? appliedFromDate.format("DD:MM:YYYY")
            : "";
          const formattedTo = appliedToDate
            ? appliedToDate.format("DD:MM:YYYY")
            : "";
          endpointTarget = `/msg-type-20/paginated?page=${page}&size=${pageSize}&sortBy=id&sortDir=desc&fromDate=${encodeURIComponent(formattedFrom)}&toDate=${encodeURIComponent(formattedTo)}${locoId ? `&stationaryKavachId=${locoId}` : ""}`;
        } else if (apiType === "1A") {
          endpointTarget = `/api/msg-type-1a?page=${page}&size=${pageSize}${locoId ? `&locoId=${locoId}` : ""}`;
        }

        const response = await axiosInstance.get(endpointTarget);
        if (active) {
          const rawRows = Array.isArray(response.data?.data?.content)
            ? response.data.data.content
            : Array.isArray(response.data?.content)
              ? response.data.content
              : Array.isArray(response.data?.data)
                ? response.data.data
                : [];
          const normalizedRows: PacketData[] = rawRows.map((item: any) => {
            const rowId = item.id ?? item.ID ?? Math.random();

            if (apiType === "1A") {
              return {
                _rowId: rowId,
                id: rowId,
                dateTimeFormatted: item.dateTime || null,
                messageType: item.messageType || "1A",
                nmsIpId: item.nmsIpId || "N/A",
                nmsSystemId: item.nmsSystemId || "",
                onboardKavachId: item.onboardKavachId || "",
                systemVersion: item.systemVersion || "N/A",
                msgTime: item.msgTime || "",
                sof: item.sof || "",
                messageLength: item.messageLength || "",
                messageSequence:
                  item.messageSequence ||
                  item.MESSAGE_SEQUENCE ||
                  item.msgSeq ||
                  "",
                crc: item.crc || "",
                pkt: item.pkt || "",
              };
            }

            if (apiType === "20") {
              return {
                _rowId: rowId,
                id: rowId,
                msgTime: item.msgTime || "",
                sof: item.sof || "",
                messageType: item.messageType || "20",
                messageLength: item.messageLength || "",
                messageSequence:
                  item.messageSequence ||
                  item.MESSAGE_SEQUENCE ||
                  item.msgSeq ||
                  "",
                locoKavachId: item.locoKavachId || "",
                stationaryKavachId: item.stationaryKavachId || "",
                nmsSystemId: item.nmsSystemId || "",
                systemVersion: item.systemVersion || "N/A",
                dateTimeFormatted: item.dateTime || null,
                crc: item.crc || "",
                nmsIpAddress: item.nmsIp?.ip || "N/A",
                divisionName: item.nmsIp?.division?.name || "N/A",
                zoneName: item.nmsIp?.division?.zone?.name || "N/A",
                firmName: item.nmsIp?.firm?.name || "N/A",
                section: item.nmsIp?.section || "N/A",
                radio1SampleCount: item.stationRadio1RssiSampleCount || "00",
                radio1Info: item.stationRadio1RssiInfo
                  ? JSON.parse(item.stationRadio1RssiInfo)
                  : [],
                radio2Info: item.stationRadio2RssiInfo
                  ? JSON.parse(item.stationRadio2RssiInfo)
                  : [],
              };
            }

            if (apiType === "1C") {
              return {
                _rowId: item.msgId,
                id: item.msgId,
                msgTime: item.msgTime,
                firmName: item.firmName,
                locoId: Number(item.locoId),
                locoTcasId: item.locoTcasId,
                systemVersion: item.locoVersion,
                locoVersion: item.locoVersion,
                messageSequence:
                  item.messageSequence ||
                  item.MESSAGE_SEQUENCE ||
                  item.msgSeq ||
                  item.eventSeq ||
                  "",
                eventSeq: item.eventSeq,
                dmiEventId: item.dmiEventId,
                eventJson: item.eventJson,
              };
            }

            if (apiType === "18") {
              return {
                _rowId: rowId,
                id: rowId,
                dateTimeFormatted:
                  item.DATE_TIME || item.DATE_TIME_FORMATTED || null,
                msgTime: item.MSG_TIME || item.msgTime || "",
                messageSequence:
                  item.MESSAGE_SEQUENCE ||
                  item.messageSequence ||
                  item.msgSeq ||
                  "",
                stationaryKavachId:
                  item.STATIONARY_KAVACH_ID || item.stationaryKavachId || "",
                firmName: item.FIRM_NAME || item.firmName || "",
                systemVersion:
                  item.SYSTEM_VERSION || item.systemVersion || "N/A",
                eventCount: item.EVENT_COUNT || item.eventCount || "0",
                events: item.EVENTS || item.events || [],
                locoId:
                  item.STATIONARY_KAVACH_ID || item.stationaryKavachId
                    ? Number(
                        item.STATIONARY_KAVACH_ID || item.stationaryKavachId,
                      )
                    : null,
              };
            }
            return {
              _rowId: rowId,
              id: rowId,
              dateTimeFormatted:
                item.dateTimeFormatted ||
                item.DATE_TIME_FORMATTED ||
                item.dateTime ||
                null,
              msgTime: item.msgTime || "",
              messageSequence:
                item.messageSequence ||
                item.MESSAGE_SEQUENCE ||
                item.msgSeq ||
                "",
              stationaryKavachId: item.stationaryKavachId || "",
              firmName: item.firmName || "",
              systemVersion: item.systemVersion || "N/A",
              locoId:
                item.locoId ||
                (item.stationaryKavachId
                  ? Number(item.stationaryKavachId)
                  : null),
              kavachSubsystemType:
                item.kavachSubsystemType || item.KAVACH_SUBSYSTEM_TYPE || "",
              totalFaultCodesF:
                item.totalFaultCodes ||
                item.totalFaultCodesF ||
                item.TOTAL_FAULT_CODES_F ||
                "-",
              faultData: item.faults || item.faultData || item.FAULT_DATA || [],
            };
          });

          setPackets(normalizedRows);

          setTotalRows(
            response.data.totalRecords ??
              response.data.total ??
              response.data.totalElements ??
              response.data.page?.totalElements ??
              response.data.content?.length ??
              normalizedRows.length ??
              0,
          );
          setTotalPages(
            response.data.totalPages ??
              response.data.page?.totalPages ??
              Math.ceil(
                (response.data.totalRecords ??
                  response.data.total ??
                  response.data.totalElements ??
                  0) / pageSize,
              ),
          );
        }
      } catch (err) {
        console.error("Data tracking failure:", err);
        if (active) {
          setPackets([]);
          setTotalRows(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPackets();
    return () => {
      active = false;
    };
  }, [
    apiType,
    locoId,
    appliedFromDate,
    appliedToDate,
    page,
    pageSize,
    refreshKey,
  ]);

  const handleApplyDateFilter = () => {
    setAppliedFromDate(fromDateInput);
    setAppliedToDate(toDateInput);
    setPage(0);
  };

  const resetFilters = () => {
    const defaultFrom = dayjs().subtract(30, "day");
    const defaultTo = dayjs();
    setApiType("19");
    setLocoId("");
    setSearchTerm("");
    setFromDateInput(defaultFrom);
    setToDateInput(defaultTo);
    setAppliedFromDate(defaultFrom);
    setAppliedToDate(defaultTo);
    setPage(0);
    setPageSize(50);
  };

  const filteredPackets = packets.filter((p) => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase();

    const searchable = [
      p.msgTime,
      p.locoId,
      p.stationaryKavachId,
      p.locoTcasId,
      p.locoKavachId,
      p.firmName,
      p.systemVersion,
      p.locoVersion,
      p.divisionName,
      p.zoneName,
      p.section,
      p.nmsIpAddress,
      p.messageType,
      p.messageSequence,
      p.onboardKavachId,
      p.nmsIpId,
      p.eventSeq,
      p.dmiEventId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(search);
  });

  const handleExportExcel = () => {
    try {
      let exportData: any[] = [];
      if (apiType === "1A") {
        exportData = filteredPackets.map((row) => ({
          DateTime: row.dateTimeFormatted,
          MessageType: row.messageType,
          MessageSequence: row.messageSequence || "N/A",
          NmsIpId: row.nmsIpId,
          NmsSystemId: row.nmsSystemId,
          OnboardKavachId: row.onboardKavachId,
          SystemVersion: row.systemVersion,
        }));
      } else if (apiType === "20") {
        exportData = filteredPackets.map((row) => ({
          MessageTime: row.msgTime,
          MessageSequence: row.messageSequence || "N/A",
          LocoKavachId: row.locoKavachId,
          StationaryId: row.stationaryKavachId,
          FirmName: row.firmName,
          Section: row.section,
          Division: row.divisionName,
          Zone: row.zoneName,
          SystemVersion: row.systemVersion,
        }));
      } else if (apiType === "19") {
        exportData = filteredPackets.map((row) => ({
          MessageTime: row.msgTime,
          MessageSequence: row.messageSequence || "N/A",
          LocoId: row.locoId || row.stationaryKavachId,
          FirmName: row.firmName,
          SystemVersion: row.systemVersion,
          TotalFaults: row.totalFaultCodesF,
          Subsystem: row.kavachSubsystemType,
        }));
      } else if (apiType === "18") {
        exportData = filteredPackets.map((row) => ({
          MessageTime: row.msgTime,
          MessageSequence: row.messageSequence || "N/A",
          LocoId: row.locoId || row.stationaryKavachId,
          FirmName: row.firmName,
          SystemVersion: row.systemVersion,
          EventCount: row.eventCount,
        }));
      } else if (apiType === "1C") {
        exportData = filteredPackets.map((row) => ({
          MessageTime: row.msgTime,
          MessageSequence: row.messageSequence || "N/A",
          LocoId: row.locoId,
          LocoTCASId: row.locoTcasId,
          FirmName: row.firmName,
          Version: row.locoVersion || row.systemVersion,
          EventSeq: row.eventSeq,
          DmiEventId: row.dmiEventId,
          EventJson: JSON.stringify(row.eventJson ?? {}),
        }));
      }

      if (!exportData.length) {
        alert("No data available for export.");
        return;
      }

      const worksheet = XLSX.utils.aoa_to_sheet([]);
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ["KAVACH PACKET REPORT"],
          [
            `Packet Type : ${apiType === "1A" ? "Type 1A Packet Log" : apiType === "20" ? "Type 20 Packet Log" : apiType === "19" ? "Kavach Fault Log (19)" : apiType === "18" ? "Loco Kavach Health (18)" : "DMI Event Packet (1C)"}`,
          ],
          [`Exported On : ${new Date().toLocaleString("en-IN")}`],
          [`Total Records : ${exportData.length}`],
          [],
        ],
        { origin: "A1" },
      );
      XLSX.utils.sheet_add_json(worksheet, exportData, {
        origin: "A6",
        skipHeader: false,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Type_${apiType}`);
      const totalColumns = Object.keys(exportData[0]).length;
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalColumns - 1 } },
      ];

      if (worksheet["A1"]) {
        worksheet["A1"].s = {
          font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E3A8A" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      }
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      saveAs(new Blob([excelBuffer]), `KAVACH_${apiType}_REPORT.xlsx`);
    } catch (error) {
      console.error("Excel export failed:", error);
    }
  };

  // Trigger Modal and 1A Sub-Reports API calls concurrently
  const handleRowView = async (e: React.MouseEvent, row: PacketData) => {
    e.stopPropagation();
    setSelectedRow(row);
    setOpenDialog(true);

    if (apiType === "1A") {
      setLoading1ADetails(true);
      setActiveTab1A(0);
      try {
        const rowId = row.id;
        const [
          stnRes,
          accessAuthRes,
          addEmergRes,
          accessReqRes,
          onboardRegulerRes,
        ] = await Promise.allSettled([
          axiosInstance.get(`/api/msg-type-1a/${rowId}/reports/STN_REGULAR`),
          axiosInstance.get(
            `/api/msg-type-1a/${rowId}/reports/ACCESS_AUTHORITY`,
          ),
          axiosInstance.get(
            `/api/msg-type-1a/${rowId}/reports/ADDITIONAL_EMERGENCY`,
          ),
          axiosInstance.get(`/api/msg-type-1a/${rowId}/reports/ACCESS_REQUEST`),
          axiosInstance.get(`/api/msg-type-1a/${rowId}/reports/OBK_REGULAR`),
        ]);

        const extractData = (res: PromiseSettledResult<any>) => {
          if (res.status === "fulfilled") {
            const data = res.value.data;
            return Array.isArray(data?.content)
              ? data.content
              : Array.isArray(data?.data?.content)
                ? data.data.content
                : Array.isArray(data?.data)
                  ? data.data
                  : Array.isArray(data)
                    ? data
                    : [];
          }
          return [];
        };

        setSubReports1A({
          stnRegular: extractData(stnRes),
          accessAuthority: extractData(accessAuthRes),
          additionalEmergency: extractData(addEmergRes),
          accessRequest: extractData(accessReqRes),
          onboardReguler: extractData(onboardRegulerRes),
        });
      } catch (err) {
        console.error("Failed to fetch 1A sub-reports:", err);
      } finally {
        setLoading1ADetails(false);
      }
    }
  };

  // Dynamic table builder for 1A Sub-Reports
  const renderTableFromData = (dataList: any[]) => {
    if (!dataList || dataList.length === 0) {
      return (
        <Typography
          variant="body2"
          sx={{
            fontStyle: "italic",
            color: "#94a3b8",
            p: 2,
            textAlign: "center",
          }}
        >
          No records found for this sub-report.
        </Typography>
      );
    }

    const headers = Object.keys(dataList[0]);

    return (
      <div className="w-full border border-slate-200 rounded-xl overflow-x-auto max-h-80 bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 sticky top-0 border-b border-slate-200">
            <tr>
              <th className="p-2.5 font-bold text-slate-700 uppercase">#</th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="p-2.5 font-bold text-slate-700 uppercase whitespace-nowrap"
                >
                  {h.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
            {dataList.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="p-2.5 font-bold text-slate-400">{index + 1}</td>
                {headers.map((h) => (
                  <td key={h} className="p-2.5 whitespace-nowrap">
                    {typeof item[h] === "object" && item[h] !== null
                      ? JSON.stringify(item[h])
                      : String(item[h] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const currentStartOffset = totalRows === 0 ? 0 : page * pageSize + 1;
  const currentEndOffset = Math.min((page + 1) * pageSize, totalRows);

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans text-slate-800">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-700">Loco Packet Logs</h1>
          <button
            onClick={() => setOpenFilter((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              openFilter
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-blue-500 text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Filter size={18} /> Filter
          </button>
        </div>
        <div className="mt-4 border-b-2 border-blue-600"></div>
      </div>

      {openFilter && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-blue-600" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-blue-500 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none font-medium cursor-pointer"
                value={apiType}
                onChange={(e) => {
                  setApiType(e.target.value as ApiType);
                  setPage(0);
                }}
              >
                <option value="19">Kavach Fault Log-19</option>
                <option value="18">Loco Kavach Health-18</option>
                <option value="1C">DMI Event Packet-1C</option>
                <option value="20">Loco Kavach RSSI-20</option>
                {/* <option value="1A">OBK Kavach Msg-1A </option> */}
              </select>
            </div>

            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg appearance-none focus:outline-none font-medium cursor-pointer"
                value={locoId}
                onChange={(e) => {
                  setLocoId(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All Loco IDs</option>
                {locoIds.map((item, idx) => {
                  const targetVal = item?.stationaryKavachId || item;
                  return (
                    <option key={idx} value={targetVal}>
                      {targetVal}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 bg-slate-50 rounded-lg transition-colors"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="flex items-center gap-2">
                <DateTimePicker
                  label="From Date"
                  value={fromDateInput}
                  onChange={(value) => setFromDateInput(value)}
                  ampm={false}
                  format={
                    apiType === "20"
                      ? "DD:MM:YYYY"
                      : apiType === "18"
                        ? "YYYY-MM-DD HH:mm:ss"
                        : "DD-MM-YYYY HH:mm:ss"
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 220 },
                    },
                  }}
                />

                <DateTimePicker
                  label="To Date"
                  value={toDateInput}
                  onChange={(value) => setToDateInput(value)}
                  ampm={false}
                  format={
                    apiType === "20"
                      ? "DD:MM:YYYY"
                      : apiType === "18"
                        ? "YYYY-MM-DD HH:mm:ss"
                        : "DD-MM-YYYY HH:mm:ss"
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 220 },
                    },
                  }}
                />
              </div>
            </LocalizationProvider>

            <button
              onClick={handleApplyDateFilter}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition shadow-sm"
              title="Apply Date Range Filter"
            >
              <Check size={16} /> Apply
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="grid grid-cols-3 items-center">
            <div>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                Total Records : {totalRows}
              </span>
            </div>
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                {apiType === "19"
                  ? "Kavach Fault Log (Type 19)"
                  : apiType === "18"
                    ? "Loco Kavach Health (Type 18)"
                    : apiType === "1C"
                      ? "DMI Event Packet (Type 1C)"
                      : apiType === "20"
                        ? "Loco Kavach RSSI (Type 20)"
                        : "Kavach Message Log (Type 1A)"}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-sm"
              >
                <Download className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setLoading(true);
                  setRefreshKey((prev) => prev + 1);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-sm"
              >
                <RotateCw
                  className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[550px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-blue-700 text-white text-sm font-semibold tracking-wider">
                  <th className="py-3 px-4 w-16 text-center border-r border-blue-600/30">
                    S.No
                  </th>
                  <th className="py-3 px-6">Message Time</th>
                  <th className="py-3 px-6 text-center">Msg Sequence</th>

                  {apiType === "1A" ? (
                    <>
                      <th className="py-3 px-6 text-center">Message Type</th>
                      <th className="py-3 px-6 text-center">NMS IP ID</th>
                      <th className="py-3 px-6 text-center">
                        Onboard Kavach ID
                      </th>
                      <th className="py-3 px-6 text-center">System Version</th>
                    </>
                  ) : apiType === "20" ? (
                    <>
                      <th className="py-3 px-6 text-center">Loco Kavach ID</th>
                      <th className="py-3 px-6 text-center">Firm</th>
                      <th className="py-3 px-6 text-center">System Version</th>
                    </>
                  ) : apiType === "1C" ? (
                    <>
                      <th className="py-3 px-6 text-center">Loco ID</th>
                      <th className="py-3 px-6 text-center">Firm</th>
                      <th className="py-3 px-6 text-center">Version</th>
                      <th className="py-3 px-6 text-center">Event Sequence</th>
                      <th className="py-3 px-6 text-center">DMI Event ID</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-6 text-center">Loco ID</th>
                      <th className="py-3 px-6 text-center">Firm Name</th>
                      <th className="py-3 px-6 text-center">Version</th>
                    </>
                  )}

                  {apiType === "19" && (
                    <>
                      <th className="py-3 px-6 text-center">Total Faults</th>
                      <th className="py-3 px-6 text-center">Subsystem</th>
                    </>
                  )}
                  {apiType === "18" && (
                    <>
                      <th className="py-3 px-6 text-center">Event Count</th>
                    </>
                  )}

                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-0 bg-slate-50/50">
                      <ContentLoading />
                    </td>
                  </tr>
                ) : filteredPackets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="py-10 text-center text-slate-400 italic bg-slate-50/50"
                    >
                      No log packets recorded matching query criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPackets.map((row, idx) => (
                    <tr
                      key={row._rowId}
                      onClick={(e) => handleRowView(e, row)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-normal border-r border-slate-100">
                        {page * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-6 font-semibold text-slate-900">
                        {row.msgTime || "N/A"}
                      </td>
                      <td className="py-3 px-6 text-center font-mono font-bold text-slate-700">
                        {row.messageSequence || "N/A"}
                      </td>

                      {apiType === "1A" ? (
                        <>
                          <td className="py-3 px-6 text-center font-bold text-indigo-700">
                            {row.messageType || "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center">
                            {row.nmsIpId || "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center text-amber-700 font-bold">
                            {row.onboardKavachId || "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center text-slate-500 font-mono">
                            {row.systemVersion || "N/A"}
                          </td>
                        </>
                      ) : apiType === "20" ? (
                        <>
                          <td className="py-3 px-6 text-center font-bold text-blue-700">
                            {row.locoKavachId || "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded font-bold">
                              {row.firmName || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            {row.systemVersion || "N/A"}
                          </td>
                        </>
                      ) : apiType === "1C" ? (
                        <>
                          <td className="py-3 px-6 text-center font-bold text-slate-800">
                            {row.locoId ?? "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded font-bold">
                              {row.firmName || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center font-mono text-slate-500">
                            {row.locoVersion || row.systemVersion || "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center font-semibold text-slate-800">
                            {row.eventSeq ?? "N/A"}
                          </td>
                          <td className="py-3 px-6 text-center font-semibold text-slate-800">
                            {row.dmiEventId ?? "N/A"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-0.5 rounded font-bold">
                              {row.locoId || row.stationaryKavachId
                                ? `${row.locoId || row.stationaryKavachId}`
                                : "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-0.5 rounded font-bold">
                              {row.firmName || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center text-slate-500 font-mono">
                            {row.systemVersion}
                          </td>
                        </>
                      )}

                      {apiType === "19" && (
                        <>
                          <td className="py-3 px-6 text-center text-red-600 font-bold">
                            {row.totalFaultCodesF}
                          </td>
                          <td className="py-3 px-6 text-center text-slate-500">
                            {row.kavachSubsystemType || "N/A"}
                          </td>
                        </>
                      )}
                      {apiType === "18" && (
                        <td className="py-3 px-6 text-center text-slate-900 font-bold">
                          {row.eventCount}
                        </td>
                      )}

                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={(e) => handleRowView(e, row)}
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-semibold px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="ml-2 font-medium text-slate-600">
              Showing {currentStartOffset} to {currentEndOffset} of {totalRows}{" "}
              records
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {page + 1} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor:
              apiType === "1C"
                ? "#5b21b6"
                : apiType === "1A"
                  ? "#0369a1"
                  : "#1d4ed8",
            color: "#fff",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Detailed Packet Logs [Type {apiType}] - ID: {selectedRow?.id}
          </Typography>
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ color: "#fff" }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#f8fafc", p: 3 }}>
          {selectedRow && (
            <Box display="flex" flexDirection="column" gap={3}>
              <div>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#64748b",
                    fontWeight: 700,
                    mb: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  General Information
                </Typography>
                {apiType === "1C" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Message Time
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.msgTime || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Msg Sequence
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.messageSequence || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Loco ID
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.locoId ?? "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Loco TCAS ID
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.locoTcasId || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Firm
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.firmName || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Version
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.locoVersion ||
                          selectedRow.systemVersion ||
                          "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Event Sequence
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.eventSeq ?? "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        DMI Event ID
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.dmiEventId ?? "N/A"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Message Time
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.msgTime || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        Message Sequence
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.messageSequence || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <div className="text-xs text-slate-500 font-medium">
                        System Version
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {selectedRow.systemVersion || "N/A"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Divider />

              {/* DYNAMIC TYPE 1A SUB-REPORTS */}
              {apiType === "1A" && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#0369a1",
                      fontWeight: 700,
                      mb: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    1A Sub-Reports (ID: {selectedRow.id})
                  </Typography>

                  {loading1ADetails ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : (
                    <>
                      <Box
                        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
                      >
                        <Tabs
                          value={activeTab1A}
                          onChange={(_, val) => setActiveTab1A(val)}
                          textColor="primary"
                          indicatorColor="primary"
                        >
                          <Tab
                            label={`STN Regular (${subReports1A.stnRegular.length})`}
                          />
                          <Tab
                            label={`Access Authority (${subReports1A.accessAuthority.length})`}
                          />
                          <Tab
                            label={`Additional Emergency (${subReports1A.additionalEmergency.length})`}
                          />
                          <Tab
                            label={`Access Request (${subReports1A.accessRequest.length})`}
                          />
                          <Tab
                            label={`Onboard Reguler (${subReports1A.onboardReguler.length})`}
                          />
                        </Tabs>
                      </Box>

                      {activeTab1A === 0 &&
                        renderTableFromData(subReports1A.stnRegular)}
                      {activeTab1A === 1 &&
                        renderTableFromData(subReports1A.accessAuthority)}
                      {activeTab1A === 2 &&
                        renderTableFromData(subReports1A.additionalEmergency)}
                      {activeTab1A === 3 &&
                        renderTableFromData(subReports1A.accessRequest)}
                      {activeTab1A === 4 &&
                        renderTableFromData(subReports1A.onboardReguler)}
                    </>
                  )}
                </Box>
              )}

              {apiType === "20" && (
                <div className="space-y-4">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      mb: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Other Details
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white border rounded-lg shadow-sm">
                      <div className="text-xs text-slate-400 font-semibold">
                        Loco Kavach ID
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {selectedRow.locoKavachId}
                      </div>
                    </div>

                    <div className="p-3 bg-white border rounded-lg shadow-sm">
                      <div className="text-xs text-slate-400 font-semibold">
                        Firm
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {selectedRow.firmName}
                      </div>
                    </div>

                    <div className="p-3 bg-white border rounded-lg shadow-sm">
                      <div className="text-xs text-slate-400 font-semibold">
                        System Version
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {selectedRow.systemVersion}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "#0f766e", fontWeight: 700, mb: 2 }}
                    >
                      Radio Links RSSI Signal Details
                    </Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 border rounded-lg">
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                          <div className="text-xs font-bold text-slate-500">
                            Radio 1 Info
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Samples:</p>
                            <p className="text-xs font-bold text-blue-700">
                              {selectedRow.radio1Info?.length ?? 0}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400">
                          {selectedRow.radio1Info?.map((r, index) => (
                            <div
                              key={index}
                              className="border rounded p-2 mb-2"
                            >
                              <div>DRef RFID : {r.DRefRFID}</div>
                              <div>Ref RFID : {r.RefRFIDTag}</div>
                              <div>Abs RFID : {r.AbsRefRFIDTag}</div>
                              <div>RSSI : {r.RSSIValue}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-lg">
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                          <div className="text-xs font-bold text-slate-500">
                            Radio 2 Info
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Samples:
                            </span>
                            <span className="text-2xl font-bold text-green-700">
                              {selectedRow.radio2Info?.length ?? 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {selectedRow.radio2Info?.map((r, index) => (
                            <div
                              key={index}
                              className="border rounded p-2 mb-2"
                            >
                              <div>DRef RFID : {r.DRefRFID}</div>
                              <div>Ref RFID : {r.RefRFIDTag}</div>
                              <div>Abs RFID : {r.AbsRefRFIDTag}</div>
                              <div>RSSI : {r.RSSIValue}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {apiType === "1C" && (
                <div className="space-y-4">
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Event Details
                  </Typography>

                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedRow.eventJson ?? {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center rounded-lg border bg-white px-4 py-3"
                        >
                          <span className="text-slate-500 font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </span>

                          <span className="font-semibold text-slate-800">
                            {String(value)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {apiType === "19" && (
                <div>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      mb: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Fault Details ({selectedRow.totalFaultCodesF} logs)
                  </Typography>
                  {selectedRow.faultData && selectedRow.faultData.length > 0 ? (
                    <div className="w-full border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-xs font-bold text-slate-600 uppercase">
                              Fault Code
                            </th>
                            <th className="p-3 text-xs font-bold text-slate-600 uppercase">
                              Fault Type
                            </th>
                            <th className="p-3 text-xs font-bold text-slate-600 uppercase">
                              Fault Message
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {selectedRow.faultData.map((fault, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-700">
                                {fault.faultCode}
                              </td>
                              <td className="p-3 text-slate-500">
                                {fault.faultCodeType}
                              </td>
                              <td className="p-3 text-slate-600 font-medium">
                                {fault.faultMessage}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      No fault codes mapped.
                    </p>
                  )}
                </div>
              )}

              {apiType === "18" && (
                <div>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#64748b",
                      fontWeight: 700,
                      mb: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Events Details ({selectedRow.eventCount} occurrences)
                  </Typography>
                  {selectedRow.events && selectedRow.events.length > 0 ? (
                    <div className="w-full border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-3 text-xs font-bold text-slate-600 uppercase">
                              Event ID
                            </th>
                            <th className="p-3 text-xs font-bold text-slate-600 uppercase">
                              Event Field
                            </th>
                            <th className="p-3 text-xs font-bold text-slate-600 uppercase">
                              Event Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {selectedRow.events.map((evt, index) => (
                            <tr
                              key={evt.ID || index}
                              className="hover:bg-slate-50/50"
                            >
                              <td className="p-3 font-mono font-bold text-slate-700">
                                {evt.eventId}
                              </td>
                              <td className="p-3 text-slate-500">
                                {evt.eventField}
                              </td>
                              <td className="p-3 text-slate-600 font-medium">
                                {evt.eventValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      No events found.
                    </p>
                  )}
                </div>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#f1f5f9" }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="contained"
            color="primary"
            size="small"
          >
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
