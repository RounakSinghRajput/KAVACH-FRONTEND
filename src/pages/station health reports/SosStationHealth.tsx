import React from "react";
import { StationHealthBaseReport } from "./StationHealthBase";
export const SOSStationHealthReport: React.FC = () => {
  return (
    <StationHealthBaseReport
      title="SOS Station Health Report"
      endpoint="/api/sos-station-health"
    />
  );
};
