import React from "react";
import { StationHealthBaseReport } from "./StationHealthBase";

export const GPSStationHealthReport: React.FC = () => {
  return (
    <StationHealthBaseReport
      title="GPS Station Health Report"
      endpoint="/api/gps-station-health-report"
    />
  );
};
