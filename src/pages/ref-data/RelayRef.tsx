import React, { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "../../services/axios";
import { api } from "../../services/api";
import { ContentLoading } from "../../components/common/LoadingScreen";
import { Search, Filter, SlidersHorizontal, Download, FileText, RefreshCw, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface Relay {
  id: number;
  slNo: number | null;
  relayGroupId: number;
  relayName: string;
  relayAddress: string;
  updatedSequence: number;
  stationCode: string;
  firm: string;
}

interface ApiPage {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

interface RelayResponse {
  content: Relay[];
  page: ApiPage;
}

const RelayManagement: React.FC = () => {
  const [rows, setRows] = useState<Relay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination and query state structures
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [rowCount, setRowCount] = useState<number>(0);
  const [search, setSearch] = useState<string>("");

  // Filter collections
  const [firms, setFirms] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<string>("");

  // Fetch server side relay entries
  const fetchRelays = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage - 1, // API pagination index base fallback
        size: pageSize,
        sortDir: "desc",
      };

      if (selectedFirm) params.firm = selectedFirm;
      if (selectedStation) params.stationCode = selectedStation;
      if (search.trim()) params.search = search.trim();

      const res = await axiosInstance.get<RelayResponse>("/api/relay", { params });
      
      setRows(res.data.content || []);
      setRowCount(res.data.page.totalElements || 0);
    } catch (error) {
      console.error("Relay fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedFirm, selectedStation, search]);

  const loadFilterData = async () => {
    try {
      const [firmData, stationData] = await Promise.all([
        api.master.getFirms(),
        api.master.getStations(),
      ]);
      setFirms(firmData || []);
      setStations(stationData || []);
    } catch (error) {
      console.error("Filter data error:", error);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchRelays();
  }, [fetchRelays]);

  // Reset page position if dropdown queries update
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedFirm("");
    setSelectedStation("");
    setSearch("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(rowCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="w-full min-h-screen bg-[#f3f7fa] p-4 font-sans text-[#333]">
      {/* Top Main Dynamic Header Banner */}
      <div className="w-full border-b-2 border-blue-600 pb-2 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-xl font-bold text-[#1a5a9e] tracking-wide">Relay</h1>
        
        {/* Filter Toolbar Area */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Realtime Context Search */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Search relay name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Firm Selection Select Dropdown */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1">
            <SlidersHorizontal size={13} className="text-slate-400 mr-1.5" />
            <select
              value={selectedFirm}
              onChange={(e) => { setSelectedFirm(e.target.value); handleFilterChange(); }}
              className="bg-transparent text-xs text-slate-700 outline-none pr-2 cursor-pointer max-w-[130px]"
            >
              <option value="">All Firms</option>
              {firms.map((firm) => (
                <option key={firm.id} value={firm.name}>{firm.name}</option>
              ))}
            </select>
          </div>

          {/* Station Selector Dropdown */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-1">
            <Filter size={13} className="text-slate-400 mr-1.5" />
            <select
              value={selectedStation}
              onChange={(e) => { setSelectedStation(e.target.value); handleFilterChange(); }}
              className="bg-transparent text-xs text-slate-700 outline-none pr-2 cursor-pointer max-w-[140px]"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.code}>{station.name}</option>
              ))}
            </select>
          </div>

          {/* Clean Clear Action Reset */}
          <button
            onClick={handleResetFilters}
            title="Reset Filters"
            className="p-1.5 border border-slate-300 hover:bg-slate-100 bg-white text-slate-600 rounded-lg shadow-xs transition-colors flex items-center justify-center h-[28px]"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Table Layout Card Wrapper */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Identity Row */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
           
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Total Records : {rowCount}
            </span>
          </div>

          {/* Export Action Elements */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={14} className="text-blue-600" /> Excel
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <FileText size={14} className="text-blue-600" /> PDF
            </button>
            <button onClick={fetchRelays} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw size={14} className="text-blue-600" /> Refresh
            </button>
          </div>
        </div>

        {/* Structured Grid Table */}
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="w-full min-h-[350px] flex items-center justify-center bg-slate-50/50">
              <ContentLoading />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-[#1b62b3] text-white text-[13px] font-semibold divide-x divide-blue-500">
                  <th className="px-4 py-2.5 w-16 text-center">S.No</th>
                  <th className="px-5 py-2.5">Relay Name</th>
                  <th className="px-4 py-2.5 w-44 text-center">Address</th>
                  <th className="px-4 py-2.5 w-40 text-center">Sequence</th>
                  <th className="px-4 py-2.5 w-44 text-center">Station</th>
                  <th className="px-4 py-2.5 w-48 text-center">Firm</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700 divide-y divide-slate-100">
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-[#f2f7fc] transition-all odd:bg-white even:bg-slate-50/50 divide-x divide-slate-100">
                      <td className="px-4 py-2 text-center font-medium text-slate-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-5 py-2 font-medium text-slate-900 truncate max-w-xs">
                        {row.relayName}
                      </td>
                      <td className="px-4 py-2 text-center font-mono text-slate-600">{row.relayAddress}</td>
                      <td className="px-4 py-2 text-center text-slate-800 font-semibold">{row.updatedSequence}</td>
                      
                      {/* Station Badge pill display context */}
                      <td className="px-4 py-2 text-center">
                        <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                          {row.stationCode}
                        </span>
                      </td>

                      {/* Firm status Badge pill representation display context */}
                      <td className="px-4 py-2 text-center">
                        <span className="inline-block bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                          {row.firm}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 bg-slate-50/30">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Global Datagrid Footer Control Segments */}
        <div className="p-4 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:border-blue-500"
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <span>
              Showing {rowCount > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, rowCount)} of {rowCount} records
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelayManagement;