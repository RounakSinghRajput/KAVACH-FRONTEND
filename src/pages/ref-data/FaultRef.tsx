import React, { useEffect, useState } from "react";
import { axiosInstance } from "../../services/axios";
import { useNotify } from "../../context/notification-context";
import { ContentLoading } from "../../components/common/LoadingScreen"; 
import { Plus, Edit3, Trash2, Search, FileText, Download, RefreshCw, X, ChevronLeft, ChevronRight } from "lucide-react";

interface FaultCode {
  id: number;
  firm: {
    id: number;
    name: string;
  };
  moduleId: number;
  faultType: {
    id: number;
    name: string;
  };
  faultCode: number;
  faultMsg: string;
  faultCategory: {
    id: number;
    name: string;
  };
  createdAt: string | null;
}

const FaultCodeMaster = () => {
  const { showAlert, confirm } = useNotify();
  const [rows, setRows] = useState<FaultCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<FaultCode | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Full structural state representing your POST / PUT JSON request body payload 
  const [formData, setFormData] = useState({
    firmId: "",
    moduleId: "",
    faultTypeId: "",
    faultCode: "",
    faultMsg: "",
    faultCategoryId: ""
  });

  const fetchFaultCodes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/fault-code");
      setRows(response.data || []);
    } catch (error) {
      console.error("Error fetching fault codes:", error);
      showAlert("Failed to load fault codes data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaultCodes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleAdd = () => {
    setEditingRow(null);
    setFormData({
      firmId: "",
      moduleId: "",
      faultTypeId: "",
      faultCode: "",
      faultMsg: "",
      faultCategoryId: ""
    });
    setOpen(true);
  };

  const handleEdit = (row: FaultCode) => {
    setEditingRow(row);
    setFormData({
      firmId: String(row.firm?.id || ""),
      moduleId: String(row.moduleId || ""),
      faultTypeId: String(row.faultType?.id || ""),
      faultCode: String(row.faultCode || ""),
      faultMsg: row.faultMsg || "",
      faultCategoryId: String(row.faultCategory?.id || "")
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "Delete Fault Code",
      message: "Are you sure you want to delete this record? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/api/fault-code/${id}`);
          showAlert("Record deleted successfully.", "success");
          fetchFaultCodes();
        } catch (error) {
          console.error(error);
          showAlert("Failed to delete the record.", "error");
        }
      },
    });
  };

  const handleSave = async () => {
    const { firmId, moduleId, faultTypeId, faultCode, faultMsg, faultCategoryId } = formData;

    // Validate that every single field from your specific payload structure is filled
    if (!firmId || !moduleId || !faultTypeId || !faultCode || !faultMsg.trim() || !faultCategoryId) {
      showAlert("Please populate all required fields.", "warning");
      return;
    }

    try {
      // Formatted exactly according to your schema rules
      const payload = {
        firm: {
          id: Number(firmId)
        },
        moduleId: Number(moduleId),
        faultType: {
          id: Number(faultTypeId)
        },
        faultCode: Number(faultCode),
        faultMsg: faultMsg.trim(),
        faultCategory: {
          id: Number(faultCategoryId)
        }
      };

      if (editingRow) {
        await axiosInstance.put(`/api/fault-code/${editingRow.id}`, payload);
        showAlert("Fault Code updated successfully.", "success");
      } else {
        await axiosInstance.post("/api/fault-code", payload);
        showAlert("Fault Code created successfully.", "success");
      }

      setOpen(false);
      fetchFaultCodes();
    } catch (error) {
      console.error(error);
      showAlert("An error occurred while saving.", "error");
    }
  };

  // Browser-native Excel (CSV layout generation engine)
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      showAlert("No data available to export.", "warning");
      return;
    }
    
    const headers = ["S.No", "Firm", "Module ID", "Fault Type", "Fault Code", "Fault Message", "Category"];
    const csvRows = [
      headers.join(","),
      ...filteredRows.map((row, idx) => [
        idx + 1,
        `"${(row.firm?.name || row.firm?.id || "N/A").toString().replace(/"/g, '""')}"`,
        row.moduleId,
        `"${(row.faultType?.name || row.faultType?.id || "N/A").toString().replace(/"/g, '""')}"`,
        row.faultCode,
        `"${row.faultMsg.replace(/"/g, '""')}"`,
        `"${(row.faultCategory?.name || row.faultCategory?.id || "N/A").toString().replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Fault_Codes_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("Excel download generated successfully.", "success");
  };

  // Browser-native PDF Print Layout Generator Engine
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      showAlert("No data available to export.", "warning");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showAlert("Popup blocked! Please allow popups to export PDF.", "error");
      return;
    }

    const htmlTableRows = filteredRows.map((row, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.firm?.name || `ID: ${row.firm?.id}`}</td>
        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${row.moduleId}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.faultType?.name || `ID: ${row.faultType?.id}`}</td>
        <td style="text-align: center; font-weight: bold; padding: 8px; border: 1px solid #ddd;">${row.faultCode}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.faultMsg}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${row.faultCategory?.name || `ID: ${row.faultCategory?.id}`}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Fault Code Master Report</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 20px; }
            h1 { color: #1a5a9e; font-size: 20px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #1b62b3; color: white; padding: 10px; border: 1px solid #1b62b3; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Fault Code Master Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Firm</th>
                <th>Module ID</th>
                <th>Fault Type</th>
                <th>Fault Code</th>
                <th>Fault Message</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              ${htmlTableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredRows = rows.filter((row) => {
    const searchText = search.toLowerCase();
    return (
      row.faultMsg?.toLowerCase().includes(searchText) ||
      row.faultCode?.toString().includes(searchText) ||
      row.firm?.name?.toLowerCase().includes(searchText) ||
      row.firm?.id?.toString().includes(searchText) ||
      row.faultType?.name?.toLowerCase().includes(searchText) ||
      row.faultType?.id?.toString().includes(searchText) ||
      row.faultCategory?.name?.toLowerCase().includes(searchText) ||
      row.faultCategory?.id?.toString().includes(searchText) ||
      row.moduleId?.toString().includes(searchText)
    );
  });

  const totalRecords = filteredRows.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full min-h-screen bg-[#f3f7fa] p-4 font-sans text-[#333]">
      {/* Top App Title Header Segment */}
      <div className="w-full border-b-2 border-blue-600 pb-2 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-[#1a5a9e] tracking-wide">Fault Code</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Search Code, Msg, Firm or Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
          
          <button
            onClick={handleAdd}
            title="Add Fault Code"
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center justify-center h-[34px] w-[34px]"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Main Table Grid Card Frame */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Total Records : {totalRecords}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={14} className="text-blue-600" /> Excel
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <FileText size={14} className="text-blue-600" /> PDF
            </button>
            <button 
              onClick={fetchFaultCodes} 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} className="text-blue-600" /> Refresh
            </button>
          </div>
        </div>

        {/* Custom Layout Table */}
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="w-full min-h-[350px] flex items-center justify-center bg-slate-50/50">
              <ContentLoading />
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-[#1b62b3] text-white text-[13px] font-semibold divide-x divide-blue-500">
                  <th className="px-3 py-2.5 w-14 text-center">S.No</th>
                  <th className="px-4 py-2.5 w-40">Firm</th>
                  <th className="px-3 py-2.5 w-24 text-center">Module ID</th>
                  <th className="px-4 py-2.5 w-40">Fault Type</th>
                  <th className="px-3 py-2.5 w-28 text-center">Fault Code</th>
                  <th className="px-4 py-2.5">Fault Message</th>
                  <th className="px-4 py-2.5 w-44">Category</th>
                  <th className="px-4 py-2.5 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] text-slate-700 divide-y divide-slate-100">
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-[#f2f7fc] transition-colors odd:bg-white even:bg-slate-50/50 divide-x divide-slate-100">
                      <td className="px-3 py-2 text-center font-medium text-slate-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-2 truncate max-w-[160px] font-medium text-slate-900">
                        {row.firm?.name || `ID: ${row.firm?.id}`}
                      </td>
                      <td className="px-3 py-2 text-center">{row.moduleId}</td>
                      <td className="px-4 py-2 truncate max-w-[160px]">{row.faultType?.name || `ID: ${row.faultType?.id}`}</td>
                      <td className="px-3 py-2 text-center font-semibold text-slate-800">{row.faultCode}</td>
                      <td className="px-4 py-2 truncate max-w-xs" title={row.faultMsg}>{row.faultMsg}</td>
                      <td className="px-4 py-2 truncate max-w-[185px]">{row.faultCategory?.name || `ID: ${row.faultCategory?.id}`}</td>
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
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400 bg-slate-50/30">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Layout Pagination Controls Footer */}
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
                {[5, 10, 25, 50, 100].map((size) => (
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

      {/* Dynamic Structural Input Dialog Modal Box */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingRow ? "✏️ Edit Fault Code" : "✨ Add New Fault Code"}
              </h3>
              <button 
                onClick={() => setOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comprehensive body input array to populate complete API properties maps */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
              
              <div className="relative w-full mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Firm ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={formData.firmId}
                  onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative w-full sm:mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Module ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 101"
                  value={formData.moduleId}
                  onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative w-full mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Fault Type ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1"
                  value={formData.faultTypeId}
                  onChange={(e) => setFormData({ ...formData, faultTypeId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative w-full mt-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Fault Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5001"
                  value={formData.faultCode}
                  onChange={(e) => setFormData({ ...formData, faultCode: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative w-full mt-2 sm:col-span-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Fault Category ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 11"
                  value={formData.faultCategoryId}
                  onChange={(e) => setFormData({ ...formData, faultCategoryId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="relative w-full mt-2 sm:col-span-2">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-xs text-blue-600 font-medium">
                  Fault Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the diagnostics error signature..."
                  value={formData.faultMsg}
                  onChange={(e) => setFormData({ ...formData, faultMsg: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

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
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaultCodeMaster;