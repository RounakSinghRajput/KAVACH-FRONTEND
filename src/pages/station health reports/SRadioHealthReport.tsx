import React from "react";
import { StationHealthBaseReport } from "./StationHealthBase";

export const SRadioHealthReport: React.FC = () => {
  return (
    <StationHealthBaseReport
      title="Radio Health Report"
      endpoint="/api/radio-health-report"
    />
  );
};
