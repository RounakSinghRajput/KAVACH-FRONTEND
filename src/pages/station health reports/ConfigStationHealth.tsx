import React from "react";
import { StationHealthBaseReport } from "./StationHealthBase";

export const ConfigurationStationHealthReport: React.FC = () => {
  return (
    <StationHealthBaseReport
      title="Configuration Station Health Report"
      endpoint="/api/configuration-station-health"
    />
  );
};
