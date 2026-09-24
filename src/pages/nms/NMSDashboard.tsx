import React, { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import historyIcon from "../../icons/history.png";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { axiosInstance } from "../../services/axios";
import {
  fetchUdpMonitorStats,
  fetchUdpMonitorMetrics,
  fetchLatestNmsDisconnectionByIp,
  fetchNmsDisconnectionLogByIp,
} from "../../services/nmsApi";
import type {
  NmsDisconnectionLatestByIpData,
  UdpMonitorStatsResponse,
  UdpMonitorMetricsResponse,
} from "../../services/nmsApi";

interface KPICardProps {
  title: string;
  value?: React.ReactNode | string | number;
  unit?: string;
  icon?: string;
  color?: string;
  hoverContent?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon,
  color = "bg-blue-500",
  hoverContent,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  return (
    <div
      className={`${color} rounded-lg shadow-lg p-6 text-white relative group cursor-pointer transition-transform hover:shadow-xl`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-100 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {value}
            {unit && <span className="text-lg ml-2">{unit}</span>}
          </p>
        </div>
        {icon && <span className="text-4xl">{icon}</span>}
      </div>

      {hoverContent && showTooltip && (
        <div
          className="absolute top-full left-0 mt-2 bg-gray-900 text-white rounded-lg shadow-2xl p-4 z-50 w-64 border border-gray-700"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {hoverContent}
        </div>
      )}
    </div>
  );
};

const COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Short formatter for X axis ticks: prefer MB/GB with 2 decimals (fallback to KB)
const formatBytesShort = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
  const GB = 1024 * 1024 * 1024;
  const MB = 1024 * 1024;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const formatTimeOnly = (isoTimestamp: string): string => {
  if (!isoTimestamp) return "-";
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDisplayDateTime = (value: string): string => {
  if (!value) return "Before 24 hrs";

  let date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const match = value.match(
      /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/,
    );

    if (match) {
      const [, dd, mm, yyyy, hh, min, ss, ms = "0"] = match;
      date = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh),
        Number(min),
        Number(ss),
        Number(ms),
      );
    }
  }

  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const NMSDashboard: React.FC = () => {
  const [stats, setStats] = useState<UdpMonitorStatsResponse | null>(null);
  const [metrics, setMetrics] = useState<UdpMonitorMetricsResponse | null>(
    null,
  );
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [divisionSearchTerm, setDivisionSearchTerm] = useState<string>("");
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] =
    useState<boolean>(false);
  const [latestInactiveDisconnectTimes, setLatestInactiveDisconnectTimes] =
    useState<Record<string, string>>({});
  const [isConnectionHistoryOpen, setIsConnectionHistoryOpen] =
    useState<boolean>(false);
  const [connectionHistoryIp, setConnectionHistoryIp] = useState<string>("");
  const [connectionHistoryLoading, setConnectionHistoryLoading] =
    useState<boolean>(false);
  const [connectionHistoryRows, setConnectionHistoryRows] = useState<
    NmsDisconnectionLatestByIpData[]
  >([]);
  const [livePackets, setLivePackets] = useState<
    { ip: string; size: number; timestamp: number; payload: string }[]
  >([]);
  const [streamConnected, setStreamConnected] = useState<boolean>(false);
  const [streamPaused, setStreamPaused] = useState<boolean>(false);
  const streamPausedRef = useRef<boolean>(false);
  const livePacketsRef = useRef<
    { ip: string; size: number; timestamp: number; payload: string }[]
  >([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get division mapping from API response
  const divisionMapping: { [key: string]: string } =
    stats?.aggregator?.ips || {};

  const ipMetadataByIp = (stats?.aggregator?.ip_mapping?.data || []).reduce<
    Record<
      string,
      {
        division: string;
        section: string;
        firm: string;
        protocol: string;
      }
    >
  >((acc, mapping) => {
    acc[mapping.ip] = {
      division:
        mapping.division?.code ||
        mapping.division?.name ||
        divisionMapping[mapping.ip] ||
        mapping.ip,
      section: mapping.section || "-",
      firm: mapping.firm?.name || "-",
      protocol: mapping.protocol || "-",
    };
    return acc;
  }, {});

  const getDivisionName = (ip: string): string => {
    return ipMetadataByIp[ip]?.division || divisionMapping[ip] || ip;
  };

  const getSectionName = (ip: string): string => {
    return ipMetadataByIp[ip]?.section || "-";
  };

  const getFirmName = (ip: string): string => {
    return ipMetadataByIp[ip]?.firm || "-";
  };

  // Keep ref in sync with state
  useEffect(() => {
    streamPausedRef.current = streamPaused;
  }, [streamPaused]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, metricsData] = await Promise.all([
        fetchUdpMonitorStats(),
        fetchUdpMonitorMetrics(),
      ]);

      if (statsData) {
        setStats(statsData);
      }

      if (metricsData) {
        setMetrics(metricsData);

        const inactiveIps = metricsData.metrics
          .filter((metric) => !metric.is_alive)
          .map((metric) => metric.ip);

        if (inactiveIps.length > 0) {
          const disconnectResults = await Promise.all(
            inactiveIps.map(async (ip) => {
              const event = await fetchLatestNmsDisconnectionByIp(ip);
              return [ip, event?.eventTime || ""] as const;
            }),
          );

          const latestTimesByIp = disconnectResults.reduce<
            Record<string, string>
          >((acc, [ip, eventTime]) => {
            if (eventTime) {
              acc[ip] = eventTime;
            }
            return acc;
          }, {});

          setLatestInactiveDisconnectTimes(latestTimesByIp);
        } else {
          setLatestInactiveDisconnectTimes({});
        }

        // Prepare timeseries data from first IP's intervals
        if (metricsData.metrics && metricsData.metrics.length > 0) {
          const firstMetric = metricsData.metrics[0];
          const tsData = firstMetric.intervals.map((interval) => ({
            time: interval.time.split("T")[1].slice(0, 5),
            bytes: interval.bytes,
            count: interval.count,
          }));
          setTimeseriesData(tsData); // All intervals
        }
      }

      setLastRefresh(new Date());
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
      setNextRefreshIn(60);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    const countdown = setInterval(() => {
      setNextRefreshIn((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  useEffect(() => {
    const baseURL = axiosInstance.defaults.baseURL || "";
    const token = localStorage.getItem("accessToken");
    const streamUrl = `${baseURL}/udpMonitor/stream/packets`;

    let abortController: AbortController | null = new AbortController();
    let isComponentMounted = true;

    const connectStream = async () => {
      try {
        if (!isComponentMounted) return;

        const response = await fetch(streamUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController?.signal,
        });

        if (!response.ok) {
          if (isComponentMounted) setStreamConnected(false);
          // Reconnect after 5 seconds
          scheduleReconnect();
          return;
        }

        if (isComponentMounted) setStreamConnected(true);

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          scheduleReconnect();
          return;
        }

        let buffer = "";
        let packetBuffer: {
          ip: string;
          size: number;
          timestamp: number;
          payload: string;
        }[] = [];
        let lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 500; // Batch updates every 500ms to reduce re-renders

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Flush any remaining packets
            if (packetBuffer.length > 0 && isComponentMounted) {
              updateLivePackets(packetBuffer);
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const jsonStr = line.slice(5).trim();
              try {
                const data = JSON.parse(jsonStr) as {
                  ip: string;
                  port: number;
                  size: number;
                  payload_hex?: string;
                  timestamp: string;
                };

                if (!streamPausedRef.current && isComponentMounted) {
                  // Only store first 10 chars of payload, convert timestamp to milliseconds (unix time)
                  const packet = {
                    ip: data.ip,
                    size: data.size,
                    timestamp: new Date(data.timestamp).getTime(),
                    payload: (data.payload_hex || "").substring(0, 50),
                  };

                  packetBuffer.unshift(packet);

                  // Batch update every 500ms or when buffer reaches 10 packets
                  const now = Date.now();
                  if (
                    now - lastUpdateTime > UPDATE_INTERVAL ||
                    packetBuffer.length >= 10
                  ) {
                    updateLivePackets(packetBuffer);
                    packetBuffer = [];
                    lastUpdateTime = now;
                  }
                }
              } catch (err) {
                console.error("Error parsing packet stream event", err);
              }
            }
          }
        }

        // Stream ended naturally, reconnect
        if (isComponentMounted) {
          setStreamConnected(false);
          scheduleReconnect();
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Stream error:", err);
          if (isComponentMounted) {
            setStreamConnected(false);
            scheduleReconnect();
          }
        }
      }
    };

    const updateLivePackets = (
      newPackets: {
        ip: string;
        size: number;
        timestamp: number;
        payload: string;
      }[],
    ) => {
      if (!isComponentMounted) return;
      livePacketsRef.current = [...newPackets, ...livePacketsRef.current].slice(
        0,
        10,
      ); // Keep only 10 packets
      setLivePackets([...livePacketsRef.current]);
    };

    const scheduleReconnect = () => {
      if (!isComponentMounted || reconnectTimeoutRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isComponentMounted) {
          reconnectTimeoutRef.current = null;
          abortController = new AbortController();
          connectStream();
        }
      }, 5000); // Reconnect after 5 seconds
    };

    connectStream();

    return () => {
      isComponentMounted = false;
      abortController?.abort();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      livePacketsRef.current = []; // Clear ref
    };
  }, []);

  const portStatsData =
    stats?.udp?.port_stats
      ?.filter((p) => p.protocol === "TCP")
      .map((port) => ({
        port: port.port.toString(),
        packets: port.packets,
      })) || [];

  const ipStatsData =
    metrics?.metrics.map((metric) => ({
      ip: metric.ip,
      division: getDivisionName(metric.ip),
      section: getSectionName(metric.ip),
      firm: getFirmName(metric.ip),
      protocol: ipMetadataByIp[metric.ip]?.protocol || "-",
      size: metric.total_bytes_24h,
      packets: metric.total_packets_24h,
      isAlive: metric.is_alive,
      lastSeen: metric.last_seen,
    })) || [];

  const divisionOptions = Array.from(
    new Set(ipStatsData.map((item) => item.division)),
  ).sort();

  const totalPackets = stats?.udp.total_packets_received || 0;
  const ipCount = stats?.aggregator.ip_count || 0;
  const portCount = stats?.udp?.tcp_ports?.length || 0;
  const memoryUsage = stats?.aggregator.estimated_memory_kb || "0 KB";
  const totalBytes24h =
    metrics?.metrics.reduce((acc, m) => acc + (m.total_bytes_24h || 0), 0) || 0;
  const totalPackets24h =
    metrics?.metrics.reduce((acc, m) => acc + (m.total_packets_24h || 0), 0) ||
    0;

  // Create hover content for Active/Inactive IPs derived from metrics
  const activeIpCount = metrics?.metrics.filter((m) => m.is_alive).length || 0;
  const inactiveIpCount =
    metrics?.metrics.filter((m) => !m.is_alive).length || 0;

  const ipListContent = (
    <div className="max-h-64 overflow-y-auto">
      <p className="font-semibold mb-2 text-sm inline-flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        Active Sections ({activeIpCount}):
      </p>
      {metrics?.metrics && activeIpCount > 0 ? (
        <div className="space-y-2">
          {metrics.metrics
            .filter((m) => m.is_alive)
            .map((m) => (
              <div key={m.ip} className="text-xs border-b border-gray-700 pb-2">
                <p className="font-semibold text-blue-300">
                  {getDivisionName(m.ip)}
                </p>
                <p className="text-gray-300">Section: {getSectionName(m.ip)}</p>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No active sections</p>
      )}

      <p className="font-semibold mt-3 mb-2 text-sm inline-flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-400" />
        Inactive Sections ({inactiveIpCount}):
      </p>
      {metrics?.metrics && inactiveIpCount > 0 ? (
        <div className="space-y-2">
          {metrics.metrics
            .filter((m) => !m.is_alive)
            .map((m) => (
              <div key={m.ip} className="text-xs border-b border-gray-700 pb-2">
                <p className="font-semibold text-red-300">
                  {getDivisionName(m.ip)}
                </p>
                <p className="text-gray-300">Section: {getSectionName(m.ip)}</p>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No inactive sections</p>
      )}
    </div>
  );

  // Create hover content for Ports
  const portListContent = (
    <div className="max-h-64 overflow-y-auto">
      <p className="font-semibold mb-3 text-sm">Monitored Ports:</p>
      {portStatsData.length > 0 ? (
        <div className="space-y-1">
          {portStatsData.map((port) => (
            <div
              key={port.port}
              className="text-xs text-gray-300 py-1 border-b border-gray-700"
            >
              <p className="font-semibold text-yellow-300">{port.port}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No ports available</p>
      )}
    </div>
  );

  const handleOpenConnectionHistory = async (ip: string) => {
    setConnectionHistoryIp(ip);
    setIsConnectionHistoryOpen(true);
    setConnectionHistoryLoading(true);

    try {
      const rows = await fetchNmsDisconnectionLogByIp(ip);
      setConnectionHistoryRows(rows);
    } finally {
      setConnectionHistoryLoading(false);
    }
  };

  const closeConnectionHistoryModal = () => {
    setIsConnectionHistoryOpen(false);
    setConnectionHistoryRows([]);
    setConnectionHistoryIp("");
  };

  const historyDivisionName =
    connectionHistoryRows[0]?.nmsIp?.division?.name || "-";
  const historyFirmName = connectionHistoryRows[0]?.nmsIp?.firm?.name || "-";

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 dark:text-blue-300">
          NMS Packets Dashboard
        </h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
          <p className="text-gray-600 dark:text-gray-400">
            Last updated:{" "}
            {lastRefresh.toLocaleTimeString(undefined, {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <button
                type="button"
                onClick={() => setIsDivisionDropdownOpen((open) => !open)}
                className="w-full flex justify-between items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <span className="truncate">
                  {selectedDivisions.length === 0 && "All Divisions"}
                  {selectedDivisions.length === 1 && selectedDivisions[0]}
                  {selectedDivisions.length === 2 &&
                    selectedDivisions.join(", ")}
                  {selectedDivisions.length > 2 &&
                    `${selectedDivisions.length} divisions selected`}
                </span>
                <span className="ml-2 text-gray-500 dark:text-gray-400">▾</span>
              </button>

              {isDivisionDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <input
                      type="text"
                      placeholder="Search divisions..."
                      value={divisionSearchTerm}
                      onChange={(e) => setDivisionSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setSelectedDivisions([])}
                      className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      Clear selection (All Divisions)
                    </button>
                    {divisionOptions
                      .filter((division) =>
                        division
                          .toLowerCase()
                          .includes(divisionSearchTerm.toLowerCase()),
                      )
                      .map((division) => {
                        const isSelected = selectedDivisions.includes(division);
                        return (
                          <label
                            key={division}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedDivisions((prev) =>
                                  prev.includes(division)
                                    ? prev.filter((d) => d !== division)
                                    : [...prev, division],
                                );
                              }}
                              className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate text-gray-800 dark:text-gray-100">
                              {division}
                            </span>
                          </label>
                        );
                      })}
                    {divisionOptions.filter((division) =>
                      division
                        .toLowerCase()
                        .includes(divisionSearchTerm.toLowerCase()),
                    ).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        No divisions found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {loading && (
              <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full whitespace-nowrap">
                Reloading...
              </span>
            )}
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              ⏱️ Reloading in {nextRefreshIn}s
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
      >
        {/* <KPICard
          title="Total Packets Received"
          value={formatNumber(totalPackets)}
          icon="📊"
          color="bg-blue-500"
        /> */}
        <KPICard
          title="Total Packets (24h)"
          value={formatNumber(totalPackets24h)}
          icon="📥"
          color="bg-indigo-500"
        />
        <KPICard
          title="Total Size Received (24h)"
          value={formatBytes(totalBytes24h)}
          icon="💾"
          color="bg-orange-500"
        />

        <KPICard
          title="Active Sections"
          value={
            <span className="inline-flex items-center gap-4">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-200" />
                <span className="text-2xl font-bold">{activeIpCount}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-200" />
                <span className="text-2xl font-bold">{inactiveIpCount}</span>
              </span>
            </span>
          }
          icon="🖥️"
          color="bg-green-500"
          hoverContent={ipListContent}
        />
        <KPICard
          title="Monitored Ports"
          value={portCount}
          icon="🔌"
          color="bg-purple-500"
          hoverContent={portListContent}
        />
      </div>

      {/* Charts Grid */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
      >
        {/* Port Statistics - REMOVED */}
        {/* Packet Trend - REMOVED */}
      </div>

      {/* IP Metrics Table */}
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 transition-opacity relative ${loading ? "opacity-60" : "opacity-100"}`}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Monitoring Status
        </h2>
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-40 dark:bg-opacity-40 rounded-lg flex items-center justify-center">
            <div className="animate-spin">
              <div className="h-8 w-8 border-4 border-purple-500 border-t-purple-200 rounded-full"></div>
            </div>
          </div>
        )}
        {ipStatsData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Division
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Section
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Firm
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Protocol
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Packets (24h)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Size (24h)
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Last Seen
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {ipStatsData.map((ip, index) => (
                  <tr
                    key={ip.ip}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-3"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      {ip.division}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                      {ip.section}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                      {ip.firm}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ip.isAlive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ip.isAlive ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200">
                      {ip.protocol || "-"}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                      {formatNumber(ip.packets)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800 dark:text-gray-200">
                      {formatBytes(ip.size)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {!ip.isAlive && latestInactiveDisconnectTimes[ip.ip]
                        ? latestInactiveDisconnectTimes[ip.ip]
                        : ip.lastSeen
                          ? formatDisplayDateTime(ip.lastSeen)
                          : "Before 24 hrs"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenConnectionHistory(ip.ip)}
                        title="Connection History"
                        aria-label={`View connection history for ${ip.ip}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-transparent transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none"
                      >
                        <img
                          src={historyIcon}
                          alt="Connection History"
                          className="h-5 w-5"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No IP data available
          </div>
        )}
      </div>

      {isConnectionHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2">
          <div className="w-full max-w-xl rounded-md bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 px-2 py-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  Connection History
                </h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight mt-0.5">
                  Section:{getSectionName(connectionHistoryIp)}|Div:{historyDivisionName}|Firm:
                  {historyFirmName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeConnectionHistoryModal}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>

            <div className="max-h-[50vh] overflow-auto p-2">
              {connectionHistoryLoading ? (
                <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Loading connection history...
                </div>
              ) : connectionHistoryRows.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-1 px-1 text-left text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        Event Type
                      </th>
                      <th className="py-1 px-1 text-right text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                        Event Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectionHistoryRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-1 px-1 text-[11px] text-gray-800 dark:text-gray-200">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                              row.eventType?.toUpperCase() === "RECONNECTED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : row.eventType?.toUpperCase() ===
                                    "DISCONNECTED"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {row.eventType}
                          </span>
                        </td>
                        <td className="py-1 px-1 text-right text-[11px] text-gray-700 dark:text-gray-300">
                          {row.eventTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  No connection history found for this IP.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Individual IP Intervals Charts */}
      <div className="mt-12 mb-8">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${loading ? "opacity-60" : "opacity-100"} transition-opacity`}
        >
          {metrics?.metrics
            .filter((metric) => {
              const divisionName = getDivisionName(metric.ip);
              if (selectedDivisions.length === 0) return true;
              return selectedDivisions.includes(divisionName);
            })
            .map((metric, ipIndex) => {
              // Display all intervals from API
              const displayIntervals = metric.intervals;
              const intervalsData = displayIntervals.map((interval) => ({
                time: interval.time.split("T")[1].slice(0, 8),
                bytes: interval.bytes,
                count: interval.count,
                fullTime: interval.time,
              }));

              return (
                <div
                  key={metric.ip}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative"
                >
                  {loading && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-40 dark:bg-opacity-40 rounded-lg flex items-center justify-center z-10">
                      <div className="animate-spin">
                        <div className="h-6 w-6 border-3 border-blue-500 border-t-blue-200 rounded-full"></div>
                      </div>
                    </div>
                  )}
                  <div className="mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-block w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: COLORS[ipIndex % COLORS.length],
                          }}
                        />
                        {getSectionName(metric.ip)}
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {getDivisionName(metric.ip)}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400">
                          {getFirmName(metric.ip)}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        24h Total: {formatNumber(metric.total_packets_24h)}{" "}
                        packets • {formatBytes(metric.total_bytes_24h)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        metric.is_alive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {metric.is_alive ? "🟢 Active" : "🔴 Inactive"}
                    </span>
                  </div>

                  {/* Packet Count Chart */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Packet Count
                    </h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart
                        data={intervalsData}
                        margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(value) => formatNumber(value as number)}
                        />
                        <Line
                          type="linear"
                          dataKey="count"
                          stroke={COLORS[ipIndex % COLORS.length]}
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bytes Chart */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bytes Transfer
                    </h4>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart
                        data={intervalsData}
                        margin={{ top: 5, right: 10, left: 45, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          stroke="#9ca3af"
                          width={50}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(value) => formatBytes(value as number)}
                        />
                        <Bar
                          dataKey="bytes"
                          fill={COLORS[ipIndex % COLORS.length]}
                          radius={[2, 2, 0, 0]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bytes Distribution Chart */}
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-opacity relative ${loading ? "opacity-60" : "opacity-100"}`}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Size Distribution (24h)
        </h2>
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-40 dark:bg-opacity-40 rounded-lg flex items-center justify-center">
            <div className="animate-spin">
              <div className="h-8 w-8 border-4 border-orange-500 border-t-orange-200 rounded-full"></div>
            </div>
          </div>
        )}
        {ipStatsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, ipStatsData.length * 48)}>
            <BarChart
              data={ipStatsData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatBytesShort(value as number)}
                domain={[0, "dataMax"]}
                tickCount={6}
              />
              <YAxis
                dataKey="section"
                type="category"
                width={115}
                tick={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
              />
              <Tooltip
                formatter={(value) => formatBytes(value as number)}
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                dataKey="size"
                fill="#8b5cf6"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                {ipStatsData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            No data available
          </div>
        )}
      </div>

      {/* Live Packet Stream (bottom) */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Live Packet Stream
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStreamPaused(!streamPaused)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                streamPaused
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
              }`}
            >
              {streamPaused ? (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Play
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pause
                </>
              )}
            </button>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                streamConnected
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {streamConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {livePackets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th
                    className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300"
                    style={{ width: "20%" }}
                  >
                    Division / Section
                  </th>
                  <th
                    className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300"
                    style={{ width: "10%" }}
                  >
                    Size (bytes)
                  </th>
                  <th
                    className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300"
                    style={{ width: "60%" }}
                  >
                    Hex Packets
                  </th>
                  <th
                    className="text-right py-2 px-4 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                    style={{ width: "10%" }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {livePackets.map((pkt, idx) => (
                  <tr
                    key={`${pkt.ip}-${pkt.timestamp}-${idx}`}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td
                      className="py-2 px-4 text-gray-800 dark:text-gray-200"
                      style={{ width: "10%" }}
                    >
                      <div className="font-medium text-xs">
                        {getDivisionName(pkt.ip)}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                        {getSectionName(pkt.ip)}
                      </div>
                    </td>
                    <td
                      className="py-2 px-4 text-left text-gray-800 dark:text-gray-200 text-xs"
                      style={{ width: "10%" }}
                    >
                      {pkt.size.toLocaleString()}
                    </td>
                    <td
                      className="py-2 px-4 text-gray-800 dark:text-gray-200"
                      style={{ width: "70%" }}
                    >
                      <div className="font-mono text-[10px]">
                        {pkt.payload || "-"}
                        {pkt.payload && <span>...</span>}
                      </div>
                    </td>
                    <td
                      className="py-2 px-4 text-right text-gray-800 dark:text-gray-200 font-mono text-[10px] whitespace-nowrap"
                      style={{ width: "10%" }}
                    >
                      {formatTimeOnly(new Date(pkt.timestamp).toISOString())}
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Waiting for live packets from stream...
          </p>
        )}
      </div>
    </div>
  );
};
