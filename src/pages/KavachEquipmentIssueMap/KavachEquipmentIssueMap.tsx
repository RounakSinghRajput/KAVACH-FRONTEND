import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import KavachEquipmentIssueMapTable, {
  KavachEquipmentIssueMap as IssueMap,
  Equipment,
} from "../../components/KavachEquipmentIssueMap/KavachEquipmentIssueMapTable";

import { axiosInstance } from "../../services/axios";

const KavachEquipmentIssueMap: React.FC =
  () => {

  // =====================================================
  // DATA STATE
  // =====================================================

  const [data, setData] =
    useState<IssueMap[]>([]);

  // =====================================================
  // EQUIPMENT MASTER
  // Used only for Equipment dropdown
  // =====================================================

  const [equipmentList, setEquipmentList] =
    useState<Equipment[]>([]);

  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] =
    useState("");

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // MODAL
  // =====================================================

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editData, setEditData] =
    useState<IssueMap | null>(null);

  // =====================================================
  // FORM
  // =====================================================

  const [equipmentId, setEquipmentId] =
    useState("");

  const [issueId, setIssueId] =
    useState("");

  const [faultName, setFaultName] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [finalCode, setFinalCode] =
    useState("");

  // =====================================================
  // ERROR
  // =====================================================

  const [error, setError] =
    useState("");

  // =====================================================
  // PAGINATION
  // =====================================================

  const [page, setPage] =
    useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  // =====================================================
  // GET EQUIPMENT ID
  // =====================================================

  const getEquipmentId = (
    item: IssueMap
  ): string => {

    /*
     * Direct equipmentId
     */

    if (
      item.equipmentId !== undefined &&
      item.equipmentId !== null
    ) {
      return String(
        item.equipmentId
      );
    }

    /*
     * Joined equipment object
     */

    if (
      item.equipment?.id !== undefined &&
      item.equipment?.id !== null
    ) {
      return String(
        item.equipment.id
      );
    }

    return "";
  };

  // =====================================================
  // GET ISSUE ID
  // =====================================================

  const getIssueId = (
    item: IssueMap
  ): string => {

    /*
     * Direct issueId
     */

    if (
      item.issueId !== undefined &&
      item.issueId !== null
    ) {
      return String(
        item.issueId
      );
    }

    /*
     * Joined issue object
     */

    if (
      item.issue?.id !== undefined &&
      item.issue?.id !== null
    ) {
      return String(
        item.issue.id
      );
    }

    return "";
  };

  // =====================================================
  // GET ALL ISSUE MAP DATA
  // =====================================================

  const fetchIssueMaps =
    async () => {

      try {

        const response =
          await axiosInstance.get(
            "/kavachEquipmentIssueMap/getAllKavachEquipmentIssueMap"
          );

        console.log(
          "Equipment Issue Map Response:",
          response.data
        );

        setData(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );

      } catch (err: any) {

        console.error(
          "Error fetching equipment issue maps:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load equipment issue mapping"
        );
      }
    };

  // =====================================================
  // GET EQUIPMENT MASTER
  // =====================================================

  const fetchEquipment =
    async () => {

      try {

        const response =
          await axiosInstance.get(
            "/kavachEquipmentMaster/getAllkavachEquipment"
          );

        console.log(
          "Equipment Master Response:",
          response.data
        );

        setEquipmentList(
          Array.isArray(
            response.data
          )
            ? response.data
            : []
        );

      } catch (err: any) {

        console.error(
          "Error fetching equipment:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load equipment master"
        );
      }
    };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    const loadData =
      async () => {

        try {

          setLoading(true);

          setError("");

          /*
           * Only these two APIs are called.
           *
           * There is NO Issue Master API.
           */

          await Promise.all([
            fetchIssueMaps(),
            fetchEquipment(),
          ]);

        } finally {

          setLoading(false);
        }
      };

    loadData();

  }, []);

  // =====================================================
  // FILTERED DATA
  // =====================================================

  const filteredData =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();

      // -------------------------------------------------
      // NO SEARCH
      // -------------------------------------------------

      if (!value) {
        return data;
      }

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      return data.filter(
        (item) => {

          const id =
            String(
              item.id ?? ""
            ).toLowerCase();

          const equipment =
            getEquipmentId(
              item
            ).toLowerCase();

          const issue =
            getIssueId(
              item
            ).toLowerCase();

          const fault =
            item.faultName
              ?.toLowerCase() ||
            "";

          const detail =
            item.details
              ?.toLowerCase() ||
            "";

          const code =
            item.finalCode
              ?.toLowerCase() ||
            "";

          return (
            id.includes(value) ||
            equipment.includes(value) ||
            issue.includes(value) ||
            fault.includes(value) ||
            detail.includes(value) ||
            code.includes(value)
          );
        }
      );

    }, [data, search]);

  // =====================================================
  // RESET PAGE WHEN SEARCH CHANGES
  // =====================================================

  useEffect(() => {

    setPage(0);

  }, [search]);

  // =====================================================
  // TOTAL PAGES
  // =====================================================

  const totalPages =
    Math.ceil(
      filteredData.length /
      rowsPerPage
    );

  // =====================================================
  // PAGINATED DATA
  // =====================================================

  const paginatedData =
    useMemo(() => {

      const startIndex =
        page *
        rowsPerPage;

      return filteredData.slice(
        startIndex,
        startIndex +
          rowsPerPage
      );

    }, [
      filteredData,
      page,
      rowsPerPage,
    ]);

  // =====================================================
  // SAFETY:
  // IF FILTERED DATA BECOMES SMALLER
  // =====================================================

  useEffect(() => {

    if (
      totalPages > 0 &&
      page >= totalPages
    ) {

      setPage(
        totalPages - 1
      );
    }

    if (
      totalPages === 0 &&
      page !== 0
    ) {

      setPage(0);
    }

  }, [
    totalPages,
    page,
  ]);

  // =====================================================
  // ADD
  // =====================================================

  const handleAdd =
    () => {

      setEditData(null);

      setEquipmentId("");

      setIssueId("");

      setFaultName("");

      setDetails("");

      setFinalCode("");

      setError("");

      setModalOpen(true);
    };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit =
    (item: IssueMap) => {

      setEditData(item);

      // -------------------------------------------------
      // EQUIPMENT ID
      // -------------------------------------------------

      setEquipmentId(
        getEquipmentId(item)
      );

      // -------------------------------------------------
      // ISSUE ID
      // -------------------------------------------------

      setIssueId(
        getIssueId(item)
      );

      // -------------------------------------------------
      // FAULT NAME
      // -------------------------------------------------

      setFaultName(
        item.faultName || ""
      );

      // -------------------------------------------------
      // DETAILS
      // -------------------------------------------------

      setDetails(
        item.details || ""
      );

      // -------------------------------------------------
      // FINAL CODE
      // -------------------------------------------------

      setFinalCode(
        item.finalCode || ""
      );

      setError("");

      setModalOpen(true);
    };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose =
    () => {

      setModalOpen(false);

      setEditData(null);

      setEquipmentId("");

      setIssueId("");

      setFaultName("");

      setDetails("");

      setFinalCode("");

      setError("");
    };

  // =====================================================
  // SAVE / UPDATE
  // =====================================================

  const handleSubmit =
    async () => {

      // =================================================
      // EQUIPMENT ID
      // =================================================

      if (
        !equipmentId.trim()
      ) {

        setError(
          "Please select an equipment"
        );

        return;
      }

      const numericEquipmentId =
        Number(
          equipmentId
        );

      if (
        !Number.isInteger(
          numericEquipmentId
        ) ||
        numericEquipmentId <= 0
      ) {

        setError(
          "Please select a valid equipment"
        );

        return;
      }

      // =================================================
      // ISSUE ID
      // =================================================

      let numericIssueId:
        number | null = null;

      /*
       * ISSUE_ID is nullable in Oracle.
       *
       * Therefore empty value is allowed.
       */

      if (
        issueId.trim()
      ) {

        numericIssueId =
          Number(
            issueId
          );

        if (
          !Number.isInteger(
            numericIssueId
          ) ||
          numericIssueId <= 0
        ) {

          setError(
            "Please enter a valid Issue ID"
          );

          return;
        }
      }

      // =================================================
      // FAULT NAME
      // =================================================

      const fault =
        faultName.trim();

      if (
        fault.length > 150
      ) {

        setError(
          "Fault name cannot exceed 150 characters"
        );

        return;
      }

      // =================================================
      // FINAL CODE
      // =================================================

      const code =
        finalCode
          .trim()
          .toUpperCase();

      if (!code) {

        setError(
          "Final code is required"
        );

        return;
      }

      if (
        code.length > 50
      ) {

        setError(
          "Final code cannot exceed 50 characters"
        );

        return;
      }

      // =================================================
      // DETAILS
      // =================================================

      const detailText =
        details.trim();

      // =================================================
      // SAVE
      // =================================================

      try {

        setLoading(true);

        setError("");

        // =================================================
        // PAYLOAD
        // =================================================

        const payload = {

          equipmentId:
            numericEquipmentId,

          issueId:
            numericIssueId,

          faultName:
            fault || null,

          details:
            detailText || null,

          finalCode:
            code,
        };

        console.log(
          "Equipment Issue Map Payload:",
          payload
        );

        // =================================================
        // UPDATE
        // =================================================

        if (
          editData?.id !== undefined &&
          editData?.id !== null
        ) {

          await axiosInstance.put(
            `/kavachEquipmentIssueMap/${editData.id}`,
            payload
          );

        }

        // =================================================
        // CREATE
        // =================================================

        else {

          await axiosInstance.post(
            "/kavachEquipmentIssueMap/addKavachEquipmentIssueMap",
            payload
          );
        }

        // =================================================
        // CLOSE
        // =================================================

        handleClose();

        // =================================================
        // REFRESH DATA
        // =================================================

        await fetchIssueMaps();

        /*
         * Return to first page after adding/updating.
         */

        setPage(0);

      } catch (err: any) {

        console.error(
          "Error saving equipment issue map:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to save equipment issue mapping"
        );

      } finally {

        setLoading(false);
      }
    };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete =
    async (
      id: number
    ) => {

      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this equipment issue mapping?"
        );

      if (!confirmDelete) {
        return;
      }

      try {

        setLoading(true);

        setError("");

        await axiosInstance.delete(
          `/kavachEquipmentIssueMap/${id}`
        );

        await fetchIssueMaps();

        /*
         * Keep current page if possible.
         * The safety useEffect above will move
         * to the previous page if required.
         */

      } catch (err: any) {

        console.error(
          "Error deleting equipment issue map:",
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to delete equipment issue mapping"
        );

      } finally {

        setLoading(false);
      }
    };

  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >

        <h2
          style={{
            margin: 0,
            color: "#0b3b70",
            fontSize: "24px",
            fontWeight: 600,
          }}
        >
          Kavach Equipment Issue Map
        </h2>

        <button
          type="button"
          onClick={handleAdd}
          style={{
            background: "#0b3b70",
            color: "#ffffff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          + Add Issue Mapping
        </button>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div
        style={{
          background: "#ffffff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "15px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >

        <input
          type="text"
          placeholder="Search ID, Equipment ID, Issue ID, Fault Name or Final Code..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            outline: "none",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && !modalOpen && (

        <div
          style={{
            background: "#ffe6e6",
            color: "#c62828",
            border:
              "1px solid #f5b5b5",
            padding: "10px 15px",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>

      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (

        <div
          style={{
            textAlign: "center",
            padding: "15px",
            color: "#0b3b70",
          }}
        >
          Loading...
        </div>

      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <KavachEquipmentIssueMapTable
        data={paginatedData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      <div className="flex justify-end items-center gap-4 mt-4 text-sm">

        {/* =================================================
            ROWS PER PAGE
        ================================================= */}

        <select
          value={rowsPerPage}
          onChange={(e) => {

            setRowsPerPage(
              Number(
                e.target.value
              )
            );

            setPage(0);

          }}
          className="border px-2 py-1 rounded
                     bg-white text-gray-800
                     focus:ring-2 focus:ring-blue-500"
        >

          <option value={10}>
            10
          </option>

          <option value={25}>
            25
          </option>

          <option value={50}>
            50
          </option>

        </select>

        {/* =================================================
            RECORD COUNT
        ================================================= */}

        <span className="text-gray-700">

          {filteredData.length === 0
            ? 0
            : page * rowsPerPage + 1}

          –

          {Math.min(
            (page + 1) *
              rowsPerPage,
            filteredData.length
          )}

          {" "}of{" "}

          {filteredData.length}

        </span>

        {/* =================================================
            PREVIOUS
        ================================================= */}

        <button
          disabled={
            page === 0
          }
          onClick={() =>
            setPage(
              page - 1
            )
          }
          className="px-2 text-blue-600
                     disabled:opacity-40
                     hover:text-blue-800"
        >
          ◀
        </button>

        {/* =================================================
            NEXT
        ================================================= */}

        <button
          disabled={
            page >=
              totalPages - 1 ||
            totalPages === 0
          }
          onClick={() =>
            setPage(
              page + 1
            )
          }
          className="px-2 text-blue-600
                     disabled:opacity-40
                     hover:text-blue-800"
        >
          ▶
        </button>

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {modalOpen && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "550px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "10px",
              padding: "25px",
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.2)",
              boxSizing: "border-box",
            }}
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >

              <h3
                style={{
                  margin: 0,
                  color: "#0b3b70",
                }}
              >
                {editData
                  ? "Edit Equipment Issue Mapping"
                  : "Add Equipment Issue Mapping"}
              </h3>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  border: "none",
                  background:
                    "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>

            </div>

            {/* =================================================
                MODAL ERROR
            ================================================= */}

            {error && (

              <div
                style={{
                  background:
                    "#ffe6e6",
                  color:
                    "#c62828",
                  border:
                    "1px solid #f5b5b5",
                  padding:
                    "9px 12px",
                  borderRadius:
                    "5px",
                  marginBottom:
                    "15px",
                  fontSize:
                    "14px",
                }}
              >
                {error}
              </div>

            )}

            {/* =================================================
                EQUIPMENT
            ================================================= */}

            <div
              style={{
                marginBottom: "15px",
              }}
            >

              <label style={labelStyle}>
                Equipment
              </label>

              <select
                value={equipmentId}
                onChange={(e) =>
                  setEquipmentId(
                    e.target.value
                  )
                }
                style={inputStyle}
              >

                <option value="">
                  Select Equipment
                </option>

                {equipmentList.map(
                  (equipment) => (

                    <option
                      key={equipment.id}
                      value={equipment.id}
                    >
                      {equipment.id}
                      {" - "}
                      {equipment.equipmentName ||
                        "Equipment"}
                      {equipment.unitCode
                        ? ` (${equipment.unitCode})`
                        : ""}
                    </option>

                  )
                )}

              </select>

            </div>

            {/* =================================================
                ISSUE ID
            ================================================= */}

            <div
              style={{
                marginBottom: "15px",
              }}
            >

              <label style={labelStyle}>
                Issue ID
              </label>

              <input
                type="number"
                min="1"
                value={issueId}
                placeholder="Enter Issue ID"
                onChange={(e) =>
                  setIssueId(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                  color: "#777",
                  fontSize: "12px",
                }}
              >
                Enter ISSUE_ID from
                KAVACH_ISSUE_MASTER.
              </small>

            </div>

            {/* =================================================
                FAULT NAME
            ================================================= */}

            <div
              style={{
                marginBottom: "15px",
              }}
            >

              <label style={labelStyle}>
                Fault Name
              </label>

              <input
                type="text"
                value={faultName}
                maxLength={150}
                placeholder="Enter fault name"
                onChange={(e) =>
                  setFaultName(
                    e.target.value
                  )
                }
                style={inputStyle}
              />

            </div>

            {/* =================================================
                DETAILS
            ================================================= */}

            <div
              style={{
                marginBottom: "15px",
              }}
            >

              <label style={labelStyle}>
                Details
              </label>

              <textarea
                value={details}
                placeholder="Enter details"
                rows={5}
                onChange={(e) =>
                  setDetails(
                    e.target.value
                  )
                }
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "110px",
                }}
              />

            </div>

            {/* =================================================
                FINAL CODE
            ================================================= */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >

              <label style={labelStyle}>
                Final Code
              </label>

              <input
                type="text"
                value={finalCode}
                maxLength={50}
                placeholder="Enter final code"
                onChange={(e) =>
                  setFinalCode(
                    e.target.value.toUpperCase()
                  )
                }
                style={inputStyle}
              />

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "10px",
              }}
            >

              <button
                type="button"
                onClick={handleClose}
                style={{
                  background:
                    "#6c757d",
                  color:
                    "#ffffff",
                  border: "none",
                  borderRadius:
                    "6px",
                  padding:
                    "9px 18px",
                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  background:
                    "#0b3b70",
                  color:
                    "#ffffff",
                  border: "none",
                  borderRadius:
                    "6px",
                  padding:
                    "9px 18px",
                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading
                      ? 0.7
                      : 1,
                }}
              >
                {loading
                  ? "Saving..."
                  : editData
                  ? "Update"
                  : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

// =====================================================
// LABEL STYLE
// =====================================================

const labelStyle:
  React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontWeight: 600,
  color: "#333",
};

// =====================================================
// INPUT STYLE
// =====================================================

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  boxSizing: "border-box",
  outline: "none",
  fontSize: "14px",
  background: "#ffffff",
};

export default KavachEquipmentIssueMap;