import React from "react";
import { BaseReportPage } from "../locoHealthReport/BaseReportPage";
export const GpsHealthReport: React.FC = () => (
  <BaseReportPage
    title="GPS Health Report"
    endpoint="/locoHealth/gps"
    exportEndpoint="/locoHealth/api4/export"
    locoDropdownEndpoint="/locoHealth/locoDrop"
    shedDropdownEndpoint="/locoHealth/shedsDrop"
  />
);
