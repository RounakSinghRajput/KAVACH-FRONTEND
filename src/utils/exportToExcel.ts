import * as XLSX from "xlsx";
import type { SlamLoco } from "../types/slam";

export const exportToExcel = (rows: SlamLoco[]) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "SLAM_LOCO");
  XLSX.writeFile(wb, "slam_loco_management.xlsx");
};