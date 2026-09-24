import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import Select from "react-select";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";

interface Kavach {
  sno?: number;
  id?: number; 
  locoId: number;
  firm: {
    id: number;
    name: string;
  } | null;
  locoType: string | null;
  locoVersion: string | null;
  condemned: boolean | null;
  shed: string | null;
  createdDate: string | null;
}

interface Firm {
  id: number;
  name: string;
}

const OnBoardKavachMaster: React.FC = () => {
  const [data, setData] = useState<Kavach[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100); // Matching report defaults

  const [search, setSearch] = useState("");
  const [firmFilter, setFirmFilter] = useState("");

  useEffect(() => {
    fetchData();
    fetchFirms();
  }, []);

  const fetchData = async () => {
    const res = await axiosInstance.get("/loco/");
    setData(res.data.data || res.data); 
  };

  const fetchFirms = async () => {
    const res = await axiosInstance.get("/firm/");
    setFirms(res.data.data);
  };

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      const searchText = search.toLowerCase();
      const firmName = d.firm?.name || "";

      const matchesSearch =
        firmName.toLowerCase().includes(searchText) ||
        (d.locoId && d.locoId.toString().includes(searchText));

      const matchesFirm = firmFilter ? firmName === firmFilter : true;

      return matchesSearch && matchesFirm;
    });
  }, [data, search, firmFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleClear = () => {
    setSearch("");
    setFirmFilter("");
    setPage(0);
  };

  const exportExcel = () => {
    const exportData = filteredData.map((d, i) => ({
      "S.No": i + 1,
      Firm: d.firm?.name || "N/A",
      "Loco ID": d.locoId,
      Version: d.locoVersion || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OnBoard Kavach");
    XLSX.writeFile(wb, "OnBoardKavach.xlsx");
  };

  // Custom UI styling rules for cleaner React-Select input elements
  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      height: '38px',
      minHeight: '38px',
      borderRadius: '6px',
      borderColor: '#d1d5db',
    }),
    valueContainer: (base: any) => ({
      ...base,
      height: '38px',
      padding: '0 6px',
    }),
    input: (base: any) => ({ ...base, margin: '0px' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '38px' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Document Header Section */}
      <div className="border-b-2 border-blue-600 pb-2 mb-6">
        <h1 className="text-2xl font-bold text-blue-700">OnBoard Kavach Master</h1>
      </div>

      {/* Main Content Card Wrapper */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-6">
        
        {/* Inline Filters and Action Elements Block */}
        <div className="flex flex-wrap items-end gap-3 justify-between mb-6">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            
            {/* Context Search */}
            <div className="w-56">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Search Firm / Loco ID</label>
              <input
                type="text"
                placeholder="Enter text..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Firm Dropdown Option */}
            <div className="w-52">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Firm</label>
              <Select
                styles={customSelectStyles}
                options={firms.map((f) => ({ value: f.name, label: f.name }))}
                value={firmFilter ? { value: firmFilter, label: firmFilter } : null}
                onChange={(selected) => { setFirmFilter(selected ? selected.value : ""); setPage(0); }}
                isClearable
                placeholder="All Firms"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
              />
            </div>

            {/* Application Filters and Controller Settings */}
            <div className="flex gap-2">
              <button className="h-[38px] px-5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Apply
              </button>
              <button 
                onClick={handleClear}
                title="Reset Filters"
                className="h-[38px] w-[38px] flex items-center justify-center border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Export Action Trigger Group */}
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              <Download size={16} className="text-blue-600" /> Excel
            </button>
            <button
              className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              <FileText size={16} className="text-red-500" /> PDF
            </button>
          </div>
        </div>

        {/* Total Records Counter Status Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-800">Data Records</span>
          <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Rows Found: {filteredData.length}
          </span>
        </div>

        {/* Scrollable Fixed Table Container Context */}
        <div className="border border-gray-200 rounded-lg h-[500px] overflow-y-auto shadow-inner relative">
          <table className="w-full border-collapse text-left bg-white">
            <thead className="sticky top-0 z-10 bg-blue-600 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold text-center w-24">S.No</th>
                <th className="px-6 py-3 font-semibold">Firm</th>
                <th className="px-6 py-3 font-semibold text-center">Loco ID</th>
                <th className="px-6 py-3 font-semibold text-center">Version</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((d, i) => (
                  <tr key={d.sno || d.locoId || i} className="hover:bg-blue-50/40 even:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 border-r border-gray-100 text-center text-gray-500 font-medium">
                      {page * rowsPerPage + i + 1}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded font-medium border border-gray-200">
                        {d.firm?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center text-blue-600 font-mono font-semibold">{d.locoId}</td>
                    <td className="px-6 py-3 text-center text-gray-600 font-medium">{d.locoVersion || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 font-medium bg-gray-50">
                    No matching onboard kavach master records discovered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table System Pagination Component Module */}
        <div className="mt-4 pt-4 border-t border-gray-100">
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
    </div>
  );
};

export default OnBoardKavachMaster;