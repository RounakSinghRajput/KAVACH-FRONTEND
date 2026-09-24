import React from "react";
import { BaseReportPage } from "./BaseReportPage";

// 1. Radio Health Report Page
export const RadioHealthReport: React.FC = () => (
  <BaseReportPage
    title="Radio Health Report"
    endpoint="/locoHealth/radio"
    exportEndpoint="/locoHealth/api7/export"
    locoDropdownEndpoint="/locoHealth/loco-dropdown"
    shedDropdownEndpoint="/locoHealth/sheds-dropdown"
  />
);
