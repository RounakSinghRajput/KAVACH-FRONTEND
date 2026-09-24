import React, { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Download, X, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";
import { useNotify } from "../../context/notification-context";
import { FloatingInput } from "../../components/common/FloatingInput";
import Can from "../../components/common/Can";

interface Zone {
  id: number;
  name: string;
  code: string;
}

interface Division {
  id: number;
  name: string;
  code: string;
  zone: Zone;
}

const DivisionTable: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  const { showAlert, confirm } = useNotify();

  // Filter input view states
  const [searchInput, setSearchInput] = useState("");
  const [zoneSelect, setZoneSelect] = useState("");

  // Filter values locked on 'Apply' click
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedZone, setAppliedZone] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal & Form fields
  const [openModal, setOpenModal] = useState(false);
  const [editDivision, setEditDivision] = useState<Division | null>(null);
  const [form, setForm] = useState({ name: "", code: "", zoneId: "" });

  const isReadOnly = false;

  useEffect(() => {
    fetchDivisions();
    fetchZones();
  }, []);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/division/ ");
      setDivisions(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    const res = await axiosInstance.get("/zone/");
    setZones(res.data.data || []);
  };

  const handleApply = () => {
    setAppliedSearch(searchInput);
    setAppliedZone(zoneSelect);
    setPage(0);
  };

  const handleReset = () => {
    setSearchInput("");
    setZoneSelect("");
    setAppliedSearch("");
    setAppliedZone("");
    setPage(0);
  };

  const filteredData = useMemo(() => {
    return divisions.filter((d) => {
      const query = appliedSearch.toLowerCase().trim();
      const matchSearch =
        (d.name || "").toLowerCase().includes(query) ||
        (d.code || "").toLowerCase().includes(query) ||
        (d.zone?.code || "").toLowerCase().includes(query);

      const matchZone = appliedZone ? d.zone?.id === Number(appliedZone) : true;
      return matchSearch && matchZone;
    });
  }, [divisions, appliedSearch, appliedZone]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const exportToExcel = () => {
    const data = filteredData.map((d, i) => ({
      "S.No": i + 1,
      "Division Name": d.name,
      "Division Code": d.code,
      "Zone Code": d.zone?.code || "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Divisions");
    XLSX.writeFile(wb, "Divisions.xlsx");
  };

  const openAdd = () => {
    setEditDivision(null);
    setForm({ name: "", code: "", zoneId: "" });
    setOpenModal(true);
  };

  const openEdit = (d: Division) => {
    setEditDivision(d);
    setForm({ name: d.name, code: d.code, zoneId: String(d.zone?.id || "") });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.zoneId) {
      showAlert("All fields required", "error");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      zoneId: Number(form.zoneId),
    };

    try {
      if (editDivision) {
        await axiosInstance.put(`/division/updateDivision/${editDivision.id}`, payload);
        showAlert("Division updated successfully", "success");
      } else {
        await axiosInstance.post("/division/addDivision", payload);
        showAlert("Division saved successfully", "success");
      }
      setOpenModal(false);
      fetchDivisions();
    } catch (err) {
      showAlert("Operation failed", "error");
    }
  };

  const deleteDivision = (id: number) => {
    confirm({
      title: "Delete Division",
      message: "Are you sure you want to delete this division?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/division/deleteDivision/${id}`);
          fetchDivisions();
          showAlert("Division deleted successfully", "success");
        } catch (err) {
          showAlert("Failed to delete division", "error");
        }
      },
    });
  };

  return (
    <div className="p-6 bg-[#f4f7fc] min-h-screen text-slate-800 font-sans">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1d61e1] tracking-tight">Division Master</h1>
        <div className="w-full h-[2px] bg-[#1d61e1] mt-2"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Dropdowns & Filters Layout Header Context */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Search Division / ID</label>
            <input
              type="text"
              placeholder="Enter text..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-60 placeholder-gray-400 focus:outline-none focus:border-[#1d61e1]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Zone</label>
            <select
              value={zoneSelect}
              onChange={(e) => setZoneSelect(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 bg-white focus:outline-none focus:border-[#1d61e1]"
            >
              <option value="">All Zones</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.code}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleApply} className="bg-[#1d61e1] hover:bg-blue-700 text-white font-medium text-sm px-6 py-2 rounded-lg transition-colors shadow-sm">Apply</button>
            <button onClick={handleReset} className="border border-gray-300 hover:bg-gray-50 text-gray-600 p-2 rounded-lg transition-colors"><RotateCcw size={18} /></button>
          </div>
        </div>

        {/* Actions Summary Strip Control Banner */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-gray-900">Data Records</span>
            <span className="bg-[#1d61e1] text-white text-xs font-bold px-2.5 py-1 rounded-full">Rows Found: {filteredData.length}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={exportToExcel} className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-1.5 text-xs font-medium rounded-md transition-colors">
              <Download size={14} className="text-blue-600" /> Excel
            </button>
            <Can>
              <button onClick={openAdd} disabled={isReadOnly} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-xs">
                <Plus size={14} /> Add Division
              </button>
            </Can>
          </div>
        </div>

        {/* Scrollable View Containment wrapper container layout */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                <tr className="bg-[#1d61e1] text-white text-[13px] font-semibold">
                  <th className="px-5 py-3 text-center w-24 border-r border-blue-400/30">S.NO</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">DIVISION NAME</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">DIVISION CODE</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">ZONE CODE</th>
                  <th className="px-5 py-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[14px] text-gray-700 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">Loading divisions dataset...</td>
                  </tr>
                )}

                {!loading && paginatedData.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-gray-50/40">
                    <td className="px-5 py-3 text-center text-gray-500 font-medium">{page * rowsPerPage + i + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 truncate">{d.name}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 uppercase">{d.code}</td>
                    <td className="px-5 py-3 font-medium text-gray-900 uppercase">{d.zone?.code || "N/A"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center items-center gap-4">
                        <Can>
                          <button onClick={() => openEdit(d)} disabled={isReadOnly} className="text-green-600 hover:text-green-800"><Pencil size={16} /></button>
                          <button onClick={() => deleteDivision(d.id)} disabled={isReadOnly} className="text-orange-600 hover:text-orange-800"><Trash2 size={16} /></button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-gray-400">No matching configurations discovered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Layout Context Core Custom Shared Pagination Bar */}
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

      {/* Modal Layout Configuration Frame */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border animate-in fade-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center mb-5 pb-2 border-b">
              <h2 className="font-bold text-base text-gray-800">{editDivision ? "Edit Division Details" : "Register Division Details"}</h2>
              <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-5 py-1">
              <FloatingInput label="Division Name" value={form.name} onChange={(e: any) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <FloatingInput label="Division Code" value={form.code} onChange={(e: any) => setForm((p) => ({ ...p, code: e.target.value }))} />
              <div className="relative">
                <select value={form.zoneId} onChange={(e) => setForm((p) => ({ ...p, zoneId: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none appearance-none">
                  <option value="">Select Zone</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 text-xs">▼</div>
              </div>
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

export default DivisionTable;