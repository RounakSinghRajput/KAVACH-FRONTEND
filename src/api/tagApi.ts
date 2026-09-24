import { axiosInstance } from "../services/axios";
import { Tag } from "../types/tag";

export async function fetchTags(): Promise<Tag[]> {
  try {
    const res = await axiosInstance.get("/tag/");

    if (!res.data || !Array.isArray(res.data.data)) {
      console.error("Unexpected tag response:", res.data);
      return []; // ✅ always return array
    }

    return res.data.data as Tag[];
  } catch (error: any) {
    console.error("Tag API error:", error.response?.status);
    return []; // ✅ never crash UI
  }
}

