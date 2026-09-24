import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { signOut } from "../../store/slices/authSlice";
import { axiosInstance } from "../../services/axios";

import IR from "../../myGallery/IR.jpeg";

interface HrmsData {
  emp_hrms_id: string;
  employee_name: string;
  emp_email_id: string;
  mobile_no: string;
  designation?: string;
  department?: string;
  zone_code?: string;
  railway_unit_name?: string;
}

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { loading: authLoading, user: authUser } = useAppSelector(
    (state) => state.auth,
  );

  const [hrmsIdInput, setHrmsIdInput] = useState<string>("");
  const [hrmsData, setHrmsData] = useState<HrmsData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleLogout = async () => {
    try {
      await dispatch(signOut()).unwrap();
    } catch (error) {
      console.error("Failed to sign out cleanly:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleFetchHrms = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = hrmsIdInput.trim();
    if (!cleanId) {
      setErrorMessage("Please enter a valid HRMS ID.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const hrmsRes = await axiosInstance.post("/hrms/fetch", {
        hrms_id: cleanId,
      });

      const fetchedHrms = hrmsRes.data?.data || hrmsRes.data;

      if (
        !fetchedHrms ||
        (typeof fetchedHrms === "string" &&
          fetchedHrms.toUpperCase().includes("INVALID")) ||
        !fetchedHrms.emp_hrms_id
      ) {
        throw new Error("INVALID_HRMS_ID");
      }

      setHrmsData(fetchedHrms);
    } catch (error: any) {
      console.error("Error fetching HRMS data:", error);
      setHrmsData(null);
      setErrorMessage("Invalid HRMS ID. Please double check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!hrmsData || !authUser?.id) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      username: authUser.username,
      email: hrmsData.emp_email_id,
      emp_code: hrmsData.emp_hrms_id,
      name: hrmsData.employee_name,
      mobile: hrmsData.mobile_no,
      status: authUser.status,
      roles: authUser.roles,
      designation: hrmsData.designation || authUser.designation,
      zone: hrmsData.zone_code || authUser.zone,
      division: authUser.division,
      section: authUser.section,
      station: authUser.station,
      firm: authUser.firm,
    };

    try {
      await axiosInstance.put(`/user/update/${authUser.id}`, payload);
      setSuccessMessage("Profile verified and updated successfully!");

      setTimeout(() => {
        navigate("/nms-logs", { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper list for side-by-side rendering
  const profileDetails = hrmsData
    ? [
        { label: "HRMS ID", value: hrmsData.emp_hrms_id },
        { label: "Employee Name", value: hrmsData.employee_name },
        { label: "Designation", value: hrmsData.designation || "N/A" },
        { label: "Department", value: hrmsData.department || "N/A" },
        { label: "Zone Code", value: hrmsData.zone_code || "N/A" },
        { label: "Railway Unit", value: hrmsData.railway_unit_name || "N/A" },
        { label: "Mobile Number", value: hrmsData.mobile_no },
        { label: "Email Address", value: hrmsData.emp_email_id },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col items-center justify-center p-4 sm:p-6 antialiased font-sans">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-7 pb-5 relative border-b border-slate-100 text-center">
          <button
            type="button"
            onClick={handleLogout}
            disabled={authLoading}
            className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full ring-4 ring-blue-50/80 border-2 border-blue-600 p-1 flex items-center justify-center bg-white shadow-md mb-3 transition-transform hover:scale-105">
              <img
                src={IR}
                alt="Indian Railways Logo"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h1 className="text-2xl font-black tracking-wider text-blue-950 uppercase">
              SURAKSHA
            </h1>
            <p className="text-blue-600 text-xs font-bold tracking-widest uppercase mt-0.5">
              Identify • Analyze • Prevent
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Step Progress Tracker */}
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 text-xs font-semibold text-slate-400">
            <div
              className={`flex items-center gap-2 ${!hrmsData ? "text-blue-600 font-bold" : "text-emerald-600"}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${!hrmsData ? "bg-blue-600 text-white" : "bg-emerald-100 text-emerald-700"}`}
              >
                {hrmsData ? "✓" : "1"}
              </span>
              <span>Fetch HRMS</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200"></div>
            <div
              className={`flex items-center gap-2 ${hrmsData ? "text-blue-600 font-bold" : ""}`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${hrmsData ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
              >
                2
              </span>
              <span>Verify & Save</span>
            </div>
          </div>

          {/* Alert Messages */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3 animate-fadeIn">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs">
                ✓
              </span>
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200/80 text-rose-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-3 animate-fadeIn">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs">
                !
              </span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: HRMS Lookup Input */}
          <form onSubmit={handleFetchHrms} className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Enter Employee HRMS ID
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={hrmsIdInput}
                onChange={(e) => setHrmsIdInput(e.target.value.toUpperCase())}
                placeholder="e.g. ABCXYZ"
                disabled={isLoading}
                maxLength={10}
                className="w-full pl-4 pr-32 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold tracking-wide text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={isLoading || !hrmsIdInput.trim()}
                className="absolute right-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-all shadow-sm active:scale-95 disabled:bg-slate-300 disabled:shadow-none disabled:active:scale-100"
              >
                {isLoading && !hrmsData ? (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  "Fetch Details"
                )}
              </button>
            </div>
          </form>

          {/* STEP 2: Side-by-Side Employee Information Display */}
          {hrmsData && (
            <div className="space-y-6 pt-2 animate-fadeIn">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 bg-slate-100/60">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Verified HRMS Profile
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active Record
                  </span>
                </div>

                {/* Side-by-Side Table Rows */}
                <div className="divide-y divide-slate-200/60 bg-white">
                  {profileDetails.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center px-5 py-3 hover:bg-slate-50/80 transition-colors text-xs sm:text-sm"
                    >
                      {/* Left: Label */}
                      <span className="w-2/5 font-medium text-slate-500 flex-shrink-0">
                        {item.label}
                      </span>

                      {/* Divider separator */}
                      <span className="text-slate-300 font-bold mr-3">—</span>

                      {/* Right: Value */}
                      <span className="w-3/5 font-semibold text-slate-900 break-words truncate">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Profile Action */}
              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Updating Profile...</span>
                  </>
                ) : (
                  <span>Confirm & Save Profile</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
