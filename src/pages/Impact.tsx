import React, { useEffect } from "react";
import { useAppSelector } from "../hooks/useRedux";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

const ImpactRedirect = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToImpact = async () => {
      try {
        const surakshaUserId = user?.username;

        if (!surakshaUserId) {
          console.error("Username not found");
          return;
        }

        // 1. Generate fresh IMPACT token
        const tokenResponse = await api.generateImpactToken();

        if (!tokenResponse?.success || !tokenResponse?.token) {
          console.error("Failed to generate IMPACT token");
          return;
        }

        const impactToken = tokenResponse.token;

        const zoneCode = await api.getCurrentUserZoneCode();

        const redirectUrl =
          `https://mrsectt.cris.org.in/impact/SurakshaLandingPage.jsp` +
          `?token=${encodeURIComponent(impactToken)}` +
          `&userid=${encodeURIComponent(surakshaUserId)}` +
          `&zonecode=${encodeURIComponent(zoneCode)}`;

      window.open(redirectUrl, "_blank", "noopener");
navigate("/nms-logs");
      } catch (error) {
        console.error("Impact redirect failed:", error);
      }
    };

    redirectToImpact();
  }, [user]);

  // return <div>Redirecting to SURAKSHA IMPACT Portal...</div>;
};

export default ImpactRedirect;
