import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useRedux";
import { verifyOtp } from "../../store/slices/authSlice";

import IR from "../../myGallery/IR.png";
import New1 from "../../myGallery/New1.png";
import { FloatingInput } from "../../components/common/FloatingInput";
import { axiosInstance } from "../../services/axios";

export const OtpPage: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);
  // const resendOtp = async (username: string) => {
  //   return axiosInstance.post("/auth/resend-otp", {
  //     username,
  //   });
  // };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = sessionStorage.getItem("otp_username");

    if (!username) {
      alert("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    try {
      const result = await dispatch(verifyOtp({ username, otp })).unwrap();

      if (result?.user) {
        sessionStorage.removeItem("otp_username");
        navigate("/nms-logs", { replace: true });
      }
    } catch (error: any) {
      alert(error || "Invalid OTP");
    }
  };

  // const handleResendOtp = async () => {
  //   const username = sessionStorage.getItem("otp_username");

  //   if (!username) return;

  //   await api.auth.resendOtp(username);

  //   setTimer(30);
  //   setOtp("");
  // };

  return (
    <div
      className="min-h-screen relative bg-cover bg-no-repeat bg-center md:bg-right"
      style={{ backgroundImage: `url(${New1})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#06152f]/80 via-[#0b2450]/40 to-transparent" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center lg:justify-start px-4 sm:px-6 lg:pl-20 xl:pl-32 py-4">
        <div className="w-full max-w-[380px]">
          {/* Branding */}
          <div className="mb-3">
            <div className="mb-3 flex items-center">
              <div className="h-14 w-14 md:h-20 md:w-20 rounded-full bg-blue-900/20 backdrop-blur-xl border border-white/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center justify-center">
                <img
                  src={IR}
                  alt="Indian Railways"
                  className="h-10 w-10 md:h-12 md:w-12 object-contain brightness-0 invert contrast-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-white/75 font-medium">
                Secure Verification
              </p>

              <h1
                className="text-lg sm:text-2xl md:text-3xl font-black leading-none tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                OTP VERIFICATION
              </h1>
            </div>

            <p className="mt-1 text-xs md:text-sm text-white/90 font-medium tracking-wide">
              Verify your identity to continue
            </p>
          </div>

          {/* OTP Card */}
          <div className="bg-white/18 backdrop-blur-2xl border border-white/25 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)] p-4 sm:p-5 md:p-6">
            <div className="mb-4 text-center">
              <h2 className="text-lg font-bold text-white">Enter OTP</h2>

              <p className="text-xs text-white/70 mt-1">
                Enter the 6-digit OTP sent to your registered mobile/email
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <FloatingInput
                label="Enter OTP"
                type="text"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputClassName="text-center tracking-[0.4em] text-lg"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-[#0E3A8A] to-[#082B68] hover:scale-[1.01] transition-all duration-300 shadow-lg"
              >
                Verify OTP
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              {timer > 0 ? (
                <p className="text-white/70">
                  Resend OTP in{" "}
                  <span className="font-semibold text-white">{timer}s</span>
                </p>
              ) : (
                <button
                  // onClick={handleResendOtp}
                  className="font-semibold text-white hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <div className="mt-4 text-center text-xs text-white/85">
              <div className="flex items-center justify-center gap-2">
                <Shield size={14} />
                Indian Railways
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
