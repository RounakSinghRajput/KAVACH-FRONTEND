import React from "react";
import { BaseReportPage } from "../locoHealthReport/BaseReportPage";
export const SosHealthReport: React.FC = () => (
  <BaseReportPage
    title="SOS Health Report"
    endpoint="/loco-health/sos-health"
    exportEndpoint="/loco-health/api8/export"
    locoDropdownEndpoint="/loco-health/LocoIds"
    shedDropdownEndpoint="/loco-health/Shed"
  />
);
