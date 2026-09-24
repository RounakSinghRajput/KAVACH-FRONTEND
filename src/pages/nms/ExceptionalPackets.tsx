import React, { useEffect, useMemo, useState } from "react";
import { Filter, RotateCw, FileText, Download } from "lucide-react";
import { Packet } from "../../types/index";
import { getExceptionalMessages } from "../../services/messageService";
import { normalizeArray } from "../../utils/normalizeApiResponse";
import { axiosInstance } from "../../services/axios";
import MessageFilterPanel from "./MessageFilterPanel";
import { ContentLoading } from "../../components/common/LoadingScreen"; 

// Precise explicit column ordering requirement (excluding 'err' which goes at the very end)
const PRIORITY_COLUMNS = ["msgTime", "zone", "divisionName", "firmName", "errorName"];

// Completely filter out technical overhead and nmsIp structure from dynamic headers
const HIDDEN_COLUMNS = ["id", "nmsip", "nmsIp", "createdAt"];

export default function ExceptionalMessagesPage() {
  const [filters, setFilters] = useState({
    messageType: "",
    divisionName: "",
    firmName: "",
    fromDate: null as Date | null,
    toDate: null as Date | null,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [exceptionalPackets, setExceptionalPackets] = useState<any[]>([]);
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
        divisionName: filters.divisionName,
        firmName: filters.firmName,
        fromDate: formatDateTime(filters.fromDate),
        toDate: formatDateTime(filters.toDate),
        page,
        size: rowsPerPage,
      };
      
      const res = await getExceptionalMessages(apiFilters);
      if (res && res.content) {
        const normalized = normalizeArray(res.content);
        
        const flattened = normalized.map((item: any) => ({
          msgTime: item.msgTime || "-",
          zone: item.nmsIp?.division?.zone?.name || item.nmsIp?.division?.zone?.code || "-",
          divisionName: item.nmsIp?.division?.name || "-",
          firmName: item.nmsIp?.firm?.name || "-",
          errorName: item.errName || "-",
          err: item.err || "-",
          ...Object.keys(item).reduce((acc: any, key) => {
            if (!HIDDEN_COLUMNS.includes(key) && !["msgTime", "errName", "err"].includes(key)) {
              acc[key] = item[key];
            }
            return acc;
          }, {})
        }));

        setExceptionalPackets(flattened);
        setTotalElements(res.page?.totalElements || res.totalElements || 0);
      } else {
        setExceptionalPackets([]);
        setTotalElements(0);
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
    if (!exceptionalPackets.length) return [];
    
    const derived = Array.from(new Set(exceptionalPackets.flatMap((p) => Object.keys(p)))).filter(
      (col) => !HIDDEN_COLUMNS.includes(col) && col !== "err"
    );

    const priority = PRIORITY_COLUMNS.filter((c) => derived.includes(c));
    const remaining = derived.filter((c) => !PRIORITY_COLUMNS.includes(c));
    const hasErrColumn = exceptionalPackets.some(p => "err" in p);

    return [
      ...priority,
      ...remaining,
      ...(hasErrColumn ? ["err"] : [])
    ];
  }, [exceptionalPackets]);

  // Client-Side Filtered Data Excel/CSV Downloader
  const exportToExcel = () => {
    if (!exceptionalPackets.length) return;

    // Header mapping setup
    const headers = ["S.No", ...columns.map(col => {
      if (col === "msgTime") return "Message Time";
      if (col === "zone") return "Zone";
      if (col === "divisionName") return "Division";
      if (col === "firmName") return "Firm";
      if (col === "errorName") return "Error Name";
      if (col === "err") return "Error Description";
      return col;
    })];

    // Build data CSV grid rows array strings safely wrapped
    const csvRows = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","), // Headers Row
      ...exceptionalPackets.map((packet, idx) => {
        const rowCells = [
          idx + 1,
          ...columns.map(col => {
            const cellValue = packet[col] !== null && packet[col] !== undefined ? String(packet[col]) : "-";
            return `"${cellValue.replace(/"/g, '""')}"`;
          })
        ];
        return rowCells.join(",");
      })
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `Exceptional_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] p-8 font-sans antialiased text-gray-800">
      {/* HEADER BAR TRACKING */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b-2 border-red-600">
        <h1 className="text-2xl font-bold text-red-600">Exceptional & System Error Logs</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-1.5 border border-red-500 rounded-md text-sm text-red-600 hover:bg-red-50 transition font-medium"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Date Pickers with clear instructions inside placeholder structures */}
      <MessageFilterPanel
        filters={filters}
        setFilters={setFilters}
        firms={firms}
        divisions={divisions}
        dateError={dateError}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        resetPagination={() => setPage(0)}
        showMessageTypeSelector={false}
        placeholderFromDate="Select From Date"
        placeholderToDate="Select To Date"
      />

      {/* REPLICATED SUBHEADER CONTROLS */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-xs flex justify-between items-center flex-wrap gap-3">
        <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs">
          Total Records : {totalElements}
        </div>
        
        <div className="bg-red-50 text-red-700 text-xs font-semibold px-5 py-1.5 rounded-full border border-red-100">
          Exception / Track Registry
        </div>

        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition"
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
        ) : !exceptionalPackets.length ? (
          <div className="p-16 text-center text-gray-400">Perfect state! No exceptional records flagged.</div>
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
                       col === "firmName" ? "Firm" : 
                       col === "errorName" ? "Error Name" : 
                       col === "err" ? "Error Description" : col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {exceptionalPackets.map((packet, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{page * rowsPerPage + idx + 1}</td>
                    {columns.map((col) => {
                      const val = packet[col] !== null && packet[col] !== undefined ? String(packet[col]) : "-";
                      
                      if (col === "firmName") {
                        return (
                          <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                            <span className="bg-[#fdf4ff] text-[#c084fc] border border-purple-200 text-xs px-2.5 py-0.5 rounded font-bold uppercase">
                              {val}
                            </span>
                          </td>
                        );
                      }
                       if (col === "messageType") {
                        return (
                          <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                            <span className="bg-[#fdf4ff] text-[#fc84b2] border border-purple-200 text-xs px-2.5 py-0.5 rounded font-bold uppercase">
                              {val}
                            </span>
                          </td>
                        );
                      }

                      // Colorful Styling for Error Name
                      if (col === "errorName") {
                        return (
                          <td key={col} className="px-5 py-3.5 whitespace-nowrap">
                            <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide">
                              {val}
                            </span>
                          </td>
                        );
                      }

                      // High Contrast Colorful Box styling for Error Details
                   if (col === "err") {
  return (
    <td key={col} className="px-3 py-1.5 max-w-md">
      <div
        className="bg-red-50/80 text-red-700 border border-red-100 text-[12px] p-2 rounded-lg font-mono truncate"
        title={val}
      >
        {val}
      </div>
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