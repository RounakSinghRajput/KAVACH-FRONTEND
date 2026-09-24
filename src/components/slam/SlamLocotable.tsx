import React, { useEffect, useMemo, useRef, useState } from "react";
import { axiosInstance } from "../../services/axios";
import type { SlamLoco } from "../../types/slam";
import { formatDate } from "../../utils/formateDate";
import { exportToExcel } from "../../utils/exportToExcel";
import SlamLocoFormModal from "./../../components/slam/AddEditForm";
import {
  Download,
  Table,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Search,
} from "lucide-react";

/* ================= COLUMN DEFINITIONS ================= */
const COLUMN_KEYS = [
  "sno",
  "loco",
  "locoType",
  "make",
  "contract",
  "version",
  "locoBrakeType",
  "locoManufacturer",
  "locoOwningZone",
  "locoOwningDivision",
  "locoOwningShed",
  "offered",
  "completed",
  "pcc",
  "final",
  "remarks",
] as const;

type ColumnKey = (typeof COLUMN_KEYS)[number];

const labelMap: Record<ColumnKey, string> = {
  sno: "S.No",
  loco: "LOCO",
  locoType: "LOCO TYPE",
  make: "MAKE",
  contract: "CONTRACT",
  version: "VERSION",
  locoBrakeType: "BRAKE TYPE",
  locoManufacturer: "MANUFACTURER",
  locoOwningZone: "ZONE",
  locoOwningDivision: "DIVISION",
  locoOwningShed: "SHED",
  offered: "OFFERED",
  completed: "COMPLETED",
  pcc: "PCC",
  final: "FINAL",
  remarks: "REMARKS",
};

/* ================= SKELETON CONTENT LOADER ================= */
const TableSkeletonLoader: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 10,
  cols = 8,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-slate-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
            </td>
          ))}
          <td className="px-4 py-3 sticky right-0 bg-white">
            <div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ================= MAIN COMPONENT ================= */
const SlamLocoManagementPage: React.FC = () => {
  const [data, setData] = useState<SlamLoco[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [openAction, setOpenAction] = useState<number | null>(null);
  const [deleteRow, setDeleteRow] = useState<SlamLoco | null>(null);

  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([]);

  // Header Dropdown Popups state
  const [openFilter, setOpenFilter] = useState<ColumnKey | null>(null);
  const filterPopupRef = useRef<HTMLDivElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<SlamLoco | null>(null);

  /* SINGLE UNIFIED SEARCH FILTER */
  const [globalSearch, setGlobalSearch] = useState("");

  /* COLUMN DROPDOWN & DATE FILTERS (Inside headers) */
  const [filters, setFilters] = useState({
    make: "",
    contract: "",
    version: "",
    locoBrakeType: "",
    locoManufacturer: "",
  });

  const [dateFilters, setDateFilters] = useState({
    offeredFrom: "",
    offeredTo: "",
    completedFrom: "",
    completedTo: "",
    pccFrom: "",
    pccTo: "",
    finalFrom: "",
    finalTo: "",
  });

  const orderedColumns = useMemo(() => {
    if (selectedColumns.length === 0) return [...COLUMN_KEYS];
    const remain = COLUMN_KEYS.filter((x) => !selectedColumns.includes(x));
    return [...selectedColumns, ...remain];
  }, [selectedColumns]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/slamLoco/fullData");
      setData(res.data?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        filterPopupRef.current &&
        !filterPopupRef.current.contains(e.target as Node)
      ) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [filters, dateFilters, globalSearch, rowsPerPage]);

  const makeOptions = useMemo(
    () => [...new Set(data.map((x) => x.make).filter(Boolean))],
    [data],
  );
  const contractOptions = useMemo(
    () => [...new Set(data.map((x) => x.contract).filter(Boolean))],
    [data],
  );
  const manufacturerOptions = useMemo(
    () => [...new Set(data.map((x) => x.locoManufacturer).filter(Boolean))],
    [data],
  );
  const brakeOptions = useMemo(
    () => [...new Set(data.map((x) => x.locoBrakeType).filter(Boolean))],
    [data],
  );

  const normalize = (v: any) => v?.toString().toLowerCase().trim() || "";

  const inRange = (dateStr: string, from?: string, to?: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const f = from ? new Date(from) : null;
    const t = to ? new Date(to) : null;
    return (!f || date >= f) && (!t || date <= t);
  };

  const filteredData = useMemo(() => {
    const query = normalize(globalSearch);

    return data.filter((row) => {
      const matchesSearch =
        !query ||
        normalize(row.loco).includes(query) ||
        normalize(row.locoOwningZone).includes(query) ||
        normalize(row.locoOwningDivision).includes(query) ||
        normalize(row.locoOwningShed).includes(query);

      return (
        matchesSearch &&
        (!filters.make || normalize(row.make) === normalize(filters.make)) &&
        (!filters.contract ||
          normalize(row.contract) === normalize(filters.contract)) &&
        (!filters.version ||
          normalize(row.version) === normalize(filters.version)) &&
        (!filters.locoBrakeType ||
          normalize(row.locoBrakeType) === normalize(filters.locoBrakeType)) &&
        (!filters.locoManufacturer ||
          normalize(row.locoManufacturer) ===
            normalize(filters.locoManufacturer)) &&
        inRange(
          row.locoOfferedInstallation,
          dateFilters.offeredFrom,
          dateFilters.offeredTo,
        ) &&
        inRange(
          row.installationCompleted,
          dateFilters.completedFrom,
          dateFilters.completedTo,
        ) &&
        inRange(
          row.preCommissioningPcc,
          dateFilters.pccFrom,
          dateFilters.pccTo,
        ) &&
        inRange(
          row.finalTestingCommissioning,
          dateFilters.finalFrom,
          dateFilters.finalTo,
        )
      );
    });
  }, [data, filters, dateFilters, globalSearch]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  /* DROPDOWN FILTER POPUPS FOR SPECIFIC COLUMNS */
  const renderPopupFilter = (col: ColumnKey) => {
    switch (col) {
      case "make":
      case "contract":
      case "version":
      case "locoBrakeType":
      case "locoManufacturer": {
        const options =
          col === "make"
            ? makeOptions
            : col === "contract"
              ? contractOptions
              : col === "locoBrakeType"
                ? brakeOptions
                : col === "locoManufacturer"
                  ? manufacturerOptions
                  : ["3.2", "4"];

        const currentValue = (filters as any)[col];

        return (
          <div className="space-y-2">
            <select
              value={currentValue}
              onChange={(e) =>
                setFilters({ ...filters, [col]: e.target.value })
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All {labelMap[col]}</option>
              {options.map((x: any) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
            {currentValue && (
              <button
                onClick={() => setFilters({ ...filters, [col]: "" })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <RotateCcw size={12} /> Clear Filter
              </button>
            )}
          </div>
        );
      }

      case "offered":
      case "completed":
      case "pcc":
      case "final": {
        const fromVal = (dateFilters as any)[`${col}From`];
        const toVal = (dateFilters as any)[`${col}To`];

        return (
          <div className="space-y-2 text-xs text-slate-800 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                From
              </label>
              <input
                type="date"
                value={fromVal}
                onChange={(e) =>
                  setDateFilters({
                    ...dateFilters,
                    [`${col}From`]: e.target.value,
                  })
                }
                className="w-full box-border border border-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                To
              </label>
              <input
                type="date"
                value={toVal}
                onChange={(e) =>
                  setDateFilters({
                    ...dateFilters,
                    [`${col}To`]: e.target.value,
                  })
                }
                className="w-full box-border border border-slate-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-0"
              />
            </div>
            {(fromVal || toVal) && (
              <button
                onClick={() =>
                  setDateFilters({
                    ...dateFilters,
                    [`${col}From`]: "",
                    [`${col}To`]: "",
                  })
                }
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 pt-1"
              >
                <RotateCcw size={12} /> Clear Dates
              </button>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      await axiosInstance.delete(`/delete/${deleteRow.sno}`);
      setDeleteRow(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete record:", error);
    }
  };

  return (
    <div className="p-6 bg-slate-50 h-screen flex flex-col font-sans overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">OBK Management</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditData(null);
              setFormOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus size={15} />
            Add Loco
          </button>

          <button
            onClick={() => exportToExcel(filteredData)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download size={15} />
            Export
          </button>

          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Table size={15} />
            Columns
          </button>
        </div>
      </div>

      {/* LEFT-ALIGNED COMPACT SEARCH BAR */}
      <div className="flex justify-start mb-3 flex-shrink-0">
        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm w-full sm:w-72 md:w-80">
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-2.5 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search LOCO, Zone, Division, Shed..."
              className="w-full border border-slate-200 rounded-md pl-8 pr-7 py-1 text-[11px] bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-slate-800 placeholder-slate-400 transition-all"
            />
            {globalSearch && (
              <button
                type="button"
                onClick={() => setGlobalSearch("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN SELECTOR DROPDOWN */}
      {showColumnSelector && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-lg mb-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 flex-shrink-0 z-30">
          {COLUMN_KEYS.map((key) => {
            const checked = selectedColumns.includes(key);
            return (
              <label
                key={key}
                className="border border-slate-200 rounded-lg p-2 flex items-center gap-2 cursor-pointer text-xs hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelectedColumns((prev) =>
                      checked ? prev.filter((x) => x !== key) : [...prev, key],
                    )
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span className="text-slate-700 font-medium">
                  {labelMap[key]}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="flex-1 overflow-auto">
          <table className="min-w-full text-xs text-left text-slate-700">
            {/* SOLID BLUE TABLE HEADER */}
            <thead className="bg-blue-700 text-white font-semibold uppercase tracking-wider sticky top-0 z-20 shadow-sm">
              <tr>
                {orderedColumns.map((col) => {
                  const hasDropdown = [
                    "make",
                    "contract",
                    "version",
                    "locoBrakeType",
                    "locoManufacturer",
                    "offered",
                    "completed",
                    "pcc",
                    "final",
                  ].includes(col);

                  const isFiltered =
                    (filters as any)[col] ||
                    (dateFilters as any)[`${col}From`] ||
                    (dateFilters as any)[`${col}To`];

                  return (
                    <th
                      key={col}
                      className="px-4 py-3.5 whitespace-nowrap border-r border-blue-600/50 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{labelMap[col]}</span>

                        {hasDropdown && (
                          <button
                            onClick={() =>
                              setOpenFilter(openFilter === col ? null : col)
                            }
                            className={`p-1 rounded hover:bg-blue-600 transition-colors ${
                              isFiltered ? "text-yellow-300" : "text-blue-200"
                            }`}
                          >
                            <Filter size={13} />
                          </button>
                        )}
                      </div>

                      {/* POPUP FILTER CONTAINER FOR DROPDOWNS */}
                      {openFilter === col && (
                        <div
                          ref={filterPopupRef}
                          className="absolute left-0 top-full mt-1 bg-white text-slate-800 shadow-xl rounded-xl border border-slate-200 p-3 min-w-[200px] z-50 normal-case font-normal"
                        >
                          <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
                            <span className="font-semibold text-xs text-slate-600">
                              Filter {labelMap[col]}
                            </span>
                            <button
                              onClick={() => setOpenFilter(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          {renderPopupFilter(col)}
                        </div>
                      )}
                    </th>
                  );
                })}

                {/* STICKY ACTIONS HEADER */}
                <th className="px-4 py-3.5 sticky right-0 bg-blue-700 z-20 text-center border-l border-blue-600/50 w-16">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeletonLoader rows={10} cols={orderedColumns.length} />
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={orderedColumns.length + 1}
                    className="py-12 text-center text-slate-400 font-medium"
                  >
                    No records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={row.sno}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {orderedColumns.map((k) => {
                      const td = "px-4 py-3 whitespace-nowrap text-slate-600";

                      switch (k) {
                        case "sno":
                          return (
                            <td key={k} className={`${td} font-medium`}>
                              {page * rowsPerPage + index + 1}
                            </td>
                          );
                        case "loco":
                          return (
                            <td
                              key={k}
                              className={`${td} font-bold text-slate-800`}
                            >
                              {row.loco}
                            </td>
                          );
                        case "locoType":
                          return (
                            <td key={k} className={td}>
                              {row.locoType}
                            </td>
                          );
                        case "make":
                          return (
                            <td key={k} className={td}>
                              {row.make}
                            </td>
                          );
                        case "contract":
                          return (
                            <td key={k} className={td}>
                              {row.contract}
                            </td>
                          );
                        case "version":
                          return (
                            <td key={k} className={td}>
                              {row.version}
                            </td>
                          );
                        case "locoBrakeType":
                          return (
                            <td key={k} className={td}>
                              {row.locoBrakeType}
                            </td>
                          );
                        case "locoManufacturer":
                          return (
                            <td key={k} className={td}>
                              {row.locoManufacturer}
                            </td>
                          );
                        case "locoOwningZone":
                          return (
                            <td key={k} className={td}>
                              {row.locoOwningZone}
                            </td>
                          );
                        case "locoOwningDivision":
                          return (
                            <td key={k} className={td}>
                              {row.locoOwningDivision}
                            </td>
                          );
                        case "locoOwningShed":
                          return (
                            <td key={k} className={td}>
                              {row.locoOwningShed}
                            </td>
                          );
                        case "offered":
                          return (
                            <td key={k} className={td}>
                              {formatDate(row.locoOfferedInstallation)}
                            </td>
                          );
                        case "completed":
                          return (
                            <td key={k} className={td}>
                              {formatDate(row.installationCompleted)}
                            </td>
                          );
                        case "pcc":
                          return (
                            <td key={k} className={td}>
                              {formatDate(row.preCommissioningPcc)}
                            </td>
                          );
                        case "final":
                          return (
                            <td key={k} className={td}>
                              {formatDate(row.finalTestingCommissioning)}
                            </td>
                          );
                        case "remarks":
                          return (
                            <td key={k} className={td}>
                              {row.remarks || "-"}
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}

                    {/* ACTION COLUMN */}
                    <td className="px-4 py-3 sticky right-0 bg-white border-l border-slate-200 text-center">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenAction(
                              openAction === row.sno ? null : row.sno,
                            )
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openAction === row.sno && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenAction(null)}
                            />

                            <div className="absolute right-0 top-8 bg-white shadow-xl rounded-xl border border-slate-200 w-32 z-40 py-1 overflow-hidden text-xs">
                              <button
                                onClick={() => {
                                  setEditData(row);
                                  setFormOpen(true);
                                  setOpenAction(null);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <Pencil size={13} className="text-blue-600" />
                                Edit
                              </button>

                              <button
                                onClick={() => {
                                  setDeleteRow(row);
                                  setOpenAction(null);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR (50, 100, 200) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex-shrink-0">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredData.length === 0 ? 0 : page * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min((page + 1) * rowsPerPage, filteredData.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {filteredData.length}
            </span>{" "}
            entries
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                className="border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium">
                {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteRow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Confirm Delete
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              Are you sure you want to delete locomotive record{" "}
              <span className="font-semibold text-slate-900">
                {deleteRow.loco}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 text-xs font-medium">
              <button
                onClick={() => setDeleteRow(null)}
                className="px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM MODAL */}
      <SlamLocoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editData}
        dataList={data}
        onSubmit={async (formData) => {
          if (editData) {
            await axiosInstance.put(`/edit/${editData.sno}`, formData);
          } else {
            await axiosInstance.post("/add/", formData);
          }
          setFormOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default SlamLocoManagementPage;
