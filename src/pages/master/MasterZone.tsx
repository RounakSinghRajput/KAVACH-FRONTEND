import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download, X, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";
import { FloatingInput } from "../../components/common/FloatingInput";
import Can from "../../components/common/Can";

interface Zone {
  id: number;
  name: string;
  code: string;
}

const ZoneTable: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter & Search states
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal & Form states
  const [openModal, setOpenModal] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [form, setForm] = useState({ name: "", code: "" });

  const isReadOnly = false;

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/zone/");
      setZones(res.data.data || []);
    } catch (err) {
      console.error("Error fetching zones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    setAppliedSearch(searchInput);
    setPage(0);
  };

  const handleReset = () => {
    setSearchInput("");
    setAppliedSearch("");
    setPage(0);
  };

  const filteredZones = useMemo(() => {
    const query = appliedSearch.toLowerCase().trim();
    return zones.filter(
      (z) =>
        (z.name || "").toLowerCase().includes(query) ||
        (z.code || "").toLowerCase().includes(query)
    );
  }, [zones, appliedSearch]);

  const totalPages = Math.ceil(filteredZones.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredZones.slice(start, start + rowsPerPage);
  }, [filteredZones, page, rowsPerPage]);

  const exportToExcel = () => {
    const data = filteredZones.map((z, i) => ({
      "S.No": i + 1,
      "Zone Name": z.name,
      "Zone Code": z.code,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Zones");
    XLSX.writeFile(wb, "Zone_Master.xlsx");
  };

  const openAdd = () => {
    setEditZone(null);
    setForm({ name: "", code: "" });
    setOpenModal(true);
  };

  const openEdit = (zone: Zone) => {
    setEditZone(zone);
    setForm({ name: zone.name, code: zone.code });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      alert("Both Zone Name and Zone Code are required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    };

    try {
      if (editZone) {
        await axiosInstance.put(`/zone/${editZone.id}`, payload);
      } else {
        await axiosInstance.post("/zone/", payload);
      }
      setOpenModal(false);
      fetchZones();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteZone = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this zone?")) return;
    try {
      await axiosInstance.delete(`/zone/${id}`);
      fetchZones();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-[#f4f7fc] min-h-screen text-slate-800 font-sans">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1d61e1] tracking-tight">Zone Master</h1>
        <div className="w-full h-[2px] bg-[#1d61e1] mt-2"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Search Zone / Code
            </label>
            <input
              type="text"
              placeholder="Enter text..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 placeholder-gray-400 focus:outline-none focus:border-[#1d61e1]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleApply} className="bg-[#1d61e1] hover:bg-blue-700 text-white font-medium text-sm px-6 py-2 rounded-lg transition-colors shadow-sm">
              Apply
            </button>
            <button onClick={handleReset} className="border border-gray-300 hover:bg-gray-50 text-gray-600 p-2 rounded-lg transition-colors" title="Reset Filters">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Action Header Banner */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-gray-900">Data Records</span>
            <span className="bg-[#1d61e1] text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Rows Found: {filteredZones.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={exportToExcel} className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-1.5 text-xs font-medium rounded-md transition-colors">
              <Download size={14} className="text-blue-600" /> Excel
            </button>
            <Can>
              <button onClick={openAdd} disabled={isReadOnly} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-xs">
                <Plus size={14} /> Add Zone
              </button>
            </Can>
          </div>
        </div>

        {/* Scrollable Table View Context */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                <tr className="bg-[#1d61e1] text-white text-[13px] font-semibold">
                  <th className="px-5 py-3 text-center w-24 border-r border-blue-400/30">S.NO</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">ZONE NAME</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">ZONE CODE</th>
                  <th className="px-5 py-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[14px] text-gray-700 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400">Loading configurations...</td>
                  </tr>
                )}

                {!loading && paginatedData.map((z, i) => (
                  <tr key={z.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-gray-50/40">
                    <td className="px-5 py-3 text-center text-gray-500 font-medium">{page * rowsPerPage + i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 truncate">{z.name}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 uppercase">{z.code}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center items-center gap-4">
                        <Can>
                          <button onClick={() => openEdit(z)} disabled={isReadOnly} className="text-green-600 hover:text-green-800 transition-colors"><Pencil size={16} /></button>
                          <button onClick={() => deleteZone(z.id)} disabled={isReadOnly} className="text-orange-600 hover:text-orange-800 transition-colors"><Trash2 size={16} /></button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredZones.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400">No matching zone data logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fixed Structure Custom Reusable Pagination implementation */}
        <TablePagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredZones.length}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </div>

      {/* Modal Add/Edit */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border animate-in fade-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center mb-5 pb-2 border-b">
              <h2 className="font-bold text-base text-gray-800">{editZone ? "Edit Zone Master" : "Add Zone Master"}</h2>
              <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-5 py-1">
              <FloatingInput label="Zone Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
              <FloatingInput label="Zone Code" value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-3 border-t">
              <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={submitForm} className="px-4 py-2 bg-[#1d61e1] text-white text-xs font-semibold rounded-lg shadow-xs">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneTable;