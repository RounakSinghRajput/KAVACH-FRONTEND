import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAppSelector } from "../../hooks/useRedux";
import { api } from "../../services/api"; // Import your API instance

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAppSelector((state) => state.auth);
  const token = localStorage.getItem("accessToken");
  
  // Local state to trace async employee profile checks
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user) {
        const isZonalAdmin = user.roles?.includes("ROLE_ZONAL_ADMIN");
        if (isZonalAdmin) {
          try {
            const userDetails = await api.getCurrentUserDetails();
            if (!userDetails.empCode || userDetails.empCode.trim() === "") {
              setNeedsProfileCompletion(true);
            }
          } catch (err) {
            console.error("Failed to verify user profile status", err);
          }
        }
      }
      setCheckingProfile(false);
    };

    if (!loading) {
      checkUserProfile();
    }
  }, [user, loading]);

  if (loading || checkingProfile) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  // ⚠️ FORCE REDIRECT: If they are Zonal Admin with missing empCode, redirect them to complete-profile
  if (needsProfileCompletion) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (
    allowedRoles &&
    user &&
    !user.roles?.some((role) => allowedRoles.includes(role as string))
  ) {
    return <Navigate to="/nms-logs" replace />;
  }

  return <>{children}</>;
};