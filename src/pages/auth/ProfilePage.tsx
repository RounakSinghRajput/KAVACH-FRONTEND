import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import { UserCircle, Lock, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/useRedux";
import { api } from "../../services/api";
import { formatRole } from "../../utils/formateRole";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      return;
    }

    setLoading(true);

    try {
      // If your backend requires current password also, update API accordingly
      await api.auth.updatePassword(newPassword);

      setMessage({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update password",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Smart close: go back if possible, else redirect
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <UserCircle size={32} color="#d84315" />
          <Typography variant="h4" fontWeight={700} sx={{ color: "#d84315" }}>
            User Profile
          </Typography>
        </Box>

        {/* Close Button */}
        <Tooltip title="Close">
          <IconButton
            onClick={handleClose}
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, #ffffff, #f5f5f5)",
              boxShadow: "0px 6px 16px rgba(0,0,0,0.08)",
              transition: "0.2s ease",
              "&:hover": {
                transform: "scale(1.05)",
                background: "linear-gradient(135deg, #ffebee, #ffffff)",
              },
            }}
          >
            <X size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Left Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: "#1976d2",
                fontSize: "3rem",
                fontWeight: 700,
                mx: "auto",
                mb: 2,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </Avatar>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              {user?.name ?? "User"}
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user?.email ?? "-"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: "left" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Role:</strong> {formatRole(user?.roles)}
              </Typography>

              {user?.id && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  <strong>Zone:</strong> {user.id}
                </Typography>
              )}

              {user?.id && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  <strong>Division:</strong> {user.id}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Card */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Lock size={24} color="#1976d2" />
              <Typography variant="h6" fontWeight={600}>
                Change Password
              </Typography>
            </Box>

            {message && (
              <Alert
                severity={message.type}
                sx={{ mb: 3 }}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            )}

            <form onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
                disabled={loading}
              />

              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                helperText="Minimum 6 characters"
                sx={{ mb: 2 }}
                disabled={loading}
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                disabled={loading}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<Save size={18} />}
                sx={{
                  bgcolor: "#1976d2",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.5,
                  px: 4,
                  "&:hover": {
                    bgcolor: "#1565c0",
                  },
                }}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
