import React from "react";
import { StationHealthBaseReport } from "./StationHealthBase";
export const StationModuleHealthReport: React.FC = () => {
  return (
    <StationHealthBaseReport
      title="Station Module Health Report"
      endpoint="/api/station-module-health"
    />
  );
};
