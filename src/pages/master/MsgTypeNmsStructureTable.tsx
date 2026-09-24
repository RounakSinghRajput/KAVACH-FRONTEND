import React, { useEffect, useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";

interface MsgType {
  msgId: number;
  msgType: string;
  msgTypeValue: string;
  purpose: string;
  msgName: string;
}

const MsgTypeTable: React.FC = () => {
  const [data, setData] = useState<MsgType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Local filter input states
  const [searchInput, setSearchInput] = useState("");
  
  // Applied filter state (Locked when clicking 'Apply')
  const [appliedSearch, setAppliedSearch] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/locoConnectivityLog/");
      // Adjusted data fallbacks if your API response wraps payload inside an extra object layer
      setData(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error fetching message types:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- APPLY & RESET BUTTON LOGIC ---------- */
  const handleApply = () => {
    setAppliedSearch(searchInput);
    setPage(0);
  };

  const handleReset = () => {
    setSearchInput("");
    setAppliedSearch("");
    setPage(0);
  };

  /* ---------- SEARCH FILTER ---------- */
  const filteredData = useMemo(() => {
    const query = appliedSearch.toLowerCase().trim();
    return data.filter((d) =>
      (d.msgType || "").toLowerCase().includes(query) ||
      (d.msgTypeValue || "").toLowerCase().includes(query) ||
      (d.purpose || "").toLowerCase().includes(query) ||
      (d.msgName || "").toLowerCase().includes(query)
    );
  }, [data, appliedSearch]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  /* ---------- EXCEL EXPORT ---------- */
  const exportToExcel = () => {
    const exportData = filteredData.map((d, i) => ({
      "S.No": i + 1,
      "Message Type": d.msgType,
      "Value": d.msgTypeValue,
      "Purpose": d.purpose,
      "Message Name": d.msgName
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MsgType");
    XLSX.writeFile(wb, "Message_Type_Master.xlsx");
  };

  return (
    <div className="p-6 bg-[#f4f7fc] min-h-screen text-slate-800 font-sans">
      
      {/* Top Header Section Title Bar */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1d61e1] tracking-tight">Message Type Master</h1>
        <div className="w-full h-[2px] bg-[#1d61e1] mt-2"></div>
      </div>

      {/* Main Content Card Wrapper Block */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        
        {/* Top Operational Action Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Search Parameters
            </label>
            <input
              type="text"
              placeholder="Type, value, or purpose..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 placeholder-gray-400 focus:outline-none focus:border-[#1d61e1]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className="bg-[#1d61e1] hover:bg-blue-700 text-white font-medium text-sm px-6 py-2 rounded-lg transition-colors shadow-sm"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="border border-gray-300 hover:bg-gray-50 text-gray-600 p-2 rounded-lg transition-colors"
              title="Reset Filters"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Row Logs Summary Strip */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-gray-900">Data Records</span>
            <span className="bg-[#1d61e1] text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Rows Found: {filteredData.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            >
              <Download size={14} className="text-blue-600" /> Excel
            </button>
          </div>
        </div>

        {/* Scrollable Data Table Container */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                <tr className="bg-[#1d61e1] text-white text-[13px] font-semibold">
                  <th className="px-5 py-3 text-center w-24 border-r border-blue-400/30">S.NO</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">MESSAGE TYPE</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">VALUE</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">PURPOSE</th>
                  <th className="px-5 py-3">MESSAGE NAME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[14px] text-gray-700 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      Loading data system configuration logs...
                    </td>
                  </tr>
                )}

                {!loading && paginatedData.map((d, i) => (
                  <tr key={d.msgId} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-gray-50/40">
                    <td className="px-5 py-3 text-center text-gray-500 font-medium">
                      {page * rowsPerPage + i + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900 truncate">
                      {d.msgType}
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate">
                      {d.msgTypeValue}
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate">
                      {d.purpose}
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate">
                      {d.msgName}
                    </td>
                  </tr>
                ))}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">
                      No matching records discovered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reusable Pagination Component */}
        <TablePagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredData.length}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />

      </div>
    </div>
  );
};

export default MsgTypeTable;