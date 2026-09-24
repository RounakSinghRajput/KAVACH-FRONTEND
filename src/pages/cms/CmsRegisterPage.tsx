import React, { useEffect, useMemo, useState } from "react";
import { axiosInstance } from "../../services/axios";
import { Filter, Eye, X, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { transformation } from "leaflet";
import TablePagination from "../../components/common/TablePaginatio";
import * as XLSX from "xlsx";
import { createPortal } from "react-dom";

/* ================= STATUS COLORS ================= */

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700 border-green-300",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-300",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
  REJECTED: "bg-red-100 text-red-700 border-red-300",
};

/* ================= COLUMN ORDER ================= */

const COLUMN_ORDER = [
  "abnormalityNo",
  "abnormalityType",
  "abnormalityTime",
  "crewId",
  "trainNo",
  "locoNo",
  "divisionCode",
  "section",
  "fromStation",
  "toStation",
  "kmFrom",
  "kmTo",
  "status",
];

const COLUMN_KEYS = [
  "abnormalityNo",
  "abnormalityType",
  "abnormalityTime",
  "ticketNo", // 👈 ADD
  "assignTo", // 👈 ADD
  "firm",
  "crewId",
  "trainNo",
  "locoNo",
  "divisionCode",
  "section",
  "fromStation",
  "toStation",
  "kmFrom",
  "kmTo",
  "status",
];

/* ================= AUTO HEADER FORMAT ================= */

const formatHeader = (key: string) => {
  return (
    key
      // split camelCase
      .replace(/([A-Z])/g, " $1")
      // uppercase first letter
      .replace(/^./, (str) => str.toUpperCase())
      // special fixes
      .replace("Id", "ID")
      .replace("Km", "KM")
      .trim()
  );
};

export default function CmsTable() {
  const [data, setData] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  const [trackingRow, setTrackingRow] = useState<any>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [filters, setFilters] = useState({
    abnormalityType: "",
    status: "",
    divisionCode: "",
    trainNo: "",
  });
  // Assign Modal Control
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRow, setAssignRow] = useState<any>(null);
  // Dropdown Data
  const [roleList, setRoleList] = useState<any[]>([]);
  const [firmList, setFirmList] = useState<any[]>([]);

  // Assign Form Data
  const [assignData, setAssignData] = useState({
    ticketNo: "",
    role: "",
    firmId: "",
    targetDate: "",
    assignmentRemarks: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Master dropdown data
  const [zones, setZones] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [oemList, setOemList] = useState<any[]>([]);
  const [rootCauseList, setRootCauseList] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    abnormalityNo: "",
    crewId: "",
    supervisorId: "",
    abnormalityType: "",
    description: "",
    status: "OPEN",
    remarks: "",
    fromStation: "",
    toStation: "",
    section: "",
    subhead: "",
    divisionCode: "",
    kmFrom: "",
    kmTo: "",
    locoNo: "",
    trainNo: "",
    signOnNo: "",
    filledBy: "",
    imageAttached: "N",
    abnormalityTime: "",
    initialClosingRemark: "",
    finalClosingRemark: "",
    oemRemark: "",
    analysis: "",
    possibleRootCause: "",
    ticketNo: "",
    assignTo: "",
    ltcasStcas: "",
    initialClosingDateTime: "",
    finalClosingDateTime: "",
    closureDateTime: "",
  });
  const formFields = [
    { name: "abnormalityNo", type: "text" },
    { name: "crewId", type: "text" },
    { name: "supervisorId", type: "text" },
    { name: "abnormalityType", type: "text" },
    { name: "description", type: "text" },

    { name: "status", type: "dropdown" },

    { name: "remarks", type: "text" },
    { name: "fromStation", type: "stationFrom" },
    { name: "toStation", type: "stationTo" },
    { name: "section", type: "section" },
    { name: "subhead", type: "text" },

    { name: "divisionCode", type: "division" },

    { name: "kmFrom", type: "text" },
    { name: "kmTo", type: "text" },
    { name: "locoNo", type: "text" },
    { name: "trainNo", type: "text" },
    { name: "signOnNo", type: "text" },
    { name: "filledBy", type: "text" },

    { name: "imageAttached", type: "text" },

    { name: "abnormalityTime", type: "datetime" },

    { name: "initialClosingRemark", type: "text" },
    { name: "finalClosingRemark", type: "text" },

    { name: "oemRemark", type: "oem" },

    { name: "analysis", type: "text" },

    { name: "possibleRootCause", type: "rootCause" },

    { name: "ticketNo", type: "text" },
    { name: "assignTo", type: "text" },
    { name: "ltcasStcas", type: "text" },

    { name: "initialClosingDateTime", type: "datetime" },
    { name: "finalClosingDateTime", type: "datetime" },
    { name: "closureDateTime", type: "datetime" },
  ];
  /* ===== Pagination ===== */

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    const res = await axiosInstance.get("/cms/incidents");
    setData(Array.isArray(res.data) ? res.data : [res.data]);
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    axiosInstance.get("/zone/").then((res) => setZones(res.data.data));
    axiosInstance.get("/firm/").then((res) => setOemList(res.data.data));
    axiosInstance
      .get("/failureCategory/")
      .then((res) => setRootCauseList(res.data.data));
  }, []);

  useEffect(() => {
    axiosInstance.get("/role/").then((res) => {
      setRoleList(res.data.data || []);
    });

    axiosInstance.get("/firm/").then((res) => {
      setFirmList(res.data.data || []);
    });
  }, []);

  const fetchAuditTrail = async (ticketNo: string) => {
    try {
      setLoadingAudit(true);

      const res = await axiosInstance.get(`/cms/audit?ticketNo=${ticketNo}`);

      setAuditData(res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingAudit(false);
    }
  };

  /* ================= FILTER ================= */

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      return (
        (!filters.abnormalityType ||
          row.abnormalityType?.includes(filters.abnormalityType)) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.divisionCode ||
          row.divisionCode?.includes(filters.divisionCode))
      );
    });
  }, [data, filters]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  /* ================= EXPORT ================= */

  const exportXLSX = () => {
    if (!filteredData.length) return;

    // 1️⃣ Use FULL API data (same as info modal)
    const exportData = filteredData.map((row) => {
      const newRow: any = {};

      Object.entries(row).forEach(([key, value]) => {
        newRow[formatHeader(key)] = value ?? "";
      });

      return newRow;
    });

    // 2️⃣ Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 3️⃣ Create workbook
    const workbook = XLSX.utils.book_new();

    // 4️⃣ Add sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, "CMS Data");

    // 5️⃣ Download Excel
    XLSX.writeFile(workbook, "cms-data.xlsx");
  };
  /* ================= UI ================= */
  const handleDelete = async (id: number) => {
    await axiosInstance.delete(`/cms/incidents/${id}`);
    fetchData();
  };
  const formatDate = (value: string) => {
    if (!value) return null;

    const date = new Date(value);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };
  const handleAssignSubmit = async () => {
    try {
      const payload = {
        ticketNo: assignData.ticketNo,
        role: assignData.role,
        firmId: Number(assignData.firmId),
        targetDate: assignData.targetDate,
        assignmentRemarks: assignData.assignmentRemarks,
      };
      if (
        ["ROLE_OEM", "ROLE_OEM_ADMIN"].includes(assignData.role) &&
        !assignData.firmId
      ) {
        alert("Please select a firm ❗");
        return;
      }

      console.log("FINAL ASSIGN PAYLOAD:", payload);

      await axiosInstance.post("/cms/assign", payload);

      alert("Assigned Successfully ✅");

      setShowAssignModal(false);
    } catch (error: any) {
      console.log("Assign Error:", error?.response?.data);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        abnormalityNo: formData.abnormalityNo,
        crewId: formData.crewId,
        supervisorId: formData.supervisorId,
        abnormalityType: formData.abnormalityType,
        description: formData.description,
        status: formData.status,
        remarks: formData.remarks,
        fromStation: formData.fromStation,
        toStation: formData.toStation,
        section: formData.section,
        subhead: formData.subhead,
        divisionCode: formData.divisionCode,
        kmFrom: formData.kmFrom,
        kmTo: formData.kmTo,
        locoNo: formData.locoNo,
        trainNo: formData.trainNo,
        signOnNo: formData.signOnNo,
        filledBy: formData.filledBy,
        imageAttached: formData.imageAttached,

        abnormalityTime: formatDate(formData.abnormalityTime),

        initialClosingRemark: formData.initialClosingRemark || null,
        finalClosingRemark: formData.finalClosingRemark || null,
        oemRemark: formData.oemRemark || null,
        analysis: formData.analysis || null,
        possibleRootCause: formData.possibleRootCause || null,
        ticketNo: formData.ticketNo,
        assignTo: formData.assignTo || null,
        ltcasStcas: formData.ltcasStcas,

        initialClosingDateTime: formData.initialClosingDateTime || null,
        finalClosingDateTime: formData.finalClosingDateTime || null,
        closureDateTime: formData.closureDateTime || null,
      };

      console.log("FINAL PAYLOAD:", payload);

      if (isEditMode) {
        await axiosInstance.put(`/cms/incidents/${formData.id}`, payload);
      } else {
        await axiosInstance.post("/cms/incidents", payload);
      }

      fetchData();
      setShowForm(false);
    } catch (error: any) {
      console.log("FULL ERROR:", error);
      console.log("SERVER RESPONSE:", error?.response?.data);
    }
  };
  const handleZoneChange = async (zoneId: number) => {
    setFormData({
      ...formData,
      zone: { id: zoneId },
      divisionCode: "",
    });

    const res = await axiosInstance.get(
      `/division/getAllDivisionByZone/${zoneId}`,
    );

    setDivisions(res.data.data || []);
  };
  const handleDivisionChange = async (divisionId: number) => {
    setFormData({
      ...formData,
      divisionCode: divisionId,
      fromStation: "",
      toStation: "",
      section: "",
    });

    const stationRes = await axiosInstance.get(
      `/station/getAllStationsByDivision/${divisionId}`,
    );

    const sectionRes = await axiosInstance.get(
      `/section/getAllSectionsByDivision/${divisionId}`,
    );

    setStations(stationRes.data.data || []);
    setSections(sectionRes.data.data || []);
  };
  const inputClass =
    "w-full h-[42px] border border-gray-300 rounded-lg px-3 text-sm bg-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400";

  const getLabel = (name: string) =>
    name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  const Detail = ({ label, value }: any) => {
    if (!value) return null;

    return (
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
          {label}
        </span>
        <span className="text-sm text-gray-900 mt-1 break-words">{value}</span>
      </div>
    );
  };
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  return (
    <div className="p-4 relative">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">CMS Register</h1>
      {/* ===== TOP BAR ===== */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-3">
          {/* <button
            onClick={() => {
              setFormData({});
              setIsEditMode(false);
              setShowForm(true);
            }}
            title="Add CMS"
            className="
    w-11 h-11
    flex items-center justify-center
    rounded-full
    bg-orange-500
    text-white
    shadow-lg
    hover:bg-orange-600
    hover:scale-105
    active:scale-95
    transition-all duration-200
  "
          >
            <Plus size={22} />
          </button> */}
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg"
          >
            <Filter size={18} />
            Filters
          </button>
          {/* Export */}
          <button
            onClick={exportXLSX}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Export
          </button>
        </div>
      </div>

      {/* ================= FILTER PANEL (OLD STYLE) ================= */}

      {showFilters && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50 grid grid-cols-4 gap-4">
          <input
            placeholder="Abnormality Type"
            value={filters.abnormalityType}
            onChange={(e) =>
              setFilters({ ...filters, abnormalityType: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            placeholder="Division Code"
            value={filters.divisionCode}
            onChange={(e) =>
              setFilters({ ...filters, divisionCode: e.target.value })
            }
            className="border p-2 rounded"
          />

          <input
            placeholder="Train No"
            value={filters.trainNo}
            onChange={(e) =>
              setFilters({ ...filters, trainNo: e.target.value })
            }
            className="border p-2 rounded"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">Status</option>
            <option>OPEN</option>
            <option>CLOSED</option>
            <option>PENDING</option>
            <option>REJECTED</option>
          </select>
        </div>
      )}

      {/* ================= TABLE ================= */}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full">
          {/* HEADER */}
          <thead className="bg-blue-600 text-white">
            <tr>
              {COLUMN_KEYS.map((key) => (
                <th
                  key={key}
                  className="p-3 text-left whitespace-nowrap border border-gray-200"
                >
                  {formatHeader(key)}
                </th>
              ))}

              <th className="p-3 sticky right-0 bg-blue-600 whitespace-nowrap border border-gray-200">
                Action
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                className={`hover:bg-blue-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {COLUMN_KEYS.map((key) => (
                  <td
                    key={key}
                    className="p-3 whitespace-nowrap border border-gray-200"
                  >
                    {key === "status" ? (
                      <span
                        className={`px-2 py-1 text-xs border rounded ${
                          STATUS_COLORS[row.status] || ""
                        }`}
                      >
                        {row.status}
                      </span>
                    ) : key === "firm" ? (
                      row.firm?.name || "-"
                    ) : (
                      row[key] || "-"
                    )}
                  </td>
                ))}

                {/* INFO BUTTON */}
                <td className="p-3 whitespace-nowrap sticky right-0 bg-white flex gap-3 items-center border border-gray-200">
                  {/* Assign */}
                  <button
                    onClick={() => {
                      setAssignRow(row);
                      setAssignData({
                        ticketNo: row.ticketNo || row.abnormalityNo,
                        role: "",
                        firmId: "",
                        targetDate: "",
                        assignmentRemarks: "",
                      });
                      setShowAssignModal(true);
                    }}
                    className="text-purple-600 hover:text-purple-800 transition"
                  >
                    <UserPlus size={18} />
                  </button>

                  {/* View */}
                  <button
                    onClick={() => setSelectedRow(row)}
                    className="text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setTrackingRow(row);
                      setShowTrackingModal(true);
                      fetchAuditTrail(row.ticketNo);
                    }}
                    className="text-orange-500 hover:text-orange-700 transition"
                    title="Track Ticket"
                  >
                    {/* Route / Tracking Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 6h11M9 12h8M9 18h11M4 6h.01M4 12h.01M4 18h.01"
                      />
                    </svg>
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setFormData(row);
                      setIsEditMode(true);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    {/* <Pencil size={18} /> */}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    {/* <Trash2 size={18} /> */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}

      <div
        className="border-t border-gray-200
             px-4 py-3 flex justify-end"
      >
        <TablePagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={filteredData.length}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setPage(0);
          }}
        />
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          {/* ===== Overlay ===== */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedRow(null)}
          />

          {/* ===== BIG MODAL ===== */}
          <div className="relative w-[90%] max-w-[1200px] h-[90vh] bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* ===== HEADER ===== */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-8 py-5 flex justify-between items-center shadow-lg">
              <div>
                <h2 className="text-xl font-bold tracking-wide">
                  Abnormality Details
                </h2>
                <p className="text-sm opacity-80 mt-1">
                  {selectedRow.abnormalityNo}
                </p>
              </div>

              <button
                onClick={() => setSelectedRow(null)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
              >
                Close ✕
              </button>
            </div>

            {/* ===== BODY ===== */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* ===== SUMMARY CARD ===== */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-blue-700">
                    Incident Summary
                  </h3>

                  <span
                    className={`px-4 py-1 text-sm font-semibold rounded-full border ${
                      STATUS_COLORS[selectedRow.status] || ""
                    }`}
                  >
                    {selectedRow.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <Detail label="Crew ID" value={selectedRow.crewId} />
                  <Detail
                    label="Supervisor ID"
                    value={selectedRow.supervisorId}
                  />
                  <Detail label="Train No" value={selectedRow.trainNo} />
                  <Detail label="Loco No" value={selectedRow.locoNo} />
                  <Detail label="Division" value={selectedRow.divisionCode} />
                  <Detail label="Section" value={selectedRow.section} />
                  <Detail
                    label="From Station"
                    value={selectedRow.fromStation}
                  />
                  <Detail label="To Station" value={selectedRow.toStation} />
                  <Detail label="KM From" value={selectedRow.kmFrom} />
                  <Detail label="KM To" value={selectedRow.kmTo} />
                  <Detail
                    label="Abnormality Time"
                    value={formatDate(selectedRow.abnormalityTime)}
                  />
                  <Detail label="Subhead" value={selectedRow.subhead} />
                </div>
              </div>

              {/* ===== DESCRIPTION ===== */}
              {selectedRow.description && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
                  <h3 className="text-lg font-semibold text-indigo-700 mb-3">
                    Description
                  </h3>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {selectedRow.description}
                  </p>
                </div>
              )}

              {/* ===== TECHNICAL DETAILS ===== */}
              {(selectedRow.analysis ||
                selectedRow.possibleRootCause ||
                selectedRow.oemRemark) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-purple-700 mb-6">
                    Technical Details
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    <Detail label="OEM Remarks" value={selectedRow.oemRemark} />
                    <Detail
                      label="Possible Root Cause"
                      value={selectedRow.possibleRootCause}
                    />
                    <Detail label="Analysis" value={selectedRow.analysis} />
                    <Detail label="Ticket No" value={selectedRow.ticketNo} />
                  </div>
                </div>
              )}
              {/* ===== TICKET & ASSIGNMENT ===== */}
              {(selectedRow.ticketNo ||
                selectedRow.assignTo ||
                selectedRow.ltcasStcas) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
                  <h3 className="text-lg font-semibold text-orange-700 mb-6">
                    Ticket & Assignment
                  </h3>

                  <div className="grid grid-cols-3 gap-6">
                    <Detail
                      label="Ticket Number"
                      value={selectedRow.ticketNo}
                    />
                    <Detail label="Assigned To" value={selectedRow.assignTo} />
                    <Detail label="Firm" value={selectedRow.firm?.name} />
                    <Detail
                      label="Target Date"
                      value={formatDate(selectedRow.targetDate)}
                    />
                    <Detail
                      label="Assignment Remarks"
                      value={selectedRow.assignmentRemarks}
                    />
                  </div>
                </div>
              )}

              {/* ===== CLOSURE ===== */}
              {(selectedRow.initialClosingRemark ||
                selectedRow.finalClosingRemark ||
                selectedRow.closureDateTime) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-green-700 mb-6">
                    Closure Details
                  </h3>

                  <div className="grid grid-cols-3 gap-6">
                    <Detail
                      label="Initial Closing"
                      value={selectedRow.initialClosingRemark}
                    />
                    <Detail
                      label="Final Closing"
                      value={selectedRow.finalClosingRemark}
                    />
                    <Detail
                      label="Closure Date"
                      value={formatDate(selectedRow.closureDateTime)}
                    />
                    <Detail label="Assigned To" value={selectedRow.assignTo} />
                  </div>
                </div>
              )}

              {/* ===== EXTRA INFO ===== */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-6">
                  Additional Info
                </h3>

                <div className="grid grid-cols-4 gap-6">
                  <Detail label="Sign On No" value={selectedRow.signOnNo} />
                  <Detail label="Filled By" value={selectedRow.filledBy} />
                  <Detail
                    label="Image Attached"
                    value={selectedRow.imageAttached}
                  />
                  <Detail
                    label="LTCAS / STCAS"
                    value={selectedRow.ltcasStcas}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* OVERLAY */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />

            {/* MODAL */}
            <div className="relative bg-white w-[900px] max-h-[85vh] overflow-auto p-8 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                {isEditMode ? "Edit CMS" : "Add CMS"}
              </h2>

              {/* FORM GRID */}
              <div className="grid grid-cols-3 gap-x-6 gap-y-5 items-start">
                {/* ===== CASCADE DROPDOWNS ===== */}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide">
                    Zone
                  </label>
                  <select
                    value={formData.zone?.id || ""}
                    onChange={(e) => handleZoneChange(Number(e.target.value))}
                    className={inputClass}
                  >
                    <option value="">Select Zone</option>
                    {zones.map((z: any) => (
                      <option key={z.id} value={z.id}>
                        {z.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide">
                    Division
                  </label>
                  <select
                    value={formData.divisionCode || ""}
                    onChange={(e) =>
                      handleDivisionChange(Number(e.target.value))
                    }
                    className={inputClass}
                  >
                    <option value="">Select Division</option>
                    {divisions.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide">
                    Section
                  </label>
                  <select
                    value={formData.section || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Select Section</option>
                    {sections.map((s: any) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide">
                    From Station
                  </label>
                  <select
                    value={formData.fromStation || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fromStation: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Select</option>
                    {stations.map((s: any) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 tracking-wide">
                    To Station
                  </label>
                  <select
                    value={formData.toStation || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, toStation: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Select</option>
                    {stations.map((s: any) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ===== AUTO FIELDS ===== */}

                {formFields.map((field) => {
                  if (
                    [
                      "zone",
                      "divisionCode",
                      "section",
                      "fromStation",
                      "toStation",
                    ].includes(field.name)
                  )
                    return null;

                  const label = getLabel(field.name);

                  let element;

                  if (field.type === "dropdown") {
                    element = (
                      <select
                        value={formData[field.name]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    );
                  } else if (field.type === "oem") {
                    element = (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option>Select OEM</option>
                        {oemList.map((o: any) => (
                          <option key={o.id} value={o.name}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    );
                  } else if (field.type === "rootCause") {
                    element = (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        className={inputClass}
                      >
                        <option>Select Root Cause</option>
                        {rootCauseList.map((r: any) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    );
                  } else if (field.type === "datetime") {
                    element = (
                      <input
                        type="datetime-local"
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    );
                  } else {
                    element = (
                      <input
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    );
                  }

                  return (
                    <div key={field.name} className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-500 tracking-wide">
                        {label}
                      </label>
                      {element}
                    </div>
                  );
                })}
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 h-[42px] border rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  className="px-5 h-[42px] bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {showTrackingModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px]"
              onClick={() => setShowTrackingModal(false)}
            />

            {/* Modal Shell */}
            <div className="relative bg-white w-full max-w-[850px] h-[80vh] rounded-xl shadow-xl overflow-hidden flex flex-col border border-orange-100">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-white via-blue-50 to-blue-100 border-b border-orange-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ticket Tracking
                  </h2>
                  <p className="text-xs font-mono text-gray-500">
                    ID: {trackingRow?.ticketNo}
                  </p>
                </div>

                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="p-1.5 hover:bg-orange-100 rounded-full transition-colors text-gray-400 hover:text-orange-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {/* Status Card */}
                <div className="border border-orange-100 rounded-lg p-4 mb-8 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-gradient-to-r from-white to-orange-50">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Current State
                    </p>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${
                        trackingRow?.status === "OPEN"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : trackingRow?.status === "IN_PROGRESS"
                            ? "bg-orange-50 text-orange-700 border-orange-100"
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          trackingRow?.status === "OPEN"
                            ? "bg-blue-500"
                            : trackingRow?.status === "IN_PROGRESS"
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      {trackingRow?.status}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Updated
                    </p>
                    <p className="text-sm font-semibold text-orange-600">
                      {auditData.length} times
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border border-orange-100 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="px-5 py-3 border-b border-orange-100 bg-orange-50">
                    <h3 className="text-sm font-semibold text-gray-900">
                      History Log
                    </h3>
                  </div>

                  {loadingAudit ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                    </div>
                  ) : auditData.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic text-sm">
                      No activity recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-orange-50">
                      {auditData.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative flex gap-4 p-5 hover:bg-orange-50/40 transition"
                        >
                          {/* Timeline Column */}
                          <div className="relative flex flex-col items-center w-10">
                            {/* Connecting Line */}
                            {index !== auditData.length - 1 && (
                              <div className="absolute top-8 left-1/2 -translate-x-1/2 h-[calc(100%+32px)] w-[2px] bg-orange-200"></div>
                            )}

                            {/* Circle */}
                            <div
                              className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center ${
                                index === 0
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-orange-50 text-orange-500 border-orange-200"
                              }`}
                            >
                              {index === 0 ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2.5"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.actionBy}
                                </p>

                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {item.role}
                                </p>
                              </div>

                              <time className="text-xs text-gray-400 font-medium">
                                {formatDate(item.actionTime)}
                              </time>
                            </div>

                            {/* Update Box */}
                            <div className="text-sm text-gray-700 bg-gradient-to-r from-white to-orange-50 p-4 rounded-lg border border-orange-100">
                              <p className="mb-2">
                                Updated status from{" "}
                                <span className="font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">
                                  {item.oldStatus}
                                </span>{" "}
                                to{" "}
                                <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs">
                                  {item.newStatus}
                                </span>
                              </p>

                              <p className="text-gray-600 italic">
                                "{item.remarks || "No reason specified"}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {showAssignModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAssignModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white w-[500px] p-8 rounded-2xl shadow-xl border border-gray-200">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Assign Ticket
              </h2>

              <div className="grid gap-4">
                {/* Ticket No */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Ticket No
                  </label>
                  <input
                    value={assignData.ticketNo}
                    disabled
                    className="w-full h-[42px] border rounded-lg px-3 bg-gray-100"
                  />
                </div>

                {/* Role Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Role
                  </label>
                  <select
                    value={assignData.role}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        role: e.target.value,
                        firmId: "", // ✅ reset firm when role changes
                      })
                    }
                    className="w-full h-[42px] border rounded-lg px-3"
                  >
                    <option value="">Select Role</option>
                    {roleList.map((role: any) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Firm Dropdown */}

                {["ROLE_OEM_OFFICER", "ROLE_OEM_ADMIN"].includes(
                  assignData.role,
                ) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500">
                      Firm
                    </label>
                    <select
                      value={assignData.firmId}
                      onChange={(e) =>
                        setAssignData({ ...assignData, firmId: e.target.value })
                      }
                      className="w-full h-[42px] border rounded-lg px-3"
                    >
                      <option value="">Select Firm</option>
                      {firmList.map((firm: any) => (
                        <option key={firm.id} value={firm.id}>
                          {firm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Target Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Target Date
                  </label>
                  <input
                    type="datetime-local"
                    value={assignData.targetDate}
                    min={getMinDateTime()}
                    onClick={(e) => {
                      // 🔥 force open picker
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    onChange={(e) => {
                      setAssignData({
                        ...assignData,
                        targetDate: e.target.value,
                      });

                      // 🔥 blur = force close after selection
                      setTimeout(() => {
                        (e.target as HTMLInputElement).blur();
                      }, 100);
                    }}
                    className="w-full h-[42px] border rounded-lg px-3 cursor-pointer"
                  />
                </div>

                {/* Remarks */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500">
                    Assignment Remarks
                  </label>
                  <textarea
                    value={assignData.assignmentRemarks}
                    onChange={(e) =>
                      setAssignData({
                        ...assignData,
                        assignmentRemarks: e.target.value,
                      })
                    }
                    className="border rounded-lg p-3 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={handleAssignSubmit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
