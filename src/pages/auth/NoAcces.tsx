import React from "react";
import { Box, Typography, Button, Paper, Avatar, Divider } from "@mui/material";
import { ShieldAlert, LogOut, Train } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { useNavigate } from "react-router-dom";
import { signOut } from "../../store/slices/authSlice";
import IR from "../../myGallery/IR.jpeg";
import CRIS from "../../myGallery/CRIS.jpg";

const getAvatarColorByRole = (role?: string) => {
  switch (role) {
    case "ROLE_SUPER_ADMIN":
      return "#c62828";
    case "ROLE_ADMIN":
      return "#6a1b9a";
    case "ROLE_RAILWAY_BOARD":
      return "#2e7d32";
    case "ROLE_ZONE_USER":
      return "#1565c0";
    case "ROLE_DIVISION_USER":
      return "#ef6c00";
    default:
      return "#1976d2";
  }
};

export default function NoAccess() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const primaryRole = user?.roles?.[0];

  const handleLogout = async () => {
    await dispatch(signOut());
    navigate("/login");
  };
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #e3f2fd 0%, #f8fbff 35%, #ffffff 100%)",
      }}
    >
      {/* TOP HEADER */}
      <Box
        sx={{
          height: 90,
          px: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
          color: "white",
          boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              height: 52,
              width: 52,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 0 0 2px rgba(255,255,255,0.7), 0 6px 16px rgba(0,0,0,0.2)",
            }}
          >
            <Box
              component="img"
              src={IR}
              alt="Indian Railways"
              sx={{ height: 34, width: 34 }}
            />
          </Box>

          <Box>
            <Typography fontWeight={900} fontSize="1.5rem" letterSpacing={1}>
              SURAKSHA
            </Typography>
            <Typography fontSize={13} sx={{ opacity: 0.9 }}>
              System for Unified Reporting & Analysis for Kavach Safety & Health
              Assessment
            </Typography>
          </Box>
        </Box>

        <Train size={34} />
      </Box>

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid rgba(25,118,210,0.12)",
            boxShadow: "0 24px 60px rgba(25,118,210,0.12)",
          }}
        >
          {/* CARD TOP */}
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(25,118,210,0.06), rgba(25,118,210,0.02))",
            }}
          >
            <Avatar
              sx={{
                width: 88,
                height: 88,
                mx: "auto",
                mb: 2,
                bgcolor: "rgba(211,47,47,0.12)",
              }}
            >
              <ShieldAlert size={46} color="#d32f2f" />
            </Avatar>

            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ mb: 1, color: "#0d47a1" }}
            >
              Access Not Assigned
            </Typography>

            <Typography
              sx={{
                fontSize: 16,
                color: "text.secondary",
                maxWidth: 520,
                mx: "auto",
              }}
            >
              Your account is authenticated successfully, but no operational
              modules have been assigned for your role.
            </Typography>
          </Box>

          <Divider />

          {/* USER INFO */}
          <Box sx={{ p: 4 }}>
            <Typography
              fontSize={13}
              fontWeight={800}
              color="text.secondary"
              sx={{ mb: 2, letterSpacing: 1 }}
            >
              ACCOUNT DETAILS
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                rowGap: 1.8,
                columnGap: 2,
                mb: 4,
              }}
            >
              <Typography fontWeight={700}>User Name</Typography>
              <Typography>{user?.name || "-"}</Typography>

              <Typography fontWeight={700}>Employee Code</Typography>
              <Typography>{user?.emp_code || "-"}</Typography>

              <Typography fontWeight={700}>Role</Typography>
              <Typography>{primaryRole || "-"}</Typography>

              <Typography fontWeight={700}>Mobile</Typography>
              <Typography>{user?.mobile || "-"}</Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: "#fff8e1",
                border: "1px solid #ffe082",
                mb: 4,
              }}
            >
              <Typography fontWeight={800} sx={{ mb: 0.8 }}>
                Administrator Action Required
              </Typography>

              <Typography fontSize={14} color="text.secondary">
                Please contact your system administrator to assign module access
                permissions for your account.
              </Typography>
            </Paper>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<LogOut size={18} />}
                onClick={handleLogout}
                sx={{
                  px: 4,
                  py: 1.4,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "0 10px 24px rgba(25,118,210,0.25)",
                }}
              >
                Logout Securely
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* FOOTER */}
      <Box
        sx={{
          py: 2,
          px: 3,
          borderTop: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box component="img" src={CRIS} alt="CRIS" sx={{ height: 36 }} />

          <Typography fontWeight={700} fontSize={14}>
            Centre for Railway Information Systems (CRIS)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
