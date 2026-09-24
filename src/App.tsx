import React, { useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { Provider } from "react-redux";
import { store } from "./store";
import { createAppTheme } from "./utils/theme";
import { useAppDispatch, useAppSelector } from "./hooks/useRedux";
import { loadUser } from "./store/slices/authSlice";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MainLayout } from "./layouts/MainLayout";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { LoginPage } from "./pages/auth/LoginPage";
// import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { NMSLogsPage } from "./pages/nms/NMSLogsPage";
// import { RealTimeNMS } from "./pages/nms/RealTimeNMS";

// import { FailureReportingPage } from "./pages/fracas/FailureReportingPage";
import { FailureAnalysisPage } from "./pages/fracas/FailureAnalysisPage";
import { CorrectiveActionPage } from "./pages/fracas/CorrectiveActionPage";
import {
  RFIDTagsPage,
  TowersPage,
  TracksidePage,
  OnboardPage,
} from "./pages/assets/AssetsPage";
import UserManagementPage from "./pages/users/UserManagementPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { ProfilePage } from "./pages/auth/ProfilePage";
import {
  LocosPage,
  SectionsPage,
  DivisionsPage,
  ZonesPage,
  SettingsPage,
} from "./pages/management/ManagementPage";
// import { tooltipReducer } from "recharts/types/state/tooltipSlice";
import SlamLocoManagementPage from "./pages/slam/SlamLocoManagementPage";
import Loco from "./pages/slam/Loco";
import { NMSDashboard } from "./pages/nms/NMSDashboard";
import MasterZone from "./pages/master/MasterZone";
import MasterDivision from "./pages/master/MasterDivision";
import MasterFirm from "./pages/master/MasterFirm";
import MasterStation from "./pages/master/MasterStation";
import MasterSection from "./pages/master/MasterSection";
import MasterShed from "./pages/master/MasterShed";
import MasterLocoType from "./pages/master/MasterLocoType";
import MasterFailureCategory from "./pages/master/MasterFailureCategory";
import MasterFailureSubCategory from "./pages/master/MasterFailureSubCategory";
import MasterIncidentCategory from "./pages/master/MasterIncidentCategory";
import MasterIncidentSubCategory from "./pages/master/MasterIncidentSubCategory";
import MasterTag from "./pages/master/MasterTag";
import MasterAsset from "./pages/master/MasterAsset";
import Incidences from "./pages/incidences/Incidences";
import Icms from "./pages/incidences/Icms";
import { NotificationProvider } from "./context/notification-context";
import MasterDesignation from "./pages/master/MasterDesignation";
import MasterDepartment from "./pages/master/MasterDepartment";
import MasterRole from "./pages/master/MasterRole";
import TowerMap from "../src/pages/gis/TowerMap";
import TagMap from "./pages/gis/TagMap";
import SlamDashboardPage from "./pages/slam/SlamLocoDashboard";
import LiveNMSPage from "./pages/nms/LiveNMSPage";
import NMSLocoLogsPage from "./pages/nms/NMSLocoLogsPage";
import MsgTypeTable from "./pages/master/MsgTypeNmsStructureTable";
import CmsRegisterPage from "./pages/cms/CmsRegisterPage";
import StationKavach from "./pages/master/StationKavach";
import LastWeekLocos from "./pages/master/weeklyLocoEvent";
import LastWeekStation from "./pages/master/WeeklyStationReport";
import OnBoardKavach from "./pages/master/OnBoardKavach";
import CmsTicketAssigned from "./pages/cms/CmsTicketAssigned";
import NMSPacket from "./pages/nms/NMSPacket";
import NmsReports from "./pages/nms/NnmReports";
import Report from "./pages/nms/Report";
import NoAcces from "./pages/auth/NoAcces";
import RoleConfig from "./pages/roleConfig/RoleConfig";
import RelayRef from "./pages/ref-data/RelayRef";
import ImpactRedirect from "../src/pages/Impact";
import LocoPacket from "./pages/loco/LocoPacket";
import NewReport from "./pages/nms/NewReport";
import SurakshaAssets from "./pages/gis/SurakshaAssets";
import FaultRef from "./pages/ref-data/FaultRef";
import FaultModule from "./pages/ref-data/FaultModule";
import FaultCatagory from "./pages/ref-data/FaultCatagory";
import FaultType from "./pages/ref-data/FaultType";
import LocoFaultReport from "./pages/locoReport/LocoFaultReport";
import LocoMovementReport from "./pages/locoReport/LocoMovementReport";
import NmsLocoMovementReport from "./pages/locoReport/nmsLocoMovementReport";
import MissingTagReport from "./pages/locoReport/MissingTagReport";
import RadioCommunicationReportPage from "./pages/locoReport/RadioCommunicationReportPage";
import RadioFailOneMonthReportPage from "./pages/locoReport/RadioFailOneMonthReportPage";
import ExceptionalPackets from "./pages/nms/ExceptionalPackets";
import ObkSKavachConnectivity from "./pages/Obk-SKavach/ObkSkavachconnectivity";
import FSBIssueReport from "./pages/locoReport/FsbIssueReport";
import EBIssueReport from "./pages/locoReport/EbIssueReport";
import ExceptionReport from "./pages/locoReport/ExceptionReport";
import NewExceptionReport from "./pages/locoReport/NewExceptionReport";
import { CompleteProfile } from "./pages/auth/CompleteProfile";
import LocoDetails from "./pages/Obk-SKavach/LocoDetails";
import LocoAvailability from "./pages/locoReport/LocoAvailability";
import PrivacyPolicyPage from "./pages/auth/PrivacyPolicyPage";
import LocoHealthReports from "./pages/locoHealthReport/LocoHealthReports";
import { BrakeStatusReport } from "./pages/locoHealthReport/BrakeStatusReport";
import { DmiHealthReport } from "./pages/locoHealthReport/DmiHealthReport";
import { GpsHealthReport } from "./pages/locoHealthReport/GpsHealthReport";
import { KmsHealthReport } from "./pages/locoHealthReport/KMSHealthReport";
import { OvkHardwareReport } from "./pages/locoHealthReport/OVKHardwareReport";
import { RadioHealthReport } from "./pages/locoHealthReport/RadioHealthReport";
import { SosHealthReport } from "./pages/locoHealthReport/SoSHealthReport";
import { ConfigurationStatusReport } from "./pages/locoHealthReport/ConfigurationStatusreport";
import { SRadioHealthReport } from "./pages/station health reports/SRadioHealthReport";
import { LocoConnectivityLog } from "./pages/Obk-SKavach/LocoConnectivityLog";
import LocoLastConnectionReport from "./pages/Obk-SKavach/LocoLastConnectionReport";
import LocoJourneyMap from "./pages/Obk-SKavach/LocoJourneyMap";
import SectionWiseStationLoco from "./pages/Obk-SKavach/SectionWiseStationLoco";
import { BaseIcmsFailureReport } from "./pages/icmsFailureReport";
import DmiEventSummaryReport from "./pages/locoReport/DmiEventSummaryReport"; // // Test for auth state loading
import { ConfigurationStationHealthReport } from "./pages/station health reports/ConfigStationHealth";
import { SOSStationHealthReport } from "./pages/station health reports/SosStationHealth";
import { KMSStationHealthReport } from "./pages/station health reports/KmsStationHealth";
import { GPSStationHealthReport } from "./pages/station health reports/GpsStationHealth";
import { StationModuleHealthReport } from "./pages/station health reports/StationModuleHealth";
import LocoSpecificFault from "./pages/locoReport/LocoSpecificFault";
import Priority from "./pages/Priority/Priority";
import SystemFaults from "./components/SystemFaults/SystemFaults";
// import Tickets from "./pages/Fault_ticket/Tickets";
import DomainMaster from "./pages/DomainMaster/DomainMaster";
import KavachIssueMaster from "./pages/KavachIssueMaster/KavachIssueMaster";
import KavachEquipmentMaster from "./pages/KavachEquipmentMaster/KavachEquipmentMaster";
import KavachEquipmentIssueMap from "./pages/KavachEquipmentIssueMap/KavachEquipmentIssueMap";

import ExceptionReportForLoco from "./pages/locoReport/ExceptionReportForLoco";
import ExceptionReportForNms from "./pages/locoReport/ExceptionReportForNms";
// interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: string;
//   zone_id: string | null;
//   division_id: string | null;
//   is_active: boolean;
//   created_at: string;
//   updated_at: string;
// }
// // Test for auth state loading ends
// const AppContent: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const { themeMode } = useAppSelector((state) => state.app);
//   const { loading, user } = useAppSelector((state) => state.auth);
//   // const [user, setUser] = useState<User | null>(null);
//   // const [loading, setLoading] = useState(true);
//   const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

//   // useEffect(() => {
//   //   dispatch(loadUser());
//   // }, [dispatch]);

//   useEffect(() => {
//     const storedAuth = localStorage.getItem("user");
//     // console.log("Stored Auth:", storedAuth);

//     if (storedAuth) {
//       try {
//         const parsed = JSON.parse(storedAuth);
//         // console.log("Parsed Auth:", parsed.name);

//         // setUser(parsed.roles); // ✅ SET USER
//       } catch (error) {
//         console.error("Invalid auth data", error);
//         localStorage.removeItem("auth");
//       }
//     }
//     dispatch(loadUser());
//     // setLoading(false);
//   }, [dispatch]);
//   if (loading) {
//     return <LoadingScreen />;
//   }
// useEffect(() => {
//   const token = localStorage.getItem("accessToken");
//   if (token) {
//     dispatch(loadUser());
//   } else {
//     dispatch({ type: "auth/loadUser/rejected" });
//   }
// }, []);

//Test code

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { themeMode } = useAppSelector((state) => state.app);
  const { loading, user } = useAppSelector((state) => state.auth);

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <NotificationProvider>
        <CssBaseline />
        <BrowserRouter basename="/">
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to="/nms-logs" replace /> : <LoginPage />
              }
            />
            {/* <Route
              path="/login"
              element={
                user ? <Navigate to="/nms-logs" replace /> : <LoginPage />
              }
            /> */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            <Route
              path="/"
              element={
                // <ProtectedRoute>
                <Navigate to="/nms-logs" replace />
                // </ProtectedRoute>
              }
            />
            <Route path="/no-access" element={<NoAcces />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/impact" element={<ImpactRedirect />} />
            <Route
              path="/asset-gis"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SurakshaAssets />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

              <Route
              path="/user-management/priority"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Priority />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/system-faults"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SystemFaults />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/slam-loco"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SlamLocoManagementPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loco-fault-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoFaultReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exception-loco"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExceptionReportForLoco />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exception-nms"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExceptionReportForNms />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Dmi-1c-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DmiEventSummaryReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fsb"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FSBIssueReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/eb"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <EBIssueReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exception"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExceptionReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

<Route
  path="/new-exception-report"
  element={
    <ProtectedRoute>
      <MainLayout>
        <NewExceptionReport />
      </MainLayout>
    </ProtectedRoute>
  }
/>




            <Route
              path="/loco-movement-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoMovementReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/nms-loco-movement-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NmsLocoMovementReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/loco-avl"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoAvailability />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/missing-tag-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MissingTagReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/radio-communication-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RadioCommunicationReportPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/radioFail-oneMonth-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RadioFailOneMonthReportPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuration-status"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ConfigurationStatusReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/obk-hardware"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OvkHardwareReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/brake-status"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <BrakeStatusReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dmi-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DmiHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/gps-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <GpsHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kms-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KmsHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/radio-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RadioHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sos-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SosHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sradio-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SRadioHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/station-module-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <StationModuleHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gps-station-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <GPSStationHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kms-station-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KMSStationHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sos-station-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SOSStationHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loco-specific-fault"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoSpecificFault />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuration-station-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ConfigurationStationHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/icms-failure-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <BaseIcmsFailureReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sradio-health"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SRadioHealthReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/loco-packet"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoPacket />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NewReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/menuConfig"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RoleConfig />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relay-ref"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RelayRef />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fault-code"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FaultRef />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fault-category"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FaultCatagory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fault-module"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FaultModule />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fault-type"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FaultType />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/nms-logs"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NMSLogsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/live-nms"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LiveNMSPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nms-packets"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NMSPacket />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/obk-s-kavach"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ObkSKavachConnectivity />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loco-24h"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoConnectivityLog />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loco/:locoId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoDetails />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loco-journey-map"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoJourneyMap />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/section-wise-station-loco"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SectionWiseStationLoco />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exceptional"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExceptionalPackets />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nms-loco-logs"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NMSLocoLogsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nms-reports"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NmsReports />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nms-report-view/:id/:name"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Report />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/loco-dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Loco />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/slam-loco-dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SlamDashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/real-time-logs"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NMSDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidences-entry"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Incidences />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/icms-failure-register"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Icms />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/loco-last-connection-report"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LocoLastConnectionReport />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms-register"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CmsRegisterPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assigned-tickets"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CmsTicketAssigned />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/zone"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterZone />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/division"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterDivision />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/role"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterRole />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/department"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterDepartment />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/designation"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterDesignation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/firm"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterFirm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/section"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterSection />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/kavachStation"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <StationKavach />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/last-week-locos"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LastWeekLocos />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/last-week-stations"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <LastWeekStation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/kavachOnboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OnBoardKavach />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/station"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterStation />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shed"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterShed />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locoType"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterLocoType />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/failureCategory"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterFailureCategory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/failureSubCategory"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterFailureSubCategory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidentCategory"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterIncidentCategory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/incidentSubCategory"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterIncidentSubCategory />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tag-details"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterTag />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tower-details"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MasterAsset />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fracas/analysis"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <FailureAnalysisPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fracas/corrective-action"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CorrectiveActionPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/rfid"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RFIDTagsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/towers"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TowersPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/trackside"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TracksidePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/onboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <OnboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locos"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "SUPER_ADMIN",
                    "RAILWAY_BOARD",
                    "ZONE_USER",
                    "DIVISION_USER",
                  ]}
                >
                  <MainLayout>
                    <LocosPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sections"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "SUPER_ADMIN",
                    "RAILWAY_BOARD",
                    "ZONE_USER",
                    "DIVISION_USER",
                  ]}
                >
                  <MainLayout>
                    <SectionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/divisions"
              element={
                <ProtectedRoute
                  allowedRoles={["SUPER_ADMIN", "RAILWAY_BOARD", "ZONE_USER"]}
                >
                  <MainLayout>
                    <DivisionsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/zones"
              element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN", "RAILWAY_BOARD"]}>
                  <MainLayout>
                    <ZonesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserManagementPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tower"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TowerMap />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tag"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TagMap />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/msgType/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MsgTypeTable />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
{/* 
             <Route
              path="/tickets" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Tickets />
                  </MainLayout>
                </ProtectedRoute>
              }
            /> */}

             <Route
              path="/domain-master" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DomainMaster />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

           <Route
               path="/user-management/kavach-issue" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KavachIssueMaster />
                  </MainLayout>
                </ProtectedRoute>
              }
            />


            <Route
               path="/user-management/kavach-equipment" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KavachEquipmentMaster />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

           <Route
              path="/kavach-equipment-issue-map" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <KavachEquipmentIssueMap />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
