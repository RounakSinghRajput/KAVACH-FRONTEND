import React, { useEffect, useMemo, useState, useRef } from "react";
import { axiosInstance } from "../../services/axios";
import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { ContentLoading } from "../../components/common/LoadingScreen";

import { Download, Database, Filter, Eye, RefreshCw, X } from "lucide-react";

type PacketRow = Record<string, any>;

interface Option {
  label: string;
  value: string;
  code: string;
}

type Column = {
  key: keyof PacketRow;
  label: string;
  visible: boolean;
};

const shouldHideColumn = (key: string) => {
  const lower = key.toLowerCase();
  return lower === "sof" || lower.includes("ip");
};

const Dashboard: React.FC = () => {
  const [rows, setRows] = useState<PacketRow[]>([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const [fromDate, setFromDate] = useState<Date | null>(tenMinutesAgo);
  const [toDate, setToDate] = useState<Date | null>(now);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [packets, setPackets] = useState<Option[]>([]);
  const [subPackets, setSubPackets] = useState<Option[]>([]);
  const [divisions, setDivisions] = useState<Option[]>([]);
  const [firms, setFirms] = useState<Option[]>([]);

  const [selectedPacket, setSelectedPacket] = useState("");
  const [selectedSubPacket, setSelectedSubPacket] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedFirm, setSelectedFirm] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [appliedSubPacket, setAppliedSubPacket] = useState("");

  const [allRows, setAllRows] = useState<PacketRow[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const mainColumns: Column[] = [
    { key: "DATE_TIME", label: "DATE TIME", visible: true },
    { key: "ZONE", label: "ZONE", visible: true },
    { key: "DIVISION", label: "DIVISION", visible: true },
    { key: "FIRM_NAME", label: "Firm Name", visible: true },
    { key: "MSG_TIME", label: "MSG TIME", visible: true },
    {
      key: "STATIONARY_KAVACH_ID",
      label: "STATIONARY KAVACH ID",
      visible: true,
    },
    { key: "NMS_SYSTEM_ID", label: "NMS SYSTEM ID", visible: true },
    { key: "SYSTEM_VERSION", label: "SYSTEM VERSION", visible: true },
  ];

  const [activeTab, setActiveTab] = useState("nms");
  const [appliedMessageType, setAppliedMessageType] = useState("");
  const [appliedPacket, setAppliedPacket] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const [allPackets, setAllPackets] = useState<Option[]>([]);
  const [selectedMessageType, setSelectedMessageType] = useState("11");

  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const staticDivisions = [
    { label: "Secunderabad", value: "Secunderabad" },
    { label: "Hyderabad", value: "Hyderabad" },
    { label: "Vadodara", value: "Vadodara" },
    { label: "Agra", value: "Agra" },
    { label: "Delhi", value: "Delhi" },
    { label: "Kota", value: "Kota" },
    { label: "Din Dayal Upadhyay", value: "Din Dayal Upadhyay" },
    { label: "Howrah", value: "Howrah" },
    { label: "Asansol", value: "Asansol" },
  ];

  const tabs = [
    {
      id: "nms",
      label: "NMS",
      icon: Database,
      color: "from-indigo-500 to-blue-500",
    },
  ];

  const MESSAGE_CONFIG: Record<string, { label: string; table: string }> = {
    "11": { label: "Stationary KAVACH information", table: "MSG_TYPE_11_1" },
    "12": { label: "Loco position information", table: "MSG_TYPE_12" },
    "13": { label: "TSR Information", table: "MSG_TYPE_13" },
    "14": { label: "Adjacent KAVACH information", table: "MSG_TYPE_14" },
    "15": { label: "Field input status", table: "MSG_TYPE_15" },
    "16": { label: "Field input event", table: "MSG_TYPE_16" },
    "17": { label: "Stationary health", table: "MSG_TYPE_17" },
    "19": { label: "Fault Message", table: "MSG_TYPE_19" },
    "21": { label: "Onboard RSSI information", table: "MSG_TYPE_21" },
  };

  useEffect(() => {
    if (selectedPacket) {
      setSelectedSubPacket("");
      loadSubPackets(selectedPacket);
    }
  }, [selectedPacket]);

  const loadPackets = async () => {
    try {
      const res = await axiosInstance.get("/packet/");
      const mappedPackets = (res.data || []).map((p: any) => ({
        label: p.name,
        value: String(p.id),
        code: String(p.code),
        id: p.id,
      }));
      setAllPackets(mappedPackets);
    } catch (err: any) {
      console.error("❌ Packet not found:", err);
    }
  };

  useEffect(() => {
    const filtered =
      selectedMessageType === "12"
        ? allPackets.filter((p: any) => p.id === 2 || p.id === 5)
        : allPackets.filter((p: any) => p.id !== 2 && p.id !== 5);

    setPackets(filtered);

    const stillValid = filtered.some(
      (p) => String(p.value) === String(selectedPacket),
    );

    if (!stillValid) {
      setSelectedPacket("");
      setSelectedSubPacket("");
    }
  }, [selectedMessageType, allPackets]);

  const loadSubPackets = async (packetId: string) => {
    try {
      const res = await axiosInstance.get(
        `/subPacket/byPacket?packetId=${packetId}`,
      );
      const mapped = (res.data || []).map((sp: any) => ({
        label: sp.name,
        value: String(sp.id),
        code: String(sp.code),
      }));
      setSubPackets(mapped);
    } catch (err) {
      console.error("SubPacket not found", err);
    }
  };

  const loadDivisions = async () => {
    try {
      const res = await axiosInstance.get("/division/");
      const mapped = (res.data?.data || []).map((d: any) => ({
        label: d.name,
        value: d.name,
      }));
      setDivisions(mapped);
    } catch (err) {
      console.error("Division not found", err);
    }
  };

  const loadFirms = async () => {
    try {
      const res = await axiosInstance.get("/firm/");
      const mapped = (res.data?.data || []).map((f: any) => ({
        label: f.name,
        value: f.name,
      }));
      setFirms(mapped);
    } catch (err) {
      console.error("Firm API error:", err);
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const buildFilterParams = () => {
    const packetObj = packets.find((p) => p.value === selectedPacket);
    const subPacketObj = subPackets.find(
      (sp) => sp.value === selectedSubPacket,
    );

    return {
      msgTable: MESSAGE_CONFIG[selectedMessageType]?.table,
      packetTable: packetObj?.code || null,
      subpacketTable: subPacketObj?.code || null,
      division: selectedDivision || null,
      firm: selectedFirm || null,
      fromDate: formatDateTime(fromDate),
      toDate: formatDateTime(toDate),
      page: page + 1,
      size: rowsPerPage,
    };
  };

  const loadTable = async () => {
    if (!selectedMessageType) {
      alert("Message Type is required");
      return;
    }
    setLoading(true);
    try {
      const params = buildFilterParams();
      const res = await axiosInstance.get("/api/packet/filter", { params });
      const data = res.data?.data || [];
      setTotalCount(res.data?.total || 0);

      if (data.length === 0) {
        setAllRows([]);
        setRows([]);
        return;
      }

      const cleanedData = data.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          if (!shouldHideColumn(key)) {
            newRow[key] = row[key];
          }
        });
        return newRow;
      });

      setAllRows(cleanedData);
      setRows(cleanedData);
    } catch (err) {
      console.error(err);
      setAllRows([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackets();
    loadDivisions();
    loadFirms();
  }, []);

  useEffect(() => {
    if (appliedMessageType) {
      loadTable();
    }
  }, [page, rowsPerPage]);

  const exportExcel = () => {
    if (rows.length === 0) {
      alert("No data to export. Please apply filters first.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const packetObj = packets.find((p) => p.value === selectedPacket);
    const subPacketObj = subPackets.find(
      (sp) => sp.value === selectedSubPacket,
    );
    const divisionObj = divisions.find((d) => d.value === selectedDivision);

    const headerInfo = [
      ["NMS REPORT"],
      [`Module: ${activeTab.toUpperCase()}`],
      [`Packet: ${packetObj?.label || "All"}`],
      [`Sub Packet: ${subPacketObj?.label || "All"}`],
      [`Division: ${divisionObj?.label || "All"}`],
      [`Exported By: Admin`],
      [`Role: Super Admin`],
      [`Date: ${new Date().toLocaleString()}`],
      [],
    ];

    const allFields = filteredSections.flatMap((section) => section.fields);
    const tableHeader = allFields.map((f) => f.replace(/_/g, " "));
    const tableRows = rows.map((r) =>
      allFields.map((field) => r[field] ?? "-"),
    );

    const ws = XLSX.utils.aoa_to_sheet([
      ...headerInfo,
      tableHeader,
      ...tableRows,
    ]);
    const headerRowIndex = headerInfo.length;

    ws["!cols"] = allFields.map(() => ({ wch: 22 }));
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: allFields.length - 1 } },
    ];

    const titleCell = ws["A1"];
    if (titleCell) {
      titleCell.s = {
        font: { sz: 18, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E40AF" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    allFields.forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({
        r: headerRowIndex,
        c: colIndex,
      });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    rows.forEach((_, rowIndex) => {
      allFields.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({
          r: headerRowIndex + 1 + rowIndex,
          c: colIndex,
        });
        const cell = ws[cellRef];
        if (cell) {
          cell.s = {
            fill: {
              fgColor: { rgb: rowIndex % 2 === 0 ? "F1F5F9" : "FFFFFF" },
            },
            border: {
              top: { style: "thin", color: { rgb: "D1D5DB" } },
              bottom: { style: "thin", color: { rgb: "D1D5DB" } },
              left: { style: "thin", color: { rgb: "D1D5DB" } },
              right: { style: "thin", color: { rgb: "D1D5DB" } },
            },
          };
        }
      });
    });

    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: headerRowIndex, c: allFields.length - 1 },
      }),
    };

    ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex + 1 };
    XLSX.utils.book_append_sheet(wb, ws, "NMS Report");
    XLSX.writeFile(wb, "NMS_Report.xlsx");
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(0);
  };

  const handleViewDetails = async (row: any) => {
    try {
      setShowDetails(true);
      setDetailsLoading(true);
      setSelectedRow(null);

      const params = {
        msgTable: MESSAGE_CONFIG[selectedMessageType]?.table,
        messageId: row.ID,
      };

      const res = await axiosInstance.get("/api/packet/popup", { params });
      setSelectedRow(res.data?.[0] || {});
    } catch (err) {
      console.error("Popup API error:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const messageSections: Record<string, any[]> = {
    "11": [
      {
        title: "Header Information",
        fields: [
          "DATE_TIME",
          "CREATED_AT",
          "ID",
          "MSG_TIME",
          "FIRM_NAME",
          "DIVISION",
          "ZONE",
          "MESSAGE_LENGTH",
          "MESSAGE_SEQUENCE",
          "STATIONARY_KAVACH_ID",
          "NMS_SYSTEM_ID",
          "SYSTEM_VERSION",
          "STATION_ACTIVE_RADIO",
        ],
      },
      {
        title: "Packet Details",
        fields: [
          "PKT_TYPE",
          "PKT_LENGTH",
          "FRAME_NUM",
          "SOURCE_STN_ILC_IBS_ID",
          "SOURCE_STN_ILC_IBS_VERSION",
          "DEST_LOCO_ID",
          "REF_PROF_ID",
          "LAST_REF_RFID",
          "DIST_PKT_START",
          "PKT_DIR",
          "PADDING_BITS",
          "PACKET_DATA_TYPE",
          "LOCO_SPECIFIC_MAC_CODE",
        ],
      },
      {
        title: "Sub Packet Information",
        fields: [
          "SUB_PKT_TBL",
          "SUB_PKT_TYPE",
          "SUB_PKT_LENGTH_MA",
          "FRAME_OFFSET",
          "DEST_LOCO_SOS",
          "TRAIN_SECTION_TYPE",
          "CUR_SIG_INFO",
          "CUR_SIG_ASP",
          "NEXT_SIG_ASPECT",
          "APPR_SIG_DIST",
          "AUTHORITY_TYPE",
          "MA_W_R_T_SIG",
          "REQ_SHORTEN_MA",
          "NEW_MA",
          "TRN_LEN_INFO_STS",
          "TRN_LEN_INFO_TYPE",
          "NEXT_STN_COMM",
          "APPR_STN_ILC_IBS_ID",
        ],
      },
    ],
    "12": [
      {
        title: "Header Information",
        fields: [
          "DATE_TIME",
          "CREATED_AT",
          "ID",
          "MSG_TIME",
          "MESSAGE_TYPE",
          "MESSAGE_LENGTH",
          "MESSAGE_SEQUENCE",
          "STATIONARY_KAVACH_ID",
          "NMS_SYSTEM_ID",
          "SYSTEM_VERSION",
          "ONBOARD_ACTIVE_RADIO",
        ],
      },
      {
        title: "Packet Details",
        fields: [
          "NO_OF_MA_SECTION_COUNT",
          "ROUTE_ID",
          "PKT_TYPE",
          "PKT_LENGTH",
          "FRAME_NUM",
          "SOURCE_LOCO_ID",
          "SOURCE_LOCO_VERSION",
          "ABS_LOCO_LOC",
          "TRAIN_LENGTH",
          "TRAIN_SPEED",
          "MOVEMENT_DIR",
          "EMERGENCY_STATUS",
          "LOCO_MODE",
          "LAST_RFID_TAG",
          "TIN",
        ],
      },
      {
        title: "Extra Information",
        fields: [
          "L_DOUBTOVER",
          "L_DOUBTUNDER",
          "TRAIN_INT",
          "TAG_DUP",
          "TAG_LINK_INFO",
          "BRAKE_APPLIED",
          "NEW_MA_REPLY",
          "LAST_REF_PROFILE_NUM",
          "SIG_OV",
          "INFO_ACK",
          "SPARE",
          "LOCO_HEALTH_STATUS",
          "LOCO_HEALTH_STATUS_VALUE",
          "MAC_CODE",
          "FIRM_NAME",
          "DIVISION",
          "ZONE",
        ],
      },
    ],
    "15": [
      {
        title: "Header Information",
        fields: [
          "DATE_TIME",
          "CREATED_AT",
          "ID",
          "MSG_TIME",
          "FIRM_NAME",
          "DIVISION",
          "ZONE",
          "MESSAGE_TYPE",
          "MESSAGE_LENGTH",
          "MESSAGE_SEQUENCE",
        ],
      },
      {
        title: "Field Status Details",
        fields: [
          "STATIONARY_KAVACH_ID",
          "NMS_SYSTEM_ID",
          "SYSTEM_VERSION",
          "TOTAL_EVENT_RELAYS_E",
          "RELAY_STATUS_IMAGE",
          "CRC",
          "PKT",
        ],
      },
    ],
    "16": [
      {
        title: "Header Information",
        fields: [
          "DATE_TIME",
          "CREATED_AT",
          "ID",
          "MSG_TIME",
          "FIRM_NAME",
          "DIVISION",
          "ZONE",
          "MESSAGE_TYPE",
          "MESSAGE_LENGTH",
          "MESSAGE_SEQUENCE",
        ],
      },
      {
        title: "Main Details",
        fields: [
          "STATIONARY_KAVACH_ID",
          "NMS_SYSTEM_ID",
          "SYSTEM_VERSION",
          "RELAY_EVENT_COUNT",
          "RELAY_EVENT",
        ],
      },
    ],
    "19": [
      {
        title: "Header Information",
        fields: [
          "DATE_TIME",
          "CREATED_AT",
          "ID",
          "MSG_TIME",
          "MESSAGE_TYPE",
          "MESSAGE_LENGTH",
          "MESSAGE_SEQUENCE",
          "STATIONARY_KAVACH_ID",
          "NMS_SYSTEM_ID",
          "SYSTEM_VERSION",
          "FIRM_NAME",
          "DIVISION",
          "ZONE",
        ],
      },
      {
        title: "Main Details",
        fields: [
          "KAVACH_SUBSYSTEM_TYPE",
          "TOTAL_FAULT_CODES_F",
          "MODULE_ID",
          "FAULT_CODE_TYPE",
          "FAULT_CODE",
        ],
      },
    ],
    "21": [
      {
        title: "Header Information",
        fields: [
          "DATE_TIME",
          "ID",
          "MSG_TIME",
          "MESSAGE_TYPE",
          "MESSAGE_LENGTH",
          "MESSAGE_SEQUENCE",
          "STATIONARY_KAVACH_ID",
          "NMS_SYSTEM_ID",
          "SYSTEM_VERSION",
          "FIRM_NAME",
          "DIVISION",
          "ZONE",
        ],
      },
      {
        title: "Main Details",
        fields: [
          "LOCO_KAVACH_ID",
          "ONBOARD_RADIO1_RSSI_SAMPLE_COUNT",
          "RADIO1_RSSI_INFO",
          "ONBOARD_RADIO2_RSSI_SAMPLE_COUNT",
          "RADIO2_RSSI_INFO",
        ],
      },
    ],
  };

  const filteredSections = useMemo(() => {
    const sections = messageSections[appliedMessageType] || [];
    if (appliedMessageType !== "11") return sections;
    const packetObj = packets.find((p) => p.value === selectedPacket);
    const hasSubPacket = packetObj?.label === "Station to Onboard Regular";
    return hasSubPacket
      ? sections
      : sections.filter((sec) => sec.title !== "Sub Packet Information");
  }, [appliedMessageType, selectedPacket, packets]);

  const filteredMainColumns = useMemo(() => {
    let cols = [...mainColumns];
    if (["16", "19", "21"].includes(appliedMessageType)) {
      cols = cols.filter((col) => col.key !== "STATION_ACTIVE_RADIO");
    }
    return cols;
  }, [appliedMessageType, mainColumns]);

  const parseJSONSafe = (value: any) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const renderNestedTable = (parsed: any[]) => {
    if (!Array.isArray(parsed) || parsed.length === 0) return "-";
    return (
      <div className="overflow-y-auto overflow-x-hidden max-h-[140px] border rounded-lg">
        <table className="text-xs w-full table-fixed">
          <thead className="bg-gray-200 sticky top-0">
            <tr>
              {Object.keys(parsed[0]).map((key) => (
                <th key={key} className="px-2 py-1 text-left">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.map((row, i) => (
              <tr key={i} className="border-b">
                {Object.values(row).map((val, j) => (
                  <td key={j} className="px-2 py-1">
                    {String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-yellow-400 text-xs font-semibold shadow-2xl">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
          BETA VERSION (Under Development)
        </div>
      </div>

      {/* NAVBAR */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-4 py-2 rounded-xl text-sm flex items-center gap-2"
              >
                <span
                  className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} ${isActive ? "opacity-100" : "opacity-0"} transition`}
                />
                <span
                  className={`relative z-10 flex items-center gap-2 ${isActive ? "text-white" : "text-gray-600"}`}
                >
                  <Icon size={16} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm transition"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* FILTER SECTION (Same Heading Design as Report Page Card Layout) */}
        {showFilters && (
          <div
            ref={filterRef}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 relative z-30 overflow-visible transition-all duration-300"
          >
            {/* Header style borrowed from premium report configurations */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Filter size={16} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 tracking-wide">
                  Filter
                </h3>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                title="Hide Filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Message Type
                  </label>
                  <select
                    value={selectedMessageType}
                    onChange={(e) => setSelectedMessageType(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 rounded-xl text-sm transition outline-none"
                  >
                    <option value="11">Message Type 11</option>
                    <option value="12">Message Type 12</option>
                    <option value="14">Message Type 14</option>
                    <option value="15">Message Type 15</option>
                    <option value="16">Message Type 16</option>
                    <option value="17">Message Type 17</option>
                    <option value="19">Message Type 19</option>
                    <option value="21">Message Type 21</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Packet
                  </label>
                  <select
                    value={selectedPacket}
                    onChange={(e) => setSelectedPacket(e.target.value)}
                    disabled={
                      !selectedMessageType ||
                      ["14", "15", "16", "19", "21"].includes(
                        selectedMessageType,
                      )
                    }
                    className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 rounded-xl text-sm transition outline-none disabled:opacity-50"
                  >
                    <option value="">Select Packet</option>
                    {packets.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Sub Packet
                  </label>
                  <select
                    value={selectedSubPacket}
                    onChange={(e) => setSelectedSubPacket(e.target.value)}
                    disabled={!selectedPacket || subPackets.length === 0}
                    className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 rounded-xl text-sm transition outline-none disabled:opacity-50"
                  >
                    <option value="">Select Sub Packet</option>
                    {subPackets.map((sp) => (
                      <option key={sp.value} value={sp.value}>
                        {sp.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Firm
                  </label>
                  <select
                    value={selectedFirm}
                    onChange={(e) => setSelectedFirm(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 rounded-xl text-sm transition outline-none"
                  >
                    <option value="">All Firms</option>
                    {firms.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Division
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-3 py-2 rounded-xl text-sm transition outline-none"
                  >
                    <option value="">All Divisions</option>
                    {staticDivisions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 overflow-visible">
                <div className="flex gap-6 flex-wrap items-center overflow-visible">
                 <LocalizationProvider dateAdapter={AdapterDayjs}>
  {/* From Date */}
  <div className="flex items-center gap-2">
    <DateTimePicker
      label="From Date"
      value={fromDate ? dayjs(fromDate) : null}
      onChange={(value) => setFromDate(value ? value.toDate() : null)}
      ampm={false}
      format="DD-MM-YYYY HH:mm:ss"
      slotProps={{
        textField: {
          size: "small",
          sx: {
            width: 220,
          },
        },
      }}
    />
  </div>

  {/* To Date */}
  <div className="flex items-center gap-2">
    <DateTimePicker
      label="To Date"
      value={toDate ? dayjs(toDate) : null}
      onChange={(value) => setToDate(value ? value.toDate() : null)}
      ampm={false}
      format="DD-MM-YYYY HH:mm:ss"
      slotProps={{
        textField: {
          size: "small",
          sx: {
            width: 220,
          },
        },
      }}
    />
  </div>
</LocalizationProvider>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedDivision("");
                      setSelectedPacket("");
                      setSelectedSubPacket("");
                      setSelectedFirm("");
                      setFromDate(null);
                      setToDate(null);
                      setAllRows([]);
                      setRows([]);
                      setFiltersApplied(false);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedMessageType) {
                        alert("Please select Message Type");
                        return;
                      }
                      setAppliedMessageType(selectedMessageType);
                      setAppliedPacket(selectedPacket);
                      setAppliedSubPacket(selectedSubPacket);
                      setFiltersApplied(true);
                      loadTable();
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow hover:opacity-95 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY BANNER: Total (Left), Name Title (Middle), Actions (Right) */}
        <div className="mb-4 grid grid-cols-3 items-center bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm relative z-10">
          {/* Left Block: Totals */}
          <div className="flex justify-start">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Total Records
              </span>
              <span className="bg-blue-600 text-white text-sm font-extrabold px-2.5 py-0.5 rounded-md shadow-inner">
                {totalCount}
              </span>
            </div>
          </div>

          {/* Middle Block: Active Path Title */}
          <div className="text-center">
            <h2 className="text-sm font-bold text-gray-800 tracking-wide bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl inline-block max-w-full truncate">
              {appliedMessageType ? (
                <span className="text-blue-600 font-extrabold">
                  {[
                    MESSAGE_CONFIG[appliedMessageType]?.label,
                    appliedPacket &&
                      packets.find((p) => p.value === appliedPacket)?.label,
                    appliedSubPacket &&
                      subPackets.find((sp) => sp.value === appliedSubPacket)
                        ?.label,
                  ]
                    .filter(Boolean)
                    .join(" ➔ ")}
                </span>
              ) : (
                <span className="text-gray-400 font-medium italic">
                  No Active Packet Selected
                </span>
              )}
            </h2>
          </div>

          {/* Right Block: Actions (Refresh + Export) */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                if (appliedMessageType) loadTable();
                else alert("Please select filters first.");
              }}
              className="p-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-xl transition border border-gray-200 shadow-sm flex items-center justify-center"
              title="Refresh Current View"
            >
              <RefreshCw
                size={16}
                className={`${loading ? "animate-spin text-blue-600" : ""}`}
              />
            </button>
            <button
              onClick={exportExcel}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* TABLE COMPONENT WRAPPER */}
        {activeTab === "nms" && (
          <>
            {!filtersApplied ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-center mb-4 border border-gray-100">
                  <Filter className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  No Filters Applied Yet
                </h2>
                <p className="text-gray-500 text-xs max-w-sm leading-relaxed mb-6">
                  Choose your filter {" "}
                  <span className="font-semibold text-indigo-600">
                    Apply Filters
                  </span>{" "}
                 
                </p>
                <button
                  onClick={() => setShowFilters(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl text-xs font-semibold shadow transition transform hover:scale-[1.02]"
                >
                  Open Filters
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 relative z-10">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="border-collapse min-w-max w-full text-sm">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-blue-600">
                        {filteredMainColumns.map((col) => (
                          <th
                            key={String(col.key)}
                            className="border border-blue-700 px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                        <th className="border border-blue-700 px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap sticky right-0 bg-blue-600 z-30 shadow-[-4px_0_6px_rgba(0,0,0,0.08)]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={filteredMainColumns.length + 1}
                            className="py-12"
                          >
                            <div className="flex h-[280px] items-center justify-center">
                              <ContentLoading />
                            </div>
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={filteredMainColumns.length + 1}
                            className="text-center p-8 text-gray-400 font-medium italic"
                          >
                            No matching grid records discovered
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => (
                          <tr
                            key={index}
                            className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                          >
                            {filteredMainColumns.map((col) => (
                              <td
                                key={String(col.key)}
                                className="border border-gray-100 px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap font-medium"
                              >
                                {row[col.key] ?? "-"}
                              </td>
                            ))}
                            <td className="border border-gray-100 px-4 py-2.5 text-center whitespace-nowrap sticky right-0 bg-white z-20 group-hover:bg-blue-50/50 shadow-[-4px_0_6px_rgba(0,0,0,0.04)]">
                              <button
                                onClick={() => handleViewDetails(row)}
                                className="text-blue-600 hover:text-blue-800 transition p-1 rounded hover:bg-blue-50 inline-block"
                              >
                                <Eye size={16} className="mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION INTERFACES */}
                <div className="flex items-center justify-end gap-6 border-t border-gray-200 bg-white px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      Rows per display:
                    </span>
                    <select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition bg-white"
                    >
                      <option value={10}>10 records</option>
                      <option value={25}>25 records</option>
                      <option value={50}>50 records</option>
                      <option value={100}>100 records</option>
                    </select>
                  </div>
                  <div className="text-xs font-bold text-gray-600">
                    {rows.length === 0 ? 0 : page * rowsPerPage + 1}–
                    {Math.min((page + 1) * rowsPerPage, rows.length)} of{" "}
                    {rows.length}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(0)}
                      className="rounded-lg p-1.5 text-xs border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition font-bold"
                    >
                      ⏮
                    </button>
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(page - 1)}
                      className="rounded-lg p-1.5 text-xs border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition font-bold"
                    >
                      ◀
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(page + 1)}
                      className="rounded-lg p-1.5 text-xs border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition font-bold"
                    >
                      ▶
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(totalPages - 1)}
                      className="rounded-lg p-1.5 text-xs border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition font-bold"
                    >
                      ⏭
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SYNCED METRIC DETAILS MODAL */}
            {showDetails && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
                  onClick={() => setShowDetails(false)}
                />
                <div className="relative bg-white w-[920px] max-h-[82vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
                  {/* MODAL TITLE TOP PANEL */}
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-6 py-4 flex justify-between items-center shadow-sm">
                    <div>
                      <h2 className="text-base font-bold tracking-wide">
                        Detailed Info..
                      </h2>
                      {/* <p className="text-xs text-indigo-100/80">
                        Structural Field Inspectors
                      </p> */}
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="bg-white/10 border border-white/20 text-white hover:bg-white hover:text-indigo-600 px-4 py-1.5 rounded-xl text-xs font-bold transition"
                    >
                      Close
                    </button>
                  </div>

                  {/* SUB-CONTENT REGIONS */}
                  <div className="overflow-y-auto p-6 flex-1 bg-slate-50/50 min-h-[300px] scrollbar-thin">
                    {detailsLoading ? (
                      <div className="flex h-[240px] items-center justify-center">
                        <ContentLoading />
                      </div>
                    ) : !selectedRow ? (
                      <div className="text-center py-12 text-gray-400 font-semibold italic">
                        No parsed structure mapped to identity key
                      </div>
                    ) : (
                      filteredSections.map((section) => (
                        <div
                          key={section.title}
                          className="mb-5 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                          <div className="bg-blue-600 text-white px-5 py-2.5 text-xs font-extrabold tracking-wider uppercase border-b border-blue-700">
                            {section.title}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 p-4 bg-white">
                            {section.fields.map((field: string) => (
                              <div
                                key={field}
                                className="border border-slate-100 rounded-xl p-3 bg-slate-50/30 hover:bg-slate-50/70 transition-colors"
                              >
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                  {field.replace(/_/g, " ")}
                                </div>
                                <div className="text-xs font-bold text-gray-800 break-all leading-normal">
                                  {(() => {
                                    const raw = selectedRow?.[field];
                                    const parsed = parseJSONSafe(raw);

                                    if (Array.isArray(parsed)) {
                                      return renderNestedTable(parsed);
                                    }
                                    if (
                                      typeof parsed === "object" &&
                                      parsed !== null
                                    ) {
                                      return (
                                        <pre className="text-[11px] bg-slate-100 p-2 rounded-lg max-h-[140px] overflow-auto font-mono text-slate-700">
                                          {JSON.stringify(parsed, null, 2)}
                                        </pre>
                                      );
                                    }
                                    if (
                                      field === "LOCO_HEALTH_STATUS_VALUE" &&
                                      typeof parsed === "string"
                                    ) {
                                      return (
                                        <div className="text-xs text-gray-700 font-semibold space-y-0.5">
                                          {parsed
                                            .split(",")
                                            .map(
                                              (item: string, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="flex items-center gap-1"
                                                >
                                                  <span className="text-indigo-400">
                                                    •
                                                  </span>{" "}
                                                  {item.trim()}
                                                </div>
                                              ),
                                            )}
                                        </div>
                                      );
                                    }
                                    return parsed ?? "-";
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
