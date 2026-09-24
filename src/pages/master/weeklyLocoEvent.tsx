import React, { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Download, RotateCcw, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import Select from "react-select";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";

interface Firm {
  id: number;
  name: string;
}

interface Loco {
  sno?: number;
  locoId: number;
  firm: Firm | null;
  locoType: string | null;
  locoVersion: string | null;
  condemned: boolean | null;
  shed: string | null;
  createdDate: string | null;
}

interface LastWeekLoco {
  loco: Loco;
  latestEventTime: string;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

const LastWeekLocos: React.FC = () => {
  const [data, setData] = useState<LastWeekLoco[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [firmFilter, setFirmFilter] = useState("");

  const [loading, setLoading] = useState(false);

  // Date filter: current date and previous 30 days only
  const today = new Date();
  const minDate = format(subDays(today, 30), "yyyy-MM-dd");
  const maxDate = format(today, "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState(() => {
    const start = subDays(new Date(), 6);
    return format(start, "yyyy-MM-dd");
  });
  const [selectedQuickRange, setSelectedQuickRange] = useState<"7" | "30" | null>("7");

  const applyQuickRange = (days: number) => {
    const start = subDays(new Date(), days - 1);
    const formatted = format(start, "yyyy-MM-dd");
    setSelectedQuickRange(String(days) as "7" | "30");
    setSelectedDate(formatted);
    setPage(0);
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, selectedDate]);

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(
        "/nmsLocoStnEvent/lastWeekLocos",
        {
          params: {
            date: selectedDate,
            page: page,
            size: rowsPerPage,
          },
        },
      );

      /*
       * API RESPONSE:
       *
       * {
       *   data: {
       *     content: [],
       *     page: {
       *       size: 10,
       *       number: 0,
       *       totalElements: 867,
       *       totalPages: 87
       *     }
       *   }
       * }
       */

      const responseData = res.data?.data;

      setData(responseData?.content || []);

      setTotalElements(responseData?.page?.totalElements || 0);

      setTotalPages(responseData?.page?.totalPages || 0);
    } catch (err) {
      console.error("Failed to fetch last week locos", err);

      setData([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirms = async () => {
    try {
      const res = await axiosInstance.get("/firm/");

      setFirms(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch firms", err);
    }
  };

  /*
   * Search and Firm filtering.
   *
   * NOTE:
   * Since the API response is paginated, this filtering is
   * currently applied only to the records returned for the
   * current page.
   *
   * Ideally search + firm should also be sent to backend API
   * for proper server-side filtering.
   */
  const filteredData = data.filter((d) => {
    const searchText = search.trim().toLowerCase();

    const firmName = d.loco?.firm?.name || "";
    const locoId = String(d.loco?.locoId || "");

    const matchesSearch =
      !searchText ||
      firmName.toLowerCase().includes(searchText) ||
      locoId.includes(searchText);

    const matchesFirm =
      !firmFilter || firmName === firmFilter;

    return matchesSearch && matchesFirm;
  });

  const handleClear = () => {
    setSearch("");
    setFirmFilter("");
    setSelectedDate(maxDate);
    setPage(0);
  };

  const exportExcel = () => {
    if (loading || filteredData.length === 0) {
      return;
    }

    const exportData = filteredData.map((d, i) => ({
      "S.No": page * rowsPerPage + i + 1,
      Firm: d.loco?.firm?.name || "N/A",
      "Loco ID": d.loco?.locoId || "N/A",
      Version: d.loco?.locoVersion || "N/A",
      "Loco Type": d.loco?.locoType || "N/A",
      Condemned:
        d.loco?.condemned === null
          ? "N/A"
          : d.loco?.condemned
            ? "Yes"
            : "No",
      Shed: d.loco?.shed || "N/A",
      "Latest Event Time": d.latestEventTime
        ? formatDateTime(d.latestEventTime)
        : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
      { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Last Week Locos",
    );

    XLSX.writeFile(
      wb,
      `LastWeekLocos_${selectedDate}.xlsx`,
    );
  };

  const formatDateTime = (date: string) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      height: "38px",
      minHeight: "38px",
      borderRadius: "6px",
      borderColor: "#d1d5db",
    }),

    valueContainer: (base: any) => ({
      ...base,
      height: "38px",
      padding: "0 6px",
    }),

    input: (base: any) => ({
      ...base,
      margin: "0px",
    }),

    indicatorsContainer: (base: any) => ({
      ...base,
      height: "38px",
    }),

    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-2 mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          Loco Detected in NMS
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mb-6">

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 justify-between mb-6">

          <div className="flex flex-wrap items-end gap-3 flex-1">

            {/* Date Filter */}
            <div className="min-w-[420px] max-w-[520px] flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                From Date
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyQuickRange(7)}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                    selectedQuickRange === "7"
                      ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Last Week
                </button>

                <button
                  type="button"
                  onClick={() => applyQuickRange(30)}
                  className={`flex-shrink-0 px-2 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                    selectedQuickRange === "30"
                      ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Last Month
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => {
                    setSelectedQuickRange(null);
                    setSelectedDate(e.target.value);
                    setPage(0);
                  }}
                  className="min-w-[150px] flex-1 h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Search */}
            <div className="w-56">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Search Firm / Loco ID
              </label>

              <input
                type="text"
                placeholder="Enter text..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full h-[38px] px-3 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Firm */}
            <div className="w-52">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Firm
              </label>

              <Select
                styles={customSelectStyles}
                options={firms.map((f) => ({
                  value: f.name,
                  label: f.name,
                }))}
                value={
                  firmFilter
                    ? {
                        value: firmFilter,
                        label: firmFilter,
                      }
                    : null
                }
                onChange={(selected) => {
                  setFirmFilter(
                    selected ? selected.value : "",
                  );
                  setPage(0);
                }}
                isClearable
                placeholder="All Firms"
                menuPortalTarget={
                  typeof window !== "undefined"
                    ? document.body
                    : null
                }
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">

              <button
                onClick={() => {
                  setPage(0);
                  fetchData();
                }}
                disabled={loading}
                className="h-[38px] px-5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Loading...
                  </>
                ) : (
                  "Apply"
                )}
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

          {/* Export */}
          <div className="flex gap-2">

            <button
              onClick={exportExcel}
              disabled={loading || filteredData.length === 0}
              className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download
                size={16}
                className="text-blue-600"
              />

              Excel
            </button>

          </div>
        </div>

        {/* Total Count */}
        <div className="flex items-center gap-2 mb-3">

          <span className="text-sm font-bold text-gray-800">
            Data Records
          </span>

          <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Rows Found : {totalElements}
          </span>

        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg h-[500px] overflow-y-auto shadow-inner relative">

          <table className="w-full border-collapse text-left bg-white">

            <thead className="sticky top-0 z-10 bg-blue-600 text-white text-xs uppercase tracking-wider">

              <tr>

                <th className="px-6 py-3 text-center w-20">
                  S.No
                </th>

                <th className="px-6 py-3">
                  Firm
                </th>

                <th className="px-6 py-3 text-center">
                  Loco ID
                </th>

                <th className="px-6 py-3 text-center">
                  Version
                </th>

                <th className="px-6 py-3 text-center">
                  Latest Event Time
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">

              {loading ? (

                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2
                        size={32}
                        className="animate-spin text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-500">
                        Loading loco data...
                      </span>
                    </div>
                  </td>
                </tr>

              ) : filteredData.length > 0 ? (

                filteredData.map((d, i) => (

                  <tr
                    key={
                      d.loco?.sno ||
                      d.loco?.locoId ||
                      i
                    }
                    className="hover:bg-blue-50/40 even:bg-gray-50/50 transition-colors"
                  >

                    {/* S.No */}
                    <td className="px-6 py-3 border-r border-gray-100 text-center">
                      {page * rowsPerPage + i + 1}
                    </td>

                    {/* Firm */}
                    <td className="px-6 py-3">

                      <span className="inline-block bg-gray-100 border border-gray-200 rounded px-2.5 py-1 text-xs">
                        {d.loco?.firm?.name || "—"}
                      </span>

                    </td>

                    {/* Loco ID */}
                    <td className="px-6 py-3 text-center text-blue-600 font-semibold">
                      {d.loco?.locoId || "—"}
                    </td>

                    {/* Version */}
                    <td className="px-6 py-3 text-center">
                      {d.loco?.locoVersion || "—"}
                    </td>

                    {/* Latest Event Time */}
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      {formatDateTime(
                        d.latestEventTime,
                      )}
                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={5}
                    className="text-center py-10 text-gray-400 font-medium bg-gray-50"
                  >
                    No Records Found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-gray-100">

          <TablePagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalElements}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
            onRowsPerPageChange={(newRowsPerPage) => {
              setRowsPerPage(newRowsPerPage);
              setPage(0);
            }}
          />

        </div>

      </div>
    </div>
  );
};

export default LastWeekLocos;