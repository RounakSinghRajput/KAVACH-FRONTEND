import React from "react";
import { BaseReportPage } from "../locoHealthReport/BaseReportPage";
export const OvkHardwareReport: React.FC = () => (
  <BaseReportPage
    title="OBK Hardware Card Report"
    endpoint="/loco-health/ovk-hardware-card"
    exportEndpoint="/loco-health/api6/export"
    locoDropdownEndpoint="/loco-health/locoDropdown"
    shedDropdownEndpoint="/loco-health/shedsDropdown"
  />
);
