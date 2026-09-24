import React, { useEffect, useMemo, useState } from "react";
import DomainMasterTable, {
  Domain,
} from "../../components/DomainMaster/DomainMasterTable";

import { axiosInstance } from "../../services/axios";

const DomainMaster: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editData, setEditData] = useState<Domain | null>(null);

  const [domainName, setDomainName] = useState("");
  const [domainCode, setDomainCode] = useState("");

  const [error, setError] = useState("");

  /*
   * ==========================================
   * GET ALL DOMAINS
   * ==========================================
   */

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axiosInstance.get("/domainMaster/getAll");

      setDomains(response.data);
    } catch (err: any) {
      console.error("Error fetching domains:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load domain data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  /*
   * ==========================================
   * SEARCH
   * ==========================================
   */

  const filteredDomains = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return domains;
    }

    return domains.filter(
      (domain) =>
        domain.domainName
          ?.toLowerCase()
          .includes(value) ||
        domain.domainCode
          ?.toLowerCase()
          .includes(value)
    );
  }, [domains, search]);

  /*
   * ==========================================
   * OPEN ADD MODAL
   * ==========================================
   */

  const handleAdd = () => {
    setEditData(null);

    setDomainName("");
    setDomainCode("");

    setError("");

    setModalOpen(true);
  };

  /*
   * ==========================================
   * OPEN EDIT MODAL
   * ==========================================
   */

  const handleEdit = (domain: Domain) => {
    setEditData(domain);

    setDomainName(domain.domainName || "");
    setDomainCode(domain.domainCode || "");

    setError("");

    setModalOpen(true);
  };

  /*
   * ==========================================
   * CLOSE MODAL
   * ==========================================
   */

  const handleClose = () => {
    setModalOpen(false);

    setEditData(null);

    setDomainName("");
    setDomainCode("");

    setError("");
  };

  /*
   * ==========================================
   * SAVE / UPDATE
   * ==========================================
   */

  const handleSubmit = async () => {
    const name = domainName.trim();
    const code = domainCode.trim().toUpperCase();

    if (!name) {
      setError("Domain name is required");
      return;
    }

    if (!code) {
      setError("Domain code is required");
      return;
    }

    if (name.length > 50) {
      setError("Domain name cannot exceed 50 characters");
      return;
    }

    if (code.length > 10) {
      setError("Domain code cannot exceed 10 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        domainName: name,
        domainCode: code,
      };

      /*
       * UPDATE
       */
      if (editData?.domainId) {
        await axiosInstance.put(
          `/domainMaster/${editData.domainId}`,
          payload
        );
      }

      /*
       * CREATE
       */
      else {
        await axiosInstance.post(
          "/domainMaster/add/domain",
          payload
        );
      }

      handleClose();

      await fetchDomains();
    } catch (err: any) {
      console.error("Error saving domain:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to save domain"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * DELETE
   * ==========================================
   */

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this domain?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axiosInstance.delete(
        `/domainMaster/${id}`
      );

      await fetchDomains();
    } catch (err: any) {
      console.error("Error deleting domain:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to delete domain"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "20px",
      }}
    >
      {/* HEADER */}

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
          Domain Master
        </h2>

        <button
          onClick={handleAdd}
          style={{
            background: "#0b3b70",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          + Add Domain
        </button>
      </div>

      {/* SEARCH */}

      <div
        style={{
          background: "#fff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "15px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <input
          type="text"
          placeholder="Search Domain Name or Domain Code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            outline: "none",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ERROR */}

      {error && !modalOpen && (
        <div
          style={{
            background: "#ffe6e6",
            color: "#c62828",
            border: "1px solid #f5b5b5",
            padding: "10px 15px",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {/* LOADING */}

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

      {/* TABLE */}

      <DomainMasterTable
        data={filteredDomains}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* MODAL */}

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
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
              maxWidth: "450px",
              background: "#fff",
              borderRadius: "10px",
              padding: "25px",
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.2)",
              boxSizing: "border-box",
            }}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
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
                  ? "Edit Domain"
                  : "Add Domain"}
              </h3>

              <button
                onClick={handleClose}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "22px",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ×
              </button>
            </div>

            {/* MODAL ERROR */}

            {error && (
              <div
                style={{
                  background: "#ffe6e6",
                  color: "#c62828",
                  border: "1px solid #f5b5b5",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  marginBottom: "15px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* DOMAIN NAME */}

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Domain Name
              </label>

              <input
                type="text"
                value={domainName}
                maxLength={50}
                placeholder="Enter domain name"
                onChange={(e) =>
                  setDomainName(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>

            {/* DOMAIN CODE */}

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Domain Code
              </label>

              <input
                type="text"
                value={domainCode}
                maxLength={10}
                placeholder="Enter domain code"
                onChange={(e) =>
                  setDomainCode(
                    e.target.value.toUpperCase()
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  boxSizing: "border-box",
                  outline: "none",
                  textTransform: "uppercase",
                }}
              />
            </div>

            {/* BUTTONS */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "9px 18px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  background: "#0b3b70",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "9px 18px",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  opacity: loading ? 0.7 : 1,
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

export default DomainMaster;