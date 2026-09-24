import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import KavachEquipmentMasterTable, {
  KavachEquipment,
} from "../../components/KavachEquipmentMaster/KavachEquipmentMasterTable";

import { axiosInstance } from "../../services/axios";

const KavachEquipmentMaster: React.FC = () => {

  // =====================================================
  // STATE
  // =====================================================

  const [equipment, setEquipment] =
    useState<KavachEquipment[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editData, setEditData] =
    useState<KavachEquipment | null>(null);

  const [domainId, setDomainId] =
    useState("");

  const [equipmentName, setEquipmentName] =
    useState("");

  const [unitCode, setUnitCode] =
    useState("");

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
  // GET DOMAIN ID FROM EQUIPMENT
  // =====================================================

  const getDomainId = (
    item: KavachEquipment
  ): string => {

    /*
     * Backend may return:
     *
     * {
     *   "domainId": 1
     * }
     *
     * OR:
     *
     * {
     *   "domain": {
     *      "Id": 1
     *   }
     * }
     */

    if (
      item.domainId !== undefined &&
      item.domainId !== null
    ) {
      return String(
        item.domainId
      );
    }

    if (
      item.domain?.Id !== undefined &&
      item.domain?.Id !== null
    ) {
      return String(
        item.domain.Id
      );
    }

    return "";
  };

  // =====================================================
  // GET EQUIPMENT
  // =====================================================

  const fetchEquipment = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await axiosInstance.get(
          "/kavachEquipmentMaster/getAllkavachEquipment"
        );

      console.log(
        "Equipment API Response:",
        response.data
      );

      setEquipment(
        Array.isArray(response.data)
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
        "Failed to load equipment"
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchEquipment();

  }, []);

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  const filteredEquipment =
    useMemo(() => {

      const value =
        search
          .trim()
          .toLowerCase();

      // -------------------------------------------------
      // NO SEARCH
      // -------------------------------------------------

      if (!value) {
        return equipment;
      }

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      return equipment.filter(
        (item) => {

          const id =
            String(
              item.id ?? ""
            ).toLowerCase();

          const currentDomainId =
            getDomainId(
              item
            ).toLowerCase();

          const equipmentName =
            item.equipmentName
              ?.toLowerCase() ||
            "";

          const unitCode =
            item.unitCode
              ?.toLowerCase() ||
            "";

          return (
            id.includes(value) ||
            currentDomainId.includes(value) ||
            equipmentName.includes(value) ||
            unitCode.includes(value)
          );
        }
      );

    }, [
      equipment,
      search,
    ]);

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
      filteredEquipment.length /
      rowsPerPage
    );

  // =====================================================
  // PAGINATED EQUIPMENT
  // =====================================================

  const paginatedEquipment =
    useMemo(() => {

      const startIndex =
        page *
        rowsPerPage;

      return filteredEquipment.slice(
        startIndex,
        startIndex +
          rowsPerPage
      );

    }, [
      filteredEquipment,
      page,
      rowsPerPage,
    ]);

  // =====================================================
  // PAGE SAFETY
  // =====================================================

  /*
   * If deleting the last record from the
   * current page causes that page to disappear,
   * automatically move to the previous page.
   */

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

  const handleAdd = () => {

    setEditData(null);

    setDomainId("");

    setEquipmentName("");

    setUnitCode("");

    setError("");

    setModalOpen(true);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (
    item: KavachEquipment
  ) => {

    setEditData(item);

    setDomainId(
      getDomainId(item)
    );

    setEquipmentName(
      item.equipmentName || ""
    );

    setUnitCode(
      item.unitCode || ""
    );

    setError("");

    setModalOpen(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose = () => {

    setModalOpen(false);

    setEditData(null);

    setDomainId("");

    setEquipmentName("");

    setUnitCode("");

    setError("");
  };

  // =====================================================
  // SAVE / UPDATE
  // =====================================================

  const handleSubmit = async () => {

    // =================================================
    // DOMAIN ID VALIDATION
    // =================================================

    if (!domainId.trim()) {

      setError(
        "Domain ID is required"
      );

      return;
    }

    const numericDomainId =
      Number(domainId);

    if (
      !Number.isInteger(
        numericDomainId
      ) ||
      numericDomainId <= 0
    ) {

      setError(
        "Domain ID must be a valid positive number"
      );

      return;
    }

    // =================================================
    // EQUIPMENT NAME
    // =================================================

    const name =
      equipmentName.trim();

    if (!name) {

      setError(
        "Equipment name is required"
      );

      return;
    }

    // =================================================
    // UNIT CODE
    // =================================================

    const code =
      unitCode
        .trim()
        .toUpperCase();

    if (!code) {

      setError(
        "Unit code is required"
      );

      return;
    }

    // =================================================
    // LENGTH VALIDATION
    // =================================================

    if (
      name.length > 150
    ) {

      setError(
        "Equipment name cannot exceed 150 characters"
      );

      return;
    }

    if (
      code.length > 20
    ) {

      setError(
        "Unit code cannot exceed 20 characters"
      );

      return;
    }

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

        domainId:
          numericDomainId,

        equipmentName:
          name,

        unitCode:
          code,
      };

      console.log(
        "Equipment Payload:",
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
          `/kavachEquipmentMaster/${editData.id}`,
          payload
        );

      }

      // =================================================
      // CREATE
      // =================================================

      else {

        await axiosInstance.post(
          "/kavachEquipmentMaster/addkavachEquipment",
          payload
        );
      }

      // =================================================
      // CLOSE MODAL
      // =================================================

      handleClose();

      // =================================================
      // REFRESH TABLE
      // =================================================

      await fetchEquipment();

      /*
       * Return to first page after adding/updating.
       */

      setPage(0);

    } catch (err: any) {

      console.error(
        "Error saving equipment:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to save equipment"
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    id: number
  ) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this equipment?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      setLoading(true);

      setError("");

      await axiosInstance.delete(
        `/kavachEquipmentMaster/${id}`
      );

      await fetchEquipment();

    } catch (err: any) {

      console.error(
        "Error deleting equipment:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to delete equipment"
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
          justifyContent:
            "space-between",
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
          Kavach Equipment Master
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
          + Add Equipment
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
          placeholder="Search ID, Domain ID, Equipment Name or Unit Code..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "10px 12px",
            border:
              "1px solid #ccc",
            borderRadius: "6px",
            outline: "none",
            fontSize: "14px",
            boxSizing:
              "border-box",
          }}
        />

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && !modalOpen && (

        <div
          style={{
            background:
              "#ffe6e6",
            color:
              "#c62828",
            border:
              "1px solid #f5b5b5",
            padding:
              "10px 15px",
            borderRadius:
              "6px",
            marginBottom:
              "15px",
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
            textAlign:
              "center",
            padding:
              "15px",
            color:
              "#0b3b70",
          }}
        >
          Loading...
        </div>

      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <KavachEquipmentMasterTable
        data={paginatedEquipment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      <div
        className="flex justify-end items-center gap-4 mt-4 text-sm"
      >

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
            RECORD RANGE
        ================================================= */}

        <span className="text-gray-700">

          {filteredEquipment.length === 0
            ? 0
            : page * rowsPerPage + 1}

          –

          {Math.min(
            (page + 1) *
              rowsPerPage,
            filteredEquipment.length
          )}

          {" "}of{" "}

          {filteredEquipment.length}

        </span>

        {/* =================================================
            PREVIOUS
        ================================================= */}

        <button
          type="button"
          disabled={
            page === 0
          }
          onClick={() =>
            setPage(
              (previousPage) =>
                previousPage - 1
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
          type="button"
          disabled={
            totalPages === 0 ||
            page >=
              totalPages - 1
          }
          onClick={() =>
            setPage(
              (previousPage) =>
                previousPage + 1
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
            justifyContent:
              "center",
            alignItems:
              "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background:
                "#ffffff",
              borderRadius:
                "10px",
              padding:
                "25px",
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.2)",
              boxSizing:
                "border-box",
            }}
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "20px",
              }}
            >

              <h3
                style={{
                  margin: 0,
                  color:
                    "#0b3b70",
                }}
              >
                {editData
                  ? "Edit Equipment"
                  : "Add Equipment"}
              </h3>

              <button
                type="button"
                onClick={
                  handleClose
                }
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  fontSize:
                    "24px",
                  cursor:
                    "pointer",
                  color:
                    "#666",
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
                DOMAIN ID
            ================================================= */}

            <div
              style={{
                marginBottom:
                  "15px",
              }}
            >

              <label
                style={labelStyle}
              >
                Domain ID
              </label>

              <input
                type="number"
                min="1"
                value={
                  domainId
                }
                placeholder="Enter Domain ID"
                onChange={(e) =>
                  setDomainId(
                    e.target.value
                  )
                }
                style={
                  inputStyle
                }
              />

            </div>

            {/* =================================================
                EQUIPMENT NAME
            ================================================= */}

            <div
              style={{
                marginBottom:
                  "15px",
              }}
            >

              <label
                style={labelStyle}
              >
                Equipment Name
              </label>

              <input
                type="text"
                value={
                  equipmentName
                }
                maxLength={150}
                placeholder="Enter equipment name"
                onChange={(e) =>
                  setEquipmentName(
                    e.target.value
                  )
                }
                style={
                  inputStyle
                }
              />

            </div>

            {/* =================================================
                UNIT CODE
            ================================================= */}

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >

              <label
                style={labelStyle}
              >
                Unit Code
              </label>

              <input
                type="text"
                value={
                  unitCode
                }
                maxLength={20}
                placeholder="Enter unit code"
                onChange={(e) =>
                  setUnitCode(
                    e.target.value.toUpperCase()
                  )
                }
                style={
                  inputStyle
                }
              />

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "10px",
              }}
            >

              <button
                type="button"
                onClick={
                  handleClose
                }
                style={{
                  background:
                    "#6c757d",
                  color:
                    "#ffffff",
                  border:
                    "none",
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
                onClick={
                  handleSubmit
                }
                disabled={
                  loading
                }
                style={{
                  background:
                    "#0b3b70",
                  color:
                    "#ffffff",
                  border:
                    "none",
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
  border:
    "1px solid #ccc",
  borderRadius: "6px",
  boxSizing:
    "border-box",
  outline: "none",
  fontSize: "14px",
  background:
    "#ffffff",
};

export default KavachEquipmentMaster;