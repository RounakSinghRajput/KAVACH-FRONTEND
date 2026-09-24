import React from "react";
import { BaseReportPage } from "../locoHealthReport/BaseReportPage";
export const ConfigurationStatusReport: React.FC = () => (
  <BaseReportPage
    title="Configuration Status Report"
    endpoint="/loco-health/configuration-status"
    exportEndpoint="/loco-health/api2/export"
    locoDropdownEndpoint="/loco-health/locoIds"
    shedDropdownEndpoint="/loco-health/Sheds"
  />
);
