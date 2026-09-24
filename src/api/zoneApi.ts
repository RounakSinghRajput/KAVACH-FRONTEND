import { axiosInstance } from "../services/axios";

export interface ZoneBoundary {
  id: number;
  zoneName: string;
  geom: string; // MULTIPOLYGON (WKT)
}

export async function fetchZones(): Promise<ZoneBoundary[]> {
  try {
    const res = await axiosInstance.get("/zonesBoundary/");

    if (!res.data || !Array.isArray(res.data.data)) {
      console.error("Unexpected zone response:", res.data);
      return [];
    }

    return res.data.data as ZoneBoundary[];
  } catch (error) {
    console.error("Zone API error:", error);
    return [];
  }
}
