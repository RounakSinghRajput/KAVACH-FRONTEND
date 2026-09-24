import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RotateCcw,
} from "lucide-react";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";

interface LocoConnectivityRecord {
  locoId: string | number;
  firm?: string | null;
  locoVersion?: string | null;
  lastSeenNms?: string | null;
  lastSeenCoa?: string | null;
  nmsStatus?: boolean | null;
  coaStatus?: boolean | null;
  loco?: unknown;
  slamLocoDTLS?: {
    locoOfferedInstallation?: string | null;
    installationCompleted?: string | null;
    preCommissioningPcc?: string | null;
    finalTestingCommissioning?: string | null;
  } | null;
}

interface ApiResponse {
  data?: LocoConnectivityRecord[];
  message?: string;
  status?: number;
}

type StatusFilter = "all" | "yes" | "no";
type LastSeenFilter = "all" | "never";
type MilestoneKey =
  | "locoOfferedInstallation"
  | "installationCompleted"
  | "preCommissioningPcc"
  | "finalTestingCommissioning";

const ROWS_PER_PAGE_OPTIONS = [100, 500, 1000, 5000];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  return value.replace("T", " ");
};

const StatusChip = ({
  value,
  activeLabel = "Yes",
  inactiveLabel = "No",
}: {
  value?: boolean | null;
  activeLabel?: string;
  inactiveLabel?: string;
}) => (
  <span
    className={`inline-flex min-w-[58px] justify-center rounded-md px-2.5 py-1 text-xs font-semibold ${
      value
        ? "bg-emerald-100 text-emerald-700"
        : "bg-rose-100 text-rose-700"
    }`}
  >
    {value ? activeLabel : inactiveLabel}
  </span>
);

const InstallationStatus = ({
  value,
}: {
  value?: string | null;
}) => {
  const completed = Boolean(value);

  return (
    <span title={completed ? `Completed: ${formatDateTime(value)}` : undefined}>
      <StatusChip value={completed} />
    </span>
  );
};

const LocoLastConnectionReport: React.FC = () => {
  const [records, setRecords] = useState<LocoConnectivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [locoFilter, setLocoFilter] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [coaFilter, setCoaFilter] = useState<StatusFilter>("all");
  const [nmsFilter, setNmsFilter] = useState<StatusFilter>("all");
  const [coaLastSeenFilter, setCoaLastSeenFilter] =
    useState<LastSeenFilter>("all");
  const [nmsLastSeenFilter, setNmsLastSeenFilter] =
    useState<LastSeenFilter>("all");
  const [milestoneFilters, setMilestoneFilters] = useState<
    Record<MilestoneKey, StatusFilter>
  >({
    locoOfferedInstallation: "all",
    installationCompleted: "all",
    preCommissioningPcc: "all",
    finalTestingCommissioning: "all",
  });
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get<ApiResponse>(
          "/locoConnectivityLog/getAllLocoLastConnectivity",
        );
        const responseData = response.data;
        setRecords(Array.isArray(responseData?.data) ? responseData.data : []);
      } catch (requestError) {
        console.error(requestError);
        setRecords([]);
        setError("Unable to load loco connectivity records.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const locoTerm = locoFilter.trim().toLowerCase();
    const firmTerm = firmFilter.trim().toLowerCase();

    return records.filter((record) => {
      const matchesLoco = String(record.locoId).toLowerCase().includes(locoTerm);
      const matchesFirm = String(record.firm ?? "")
        .toLowerCase()
        .includes(firmTerm);
      const matchesCoa =
        coaFilter === "all" ||
        (coaFilter === "yes" ? record.coaStatus === true : record.coaStatus === false);
      const matchesNms =
        nmsFilter === "all" ||
        (nmsFilter === "yes" ? record.nmsStatus === true : record.nmsStatus === false);
      const matchesCoaLastSeen =
        coaLastSeenFilter === "all" || !record.lastSeenCoa;
      const matchesNmsLastSeen =
        nmsLastSeenFilter === "all" || !record.lastSeenNms;
      const matchesMilestones = (Object.entries(milestoneFilters) as [
        MilestoneKey,
        StatusFilter,
      ][]).every(([key, filter]) => {
        if (filter === "all") return true;
        const completed = Boolean(record.slamLocoDTLS?.[key]);
        return filter === "yes" ? completed : !completed;
      });

      return (
        matchesLoco &&
        matchesFirm &&
        matchesCoa &&
        matchesNms &&
        matchesCoaLastSeen &&
        matchesNmsLastSeen &&
        matchesMilestones
      );
    });
  }, [
    records,
    locoFilter,
    firmFilter,
    coaFilter,
    nmsFilter,
    coaLastSeenFilter,
    nmsLastSeenFilter,
    milestoneFilters,
  ]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const visibleRecords = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, page, rowsPerPage]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
    if (totalPages === 0 && page !== 0) {
      setPage(0);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!activeHeaderFilter) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-loco-report-filter]")) {
        setActiveHeaderFilter(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeHeaderFilter]);

  const resetFilters = () => {
    setLocoFilter("");
    setFirmFilter("");
    setCoaFilter("all");
    setNmsFilter("all");
    setCoaLastSeenFilter("all");
    setNmsLastSeenFilter("all");
    setMilestoneFilters({
      locoOfferedInstallation: "all",
      installationCompleted: "all",
      preCommissioningPcc: "all",
      finalTestingCommissioning: "all",
    });
    setActiveHeaderFilter(null);
    setPage(0);
  };

  const startRow = filteredRecords.length === 0 ? 0 : page * rowsPerPage + 1;
  const endRow = Math.min((page + 1) * rowsPerPage, filteredRecords.length);

  const renderFilterHeader = (
    label: string,
    filterId: string,
    content: React.ReactNode,
    isActive: boolean,
    alignRight = false,
  ) => (
      <div className="relative" data-loco-report-filter>
          <div className="flex items-center justify-between gap-2">
            <span>{label}</span>
            <button
              type="button"
              onClick={() =>
                setActiveHeaderFilter((current) =>
                  current === filterId ? null : filterId,
                )
              }
              className="rounded p-0.5 transition hover:bg-blue-500"
              aria-label={`Filter ${label}`}
            >
              <Filter size={14} className={isActive ? "fill-current text-yellow-300" : ""} />
            </button>
          </div>
          {activeHeaderFilter === filterId && (
            <div
              className={`absolute top-full z-50 mt-1 min-w-[190px] rounded-lg border border-gray-200 bg-white p-3 text-left font-normal text-gray-800 shadow-xl ${
                alignRight ? "right-0" : "left-0"
              }`}
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Filter {label}
              </div>
              {content}
          </div>
          )}
      </div>
  );

  const renderStatusFilter = (
    value: StatusFilter,
    onChange: (value: StatusFilter) => void,
    activeLabel = "Yes",
    inactiveLabel = "No",
  ) => (
    <select
      value={value}
      onChange={(event) => {
        onChange(event.target.value as StatusFilter);
        setPage(0);
      }}
      className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500"
    >
      <option value="all">All</option>
      <option value="yes">{activeLabel}</option>
      <option value="no">{inactiveLabel}</option>
    </select>
  );

  const renderLastSeenFilter = (
    value: LastSeenFilter,
    onChange: (value: LastSeenFilter) => void,
  ) => (
    <select
      value={value}
      onChange={(event) => {
        onChange(event.target.value as LastSeenFilter);
        setPage(0);
      }}
      className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500"
    >
      <option value="all">All</option>
      <option value="never">Never Connected</option>
    </select>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mb-6 border-b-2 border-blue-600 pb-3">
        <h1 className="text-2xl font-bold text-blue-600 md:text-3xl">
          Loco Last Connection Report
        </h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Loco Connectivity Records
            </h2>
            <p className="text-sm text-slate-500">
              {filteredRecords.length} of {records.length} records
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset Filters
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden flex flex-col h-[580px] relative shadow-inner bg-white">
          <div className="overflow-x-auto h-full min-h-0">
            <div className="h-full overflow-y-auto min-h-0 pb-4">
            {loading ? (
              <div className="flex h-[500px] items-center justify-center">
                <ContentLoading />
              </div>
            ) : (
          <table className="min-w-[1550px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-30 bg-blue-600 text-left text-white">
              <tr>
                <th className="border-r border-blue-500 px-4 py-3">S.No</th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "Loco",
                    "loco",
                    <input
                      autoFocus
                      value={locoFilter}
                      onChange={(event) => {
                        setLocoFilter(event.target.value);
                        setPage(0);
                      }}
                      placeholder="All locos"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    />,
                    Boolean(locoFilter),
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "Firm",
                    "firm",
                    <input
                      autoFocus
                      value={firmFilter}
                      onChange={(event) => {
                        setFirmFilter(event.target.value);
                        setPage(0);
                      }}
                      placeholder="All firms"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    />,
                    Boolean(firmFilter),
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">Version</th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "Kavach Installation Offered",
                    "offered",
                    renderStatusFilter(
                      milestoneFilters.locoOfferedInstallation,
                      (value) =>
                        setMilestoneFilters((current) => ({
                          ...current,
                          locoOfferedInstallation: value,
                        })),
                    ),
                    milestoneFilters.locoOfferedInstallation !== "all",
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "Kavach Installed",
                    "installed",
                    renderStatusFilter(
                      milestoneFilters.installationCompleted,
                      (value) =>
                        setMilestoneFilters((current) => ({
                          ...current,
                          installationCompleted: value,
                        })),
                    ),
                    milestoneFilters.installationCompleted !== "all",
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "Pre Commissioning PCC Done",
                    "pcc",
                    renderStatusFilter(
                      milestoneFilters.preCommissioningPcc,
                      (value) =>
                        setMilestoneFilters((current) => ({
                          ...current,
                          preCommissioningPcc: value,
                        })),
                    ),
                    milestoneFilters.preCommissioningPcc !== "all",
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "Loco Commissioned with Kavach",
                    "commissioned",
                    renderStatusFilter(
                      milestoneFilters.finalTestingCommissioning,
                      (value) =>
                        setMilestoneFilters((current) => ({
                          ...current,
                          finalTestingCommissioning: value,
                        })),
                    ),
                    milestoneFilters.finalTestingCommissioning !== "all",
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "COA Status",
                    "coa",
                    renderStatusFilter(coaFilter, setCoaFilter, "Active", "Inactive"),
                    coaFilter !== "all",
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "COA Last Seen",
                    "coaLastSeen",
                    renderLastSeenFilter(coaLastSeenFilter, setCoaLastSeenFilter),
                    coaLastSeenFilter !== "all",
                  )}
                </th>
                <th className="border-r border-blue-500 px-4 py-3">
                  {renderFilterHeader(
                    "NMS Status",
                    "nms",
                    renderStatusFilter(nmsFilter, setNmsFilter, "Connected", "Disconnected"),
                    nmsFilter !== "all",
                  )}
                </th>
                <th className="px-4 py-3">
                  {renderFilterHeader(
                    "NMS Last Seen",
                    "nmsLastSeen",
                    renderLastSeenFilter(nmsLastSeenFilter, setNmsLastSeenFilter),
                    nmsLastSeenFilter !== "all",
                    true,
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    {error ?? "No records found"}
                  </td>
                </tr>
              )}
              {!loading &&
                visibleRecords.map((record, index) => (
                  <tr
                    key={`${record.locoId}-${index}`}
                    className="border-b border-slate-200 even:bg-slate-50"
                  >
                    <td className="border-r border-slate-200 px-4 py-3 font-medium text-blue-600">
                      {page * rowsPerPage + index + 1}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 font-semibold text-slate-800">
                      {record.locoId}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3">
                      {record.firm || "-"}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3">
                      {record.locoVersion || "-"}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-center">
                      <InstallationStatus
                        value={record.slamLocoDTLS?.locoOfferedInstallation}
                      />
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-center">
                      <InstallationStatus
                        value={record.slamLocoDTLS?.installationCompleted}
                      />
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-center">
                      <InstallationStatus
                        value={record.slamLocoDTLS?.preCommissioningPcc}
                      />
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-center">
                      <InstallationStatus
                        value={record.slamLocoDTLS?.finalTestingCommissioning}
                      />
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-center">
                      <StatusChip
                        value={record.coaStatus}
                        activeLabel="Active"
                        inactiveLabel="Inactive"
                      />
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 whitespace-nowrap">
                      {formatDateTime(record.lastSeenCoa)}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-3 text-center">
                      <StatusChip
                        value={record.nmsStatus}
                        activeLabel="Connected"
                        inactiveLabel="Disconnected"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDateTime(record.lastSeenNms)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
            )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span>Records per Page:</span>
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 outline-none"
            >
              {ROWS_PER_PAGE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              {startRow}-{endRow} of {filteredRecords.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(0)}
              disabled={page === 0 || totalPages === 0}
              className="rounded-md border border-slate-300 p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="First page"
            >
              <ChevronsLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page === 0 || totalPages === 0}
              className="rounded-md border border-slate-300 p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="px-3 font-medium">
              {totalPages === 0 ? 0 : page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages - 1 || totalPages === 0}
              className="rounded-md border border-slate-300 p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1 || totalPages === 0}
              className="rounded-md border border-slate-300 p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Last page"
            >
              <ChevronsRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocoLastConnectionReport;
