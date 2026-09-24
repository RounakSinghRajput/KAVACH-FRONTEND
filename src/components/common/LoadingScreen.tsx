import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Train } from "lucide-react";

export const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Train size={64} color="#1565C0" />
      </Box>
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Loading SURAKSHA...
      </Typography>
    </Box>
  );
};

export const ContentLoading: React.FC = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: "450px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Train size={48} color="#1565C0" />

      <CircularProgress sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  );
};
