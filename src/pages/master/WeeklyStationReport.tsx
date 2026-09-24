import React, { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Download, RotateCcw, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import Select from "react-select";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";

interface Zone {
  id: number;
  name: string;
  code: string;
  divisionalId: number | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface Division {
  id: number;
  name: string;
  code: string;
  divisionalId: number | null;
  zone: Zone;
}

interface Firm {
  id: number;
  name: string;
}

interface NmsIp {
  id: number;
  ip: string;
  division: Division;
  firm: Firm;
  section: string;
}

interface Station {
  id: number;
  name: string;
  code: string;
  division: Division;
  firm: Firm;
  nmsIp: NmsIp;
  nmsVersion: string;
  sectionId: number | null;
  section: string | null;
  kavachSubSystemId: number;
}

interface StationEvent {
  station: Station;
  latestEventTime: string;
}

interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

const WeeklyStationReport: React.FC = () => {
  const [data, setData] = useState<StationEvent[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");

  const [zoneFilter, setZoneFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [firmFilter, setFirmFilter] = useState("");

  const [loading, setLoading] = useState(false);

  // API date filter: only the last 30 days are selectable.
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

  /*
   * Fetch data whenever page or rowsPerPage changes.
   *
   * API:
   * /nmsLocoStnEvent/lastWeekStations?date=2026-08-15&page=0&size=10
   */
  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(
        "/nmsLocoStnEvent/lastWeekStations",
        {
          params: {
            date: selectedDate,
            page: page,
            size: rowsPerPage,
          },
        },
      );

      const responseData = res.data?.data;

      /*
       * API RESPONSE:
       *
       * data: {
       *   content: [],
       *   page: {
       *     size: 10,
       *     number: 0,
       *     totalElements: 403,
       *     totalPages: 41
       *   }
       * }
       */

      setData(responseData?.content || []);

      setTotalElements(
        responseData?.page?.totalElements || 0,
      );

      setTotalPages(
        responseData?.page?.totalPages || 0,
      );
    } catch (error) {
      console.error(
        "Failed to fetch last week stations",
        error,
      );

      setData([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Zone dropdown
   */
  const zoneOptions = useMemo(() => {
    return [
      ...new Map(
        data
          .filter(
            (item) =>
              item.station?.division?.zone,
          )
          .map((item) => [
            item.station.division.zone.id,
            {
              value: item.station.division.zone.name,
              label: item.station.division.zone.name,
            },
          ]),
      ).values(),
    ];
  }, [data]);

  /*
   * Division dropdown
   */
  const divisionOptions = useMemo(() => {
    return [
      ...new Map(
        data
          .filter(
            (item) =>
              item.station?.division,
          )
          .map((item) => [
            item.station.division.id,
            {
              value: item.station.division.name,
              label: item.station.division.name,
            },
          ]),
      ).values(),
    ];
  }, [data]);

  /*
   * Firm dropdown
   */
  const firmOptions = useMemo(() => {
    return [
      ...new Map(
        data
          .filter(
            (item) =>
              item.station?.firm,
          )
          .map((item) => [
            item.station.firm.id,
            {
              value: item.station.firm.name,
              label: item.station.firm.name,
            },
          ]),
      ).values(),
    ];
  }, [data]);

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

  /*
   * Filtering only the records received for the current page.
   *
   * For true server-side filtering across all 403 records,
   * search/zone/division/firm should also be sent to backend.
   */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const station = item.station;

      if (!station) {
        return false;
      }

      const searchText = search.trim().toLowerCase();

      const stationName =
        station.name?.toLowerCase() || "";

      const stationCode =
        station.code?.toLowerCase() || "";

      const subsystemId =
        String(station.kavachSubSystemId || "");

      const matchesSearch =
        !searchText ||
        stationName.includes(searchText) ||
        stationCode.includes(searchText) ||
        subsystemId.includes(searchText);

      const matchesZone =
        !zoneFilter ||
        station.division?.zone?.name === zoneFilter;

      const matchesDivision =
        !divisionFilter ||
        station.division?.name === divisionFilter;

      const matchesFirm =
        !firmFilter ||
        station.firm?.name === firmFilter;

      return (
        matchesSearch &&
        matchesZone &&
        matchesDivision &&
        matchesFirm
      );
    });
  }, [
    data,
    search,
    zoneFilter,
    divisionFilter,
    firmFilter,
  ]);

  const handleClear = () => {
    setSearch("");
    setZoneFilter("");
    setDivisionFilter("");
    setFirmFilter("");
    setSelectedDate(maxDate);
    setPage(0);
  };

  const exportExcel = () => {
    if (loading || filteredData.length === 0) {
      return;
    }

    const exportData = filteredData.map((item, index) => ({
      "S.No": page * rowsPerPage + index + 1,
      "Station Name": item.station?.name || "N/A",
      "Station Code": item.station?.code || "N/A",
      "Kavach Subsystem ID":
        item.station?.kavachSubSystemId || "N/A",
      Zone:
        item.station?.division?.zone?.name || "N/A",
      Division:
        item.station?.division?.name || "N/A",
      Firm:
        item.station?.firm?.name || "N/A",
      "NMS Version":
        item.station?.nmsVersion || "N/A",
      "NMS IP":
        item.station?.nmsIp?.ip || "N/A",
      Section:
        item.station?.nmsIp?.section ||
        item.station?.section ||
        "N/A",
      "Latest Event Time": item.latestEventTime
        ? formatDateTime(item.latestEventTime)
        : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 20 },
      { wch: 22 },
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
      { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Stations",
    );

    XLSX.writeFile(
      wb,
      `LastWeekStations_${selectedDate}.xlsx`,
    );
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
          Station Detected in NMS
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
                  className="min-w-[150px] flex-1 h-[38px] px-3 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Search */}
            <div className="w-56">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Search Station / Code / ID
              </label>

              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full h-[38px] px-3 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Zone */}
            <div className="w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Zone
              </label>

              <Select
                styles={customSelectStyles}
                options={zoneOptions}
                value={
                  zoneFilter
                    ? {
                        value: zoneFilter,
                        label: zoneFilter,
                      }
                    : null
                }
                onChange={(selected) => {
                  setZoneFilter(
                    selected
                      ? selected.value
                      : "",
                  );
                  setPage(0);
                }}
                isClearable
                placeholder="All Zones"
                menuPortalTarget={
                  typeof window !== "undefined"
                    ? document.body
                    : null
                }
              />
            </div>

            {/* Division */}
            <div className="w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Division
              </label>

              <Select
                styles={customSelectStyles}
                options={divisionOptions}
                value={
                  divisionFilter
                    ? {
                        value: divisionFilter,
                        label: divisionFilter,
                      }
                    : null
                }
                onChange={(selected) => {
                  setDivisionFilter(
                    selected
                      ? selected.value
                      : "",
                  );
                  setPage(0);
                }}
                isClearable
                placeholder="All Divisions"
                menuPortalTarget={
                  typeof window !== "undefined"
                    ? document.body
                    : null
                }
              />
            </div>

            {/* Firm */}
            <div className="w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Firm
              </label>

              <Select
                styles={customSelectStyles}
                options={firmOptions}
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
                    selected
                      ? selected.value
                      : "",
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
                  "Refresh"
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
              className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Excel
            </button>

          </div>
        </div>

        {/* Records */}
        <div className="flex items-center gap-3 mb-4">

          <span className="font-semibold">
            Data Records
          </span>

          <span className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs">
            Total Records : {totalElements}
          </span>

        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg h-[500px] overflow-y-auto shadow-inner">

          <table className="w-full border-collapse">

            <thead className="sticky top-0 bg-blue-600 text-white">

              <tr>

                <th className="px-4 py-3 text-center">
                  S.No
                </th>

                <th className="px-4 py-3 text-left">
                  Station Name
                </th>

                <th className="px-4 py-3 text-center">
                  Station Code
                </th>

                <th className="px-4 py-3 text-center">
                  Kavach Subsystem ID
                </th>

                <th className="px-4 py-3 text-left">
                  Zone
                </th>

                <th className="px-4 py-3 text-left">
                  Division
                </th>

                <th className="px-4 py-3 text-left">
                  Firm
                </th>

                <th className="px-4 py-3 text-center">
                  Latest Event Time
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (

                <tr>
                  <td colSpan={8} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2
                        size={32}
                        className="animate-spin text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-500">
                        Loading station data...
                      </span>
                    </div>
                  </td>
                </tr>

              ) : filteredData.length > 0 ? (

                filteredData.map(
                  (item, index) => (

                    <tr
                      key={
                        item.station?.id ||
                        index
                      }
                      className="hover:bg-blue-50 even:bg-gray-50"
                    >

                      {/* S.No */}
                      <td className="px-4 py-2 text-center">
                        {page * rowsPerPage +
                          index +
                          1}
                      </td>

                      {/* Station Name */}
                      <td className="px-4 py-2">
                        {item.station?.name ||
                          "—"}
                      </td>

                      {/* Station Code */}
                      <td className="px-4 py-2 text-center">
                        {item.station?.code ||
                          "—"}
                      </td>

                      {/* Kavach Subsystem ID */}
                      <td className="px-4 py-2 text-center font-medium text-blue-600">
                        {item.station
                          ?.kavachSubSystemId ||
                          "—"}
                      </td>

                      {/* Zone */}
                      <td className="px-4 py-2">
                        {item.station
                          ?.division
                          ?.zone?.name ||
                          "—"}
                      </td>

                      {/* Division */}
                      <td className="px-4 py-2">
                        {item.station
                          ?.division?.name ||
                          "—"}
                      </td>

                      {/* Firm */}
                      <td className="px-4 py-2">

                        <span className="px-2 py-1 rounded bg-gray-100 border text-xs">
                          {item.station
                            ?.firm?.name ||
                            "—"}
                        </span>

                      </td>

                      {/* Latest Event Time */}
                      <td className="px-4 py-2 text-center">
                        {formatDateTime(
                          item.latestEventTime,
                        )}
                      </td>

                    </tr>
                  ),
                )

              ) : (

                <tr>

                  <td
                    colSpan={8}
                    className="py-10 text-center text-gray-500"
                  >
                    No Station Event Found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}
        <div className="mt-4">

          <TablePagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalElements}
            totalPages={totalPages}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(0);
            }}
          />

        </div>

      </div>
    </div>
  );
};


export default WeeklyStationReport;