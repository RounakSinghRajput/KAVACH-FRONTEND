import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface ManagementPageProps {
  title: string;
  description: string;
}

export const ManagementPage: React.FC<ManagementPageProps> = ({
  title,
  description,
}) => {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        {title}
      </Typography>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Paper>
    </Box>
  );
};

export { LocosPage } from "./LocosPage";
export { SectionsPage } from "./SectionsPage";
export { DivisionsPage } from "./DivisionsPage";
export { ZonesPage } from "./ZonesPage";

export const SettingsPage: React.FC = () => (
  <ManagementPage
    title="Settings"
    description="Configure system settings and preferences"
  />
);
