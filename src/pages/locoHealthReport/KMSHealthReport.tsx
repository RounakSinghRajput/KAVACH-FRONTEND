import React from "react";
import { BaseReportPage } from "./BaseReportPage";

export const KmsHealthReport: React.FC = () => (
  <BaseReportPage
    title="KMS Health Report"
    endpoint="/loco-health/kms-health"
    exportEndpoint="/loco-health/api5/export"
    locoDropdownEndpoint="/loco-health/loco-drop"
    shedDropdownEndpoint="/loco-health/sheds-drop"
  />
);
