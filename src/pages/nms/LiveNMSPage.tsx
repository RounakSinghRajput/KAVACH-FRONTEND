import React, { useEffect, useMemo, useState } from "react";
import { Filter, RotateCw, FileText, Download } from "lucide-react";
import { Packet } from "../../types/index";
import { getDecodedMessages } from "../../services/messageService";
import { normalizeArray } from "../../utils/normalizeApiResponse";
import { flattenPacket } from "../../utils/flattenPacket";
import { axiosInstance } from "../../services/axios";
import MessageFilterPanel from "./MessageFilterPanel";
import { ContentLoading } from "../../components/common/LoadingScreen"; 

const MESSAGE_PURPOSE: Record<string, string> = {
  "11": "Stationary KAVACH Information",
  "12": "Loco Position Information",
  "14": "Adjacent KAVACH Information",
  "15": "Field Input Status",
  "16": "Field Input Event",
  "17": "Stationary Health",
  "19": "Fault Message",
};

// Enforced column sequencing rules
const PRIORITY_COLUMNS = ["msgTime", "zone", "divisionName","division", "firmName","firm", "stationaryKavachId", "systemVersion", "messageSequence"];

// Explicitly clean up all network artifacts, technical properties, and IP address variations
const HIDDEN_COLUMNS = [
  "id",  
  "IP", "nmsip", "nmsIpAddress", 
  "createdAt", "nmsIp","ip",
];

export default function DecodedMessagesPage() {
  const [filters, setFilters] = useState({
    messageType: "11",
    divisionName: "",
    firmName: "",
    fromDate: null as Date | null,
    toDate: null as Date | null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [packets, setPackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [firms, setFirms] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateError, setDateError] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  const formatDateTime = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const sec = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
  };

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const fRes = await axiosInstance.get("/firm/");
        const dRes = await axiosInstance.get("/division/");
        setFirms(fRes.data?.data || fRes.data || []);
        setDivisions(dRes.data?.data || dRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadDropdowns();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiFilters = {
        ...filters,
        fromDate: formatDateTime(filters.fromDate),
        toDate: formatDateTime(filters.toDate),
        page,
        size: rowsPerPage,
      };
      const res = await getDecodedMessages(filters.messageType, apiFilters);
      if (res) {
        const normalized = normalizeArray(res.content || []);
        
        // Deep map and preserve nested location structural properties cleanly
        const flattened = normalized.map((item: any) => {
          const flat = flattenPacket(item);
          return {
            msgTime: flat.msgTime || item.msgTime || "-",
            zone: item.nmsIp?.division?.zone?.name || item.nmsIp?.division?.zone?.code || flat.zone || "-",
            divisionName: item.nmsIp?.division?.name || flat.divisionName || "-",
            firmName: item.nmsIp?.firm?.name || flat.firmName || "-",
            stationaryKavachId: flat.stationaryKavachId || item.stationaryKavachId || "-",
            systemVersion: flat.systemVersion || item.systemVersion || "-",
            messageSequence: flat.messageSequence || item.messageSequence || "-",
            ...Object.keys(flat).reduce((acc: any, key) => {
              if (!HIDDEN_COLUMNS.includes(key) && !PRIORITY_COLUMNS.includes(key)) {
                acc[key] = flat[key];
              }
              return acc;
            }, {})
          };
        });

        setPackets(flattened);
        setTotalElements(res.page?.totalElements || res.totalElements || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.fromDate && filters.toDate && filters.toDate < filters.fromDate) {
      setDateError("To Date cannot be before From Date");
      return;
    }
    setDateError("");
    fetchData();
  }, [filters, page, rowsPerPage]);

  const columns = useMemo(() => {
    if (!packets.length) return [];
    
    const derived = Array.from(new Set(packets.flatMap((p) => Object.keys(p)))).filter(
      (col) => !HIDDEN_COLUMNS.includes(col)
    );
    
    const priority = PRIORITY_COLUMNS.filter((c) => derived.includes(c));
    const remaining = derived.filter((c) => !PRIORITY_COLUMNS.includes(c));

    return [...priority, ...remaining];
  }, [packets]);

  // Client-Side Export Tool Configuration
  const exportToExcel = () => {
    if (!packets.length) return;

    const headers = ["S.No", ...columns.map(col => {
      if (col === "msgTime") return "Message Time";
      if (col === "zone") return "Zone";
      if (col === "divisionName") return "Division";
      if (col === "firmName") return "Firm Name";
      if (col === "stationaryKavachId") return "Loco ID";
      if (col === "systemVersion") return "Version";
      if (col === "messageSequence") return "Sequence";
      return col.replace(/([A-Z])/g, ' $1').trim();
    })];

    const csvRows = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...packets.map((packet, idx) => {
        const rowCells = [
          idx + 1,
          ...columns.map(col => {
            const val = packet[col] !== null && packet[col] !== undefined ? String(packet[col]) : "-";
            return `"${val.replace(/"/g, '""')}"`;
          })
        ];
        return rowCells.join(",");
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `Decoded_Logs_Type_${filters.messageType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] p-8 font-sans antialiased text-gray-800">
      {/* TITLE SECTION */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b-2 border-[#1e40af]">
        <h1 className="text-2xl font-bold text-[#1e40af]">NMS Message Details</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-1.5 border border-blue-500 rounded-md text-sm text-[#1e40af] hover:bg-blue-50 transition font-medium"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      <MessageFilterPanel
        filters={filters}
        setFilters={setFilters}
        firms={firms}
        divisions={divisions}
        dateError={dateError}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        resetPagination={() => setPage(0)}
      />

      {/* REPLICATED SUBHEADER WHITE PANEL */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-xs flex justify-between items-center flex-wrap gap-3">
        <div className="bg-[#1d4ed8] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs">
          Total Records : {totalElements}
        </div>
        
        <div className="bg-[#dbeafe] text-[#1e40af] text-xs font-semibold px-5 py-1.5 rounded-full border border-blue-200">
          {MESSAGE_PURPOSE[filters.messageType] || "Kavach Log"} (Type {filters.messageType})
        </div>

        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-blue-300 rounded-md text-blue-600 bg-blue-50/50 hover:bg-blue-100/70 transition font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
            <RotateCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* CORE DATA TABLE CONTAINER */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8">
            <ContentLoading />
          </div>
        ) : !packets.length ? (
          <div className="p-16 text-center text-gray-400">No data records available for current setup.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-[#2563eb] text-white font-semibold">
                <tr>
                  <th className="px-5 py-3 text-xs uppercase font-bold tracking-wider w-16">S.No</th>
                  {columns.map((col) => (
                    <th key={col} className="px-5 py-3 text-xs uppercase font-bold tracking-wider whitespace-nowrap">
                      {col === "msgTime" ? "Message Time" : 
                       col === "zone" ? "Zone" : 
                       col === "divisionName" ? "Division" : 
                       col === "firmName" ? "Firm Name" : 
                       col === "stationaryKavachId" ? "Loco ID" : 
                       col === "systemVersion" ? "Version" : 
                       col.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {packets.map((packet, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{page * rowsPerPage + idx + 1}</td>
                    {columns.map((col) => {
                      const val = packet[col] !== null && packet[col] !== undefined ? String(packet[col]) : "-";
                      
                      if (col === "stationaryKavachId") {
                        return (
                          <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                            <span className="bg-[#eff6ff] text-[#2563eb] border border-blue-200 text-xs px-2.5 py-1 rounded font-bold">
                              {val}
                            </span>
                          </td>
                        );
                      }
                      if (col === "firmName") {
                        return (
                          <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                            <span className="bg-[#fdf4ff] text-[#c084fc] border border-purple-200 text-xs px-2.5 py-0.5 rounded font-bold uppercase">
                              {val}
                            </span>
                          </td>
                        );
                      }
                      if (col === "systemVersion") {
                        return (
                          <td key={col} className="px-5 py-3.5 whitespace-nowrap text-gray-400 text-xs">
                            Version {val}
                          </td>
                        );
                      }
                      return (
                        <td key={col} className="px-5 py-3.5 whitespace-nowrap text-[13px]">
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PILL PAGINATION BAR */}
        <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center flex-wrap text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              className="border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none"
            >
              {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <span className="ml-4">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalElements)} of {totalElements} records
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1 border border-gray-200 rounded text-gray-400 hover:bg-gray-50 disabled:opacity-40"
            >
              &lt;
            </button>
            <span className="text-gray-700 font-semibold">Page {page + 1} of {Math.ceil(totalElements / rowsPerPage) || 1}</span>
            <button
              disabled={(page + 1) * rowsPerPage >= totalElements}
              onClick={() => setPage(p => p + 1)}
              className="p-1 border border-gray-200 rounded text-gray-400 hover:bg-gray-50 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}