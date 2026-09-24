import React, { useEffect, useState } from "react";
import { Eye, Download, Settings, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";

/* ================= TYPES ================= */
interface ICMSRow {
  id: number;
  event_date: string;
  division?: {
    code: string;
    name: string;
    zone?: {
      code: string;
      name: string;
    };
  };
  section?: string;
  detention_code: string;
  start_time: string;
  end_time: string;
  duration: string;
  block_section: string;
  up_dn_flag: string;
  affected_trains: string;
  avg_det_time: string;
  remark: string;
  failure_id: string;
  operator_code: string;
  update_time: string;
  classification: string;
  event_end_date: string;
  status: string;
  assetiid: string;
  assetname: string;
}

/* ================= COLUMNS ================= */
type ColumnKey =
  | "event_date"
  | "section"
  | "detention_code"
  | "start_time"
  | "end_time"
  | "duration"
  | "block_section"
  | "up_dn_flag"
  | "affected_trains"
  | "avg_det_time"
  | "failure_id"
  | "operator_code"
  | "classification"
  | "status";

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "event_date", label: "Event Date" },
  { key: "section", label: "Section" },
  { key: "detention_code", label: "Detention Code" },
  { key: "start_time", label: "Start Time" },
  { key: "end_time", label: "End Time" },
  { key: "duration", label: "Duration" },
  { key: "block_section", label: "Block Section" },
  { key: "up_dn_flag", label: "UP/DN" },
  { key: "affected_trains", label: "Affected Trains" },
  { key: "avg_det_time", label: "Avg Date Time" },
  { key: "failure_id", label: "Failure ID" },
  { key: "operator_code", label: "Operator Code" },
  { key: "classification", label: "Classification" },
  { key: "status", label: "Status" },
];

/* ================= COMPONENT ================= */
const ICMSFailureRegister: React.FC = () => {
  const [data, setData] = useState<ICMSRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* selection */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  /* columns */
  const [columns, setColumns] = useState<ColumnKey[]>(() => {
    const saved = localStorage.getItem("icms-columns");
    return saved ? JSON.parse(saved) : ALL_COLUMNS.map((c) => c.key);
  });
  const [openColumnModal, setOpenColumnModal] = useState(false);

  /* info modal */
  const [openInfo, setOpenInfo] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ICMSRow | null>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage]);

  useEffect(() => {
    localStorage.setItem("icms-columns", JSON.stringify(columns));
  }, [columns]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await axiosInstance.get("/icms/", {
        params: {
          page: page,
          size: rowsPerPage,
        },
      });

      const pageData = res.data.data;

      setData(pageData.content || []);
      setSelectedIds([]);
      setTotalElements(pageData.totalElements || 0);
      setTotalPages(pageData.totalPages || 0);
    } catch (err) {
      console.error(err);
    }
    fontFinally: {
      setLoading(false);
    }
  };

  /* ================= SELECTION ================= */
  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((r) => r.id));
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /* ================= CELL ================= */
  const renderCell = (r: ICMSRow, key: ColumnKey) => {
    switch (key) {
      case "section":
        return r.section || "-";

      case "status":
        const isActive = String(r.status) === "1";

        return (
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );

      default:
        return (r as any)[key] || "-";
    }
  };

  /* ================= EXPORT ================= */
  const exportToExcel = () => {
    const exportRows =
      selectedIds.length > 0
        ? data.filter((r) => selectedIds.includes(r.id))
        : data;

    if (exportRows.length === 0) return;

    const sheetData = exportRows.map((r, index) => {
      const row: any = { "S.No": index + 1 };

      columns.forEach((c) => {
        const label = ALL_COLUMNS.find((x) => x.key === c)?.label || c;
        row[label] = renderCell(r, c);
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ICMS");
    XLSX.writeFile(wb, "ICMS_Failure_Register.xlsx");
  };

  const startRow = totalElements === 0 ? 0 : page * rowsPerPage + 1;
  const endRow = Math.min((page + 1) * rowsPerPage, totalElements);

  /* ================= UI ================= */
  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* HEADER WITH BLUE UNDERLINE */}
      <div className="border-b-2 border-blue-600 pb-2 mb-6">
        <h1 className="text-3xl font-bold text-blue-600">
          ICMS Failure Register
        </h1>
      </div>

      {/* CARD CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {/* CARD HEADER / CONTROLS */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              ICMS Failure Logs
            </h2>
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Total: {totalElements}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpenColumnModal(true)}
              className="flex items-center gap-2 border border-blue-500 text-blue-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-50 transition"
            >
              <Settings size={16} />
              Columns
            </button>

            <button
              onClick={exportToExcel}
              disabled={data.length === 0}
              className={`flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-semibold transition ${
                data.length === 0
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-blue-500 text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Download size={16} />
              {selectedIds.length > 0 ? "Export Selected" : "Excel"}
            </button>
          </div>
        </div>

        {/* FIXED HEIGHT & SCROLLABLE TABLE CONTAINER */}
        <div className="border border-gray-200 rounded-lg overflow-auto h-[580px] relative shadow-inner bg-white">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-40 flex flex-col items-center justify-center text-blue-600 gap-2">
              <Loader2 size={40} className="animate-spin" />
              <span className="text-sm font-semibold text-gray-600">
                Loading records...
              </span>
            </div>
          )}

          <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
            {/* STICKY HEADER */}
            <thead className="bg-blue-600 text-white font-semibold text-sm sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-4 py-3.5 border-r border-blue-500 sticky left-0 top-0 bg-blue-600 z-40 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-blue-800 cursor-pointer"
                    checked={
                      data.length > 0 && selectedIds.length === data.length
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3.5 border-r border-blue-500 text-center w-16 font-bold">
                  S.No
                </th>

                {columns.map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3.5 border-r border-blue-500 font-bold"
                  >
                    {ALL_COLUMNS.find((x) => x.key === c)?.label}
                  </th>
                ))}

                <th className="px-4 py-3.5 sticky right-0 top-0 bg-blue-600 z-40 text-center w-16 font-bold">
                  Info
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-gray-800 text-sm">
              {!loading && data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 3}
                    className="text-center py-20 text-gray-500 font-medium text-base"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((r, i) => (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 border-r border-gray-200 sticky left-0 bg-white text-center z-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleRow(r.id)}
                      />
                    </td>

                    <td className="px-4 py-3 border-r border-gray-200 text-center font-medium text-gray-600">
                      {page * rowsPerPage + i + 1}
                    </td>

                    {columns.map((c) => (
                      <td
                        key={c}
                        className="px-4 py-3 border-r border-gray-200 max-w-[240px] truncate"
                        title={String(renderCell(r, c))}
                      >
                        {renderCell(r, c)}
                      </td>
                    ))}

                    <td className="px-4 py-3 sticky right-0 bg-white text-center border-l border-gray-200 z-10">
                      <button
                        onClick={() => {
                          setSelectedRow(r);
                          setOpenInfo(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1.5 rounded-full transition"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-end gap-6 mt-4 text-sm text-gray-700 font-medium">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <span>
            {startRow}-{endRow} of{" "}
            <strong className="text-blue-600 font-bold">{totalElements}</strong>
          </span>

          <div className="flex items-center gap-1 text-blue-600 text-lg font-semibold">
            <button
              disabled={page === 0}
              onClick={() => setPage(0)}
              className="px-2 py-1 disabled:text-gray-300 hover:bg-gray-100 rounded"
              title="First Page"
            >
              «
            </button>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-1 disabled:text-gray-300 hover:bg-gray-100 rounded"
              title="Previous Page"
            >
              ‹
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 disabled:text-gray-300 hover:bg-gray-100 rounded"
              title="Next Page"
            >
              ›
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
              className="px-2 py-1 disabled:text-gray-300 hover:bg-gray-100 rounded"
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN SELECTION MODAL */}
      {openColumnModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[380px] rounded-lg overflow-hidden shadow-xl border border-gray-200">
            <div className="bg-blue-600 text-white px-5 py-3.5 flex justify-between items-center">
              <h2 className="font-semibold text-base">Customize Columns</h2>
              <button
                onClick={() => setOpenColumnModal(false)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[350px] overflow-y-auto space-y-1">
              {ALL_COLUMNS.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-3 py-2 text-sm cursor-pointer hover:bg-gray-50 px-2 rounded font-medium text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-blue-600"
                    checked={columns.includes(c.key)}
                    onChange={() =>
                      setColumns((prev) =>
                        prev.includes(c.key)
                          ? prev.filter((x) => x !== c.key)
                          : [...prev, c.key],
                      )
                    }
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {openInfo && selectedRow && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-lg shadow-xl flex flex-col overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">ICMS Failure Details</h2>

              <button
                onClick={() => setOpenInfo(false)}
                className="px-4 py-1.5 bg-white text-blue-600 rounded-md text-sm font-bold hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full border border-gray-200 text-sm">
                <tbody>
                  {Object.entries(selectedRow).map(([key, value]) => {
                    if (
                      typeof value === "object" ||
                      value === null ||
                      value === undefined ||
                      String(value).trim() === ""
                    )
                      return null;

                    const formattedKey = key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                      <tr key={key} className="border-b border-gray-200">
                        <td className="w-1/3 px-4 py-2.5 bg-gray-50 font-semibold border-r border-gray-200 text-gray-700">
                          {formattedKey}
                        </td>
                        <td className="px-4 py-2.5 break-words text-gray-800">
                          {String(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICMSFailureRegister;
