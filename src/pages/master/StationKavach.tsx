import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import Select from "react-select";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";

interface Station {
  id: number;
  name: string;
  code: string;
  kavachSubSystemId: number;
  nmsVersion: string;
  sectionId: string;
  section: string;
  division: {
    id: number;
    name: string;
    code: string;
    divisionalId: string;
    zone: {
      id: number;
      name: string;
      code: string;
      zonalId: string;
    };
  };
  firm: {
    id: number;
    name: string;
  };
}

interface Zone { id: number; name: string; }
interface Division { id: number; name: string; }
interface Firm { id: number; name: string; }
interface Shed { id: number; name: string; }

const StationKavachMaster: React.FC = () => {
  const [data, setData] = useState<Station[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [sheds, setSheds] = useState<Shed[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [shedFilter, setShedFilter] = useState("");

  useEffect(() => {
    fetchData();
    fetchZones();
    fetchDivisions();
    fetchFirms();
    fetchSheds();
  }, []);

  const fetchData = async () => {
    const res = await axiosInstance.get("/mstStation/");
    setData(res.data.data);
  };

  const fetchZones = async () => {
    const res = await axiosInstance.get("/zone/");
    setZones(res.data.data);
  };

  const fetchDivisions = async () => {
    const res = await axiosInstance.get("/division/");
    setDivisions(res.data.data);
  };

  const fetchFirms = async () => {
    const res = await axiosInstance.get("/firm/");
    setFirms(res.data.data);
  };

  const fetchSheds = async () => {
    const res = await axiosInstance.get("/shed/");
    setSheds(res.data.data);
  };

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      const searchText = search.toLowerCase();
      const matchesSearch =
        (d.name && d.name.toLowerCase().includes(searchText)) ||
        (d.kavachSubSystemId && d.kavachSubSystemId.toString().includes(searchText));

      const matchesFilters =
        (zoneFilter ? d.division?.zone?.name === zoneFilter : true) &&
        (divisionFilter ? d.division?.name === divisionFilter : true) &&
        (firmFilter ? d.firm?.name === firmFilter : true);

      return matchesSearch && matchesFilters;
    });
  }, [data, search, zoneFilter, divisionFilter, firmFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleClear = () => {
    setSearch("");
    setZoneFilter("");
    setDivisionFilter("");
    setFirmFilter("");
    setShedFilter("");
    setPage(0);
  };

  const exportExcel = () => {
    const exportData = filteredData.map((d, i) => ({
      "S.No": i + 1,
      Station: d.name,
      Code: d.code,
      "Kavach SubSystem ID": d.kavachSubSystemId,
      Zone: d.division?.zone?.name || "",
      Division: d.division?.name || "",
      Firm: d.firm?.name || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stations");
    XLSX.writeFile(wb, "StationMaster.xlsx");
  };

  // Base styling configuration to match clean UI layout
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
    // Breaking the dropdown out into a layout portal container to layer above absolute headers
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="border-b-2 border-blue-600 pb-2 mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Station Kavach Master</h1>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-6">
        
        {/* Top Filter and Actions Bar */}
        <div className="flex flex-wrap items-end gap-3 justify-between mb-6">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            {/* Search */}
            <div className="w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Search Station / ID</label>
              <input
                type="text"
                placeholder="Enter text..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Zone */}
            <div className="w-44">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Zone</label>
              <Select
                styles={customSelectStyles}
                options={zones.map((z) => ({ value: z.name, label: z.name }))}
                value={zoneFilter ? { value: zoneFilter, label: zoneFilter } : null}
                onChange={(selected) => { setZoneFilter(selected ? selected.value : ""); setPage(0); }}
                isClearable
                placeholder="All Zones"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
              />
            </div>

            {/* Division */}
            <div className="w-44">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Division</label>
              <Select
                styles={customSelectStyles}
                options={divisions.map((d) => ({ value: d.name, label: d.name }))}
                value={divisionFilter ? { value: divisionFilter, label: divisionFilter } : null}
                onChange={(selected) => { setDivisionFilter(selected ? selected.value : ""); setPage(0); }}
                isClearable
                placeholder="All Divisions"
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
              />
            </div>

            {/* Firm */}
            <div className="w-44">
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

            {/* Action Group: Apply & Reset */}
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

          {/* Export Group */}
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

        {/* Data Records Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-gray-800">Data Records</span>
          <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Rows Found: {filteredData.length}
          </span>
        </div>

        {/* Table Container Layout Configuration */}
        <div className="border border-gray-200 rounded-lg h-[500px] overflow-y-auto shadow-inner relative">
          <table className="w-full border-collapse text-left bg-white">
            <thead className="sticky top-0 z-10 bg-blue-600 text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold text-center w-16">S.No</th>
                <th className="px-4 py-3 font-semibold">Station Name</th>
                <th className="px-4 py-3 font-semibold text-center">Station ID</th>
                <th className="px-4 py-3 font-semibold text-center">Station Code</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Division</th>
                <th className="px-4 py-3 font-semibold">Firm</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((d, i) => (
                  <tr key={d.id} className="hover:bg-blue-50/40 even:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 border-r border-gray-100 text-center text-gray-500 font-medium">
                      {page * rowsPerPage + i + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-2.5 text-center text-blue-600 font-mono text-xs">{d.kavachSubSystemId}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-gray-600">{d.code}</td>
                    <td className="px-4 py-2.5">{d.division?.zone?.name || "—"}</td>
                    <td className="px-4 py-2.5">{d.division?.name || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded font-medium border border-gray-200">
                        {d.firm?.name || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 font-medium bg-gray-50">
                    No matching station master data records discovered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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

export default StationKavachMaster;