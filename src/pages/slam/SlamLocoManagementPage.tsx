import React, { useEffect, useMemo, useState } from "react";
import { axiosInstance } from "../../services/axios";
import type { SlamLoco } from "../../types/slam";
import { formatDate } from "../../utils/formateDate";
import { exportToExcel } from "../../utils/exportToExcel";
import { Download, Table } from "lucide-react";

/* ================= COLUMN ORDER (ORIGINAL) ================= */
const COLUMN_KEYS = [
  "sno",
  "loco",
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

const SlamLocoManagementPage: React.FC = () => {
  const [data, setData] = useState<SlamLoco[]>([]);
  const [loading, setLoading] = useState(true);

  /* PAGINATION */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* FILTER STATES */
  const [locoSearch, setLocoSearch] = useState("");
  const [makeOpen, setMakeOpen] = useState(false);

  const [filters, setFilters] = useState({
    make: [] as string[],
    contract: "",
    version: "",
    locoBrakeType: "",
    locoManufacturer: "",
    locoOwningZone: "",
    locoOwningDivision: "",
    locoOwningShed: "",
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

  const MAKE_OPTIONS = ["QUADRANT", "GGT", "HBL", "MEDHA", "KERNEX"];

  /* COLUMN REORDER */
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>([]);

  const orderedColumns = useMemo<ColumnKey[]>(() => {
    if (selectedColumns.length === 0) return [...COLUMN_KEYS];
    const remaining = COLUMN_KEYS.filter((c) => !selectedColumns.includes(c));
    return [...selectedColumns, ...remaining];
  }, [selectedColumns]);

  /* FETCH DATA */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/slam/");
        setData(res.data?.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* CLOSE MAKE DROPDOWN */
  useEffect(() => {
    const close = () => setMakeOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* RESET PAGE */
  useEffect(() => {
    setPage(0);
  }, [filters, dateFilters, locoSearch, rowsPerPage]);

  /* FILTER LOGIC */
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const inRange = (date: Date, from?: string, to?: string) => {
        const f = from ? new Date(from) : null;
        const t = to ? new Date(to) : null;
        return (!f || date >= f) && (!t || date <= t);
      };

      return (
        (!locoSearch || row.loco.toString().includes(locoSearch)) &&
        (filters.make.length === 0 ||
          filters.make.some(
            (m) => m.toLowerCase().trim() === row.make.toLowerCase().trim(),
          )) &&
        (!filters.contract || row.contract === filters.contract) &&
        (!filters.version || row.version === filters.version) &&
        (!filters.locoBrakeType ||
          row.locoBrakeType === filters.locoBrakeType) &&
        (!filters.locoManufacturer ||
          row.locoManufacturer === filters.locoManufacturer) &&
        (!filters.locoOwningZone ||
          row.locoOwningZone === filters.locoOwningZone) &&
        (!filters.locoOwningDivision ||
          row.locoOwningDivision === filters.locoOwningDivision) &&
        (!filters.locoOwningShed ||
          row.locoOwningShed === filters.locoOwningShed) &&
        inRange(
          new Date(row.locoOfferedInstallation),
          dateFilters.offeredFrom,
          dateFilters.offeredTo,
        ) &&
        inRange(
          new Date(row.installationCompleted),
          dateFilters.completedFrom,
          dateFilters.completedTo,
        ) &&
        inRange(
          new Date(row.preCommissioningPcc),
          dateFilters.pccFrom,
          dateFilters.pccTo,
        ) &&
        inRange(
          new Date(row.finalTestingCommissioning),
          dateFilters.finalFrom,
          dateFilters.finalTo,
        )
      );
    });
  }, [data, locoSearch, filters, dateFilters]);

  /* PAGINATION */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const labelMap: Record<ColumnKey, string> = {
    sno: "S.No",
    loco: "LOCO",
    make: "MAKE",
    contract: "CONTRACT",
    version: "VERSION",
    locoBrakeType: "BRAKE TYPE",
    locoManufacturer: "MANUFACTURER",
    locoOwningZone: "ZONE",
    locoOwningDivision: "DIVISION",
    locoOwningShed: "SHED",
    offered: "OFFERED FOR INSTALLATION",
    completed: "INSTALLATION COMPLETED",
    pcc: "PCC",
    final: "FINAL COMMISSIONING",
    remarks: "REMARKS",
  };

  /* FILTER CELL RENDERER */
  const renderFilterCell = (col: ColumnKey) => {
    switch (col) {
      case "sno":
        return <th key={col} />;

      case "loco":
        return (
          <th key={col} className="px-2 py-2">
            <input
              placeholder="Search loco"
              value={locoSearch}
              onChange={(e) => setLocoSearch(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded
                         bg-white text-gray-800
                         border border-gray-300
                         focus:ring-2 focus:ring-blue-500"
            />
          </th>
        );

      case "make":
        return (
          <th key={col} className="px-2 py-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMakeOpen(!makeOpen);
              }}
              className="w-full px-3 py-2 text-xs rounded-md
                         bg-white text-gray-800 text-left
                         border border-gray-300
                         flex items-center justify-between
                         hover:border-blue-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filters.make.length === 0
                ? "Select"
                : `${filters.make.length} selected`}
              <span>▾</span>
            </button>

            {/* DROPDOWN */}
            {makeOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full z-[9999] mt-1 w-48
               bg-white border border-black
               rounded-lg shadow-xl"
              >
                {/* HEADER */}
                <div
                  className="px-4 py-1.5 text-sm font-semibold
                    bg-blue-600 text-white
                    border-b border-black
                    rounded-t-lg"
                >
                  Select
                </div>

                {/* OPTIONS */}
                <div className="max-h-48 overflow-y-auto divide-y">
                  {MAKE_OPTIONS.map((make) => {
                    const checked = filters.make.includes(make);

                    return (
                      <label
                        key={make}
                        className={`flex items-start gap-3 px-4 py-1.5
                        cursor-pointer text-sm
                        text-gray-800
                        hover:bg-blue-50
                        ${checked ? "bg-blue-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              make: checked
                                ? prev.make.filter((m) => m !== make)
                                : [...prev.make, make],
                            }))
                          }
                          className="mt-1 accent-blue-600"
                        />

                        <span className="leading-snug">{make}</span>
                      </label>
                    );
                  })}
                </div>

                {/* FOOTER */}
                <div
                  className="flex justify-between items-center px-4 py-1.5
                    border-t border-black
                    bg-gray-50
                    rounded-b-lg text-xs"
                >
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, make: [] }))
                    }
                    className="text-red-600 hover:underline font-medium"
                  >
                    Clear
                  </button>

                  <span className="text-gray-500">
                    {filters.make.length} selected
                  </span>
                </div>
              </div>
            )}
          </th>
        );

      case "contract":
        return (
          <th key={col} className="px-2 py-2">
            <select
              value={filters.contract}
              onChange={(e) =>
                setFilters({ ...filters, contract: e.target.value })
              }
              className="w-full px-2 py-1 text-xs rounded
                         bg-white text-gray-800
                         border border-gray-300"
            >
              <option value="">All</option>
              <option value="CLW PO-1">CLW PO-1</option>
              <option value="S&T (Phase ll)">S&T (Phase ll)</option>
            </select>
          </th>
        );

      case "version":
        return (
          <th key={col} className="px-2 py-2">
            <select
              value={filters.version}
              onChange={(e) =>
                setFilters({ ...filters, version: e.target.value })
              }
              className="w-full px-2 py-1 text-xs rounded
                         bg-white text-gray-800
                         border border-gray-300"
            >
              <option value="">All</option>
              <option value="3.2">3.2</option>
              <option value="4">4</option>
            </select>
          </th>
        );
      case "locoBrakeType":
      case "locoManufacturer":
      case "locoOwningZone":
      case "locoOwningDivision":
      case "locoOwningShed":
        return (
          <th key={col} className="px-2 py-2">
            <input
              placeholder="Filter"
              value={(filters as any)[col]}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  [col]: e.target.value,
                } as any)
              }
              className="w-full px-2 py-1 text-xs rounded
                   bg-white text-gray-800
                   border border-gray-300"
            />
          </th>
        );

      case "offered":
      case "completed":
      case "pcc":
      case "final":
        return (
          <th key={col} className="px-2 py-2">
            <div className="flex gap-1">
              <input
                type="date"
                value={(dateFilters as any)[`${col}From`]}
                onChange={(e) =>
                  setDateFilters({
                    ...dateFilters,
                    [`${col}From`]: e.target.value,
                  } as any)
                }
                className="px-1 py-1 text-xs rounded
                           bg-white text-gray-800
                           border border-gray-300"
              />
              <input
                type="date"
                value={(dateFilters as any)[`${col}To`]}
                onChange={(e) =>
                  setDateFilters({
                    ...dateFilters,
                    [`${col}To`]: e.target.value,
                  } as any)
                }
                className="px-1 py-1 text-xs rounded
                           bg-white text-gray-800
                           border border-gray-300"
              />
            </div>
          </th>
        );

      case "remarks":
        return <th key={col} />;

      default:
        return <th key={col} />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent">
          LKavach (OBK) Management (SLAM Data)
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => exportToExcel(filteredData)}
            className="flex items-center gap-2 px-4 py-2
                       bg-blue-600 text-white rounded
                       hover:bg-blue-700"
          >
            <Download size={16} />
            Export
          </button>

          <button
            onClick={() => setShowColumnSelector((p) => !p)}
            className="px-4 py-2 border border-blue-600
                       text-blue-600 rounded
                       hover:bg-blue-50"
          >
            Customize Columns
          </button>
        </div>
      </div>

      {/* COLUMN SELECTOR */}
      {showColumnSelector && (
        <div
          className="mb-5 p-5
                  bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50
                  border border-blue-200
                  rounded-2xl shadow-lg"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h3
              className="flex items-center gap-2
               text-sm font-bold text-blue-700 tracking-wide"
            >
              <Table size={16} />
              Customize Columns
            </h3>

            {selectedColumns.length > 0 && (
              <button
                onClick={() => setSelectedColumns([])}
                className="text-xs font-semibold
                     text-red-600
                     bg-red-100 px-3 py-1 rounded-full
                     hover:bg-red-200 transition"
              >
                Clear All ✕
              </button>
            )}
          </div>

          {/* COLORFUL GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {COLUMN_KEYS.map((key, index) => {
              const checked = selectedColumns.includes(key);

              const colorVariants = [
                "from-blue-500 to-indigo-500",
                "from-emerald-500 to-teal-500",
                "from-purple-500 to-fuchsia-500",
                "from-orange-500 to-amber-500",
                "from-pink-500 to-rose-500",
                "from-cyan-500 to-sky-500",
                "from-lime-500 to-green-500",
                "from-violet-500 to-purple-600",
                "from-yellow-500 to-orange-500",
                "from-red-500 to-pink-500",
              ];

              const gradient = colorVariants[index % colorVariants.length];

              return (
                <label
                  key={key}
                  className={`relative cursor-pointer rounded-xl p-3
                        transition-all duration-200
                        ${
                          checked
                            ? `bg-gradient-to-r ${gradient}
                               text-white shadow-xl scale-[1.03]
                               ring-2 ring-offset-2 ring-blue-400`
                            : "bg-white border border-gray-300 hover:shadow-md hover:-translate-y-0.5"
                        }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedColumns((prev) =>
                          checked
                            ? prev.filter((c) => c !== key)
                            : [...prev, key],
                        )
                      }
                      className="accent-white"
                    />

                    <span
                      className={`text-sm font-semibold
                            ${checked ? "text-white" : "text-gray-700"}`}
                    >
                      {labelMap[key]}
                    </span>
                  </div>

                  {/* CHECK ICON */}
                  {checked && (
                    <span className="absolute top-2 right-2 text-xs font-bold">
                      ✓
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border border-blue-500 rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              {orderedColumns.map((k) => (
                <th key={k} className="px-4 py-3 border border-blue-500">
                  {labelMap[k]}
                </th>
              ))}
            </tr>
            <tr className="bg-blue-600">
              {orderedColumns.map((k) => renderFilterCell(k))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={row.sno} className="hover:bg-blue-50">
                  {orderedColumns.map((k) => {
                    switch (k) {
                      case "sno":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {page * rowsPerPage + index + 1}
                          </td>
                        );
                      case "loco":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {row.loco}
                          </td>
                        );
                      case "make":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {row.make}
                          </td>
                        );
                      case "contract":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {row.contract}
                          </td>
                        );
                      case "version":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {row.version}
                          </td>
                        );
                      case "locoBrakeType":
                        return (
                          <td className="px-4 py-2 border">
                            {row.locoBrakeType}
                          </td>
                        );

                      case "locoManufacturer":
                        return (
                          <td className="px-4 py-2 border">
                            {row.locoManufacturer}
                          </td>
                        );

                      case "locoOwningZone":
                        return (
                          <td className="px-4 py-2 border">
                            {row.locoOwningZone}
                          </td>
                        );

                      case "locoOwningDivision":
                        return (
                          <td className="px-4 py-2 border">
                            {row.locoOwningDivision}
                          </td>
                        );

                      case "locoOwningShed":
                        return (
                          <td className="px-4 py-2 border">
                            {row.locoOwningShed}
                          </td>
                        );
                      case "offered":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {formatDate(row.locoOfferedInstallation)}
                          </td>
                        );
                      case "completed":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {formatDate(row.installationCompleted)}
                          </td>
                        );
                      case "pcc":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {formatDate(row.preCommissioningPcc)}
                          </td>
                        );
                      case "final":
                        return (
                          <td key={k} className="px-4 py-2 border">
                            {formatDate(row.finalTestingCommissioning)}
                          </td>
                        );
                      case "remarks":
                        return (
                          <td key={k} className="px-4 py-2 border max-w-xs">
                            <div className="relative group">
                              <div className="truncate cursor-pointer">
                                {row.remarks || "-"}
                              </div>
                              {row.remarks && (
                                <div
                                  className="absolute left-0 top-full mt-2
                                                hidden group-hover:block
                                                z-50 bg-gray-900 text-white
                                                text-xs rounded-md px-3 py-2
                                                max-w-sm shadow-xl"
                                >
                                  {row.remarks}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end items-center gap-4 mt-4 text-sm">
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          className="border px-2 py-1 rounded
                     bg-white text-gray-800
                     focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>

        <span className="text-gray-700">
          {page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, filteredData.length)} of{" "}
          {filteredData.length}
        </span>

        <button
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className="px-2 text-blue-600
                     disabled:opacity-40
                     hover:text-blue-800"
        >
          ◀
        </button>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
          className="px-2 text-blue-600
                     disabled:opacity-40
                     hover:text-blue-800"
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default SlamLocoManagementPage;
