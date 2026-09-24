import React from "react";
import { StationHealthBaseReport } from "./StationHealthBase";

export const KMSStationHealthReport: React.FC = () => {
  return (
    <StationHealthBaseReport
      title="KMS Station Health Report"
      endpoint="/api/kms-station-health"
    />
  );
};
