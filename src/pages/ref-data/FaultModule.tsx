import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../services/axios";
import { useNotify } from "../../context/notification-context";
import { ContentLoading } from "../../components/common/LoadingScreen"; 
import { Plus, Edit3, Trash2, Search, FileText, Download, RefreshCw, X, ChevronLeft, ChevronRight } from "lucide-react";

interface FaultModule {
  id: number;
  moduleId: number;
  moduleName: string;
  firm: {
    id: number;
    name: string;
  };
  faultCategory: {
    id: number;
    name: string;
  };
}

const FaultModuleMaster = () => {
  const { showAlert, confirm } = useNotify();
  const [rows, setRows] = useState<FaultModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FaultModule | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    moduleId: "",
    moduleName: "",
  });

  const fetchFaultModules = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/fault-modules");
      setRows(response.data || []);
    } catch (error) {
      console.error("Error fetching fault modules:", error);
      showAlert("Failed to load fault modules data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaultModules();
  }, []);

  // Reset page position if search updates
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleAdd = () => {
    setEditingRow(null);
    setFormData({ moduleId: "", moduleName: "" });
    setOpen(true);
  };

  const handleEdit = (row: FaultModule) => {
    setEditingRow(row);
    setFormData({
      moduleId: String(row.moduleId || ""),
      moduleName: row.moduleName || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "Delete Fault Module",
      message: "Are you sure you want to delete this module record? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/fault-modules/${id}`);
          showAlert("Module deleted successfully.", "success");
          fetchFaultModules();
        } catch (error) {
          console.error(error);
          showAlert("Failed to delete the module record.", "error");
        }
      },
    });
  };

  const handleSave = async () => {
    if (!formData.moduleId || !formData.moduleName.trim()) {
      showAlert("Please populate all required fields.", "warning");
      return;
    }

    try {
      const payload = {
        moduleId: Number(formData.moduleId),
        moduleName: formData.moduleName.trim(),
      };

      if (editingRow) {
        await axiosInstance.put(`/api/fault-modules/${editingRow.id}`, payload);
        showAlert("Fault Module updated successfully.", "success");
      } else {
        await axiosInstance.post("/api/fault-modules", payload);
        showAlert("Fault Module created successfully.", "success");
      }

      setOpen(false);
      fetchFaultModules();
    } catch (error) {
      console.error(error);
      showAlert("An error occurred while saving.", "error");
    }
  };

  const filteredRows = rows.filter((row) => {
    const searchText = search.toLowerCase();
    return (
      row.moduleName?.toLowerCase().includes(searchText) ||
      row.moduleId?.toString().includes(searchText) ||
      row.firm?.name?.toLowerCase().includes(searchText) ||
      row.faultCategory?.name?.toLowerCase().includes(searchText) ||
      row.id?.toString().includes(searchText)
    );
  });

  // Pagination Slice Logic
  const totalRecords = filteredRows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full min-h-screen bg-[#f3f7fa] p-4 font-sans text-[#333]">
      {/* Top Title Section */}
      <div className="w-full border-b-2 border-blue-600 pb-2 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-[#1a5a9e] tracking-wide">Fault Module</h1>
        
        {/* Compact Workspace Controls */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Search Module, ID, Firm or Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
          
          <button
            onClick={handleAdd}
            title="Add Fault Module"
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center justify-center h-[34px] w-[34px]"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Main Table Card Box */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table View Heading Controls */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
         
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Total Records : {totalRecords}
            </span>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Download size={14} className="text-blue-600" /> Excel
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">
              <FileText size={14} className="text-blue-600" /> PDF
            </button>
            <button onClick={fetchFaultModules} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">
              <RefreshCw size={14} className="text-blue-600" /> Refresh
            </button>
          </div>
        </div>

        {/* Dense Custom Blue-Header Table */}
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="w-full min-h-[300px] flex items-center justify-center bg-slate-50/50">
              <ContentLoading />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-[#1b62b3] text-white text-[13px] font-semibold divide-x divide-blue-500">
                  <th className="px-4 py-2.5 w-16 text-center">S.No</th>
                  <th className="px-4 py-2.5 w-28">Module ID</th>
                  <th className="px-4 py-2.5">Module Name</th>
                  <th className="px-4 py-2.5">Firm Name</th>
                  <th className="px-4 py-2.5">Fault Category</th>
                  <th className="px-4 py-2.5 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700 divide-y divide-slate-100">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-[#f2f7fc] transition-colors odd:bg-white even:bg-slate-50/50 divide-x divide-slate-100">
                      <td className="px-4 py-2 text-center font-medium text-slate-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-900">{row.moduleId}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{row.moduleName}</td>
                      <td className="px-4 py-2">{row.firm?.name || "N/A"}</td>
                      <td className="px-4 py-2">{row.faultCategory?.name || "N/A"}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEdit(row)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 bg-slate-50/30">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Action Footer block matching data layout bars */}
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
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <span>
              Showing {totalRecords > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} records
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

      {/* Pure Tailwind Context Overlay Form Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-md font-bold text-slate-800">
                {editingRow ? "✏️ Edit Fault Module" : "✨ Add New Fault Module"}
              </h3>
              <button 
                onClick={() => setOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Forms */}
            <div className="p-5 flex flex-col gap-6">
              <div className="relative w-full mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Module ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1024"
                  value={formData.moduleId}
                  onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-blue-500 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div className="relative w-full">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Module Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radio Communication Unit"
                  value={formData.moduleName}
                  onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-blue-500 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                Save Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaultModuleMaster;