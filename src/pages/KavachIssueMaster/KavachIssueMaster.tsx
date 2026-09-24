import React, { useEffect, useMemo, useState } from "react";

import KavachIssueMasterTable, {
  KavachIssue,
} from "../../components/KavachIssueMaster/KavachIssueMasterTable";

import { axiosInstance } from "../../services/axios";

const KavachIssueMaster: React.FC = () => {
  const [issues, setIssues] = useState<KavachIssue[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editData, setEditData] =
    useState<KavachIssue | null>(null);

  const [issueCode, setIssueCode] = useState("");
  const [issueName, setIssueName] = useState("");

  const [error, setError] = useState("");

  /*
   * ==========================================
   * GET ALL ISSUES
   * ==========================================
   */

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await axiosInstance.get(
          "/kavachIssueMaster/getAllIssue"
        );

      setIssues(response.data);
    } catch (err: any) {
      console.error(
        "Error fetching Kavach issues:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load Kavach issue data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  /*
   * ==========================================
   * SEARCH
   * ==========================================
   */

  const filteredIssues = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return issues;
    }

    return issues.filter(
      (issue) =>
        issue.issueCode
          ?.toLowerCase()
          .includes(value) ||
        issue.issueName
          ?.toLowerCase()
          .includes(value)
    );
  }, [issues, search]);

  /*
   * ==========================================
   * ADD
   * ==========================================
   */

  const handleAdd = () => {
    setEditData(null);

    setIssueCode("");
    setIssueName("");

    setError("");

    setModalOpen(true);
  };

  /*
   * ==========================================
   * EDIT
   * ==========================================
   */

  const handleEdit = (issue: KavachIssue) => {
    setEditData(issue);

    setIssueCode(issue.issueCode || "");
    setIssueName(issue.issueName || "");

    setError("");

    setModalOpen(true);
  };

  /*
   * ==========================================
   * CLOSE
   * ==========================================
   */

  const handleClose = () => {
    setModalOpen(false);

    setEditData(null);

    setIssueCode("");
    setIssueName("");

    setError("");
  };

  /*
   * ==========================================
   * SAVE / UPDATE
   * ==========================================
   */

  const handleSubmit = async () => {
    const code =
      issueCode.trim().toUpperCase();

    const name =
      issueName.trim();

    if (!code) {
      setError("Issue code is required");
      return;
    }

    if (!name) {
      setError("Issue name is required");
      return;
    }

    if (code.length > 10) {
      setError(
        "Issue code cannot exceed 10 characters"
      );
      return;
    }

    if (name.length > 100) {
      setError(
        "Issue name cannot exceed 100 characters"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        issueCode: code,
        issueName: name,
      };

      /*
       * UPDATE
       */
      if (editData?.id) {
        await axiosInstance.put(
          `/kavachIssueMaster/${editData.id}`,
          payload
        );
      }

      /*
       * CREATE
       */
      else {
        await axiosInstance.post(
          "/kavachIssueMaster/addkavachIssue",
          payload
        );
      }

      handleClose();

      await fetchIssues();
    } catch (err: any) {
      console.error(
        "Error saving Kavach issue:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to save issue"
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
      "Are you sure you want to delete this issue?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axiosInstance.delete(
        `/kavachIssueMaster/${id}`
      );

      await fetchIssues();
    } catch (err: any) {
      console.error(
        "Error deleting Kavach issue:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to delete issue"
      );
    } finally {
      setLoading(false);
    }
  };

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
          Kavach Issue Master
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
          + Add Issue
        </button>
      </div>

      {/* SEARCH */}

      <div
        style={{
          background: "#fff",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "15px",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <input
          type="text"
          placeholder="Search Issue Code or Issue Name..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
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

      <KavachIssueMasterTable
        data={filteredIssues}
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
                  ? "Edit Kavach Issue"
                  : "Add Kavach Issue"}
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

            {/* ERROR */}

            {error && (
              <div
                style={{
                  background: "#ffe6e6",
                  color: "#c62828",
                  border:
                    "1px solid #f5b5b5",
                  padding: "9px 12px",
                  borderRadius: "5px",
                  marginBottom: "15px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {/* ISSUE CODE */}

            <div
              style={{
                marginBottom: "15px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Issue Code
              </label>

              <input
                type="text"
                value={issueCode}
                maxLength={10}
                placeholder="Enter issue code"
                onChange={(e) =>
                  setIssueCode(
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
                }}
              />
            </div>

            {/* ISSUE NAME */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Issue Name
              </label>

              <input
                type="text"
                value={issueName}
                maxLength={100}
                placeholder="Enter issue name"
                onChange={(e) =>
                  setIssueName(e.target.value)
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

export default KavachIssueMaster;