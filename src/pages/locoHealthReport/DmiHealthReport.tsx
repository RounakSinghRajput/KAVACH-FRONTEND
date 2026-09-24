import React from "react";
import { BaseReportPage } from "../locoHealthReport/BaseReportPage";
export const DmiHealthReport: React.FC = () => (
  <BaseReportPage
    title="DMI Health Report"
    endpoint="/loco-health/dmi"
    exportEndpoint="/loco-health/api3/export"
    locoDropdownEndpoint="/loco-health/loco-Ids"
    shedDropdownEndpoint="/loco-health/shed-name"
  />
);
