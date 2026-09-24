import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, RefreshCw } from "lucide-react";
import TablePagination from "../../components/common/TablePaginatio";
import {
  fetchNmsLocoLogsPage,
  type NmsLocoLogRecord,
  type SortDirection,
} from "../../services/nmsApi";

const DEFAULT_PAGE_SIZE = 6;
const ROWS_PER_PAGE_OPTIONS = [6, 10, 25, 50];
const TABLE_COLUMNS = [
  "packetTimestamp",
  "payloadHex",
  "payloadAscii",
] as const;
const SORTABLE_COLUMNS = ["packetTimestamp"] as const;

interface DateRangeFilter {
  fromDate: string;
  toDate: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

const toDateTimeLocalValue = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultFilters = (): DateRangeFilter => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  return {
    fromDate: toDateTimeLocalValue(startOfToday),
    toDate: toDateTimeLocalValue(now),
  };
};

const formatApiDateTime = (value?: string) => {
  if (!value) return undefined;

  const [date, time = "00:00"] = value.split("T");
  return `${date} ${time}:00`;
};

const formatDisplayDateTime = (value?: string) => {
  if (!value) return "-";

  const normalized = value.trim().replace("T", " ");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );

  if (!match) {
    return value;
  }

  const [, year, month, day, hours, minutes, seconds = "00"] = match;
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

const formatColumnName = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.]/g, " ")
    .replace(/\bId\b/g, "ID")
    .replace(/\bNms\b/g, "NMS")
    .replace(/\bLoco\b/g, "Loco")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? JSON.stringify(value) : "-";
  if (isPlainObject(value)) return JSON.stringify(value);
  return String(value);
};

const getRowKey = (row: NmsLocoLogRecord, index: number, page: number) =>
  String(row.id ?? row.packetId ?? row.createdAt ?? `${page}-${index}`);

const isSortableColumn = (column: string) =>
  SORTABLE_COLUMNS.includes(column as (typeof SORTABLE_COLUMNS)[number]);

export default function NMSLocoLogsPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [filters, setFilters] = useState<DateRangeFilter>(() =>
    getDefaultFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<DateRangeFilter>(() =>
    getDefaultFilters(),
  );
  const [rows, setRows] = useState<NmsLocoLogRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns = useMemo(
    () => TABLE_COLUMNS.filter((column) => rows.some((row) => column in row)),
    [rows],
  );

  useEffect(() => {
    let active = true;

    const loadRows = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchNmsLocoLogsPage({
          page,
          size: rowsPerPage,
          sortBy,
          sortDir,
          fromDate: formatApiDateTime(appliedFilters.fromDate),
          toDate: formatApiDateTime(appliedFilters.toDate),
        });

        if (!active) return;

        setRows(response.content);
        setTotalCount(response.totalElements);
        setTotalPages(response.totalPages);
      } catch (fetchError) {
        if (!active) return;

        console.error("Error fetching NMS loco logs:", fetchError);
        setRows([]);
        setTotalCount(0);
        setTotalPages(1);
        setError(
          "Unable to load NMS loco logs. Check the selected filters and try again.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      active = false;
    };
  }, [
    appliedFilters.fromDate,
    appliedFilters.toDate,
    page,
    refreshKey,
    rowsPerPage,
    sortBy,
    sortDir,
  ]);

  const handleSort = (column: string) => {
    if (!isSortableColumn(column)) {
      return;
    }

    setPage(0);
    setSortDir((currentDirection) => {
      if (column !== sortBy) {
        return "desc";
      }

      return currentDirection === "asc" ? "desc" : "asc";
    });
    setSortBy(column);
  };

  const handleApplyFilters = () => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const defaultFilters = getDefaultFilters();
    setPage(0);
    setSortBy("id");
    setSortDir("desc");
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">
                OnBoard Kavach Logs
              </h1>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                From Date
              </span>
              <input
                type="datetime-local"
                value={filters.fromDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                To Date
              </span>
              <input
                type="datetime-local"
                value={filters.toDate}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <button
              type="button"
              onClick={handleApplyFilters}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-gray-100 px-3 py-1">
              Applied from:{" "}
              {formatDisplayDateTime(
                formatApiDateTime(appliedFilters.fromDate),
              )}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1">
              Applied to:{" "}
              {formatDisplayDateTime(formatApiDateTime(appliedFilters.toDate))}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1">
              Sorted by: {formatColumnName(sortBy)} ({sortDir})
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {error ? (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm table-auto">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="whitespace-nowrap border border-blue-500 p-3 text-left font-semibold">
                    SNo
                  </th>
                  {columns.map((column) => {
                    const isActiveSort = sortBy === column;
                    const sortable = isSortableColumn(column);

                    return (
                      <th
                        key={column}
                        className="whitespace-nowrap border border-blue-500 p-3 text-left font-semibold"
                      >
                        {sortable ? (
                          <button
                            type="button"
                            onClick={() => handleSort(column)}
                            className="inline-flex items-center gap-2"
                          >
                            <span>{formatColumnName(column)}</span>
                            <ArrowDownUp
                              className={`h-4 w-4 ${isActiveSort ? "opacity-100" : "opacity-60"}`}
                            />
                            {isActiveSort ? (
                              <span className="text-[11px] uppercase">
                                {sortDir}
                              </span>
                            ) : null}
                          </button>
                        ) : (
                          <span>{formatColumnName(column)}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length + 1, 2)}
                      className="p-10 text-center text-gray-500"
                    >
                      Loading loco logs...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length + 1, 2)}
                      className="p-10 text-center text-gray-500"
                    >
                      No loco logs available for the selected filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr
                      key={getRowKey(row, index, page)}
                      className="border-t border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-blue-50/60"
                    >
                      <td className="whitespace-nowrap border border-gray-200 p-3 text-gray-700">
                        {page * rowsPerPage + index + 1}
                      </td>
                      {columns.map((column) =>
                        (() => {
                          const rawValue = formatCellValue(row[column]);
                          const displayValue =
                            column === "packetTimestamp"
                              ? formatDisplayDateTime(
                                  typeof row[column] === "string"
                                    ? row[column]
                                    : rawValue,
                                )
                              : rawValue;

                          return (
                            <td
                              key={column}
                              className={
                                column === "payloadHex" ||
                                column === "payloadAscii"
                                  ? "border border-gray-400 p-3 font-mono text-md text-gray-700 whitespace-pre-wrap break-all max-h-[150px] overflow-auto"
                                  : "border border-gray-400 p-3 text-gray-700 whitespace-normal break-words"
                              }
                              // title={displayValue}
                            >
                              {displayValue}
                            </td>
                          );
                        })(),
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-4 py-3">
            <TablePagination
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              totalPages={totalPages}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              onPageChange={(nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(nextRowsPerPage) => {
                setRowsPerPage(nextRowsPerPage);
                setPage(0);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
