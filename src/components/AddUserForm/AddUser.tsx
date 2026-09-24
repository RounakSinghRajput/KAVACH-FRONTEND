import { useEffect, useState } from "react";
import { axiosInstance } from "../../services/axios";

/* ================= HELPERS ================= */

const normalizeId = (v: any): number | null => {
  if (Array.isArray(v)) return v.length ? Number(v[0]) : null;
  if (v === null || v === undefined || v === "") return null;
  return Number(v);
};

const getLoggedInUserRole = (): string => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}");
    const roles = auth?.user?.roles;

    if (Array.isArray(roles) && roles.length > 0) {
      if (typeof roles[0] === "string") {
        return roles[0];
      }
      return roles[0]?.name || roles[0]?.roleName || "";
    }
    return "";
  } catch (error) {
    console.error("Failed to parse auth data from localStorage:", error);
    return "";
  }
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editUser: any | null;
}

/* ================= ROLE FIELD CONFIG ================= */

const roleConfig: any = {
  ROLE_ADMIN: [],
  ROLE_RBM: [],
  ROLE_RBO: [],
  ROLE_RDSO: [],
  ROLE_TRAINING_INSTITUTE: [],

  ROLE_ZONAL_ADMIN: ["designation", "zone"],
  ROLE_ZONAL_OFFICER: ["designation", "zone"],
  ROLE_ZONAL_CONTROL_ROOM: ["designation", "zone"],

  ROLE_DIVISIONAL_ADMIN: ["designation", "zone", "division"],
  ROLE_DIVISIONAL_OFFICER: ["designation", "zone", "division"],
  ROLE_DIVISIONAL_CONTROL_ROOM: ["designation", "zone", "division"],

  ROLE_SECTION_ADMIN: ["designation", "zone", "division", "section"],
  ROLE_SECTION_OFFICER: ["designation", "zone", "division", "section"],
  ROLE_SECTION_CONTROL_ROOM: ["designation", "zone", "division", "section"],

  ROLE_STATION_OFFICER: [
    "designation",
    "zone",
    "division",
    "section",
    "station",
  ],

  ROLE_OEM_ADMIN: ["firm", "zone", "division"],
  ROLE_OEM_OFFICER: ["firm", "zone", "division"],
};

export default function AddUserForm({ onClose, onSuccess, editUser }: Props) {
  const [loading, setLoading] = useState(false);
  const [hrmsLoading, setHrmsLoading] = useState(false);

  // Initial Form State
  const initialFormState = {
    empId: "",
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    mobile: "",
    role: "",
    status: "Active",

    designation: "",
    zone: "",
    division: "",
    section: "",
    station: "",
    firm: "",

    remarks: "",
  };

  // Initial HRMS Locked Fields State
  const initialLockedState = {
    empId: false,
    username: false,
    fullName: false,
    email: false,
    mobile: false,
    designation: false,
    zone: false,
    division: false,
  };

  const [hrmsLockedFields, setHrmsLockedFields] = useState(initialLockedState);
  const currentUserRole = getLoggedInUserRole();
  const [form, setForm] = useState<any>(initialFormState);

  /* ================= DROPDOWN DATA ================= */

  const [roles, setRoles] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);

  const [zones, setZones] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});

  const selectedRoleName = roles.find(
    (r) => String(r.id) === String(form.role),
  )?.name;

  const isOEMRole =
    selectedRoleName === "ROLE_OEM_ADMIN" ||
    selectedRoleName === "ROLE_OEM_OFFICER";

  const isZonalRole =
    selectedRoleName === "ROLE_ZONAL_ADMIN" ||
    selectedRoleName === "ROLE_ZONAL_OFFICER" ||
    selectedRoleName === "ROLE_ZONAL_CONTROL_ROOM";

  const isDivisionalRole =
    selectedRoleName === "ROLE_DIVISIONAL_ADMIN" ||
    selectedRoleName === "ROLE_DIVISIONAL_OFFICER" ||
    selectedRoleName === "ROLE_DIVISIONAL_CONTROL_ROOM" ||
    selectedRoleName === "ROLE_SECTION_ADMIN" ||
    selectedRoleName === "ROLE_SECTION_OFFICER" ||
    selectedRoleName === "ROLE_SECTION_CONTROL_ROOM" ||
    selectedRoleName === "ROLE_STATION_OFFICER";

  const allowedFields = roleConfig[selectedRoleName] || [];

  /* ================= LOAD MASTER DATA ================= */

  useEffect(() => {
    axiosInstance.get("/role/").then((r) => setRoles(r.data.data || []));
    axiosInstance
      .get("/designation/")
      .then((r) => setDesignations(r.data.data || []));
    axiosInstance.get("/firm/").then((r) => setFirms(r.data.data || []));
    axiosInstance.get("/zone/").then((r) => setZones(r.data.data || []));
  }, []);

  /* ================= FILTER ROLES FOR RDSO ADMIN ================= */

  const filteredRoles =
    currentUserRole === "ROLE_RDSO_ADMIN"
      ? roles.filter(
          (r) =>
            r.name === "ROLE_DIVISIONAL_OFFICER" ||
            r.name === "ROLE_ZONAL_OFFICER",
        )
      : roles;

  /* ================= RESET FORM ================= */

  const handleReset = () => {
    if (editUser) {
      // If editing an existing user, restore initial edit user values
      setForm({
        empId: editUser.empCode || "",
        username: editUser.username || "",
        fullName: editUser.name || "",
        email: editUser.email || "",
        mobile: editUser.mobile || "",

        role: editUser.roles?.[0]?.id ?? "",
        status: editUser.status || "Active",

        designation: editUser.designation?.[0]?.id ?? "",
        firm: editUser.firm?.[0]?.id ?? "",

        zone: editUser.zone?.[0]?.id ?? "",
        division: editUser.division?.[0]?.id ?? "",
        section: editUser.section?.[0]?.id ?? "",
        station: editUser.station?.[0]?.id ?? "",

        password: "",
        confirmPassword: "",
      });
    } else {
      // Clear all input fields for new user creation
      setForm(initialFormState);
      setDivisions([]);
      setSections([]);
      setStations([]);
    }

    setHrmsLockedFields(initialLockedState);
    setErrors({});
  };

  /* ================= AUTO-FETCH HRMS & AUTO-FILL USERNAME ON EMP ID CHANGE ================= */

  const handleEmpIdChange = async (empIdValue: string) => {
    const trimmedId = empIdValue.trim().toUpperCase();

    // Reset locked fields prior to receiving HRMS response
    setHrmsLockedFields(initialLockedState);

    // Auto-reflect Emp ID in Username
    setForm((prev: any) => ({
      ...prev,
      empId: trimmedId,
      username: trimmedId,
    }));

    validateField("empId", trimmedId);
    validateField("username", trimmedId);

    // Fetch HRMS when ID reaches 6 characters irrespective of role
    if (trimmedId.length === 6 && !editUser) {
      setHrmsLoading(true);

      try {
        const response = await axiosInstance.post("/hrms/fetch", {
          hrms_id: trimmedId,
        });

        if (response.data?.status === 200 && response.data?.data) {
          const hrmsData = response.data.data;
          console.log("HRMS DATA:", hrmsData);

          /* FIND ZONE */
          const matchedZone = zones.find(
            (z: any) =>
              String(z.code || "").toLowerCase() ===
                String(hrmsData.zone_code || "").toLowerCase() ||
              String(z.name || "").toLowerCase() ===
                String(hrmsData.zone_code || "").toLowerCase(),
          );

          /* FIND DESIGNATION */
          const matchedDesignation = designations.find(
            (d: any) =>
              String(d.name || "").toLowerCase() ===
                String(hrmsData.designation || "").toLowerCase() ||
              String(d.code || "").toLowerCase() ===
                String(hrmsData.designation || "").toLowerCase(),
          );

          /* SET BASIC HRMS DATA */
          setForm((prev: any) => ({
            ...prev,
            empId: trimmedId,
            username: trimmedId,
            fullName: hrmsData.employee_name || prev.fullName,
            email: hrmsData.emp_email_id || prev.email,
            mobile: hrmsData.mobile_no || prev.mobile,
            designation: matchedDesignation
              ? String(matchedDesignation.id)
              : prev.designation,
            zone: matchedZone ? String(matchedZone.id) : prev.zone,
            division: prev.division,
          }));

          /* FIND DIVISION FROM rly_unit_code */
          let matchedDivision: any = null;

          if (matchedZone && hrmsData.rly_unit_code) {
            try {
              const divisionResponse = await axiosInstance.get(
                `/division/getAllDivisionByZone/${matchedZone.id}`,
              );

              const divisionList = divisionResponse.data?.data || [];
              setDivisions(divisionList);

              matchedDivision = divisionList.find(
                (d: any) =>
                  String(d.code || "").toLowerCase() ===
                    String(hrmsData.rly_unit_code || "").toLowerCase() ||
                  String(d.name || "").toLowerCase() ===
                    String(hrmsData.rly_unit_code || "").toLowerCase(),
              );

              console.log("HRMS Division Code:", hrmsData.rly_unit_code);
              console.log("Matched Division:", matchedDivision);
            } catch (divisionError) {
              console.error("Failed to load divisions:", divisionError);
            }
          }

          /* SET DIVISION */
          if (matchedDivision) {
            setForm((prev: any) => ({
              ...prev,
              division: String(matchedDivision.id),
            }));
          }

          /* LOCK HRMS FILLED FIELDS */
          setHrmsLockedFields({
            empId: true,
            username: true,
            fullName: !!hrmsData.employee_name,
            email: !!hrmsData.emp_email_id,
            mobile: !!hrmsData.mobile_no,
            designation: !!matchedDesignation,
            zone: !!matchedZone,
            division: !!matchedDivision,
          });

          /* CLEAR HRMS FIELD ERRORS */
          setErrors((prev: any) => ({
            ...prev,
            empId: "",
            username: "",
            fullName: "",
            email: "",
            mobile: "",
            designation: "",
            zone: "",
            division: "",
          }));
        }
      } catch (err) {
        console.warn("HRMS auto-fetch failed or ID not found:", err);
        setHrmsLockedFields(initialLockedState);
      } finally {
        setHrmsLoading(false);
      }
    }
  };

  /* ================= EDIT PREFILL ================= */

  useEffect(() => {
    if (!editUser) return;

    setForm({
      empId: editUser.empCode || "",
      username: editUser.username || "",
      fullName: editUser.name || "",
      email: editUser.email || "",
      mobile: editUser.mobile || "",

      role: editUser.roles?.[0]?.id ?? "",
      status: editUser.status || "Active",

      designation: editUser.designation?.[0]?.id ?? "",
      firm: editUser.firm?.[0]?.id ?? "",

      zone: editUser.zone?.[0]?.id ?? "",
      division: editUser.division?.[0]?.id ?? "",
      section: editUser.section?.[0]?.id ?? "",
      station: editUser.station?.[0]?.id ?? "",

      password: "",
      confirmPassword: "",
    });

    if (editUser.zone?.[0]?.id) {
      axiosInstance
        .get(`/division/getAllDivisionByZone/${editUser.zone[0].id}`)
        .then((r) => setDivisions(r.data.data || []));
    }

    if (editUser.division?.[0]?.id) {
      axiosInstance
        .get(`/section/getAllSectionsByDivision/${editUser.division[0].id}`)
        .then((r) => setSections(r.data.data || []));
    }

    if (editUser.section?.[0]?.id) {
      axiosInstance
        .get(`/station/getAllStationsBySection/${editUser.section[0].id}`)
        .then((r) => setStations(r.data.data || []));
    }
  }, [editUser]);

  /* ================= CASCADING ================= */

  const onZoneChange = async (zoneId: string) => {
    setForm((p: any) => ({
      ...p,
      zone: zoneId,
      division: "",
      section: "",
      station: "",
    }));
    setDivisions([]);
    setSections([]);
    setStations([]);

    if (errors.zone) {
      setErrors((prev: any) => ({ ...prev, zone: "" }));
    }

    if (!zoneId) return;
    const res = await axiosInstance.get(
      `/division/getAllDivisionByZone/${zoneId}`,
    );
    setDivisions(res.data.data || []);
  };

  const onDivisionChange = async (divisionId: string) => {
    setForm((p: any) => ({
      ...p,
      division: divisionId,
      section: "",
      station: "",
    }));
    setSections([]);
    setStations([]);

    if (errors.division) {
      setErrors((prev: any) => ({ ...prev, division: "" }));
    }

    if (!divisionId) return;

    const sec = await axiosInstance.get(
      `/section/getAllSectionsByDivision/${divisionId}`,
    );
    setSections(sec.data.data || []);

    const sta = await axiosInstance.get(
      `/station/getAllStationsByDivision/${divisionId}`,
    );
    setStations(sta.data.data || []);
  };

  /* ================= VALIDATIONS ================= */

  const validateField = (field: string, value: any) => {
    let error = "";

    if (field === "empId") {
      if (!isOEMRole) {
        if (!value.trim()) error = "Employee ID is required";
        else if (value.length > 10) error = "Max 10 characters allowed";
      }
    }

    if (field === "username") {
      if (!value.trim()) error = "Username is required";
      else if (value.length > 15) error = "Max 15 characters allowed";
    }

    if (field === "fullName") {
      if (!value.trim()) error = "Full name is required";
      else if (value.length > 50) error = "Max 50 characters allowed";
    }

    if (field === "email") {
      if (!value.trim()) error = "Email is required";
      else if (!/^\S+@\S+\.\S+$/.test(value)) error = "Invalid email format";
    }

    if (field === "mobile") {
      if (!value.trim()) error = "Mobile number required";
      else if (!/^\d{10}$/.test(value.replace(/\D/g, "")))
        error = "Mobile must be 10 digits";
    }

    if (field === "password") {
      if (editUser) {
        setErrors((prev: any) => ({ ...prev, password: "" }));
        return;
      }

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;

      if (!value) error = "Password required";
      else if (!passwordRegex.test(value))
        error = "8-20 chars with upper, lower, number & special char";
    }

    if (field === "confirmPassword") {
      if (!value) error = "Confirm password required";
      else if (value !== form.password) error = "Password mismatch";
    }

    setErrors((prev: any) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleChange = (field: string, value: any) => {
    if (field === "role") {
      const roleName = roles.find((r) => String(r.id) === String(value))?.name;
      const allowed = roleConfig[roleName] || [];

      setForm((prev: any) => ({
        ...prev,
        role: value,
        // HRMS fields should NOT be cleared
        designation: prev.designation,
        zone: prev.zone,
        division: prev.division,

        // Role-dependent fields
        section: allowed.includes("section") ? prev.section : "",
        station: allowed.includes("station") ? prev.station : "",
        firm: allowed.includes("firm") ? prev.firm : "",
      }));

      // Clear previous zone/division errors on role change
      setErrors((prev: any) => ({
        ...prev,
        role: "",
        zone: "",
        division: "",
      }));
      return;
    }

    setForm((prev: any) => ({
      ...prev,
      [field]: value,
    }));

    validateField(field, value);
  };

  const validate = () => {
    const newErrors: any = {};

    if (!isOEMRole) {
      if (!form.empId.trim()) newErrors.empId = "Employee ID is required";
      else if (form.empId.length > 10)
        newErrors.empId = "Max 10 characters allowed";
    }

    if (!form.username.trim()) newErrors.username = "Username is required";
    else if (form.username.length > 15)
      newErrors.username = "Max 15 characters allowed";

    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Invalid email format";

    if (!form.mobile.trim()) newErrors.mobile = "Mobile number is required";

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,20}$/;

    if (!editUser) {
      if (!form.password) newErrors.password = "Password required";
      else if (!passwordRegex.test(form.password))
        newErrors.password =
          "8-20 chars with uppercase, lowercase, number & special character";

      if (!form.confirmPassword)
        newErrors.confirmPassword = "Confirm password required";
      else if (form.password !== form.confirmPassword)
        newErrors.confirmPassword = "Password mismatch";
    }

    if (!form.role) newErrors.role = "Role is required";

    /* ================= CONDITIONAL ZONE & DIVISION VALIDATION ================= */

    if ((isZonalRole || isDivisionalRole) && !form.zone) {
      newErrors.zone = "Zone is required for the selected role";
    }

    if (isDivisionalRole && !form.division) {
      newErrors.division = "Division is required for the selected role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SUBMIT ================= */

  const submit = async () => {
    if (!validate()) return;

    const payload = {
      username: form.username,
      email: form.email,
      emp_code: form.empId,
      name: form.fullName,
      mobile: form.mobile,
      status: form.status,
      password: form.password,

      roles: form.role ? [{ id: normalizeId(form.role) }] : [],
      designation: form.designation
        ? { id: normalizeId(form.designation) }
        : null,

      zone: form.zone ? { id: normalizeId(form.zone) } : null,
      division: form.division ? { id: normalizeId(form.division) } : null,
      section: form.section ? { id: normalizeId(form.section) } : null,
      station: form.station ? { id: normalizeId(form.station) } : null,
      firm: form.firm ? { id: normalizeId(form.firm) } : null,
    };

    try {
      setLoading(true);
      if (editUser) {
        await axiosInstance.put(`/user/update/${editUser.id}`, payload);
      } else {
        await axiosInstance.post("/user/addUser", payload);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
        <div>
          <h2 className="text-xl font-semibold">
            {editUser ? "Edit User" : "Add New User"}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            {editUser
              ? "Update user details and permissions"
              : "Create user and assign access"}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-xl"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="px-6 py-5 max-h-[75vh] overflow-y-auto bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="relative">
            <Input
              label={isOEMRole ? "Employee ID" : "HRMS ID *"}
              value={form.empId}
              error={errors.empId}
              disabled={hrmsLockedFields.empId}
              onChange={handleEmpIdChange}
              placeholder="Enter HRMS"
            />
            {hrmsLoading && (
              <span className="absolute right-3 top-9 text-xs text-blue-600 font-medium animate-pulse">
                Fetching HRMS...
              </span>
            )}
          </div>

          <Input
            label="Username *"
            value={form.username}
            error={errors.username}
            disabled={hrmsLockedFields.username}
            onChange={(v: string) => handleChange("username", v)}
          />

          {!editUser && (
            <>
              <Input
                label="Password *"
                type="password"
                value={form.password}
                error={errors.password}
                onChange={(v: string) => handleChange("password", v)}
              />

              <Input
                label="Confirm Password *"
                type="password"
                value={form.confirmPassword}
                error={errors.confirmPassword}
                onChange={(v: string) => handleChange("confirmPassword", v)}
              />
            </>
          )}

          <Input
            label="Full Name *"
            value={form.fullName}
            error={errors.fullName}
            disabled={hrmsLockedFields.fullName}
            onChange={(v: string) => handleChange("fullName", v)}
          />

          <Input
            label="Email *"
            value={form.email}
            error={errors.email}
            disabled={hrmsLockedFields.email}
            onChange={(v: string) => handleChange("email", v)}
          />

          <Input
            label="Mobile *"
            value={form.mobile}
            error={errors.mobile}
            disabled={hrmsLockedFields.mobile}
            onChange={(v: string) => handleChange("mobile", v)}
          />

          <Select
            label="Role *"
            value={form.role}
            error={errors.role}
            options={filteredRoles}
            onChange={(v: string) => handleChange("role", v)}
          />

          <Select
            label="Designation"
            value={form.designation}
            error={errors.designation}
            options={designations}
            disabled={hrmsLockedFields.designation}
            onChange={(v: string) => handleChange("designation", v)}
          />

          <Select
            label="Status *"
            value={form.status}
            options={["Active", "Inactive"]}
            onChange={(v: any) => setForm({ ...form, status: v })}
          />

          {allowedFields.includes("firm") && (
            <Select
              label="Firm"
              value={form.firm}
              options={firms}
              onChange={(v: string) => handleChange("firm", v)}
            />
          )}

          <Select
            label={isZonalRole || isDivisionalRole ? "Zone *" : "Zone"}
            value={form.zone}
            error={errors.zone}
            options={zones}
            disabled={hrmsLockedFields.zone}
            onChange={onZoneChange}
          />

          <Select
            label={isDivisionalRole ? "Division *" : "Division"}
            value={form.division}
            error={errors.division}
            options={divisions}
            disabled={hrmsLockedFields.division}
            onChange={onDivisionChange}
          />

          {allowedFields.includes("section") && (
            <Select
              label="Section"
              value={form.section}
              options={sections}
              onChange={(v: string) => handleChange("section", v)}
            />
          )}

          {allowedFields.includes("station") && (
            <Select
              label="Station"
              value={form.station}
              options={stations}
              onChange={(v: string) => handleChange("station", v)}
            />
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t bg-white">
        <button
          type="button"
          onClick={handleReset}
          className="px-5 h-11 rounded-xl border border-amber-500 text-amber-600 hover:bg-amber-50 transition font-medium"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-5 h-11 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="px-6 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:shadow-lg transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

/* ================= CONTROL COMPONENTS ================= */

function Input({
  label,
  value,
  onChange,
  type = "text",
  error,
  placeholder,
  disabled = false,
}: any) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label.replace("*", "")}
        {label.includes("*") && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={isPasswordType ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 rounded-xl border border-gray-300 px-4 text-sm shadow-sm transition-all ${
            disabled
              ? "bg-gray-100 text-gray-600 cursor-not-allowed"
              : "bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          } ${isPasswordType ? "pr-10" : ""} ${error ? "border-red-500" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? (
              /* Eye Slash Icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.858A9.954 9.954 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.592-4.592a3 3 0 11-4.243-4.243m4.242 4.242L3 3l18 18"
                />
              </svg>
            ) : (
              /* Eye Icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Select({
  label,
  value,
  options = [],
  onChange,
  error,
  labelKey = "name",
  valueKey = "id",
  disabled = false,
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label.replace("*", "")}
        {label.includes("*") && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        disabled={disabled}
        className={`w-full h-11 rounded-xl border border-gray-300 px-4 text-sm shadow-sm transition-all ${
          disabled
            ? "bg-gray-100 text-gray-600 cursor-not-allowed"
            : "bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        } ${error ? "border-red-500" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>

        {options.map((item: any, index: number) => {
          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean"
          ) {
            return (
              <option key={index} value={String(item)}>
                {String(item)}
              </option>
            );
          }

          const optionValue = item?.[valueKey] ?? "";
          const optionLabel =
            item?.[labelKey] ?? item?.name ?? item?.code ?? "Unknown";

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
