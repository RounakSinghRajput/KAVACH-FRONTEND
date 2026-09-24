import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download, X, RotateCcw } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";
import { useNotify } from "../../context/notification-context";
import { FloatingInput } from "../../components/common/FloatingInput";
import Can from "../../components/common/Can";

interface Shed {
  id: number;
  name: string;
}

const ShedTable: React.FC = () => {
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Local filter input states
  const [searchInput, setSearchInput] = useState("");
  
  // Applied filter state (Locked when clicking 'Apply')
  const [appliedSearch, setAppliedSearch] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal & Form states
  const [openModal, setOpenModal] = useState(false);
  const [editShed, setEditShed] = useState<Shed | null>(null);
  const [form, setForm] = useState({ name: "" });
  const { showAlert, confirm } = useNotify();

  const isReadOnly = false;

  useEffect(() => {
    fetchSheds();
  }, []);

  const fetchSheds = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/shed/");
      setSheds(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sheds:", err);
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
  const filteredSheds = useMemo(() => {
    const query = appliedSearch.toLowerCase().trim();
    return sheds.filter((s) =>
      (s.name || "").toLowerCase().includes(query)
    );
  }, [sheds, appliedSearch]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredSheds.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSheds.slice(start, start + rowsPerPage);
  }, [filteredSheds, page, rowsPerPage]);

  /* ---------- EXCEL EXPORT ---------- */
  const exportToExcel = () => {
    const data = filteredSheds.map((s, i) => ({
      "S.No": i + 1,
      "Shed Name": s.name,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheds");
    XLSX.writeFile(wb, "Shed_Master.xlsx");
  };

  /* ---------- ADD / EDIT ---------- */
  const openAdd = () => {
    setEditShed(null);
    setForm({ name: "" });
    setOpenModal(true);
  };

  const openEdit = (shed: Shed) => {
    setEditShed(shed);
    setForm({ name: shed.name });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      showAlert("Shed name is required", "warning");
      return;
    }

    try {
      if (editShed) {
        await axiosInstance.put("/shed/", {
          id: editShed.id,
          name: form.name.trim(),
        });
        showAlert("Shed updated successfully", "success");
      } else {
        await axiosInstance.post("/shed/", {
          name: form.name.trim()
        });
        showAlert("Shed added successfully", "success");
      }
      setOpenModal(false);
      fetchSheds();
    } catch (err) {
      showAlert("Operation failed", "error");
    }
  };

  /* ---------- DELETE ---------- */
  const deleteShed = (id: number) => {
    confirm({
      title: "Delete Shed",
      message: "Are you sure you want to delete this shed?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/shed/${id}`);
          fetchSheds();
          showAlert("Shed deleted successfully", "success");
        } catch (err) {
          console.error(err);
          showAlert("Delete failed", "error");
        }
      },
    });
  };

  return (
    <div className="p-6 bg-[#f4f7fc] min-h-screen text-slate-800 font-sans">
      
      {/* Top Header Section Title Bar */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#1d61e1] tracking-tight">Shed Master</h1>
        <div className="w-full h-[2px] bg-[#1d61e1] mt-2"></div>
      </div>

      {/* Main Content Card Wrapper Block */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        
        {/* Top Operational Action Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Search Shed Name
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

        {/* Action Controls & Row Logs Summary Strips */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-gray-900">Data Records</span>
            <span className="bg-[#1d61e1] text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Rows Found: {filteredSheds.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            >
              <Download size={14} className="text-blue-600" /> Excel
            </button>

            <Can>
              <button
                onClick={openAdd}
                disabled={isReadOnly}
                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-xs"
              >
                <Plus size={14} /> Add Shed
              </button>
            </Can>
          </div>
        </div>

        {/* Scrollable Data Table Container */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
                <tr className="bg-[#1d61e1] text-white text-[13px] font-semibold">
                  <th className="px-5 py-3 text-center w-24 border-r border-blue-400/30">S.NO</th>
                  <th className="px-5 py-3 border-r border-blue-400/30">SHED NAME</th>
                  <th className="px-5 py-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[14px] text-gray-700 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400">
                      Loading data shed logs...
                    </td>
                  </tr>
                )}

                {!loading && paginatedData.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-gray-50/40">
                    <td className="px-5 py-3 text-center text-gray-500 font-medium">
                      {page * rowsPerPage + i + 1}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900 truncate">
                      {s.name}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center items-center gap-4">
                        <Can>
                          <button
                            onClick={() => openEdit(s)}
                            disabled={isReadOnly}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteShed(s.id)}
                            disabled={isReadOnly}
                            className="text-orange-600 hover:text-orange-800 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredSheds.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400">
                      No matching configuration records discovered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reusable Component Footer Pagination Element */}
        <TablePagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredSheds.length}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />

      </div>

      {/* Action Dialog Form Modal Overlay Context */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border animate-in fade-in zoom-in-95 duration-100">
            <div className="flex justify-between items-center mb-5 pb-2 border-b">
              <h2 className="font-bold text-base text-gray-800">
                {editShed ? "Edit Shed Configuration" : "Register Shed Profile"}
              </h2>
              <button 
                onClick={() => setOpenModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 py-1">
              <FloatingInput
                label="Shed Name"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setForm({ name: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="px-4 py-2 bg-[#1d61e1] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                {editShed ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShedTable;