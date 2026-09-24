import { axiosInstance } from "../services/axios";
import { Tower } from "../types/tower";

export async function fetchTowers(): Promise<Tower[]> {
  try {
    const res = await axiosInstance.get("/asset/");

    if (!res.data || !Array.isArray(res.data.data)) {
      return [];
    }

    return res.data.data as Tower[];
  } catch (error: any) {
    console.error("Tower API error:", error.response?.status);
    return [];
  }
}
