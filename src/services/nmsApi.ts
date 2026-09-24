import { axiosInstance } from "./axios";
import type { NMSDataPoint } from "../types/nms";

/** Trend response:
 * {
 *   data: {
 *     "71_1": [["17:27:14", 2810], ...],
 *     "20_3": [["17:27:21", 1814], ...]
 *   },
 *   message?: string,
 *   status?: number
 * }
 */
export interface PacketTrendResponse {
  data: Record<string, [string, number][]>;
  message?: string;
  status?: number;
}

/** 24h response:
 * {
 *   data: [[36,1,"21.65 MB"], [43,3,"2.67 MB"], ...],
 *   message: "Success",
 *   status: 200
 * }
 */
export interface Last24hrsResponse {
  data: [number, number, string][];
  message: string;
  status: number;
}

// ✅ Trend API (call every 30 sec)
export const fetchPacketTrendByFirmAndDivision = async (): Promise<
  Record<string, NMSDataPoint[]>
> => {
  try {
    const response = await axiosInstance.get<PacketTrendResponse>(
      "/nms/getPacketTrendByFirmAndDivision"
    );

    const apiData = response.data.data || {};

    // convert to map: { "71_1": [{timestamp, packetLength}, ...] }
    const result: Record<string, NMSDataPoint[]> = {};

    Object.entries(apiData).forEach(([key, rows]) => {
      result[key] = rows.map(([time, value], index) => ({
        timestamp: `${time}_${index}`, // unique X axis
        displayTime: time, // original time
        packetLength: value,
      }));
    });

    return result;
  } catch (error) {
    console.error("Error fetching trend data:", error);
    return {};
  }
};

// ✅ 24h API (call once)
export const fetchPacketsLast24hrs = async (): Promise<Record<string, string>> => {
  try {
    const response = await axiosInstance.get<Last24hrsResponse>(
      "/nms/getPacketsLast24hrs"
    );

    const rows = response.data.data || [];

    // convert to map: { "36_1": "21.65 MB", ... }
    const map: Record<string, string> = {};
    rows.forEach(([divisionCode, firmCode, value]) => {
      map[`${divisionCode}_${firmCode}`] = value;
    });

    return map;
  } catch (error) {
    console.error("Error fetching last 24hrs data:", error);
    return {};
  }
};

// ✅ UDP Monitor Stats API
export interface UdpMonitorStatsResponse {
  aggregator: {
    ip_mapping?: {
      data: {
        id: number;
        ip: string;
        section: string;
        division?: {
          id: number;
          code: string;
          name: string;
          divisionalId?: string;
          zone?: {
            id: number;
            code: string;
            name: string;
            zonalId?: string;
          };
        };
        firm?: {
          id: number;
          name: string;
        };
        protocol?: string;
      }[];
    };
    bucket_size_seconds: number;
    estimated_memory_kb: string;
    ip_count: number;
    ips: Record<string, string>;
    long_total_buckets: number;
    max_buckets_per_ip: number;
    retention_hours: number;
    short_total_buckets: number;
    total_buckets: number;
  };

  aggregator_totals_last_hours: {
    hours: number;
    total_bytes: number;
    total_packets: number;
  };

  estimated_memory_kb: string;
  timestamp: string;
  total_buckets: number;
  ver: string;

  udp: {
    port_stats: {
      packets: number;
      port: number;
      protocol: "TCP" | "UDP";
    }[];

    tcp_ports: number[];
    udp_ports: number[];

    total_listeners: number;
    total_tcp_listeners: number;
    total_udp_listeners: number;

    total_packets_received: number;
    total_tcp_packets: number;
    total_udp_packets: number;
  };
}

export const fetchUdpMonitorStats = async (): Promise<
  UdpMonitorStatsResponse | null
> => {
  try {
    const response = await axiosInstance.get<UdpMonitorStatsResponse>(
      "/udpMonitor/stats"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching UDP monitor stats:", error);
    return null;
  }
};

// ✅ UDP Monitor Metrics API
export interface UdpMonitorMetricsInterval {
  bytes: number;
  count: number;
  time: string;
  timestamp: number;
}

export interface UdpMonitorMetric {
  ip: string;
  is_alive: boolean;
  last_seen: string;
  total_bytes_24h: number;
  total_packets_24h: number;
  intervals: UdpMonitorMetricsInterval[];
}

export interface UdpMonitorMetricsResponse {
  metrics: UdpMonitorMetric[];
  timestamp: string;
}

export interface NmsDisconnectionLatestByIpData {
  id: number;
  name: string;
  ip: string;
  nmsIp?: {
    id: number;
    ip: string;
    division?: {
      id: number;
      name: string;
      code: string;
    };
    firm?: {
      id: number;
      name: string;
    };
  };
  eventType: string;
  eventTime: string;
  createdAt: string;
}

export interface NmsDisconnectionLatestByIpResponse {
  data: NmsDisconnectionLatestByIpData | null;
  message: string;
  status: number;
}

export interface NmsDisconnectionConnectionLogByIpResponse {
  data: NmsDisconnectionLatestByIpData[];
  message: string;
  status: number;
}

export type SortDirection = "asc" | "desc";

export type NmsLocoLogRecord = Record<string, unknown>;

export interface NmsLocoLogsPageRequest {
  page: number;
  size: number;
  sortBy: string;
  sortDir: SortDirection;
  fromDate?: string;
  toDate?: string;
}

export interface NmsLocoLogsPageResponse {
  content: NmsLocoLogRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const getBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const normalizeNmsLocoLogsPage = (
  payload: unknown,
  fallbackPage: number,
  fallbackSize: number,
): NmsLocoLogsPageResponse => {
  const root = isRecord(payload) ? payload : {};
  const dataNode = isRecord(root.data) ? root.data : root;
  const pageNode = isRecord(dataNode.page) ? dataNode.page : dataNode;

  const rawContent = Array.isArray(dataNode.content)
    ? dataNode.content
    : Array.isArray(dataNode.rows)
      ? dataNode.rows
      : Array.isArray(dataNode.items)
        ? dataNode.items
        : [];

  const content = rawContent.filter(isRecord);

  const size = getNumber(pageNode.size, fallbackSize);
  const number = getNumber(pageNode.number, fallbackPage);
  const numberOfElements = getNumber(
    pageNode.numberOfElements,
    content.length
  );
  const totalElements = getNumber(
    pageNode.totalElements,
    numberOfElements
  );

  const inferredTotalPages =
    totalElements > 0
      ? Math.ceil(totalElements / Math.max(size, 1))
      : 1;

  const totalPages = getNumber(
    pageNode.totalPages,
    inferredTotalPages
  );

  return {
    content,
    totalElements,
    totalPages,
    number,
    size,
    numberOfElements,
    first: getBoolean(pageNode.first, number === 0),
    last: getBoolean(pageNode.last, number >= totalPages - 1),
    empty: getBoolean(pageNode.empty, content.length === 0),
  };
};

export const fetchUdpMonitorMetrics = async (): Promise<
  UdpMonitorMetricsResponse | null
> => {
  try {
    const response = await axiosInstance.get<UdpMonitorMetricsResponse>(
      "/udpMonitor/metrics"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching UDP monitor metrics:", error);
    return null;
  }
};

export const fetchLatestNmsDisconnectionByIp = async (
  ip: string,
): Promise<NmsDisconnectionLatestByIpData | null> => {
  try {
    const response = await axiosInstance.get<NmsDisconnectionLatestByIpResponse>(
      "/nmsDisconnection/latestByIp",
      {
        params: { ip },
      },
    );
    return response.data?.data || null;
  } catch (error) {
    console.error(`Error fetching latest disconnection event for IP ${ip}:`, error);
    return null;
  }
};

export const fetchNmsDisconnectionLogByIp = async (
  ip: string,
): Promise<NmsDisconnectionLatestByIpData[]> => {
  try {
    const response =
      await axiosInstance.get<NmsDisconnectionConnectionLogByIpResponse>(
        "/nmsDisconnection/connectionLogByIp",
        {
          params: { ip },
        },
      );
    return response.data?.data || [];
  } catch (error) {
    console.error(`Error fetching connection history for IP ${ip}:`, error);
    return [];
  }
};

export const fetchNmsLocoLogsPage = async (
  params: NmsLocoLogsPageRequest,
): Promise<NmsLocoLogsPageResponse> => {
  const queryParams = Object.fromEntries(
    Object.entries({
      page: params.page,
      size: params.size,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      fromDate: params.fromDate,
      toDate: params.toDate,
    }).filter(([, value]) => value !== undefined && value !== ""),
  );

  const response = await axiosInstance.get(
    "/nmsLocologPacket/paginated",
    {
      params: queryParams,
    },
  );

  return normalizeNmsLocoLogsPage(response.data, params.page, params.size);
};
