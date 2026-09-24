import React from "react";
import { BaseReportPage } from "../locoHealthReport/BaseReportPage";
export const BrakeStatusReport: React.FC = () => (
  <BaseReportPage
    title="Brake Status"
    endpoint="/loco-health/brake-status"
    exportEndpoint="/loco-health/api1/export"
    locoDropdownEndpoint="/loco-health/locos"
    shedDropdownEndpoint="/loco-health/sheds"
  />
);
