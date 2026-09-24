import React, { useState, useEffect } from "react";
import {
  Shield,
  Building2,
  RefreshCcw,
  Eye,
  ShieldCheck,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { signIn, clearError } from "../../store/slices/authSlice";
import ob1 from "../../myGallery/ob1.png";
import ob2 from "../../myGallery/ob2.png"; // Imported ob2 for mobile & tab
import IR from "../../myGallery/IR.jpeg";
import { FloatingInput } from "../../components/common/FloatingInput";
import { axiosInstance } from "../../services/axios";
import { api } from "../../services/api";
import {
  IdentifyIcon,
  AnalyzeIcon,
  PreventIcon,
} from "../../components/SvgIcon/Icon";

type UserType = "railways" | "non-railways";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("railways");

  // CAPTCHA STATES
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaFocused, setCaptchaFocused] = useState(false);

  const [formError, setFormError] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const usernameError = submitAttempted && !username.trim();
  const passwordError = submitAttempted && !password.trim();
  const captchaError = submitAttempted && !captchaInput.trim();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, error } = useAppSelector((state) => state.auth);

  const fetchCaptcha = async () => {
    try {
      const res = await axiosInstance.get("/api/captcha/");
      setCaptchaId(res.data.data.captchaId);
      setCaptchaImage(res.data.data.imageBase64);
    } catch (err) {
      console.error("Captcha fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setSubmitAttempted(true);

    if (!username.trim()) {
      setFormError("Please fill the username");
      return;
    }
    if (!password.trim()) {
      setFormError("Please fill the password");
      return;
    }
    if (!captchaInput.trim()) {
      setFormError("Please fill the CAPTCHA field");
      return;
    }
    try {
      const authPayload = await dispatch(
        signIn({
          username,
          password,
          captchaInput,
          captchaId,
        }),
      ).unwrap();

      const userId = authPayload.user.id;
      const userDetails = await api.getCurrentUserDetails();
      const isZonalAdmin = authPayload.user.roles.includes("ROLE_ZONAL_ADMIN");

      if (
        isZonalAdmin &&
        (!userDetails.empCode || userDetails.empCode.trim() === "")
      ) {
        navigate("/complete-profile", { replace: true });
        return;
      }

      const menuResponse = await api.menu.getByUserId(userId);
      const activeMenus = menuResponse.filter((item: any) => item.active);

      if (!activeMenus || activeMenus.length === 0) {
        navigate("/no-access");
        return;
      }

      activeMenus.sort((a: any, b: any) => a.id - b.id);
      const firstRoute = activeMenus[0].link;

      navigate(firstRoute, { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      fetchCaptcha();
    }
  };

  return (
    <div className="min-h-screen relative font-sans w-full overflow-x-hidden flex flex-col justify-between">
      {/* Dynamic Responsive Background Image */}
      <>
        {/* Mobile & Tablet */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat lg:hidden"
          style={{
            backgroundImage: `url(${ob2})`,
          }}
        />

        {/* Desktop */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden lg:block"
          style={{
            backgroundImage: `url(${ob1})`,
          }}
        />
      </>
      <header className="hidden lg:flex w-full px-8 xl:px-20 py-4 items-center gap-4 lg:gap-6 z-20 relative">
        {/* Logo */}
        <img
          src={IR}
          alt="Indian Railways Logo"
          className="w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 object-contain shrink-0"
        />

        {/* Text & Underline Container (inline-flex ensures line matches text width) */}
        <div className="flex flex-col items-start min-w-0">
          {/* System Title */}
          <h2 className="text-lg lg:text-xl xl:text-2xl font-bold tracking-tight text-[#0A3D91] leading-snug">
            System for Unified Reporting & Analysis for Kavach Safety & Health
            Assessment
          </h2>

          {/* Decorative Line Constrained strictly under the text width */}
          <div className="mt-2.5 flex items-center w-full max-w-full">
            <div className="h-[2px] w-12 lg:w-16 xl:w-20 bg-gradient-to-r from-blue-200 to-blue-400 shrink-0" />
            <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 mx-2 lg:mx-2.5 rounded-full bg-[#0A3D91] shadow-md shadow-blue-300 shrink-0" />
            <div className="h-[2px] flex-1 max-w-[180px] lg:max-w-[240px] xl:max-w-[320px] bg-gradient-to-r from-blue-400 to-transparent" />
          </div>
        </div>
      </header>

      {/* MOBILE & TABLET HEADER (TOP HERO) */}
      <div className="flex lg:hidden flex-col items-center pt-8 pb-4 px-4 z-10 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-red-500 bg-white p-1 flex items-center justify-center shadow-md mb-3">
          <img
            src={IR}
            alt="Indian Railways"
            className="w-full h-full object-contain rounded-full"
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Welcome to
        </h2>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0A3D91] tracking-wider mt-1">
          SURAKSHA
        </h1>

        <div className="flex items-center justify-center my-2 w-32">
          <div className="h-[1px] flex-1 bg-blue-400"></div>
          <div className="w-2 h-2 mx-2 rotate-45 bg-blue-700"></div>
          <div className="h-[1px] flex-1 bg-blue-400"></div>
        </div>

        <div className="flex lg:hidden z-10 px-2 pb-1 pt-2 w-full max-w-[380px] mx-auto gap-3">
          {/* Card 1: Identify */}
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-200 p-3 sm:p-4 flex flex-col items-center text-center shadow-md">
            <div className="w-4 h-4 sm:w-2 sm:h-2 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <IdentifyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-blue-700 text-xs sm:text-sm">
              Identify
            </h4>
          </div>

          {/* Card 2: Analyze */}
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-200 p-3 sm:p-4 flex flex-col items-center text-center shadow-md">
            <div className="w-4 h-4 sm:w-2 sm:h-2  rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <AnalyzeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            </div>
            <h4 className="font-bold text-amber-600 text-xs sm:text-sm">
              Analyze
            </h4>
          </div>

          {/* Card 3: Prevent */}
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-200 p-3 sm:p-4 flex flex-col items-center text-center shadow-md">
            <div className="w-4 h-4 sm:w-2 sm:h-2  rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <PreventIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-emerald-600 text-xs sm:text-sm">
              Prevent
            </h4>
          </div>
        </div>
      </div>

      {/* MAIN GRID CONTENT AREA */}
      <main className="relative z-10 flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 grid grid-cols-1 lg:grid-cols-12 items-center py-4 lg:py-6 gap-8">
        {/* LOGIN FORM CARD */}
        <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-start lg:-ml-10 z-10 w-full mt-0">
          <div className="w-full max-w-[380px] sm:max-w-md lg:max-w-[370px] relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden transition-all duration-300 mx-auto lg:mx-0">
            {/* Decorative Top Accent Border */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-900" />

            <div className="relative px-6 py-8 sm:px-8 sm:py-8">
              {/* Subtle Watermark Logo */}
              <img
                src={IR}
                alt="Indian Railways Watermark"
                className="absolute inset-0 m-auto w-3/4 max-w-[240px] opacity-[0.03] pointer-events-none select-none hidden lg:block"
              />

              <div className="relative z-10">
                {/* Top Logo */}
                <div className="hidden lg:flex justify-center mb-5">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative w-20 h-20 rounded-full border border-slate-100 bg-white p-2 flex items-center justify-center shadow-lg">
                      <img
                        src={IR}
                        alt="Indian Railways"
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center mb-5 lg:mb-6">
                  <div className="relative inline-flex flex-col items-center pb-2">
                    {/* Premium Badge */}
                    <div className="inline-flex items-center px-3 lg:px-4 py-1 rounded-full border border-[#F6D2BF] bg-gradient-to-r from-[#FFF8F4] via-[#FFFFFF] to-[#FFF8F4] shadow-sm mb-2">
                      <span
                        className="
          text-[10px] sm:text-[11px] lg:text-xs
          font-bold
          uppercase
          tracking-[0.28em]
          bg-gradient-to-r
          from-[#F4B183]
          via-[#E8894A]
          to-[#D96B2B]
          bg-clip-text
          text-transparent
        "
                      >
                        Sign in to
                      </span>
                    </div>

                    {/* SURAKSHA */}
                    <h1
                      className="
        text-2xl sm:text-3xl lg:text-4xl
        font-black
        leading-none
        tracking-tight
        bg-gradient-to-b
        from-[#0A3D91]
        via-[#2563EB]
        to-[#0A3D91]
        bg-clip-text
        text-transparent
        drop-shadow-[0_2px_10px_rgba(37,99,235,0.15)]
      "
                    >
                      SURAKSHA
                    </h1>

                    {/* Premium Divider */}
                    <div className="mt-3 flex items-center justify-center w-full">
                      <div className="h-[2px] w-10 sm:w-12 lg:w-16 rounded-full bg-gradient-to-r from-transparent via-blue-400 to-blue-600" />

                      <div className="mx-2 w-2 h-2 rotate-45 rounded-[2px] bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_10px_rgba(37,99,235,.35)]" />

                      <div className="h-[2px] w-10 sm:w-12 lg:w-16 rounded-full bg-gradient-to-l from-transparent via-blue-400 to-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Alert Messages */}
                {(error || formError) && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200/80 text-red-600 px-4 py-2.5 text-xs font-medium flex items-center gap-2 animate-fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {error || formError}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div className="space-y-1">
                    <FloatingInput
                      label="Username"
                      value={username}
                      disabled={loading}
                      error={usernameError}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUsername(e.target.value)
                      }
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <FloatingInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      disabled={loading || !username.trim()}
                      error={passwordError}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (!username.trim()) {
                          setFormError("Please enter username first");
                          return;
                        }
                        setFormError("");
                        setPassword(e.target.value);
                      }}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md"
                        >
                          {showPassword ? (
                            <EyeOff size={18} strokeWidth={2} />
                          ) : (
                            <Eye size={18} strokeWidth={2} />
                          )}
                        </button>
                      }
                    />
                  </div>

                  {/* Premium CAPTCHA Section */}
                  <div className="space-y-2 pt-1">
                    <div
                      className={`relative rounded-xl border bg-slate-50/50 transition-all duration-200 focus-within:bg-white focus-within:ring-2 ${
                        captchaError
                          ? "border-red-400 focus-within:ring-red-500/20"
                          : "border-slate-200 focus-within:border-blue-600 focus-within:ring-blue-600/20"
                      }`}
                    >
                      <input
                        type="text"
                        value={captchaInput}
                        placeholder="Enter CAPTCHA Code"
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        onFocus={() => setCaptchaFocused(true)}
                        onBlur={() => {
                          if (!captchaInput) setCaptchaFocused(false);
                        }}
                        className="w-full px-3.5 py-2.5 bg-transparent outline-none text-sm font-medium text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    {/* CAPTCHA Display Box */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-inner">
                        {captchaImage ? (
                          <img
                            src={`data:image/png;base64,${captchaImage}`}
                            alt="captcha"
                            className="h-full w-full object-contain p-1 mix-blend-multiply"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">
                            Loading CAPTCHA...
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          fetchCaptcha();
                          setCaptchaInput("");
                        }}
                        className="h-11 w-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm"
                        title="Refresh CAPTCHA"
                      >
                        <RefreshCcw
                          size={18}
                          className="transition-transform group-hover:rotate-180"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full mt-3 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 hover:opacity-95 active:scale-[0.98] disabled:opacity-70 transition-all duration-200 text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP RIGHT SIDE HERO PANEL */}
        <div className="col-span-1 lg:col-span-7 xl:col-span-8 hidden lg:flex flex-col justify-center items-end text-right lg:pl-12">
          <div className="space-y-1 select-none">
            <h2 className="text-3xl xl:text-5xl font-semibold text-slate-900 tracking-tight">
              Welcome to
            </h2>
            <div className="space-y-3 flex flex-col items-end">
              <h3 className="text-5xl xl:text-7xl font-black text-[#0A3D91] tracking-wide leading-none">
                SURAKSHA
              </h3>
              <div className="flex items-center justify-center mt-4">
                <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-blue-400 to-blue-600 rounded-full" />
                <div className="mx-3 w-3 h-3 rotate-45 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,.5)]" />
                <div className="h-[2px] w-20 bg-gradient-to-l from-transparent via-blue-400 to-blue-600 rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 xl:gap-4 mt-12 w-full max-w-[460px]">
            <div className="flex-1 rounded-2xl bg-white border border-blue-300 shadow-[0_10px_25px_rgba(37,99,235,0.18)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.30)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-4">
                <IdentifyIcon className="w-7 h-7 text-blue-600" />
              </div>
              <h4 className="font-bold text-blue-700 text-base">Identify</h4>
              <div className="mt-3 w-8 h-[3px] rounded-full bg-blue-600"></div>
            </div>

            <div className="flex-1 rounded-2xl bg-white border border-amber-300 shadow-[0_10px_25px_rgba(245,158,11,0.18)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.30)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <AnalyzeIcon className="w-7 h-7 text-amber-500" />
              </div>
              <h4 className="font-bold text-amber-600 text-base">Analyze</h4>
              <div className="mt-3 w-8 h-[3px] rounded-full bg-amber-500"></div>
            </div>

            <div className="flex-1 rounded-2xl bg-white border border-emerald-300 shadow-[0_10px_25px_rgba(16,185,129,0.18)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.30)] transition-all duration-300 hover:-translate-y-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                <PreventIcon className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-bold text-emerald-600 text-base">Prevent</h4>
              <div className="mt-3 w-8 h-[3px] rounded-full bg-emerald-600"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
