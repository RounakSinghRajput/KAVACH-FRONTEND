import React, { useEffect, useMemo, useState } from "react";
import "./Priority.css";
import { axiosInstance } from "../../services/axios";
import PriorityModal from "./PriorityModal";
import { Priority } from "./PriorityTypes";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FlagIcon from "@mui/icons-material/Flag";
import GroupsIcon from "@mui/icons-material/Groups";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CircularProgress from "@mui/material/CircularProgress";

const PriorityPage: React.FC = () => {
  const [priorityList, setPriorityList] = useState<Priority[]>([]);

  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);

  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(
    null,
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (openModal) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }

  return () => {
    document.body.style.overflow = "";
  };
}, [openModal]);

  const getPriorityList = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/priority");

      const data: Priority[] = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      setPriorityList(data);
    } catch (error) {
      console.error("Priority Load Error:", error);

      alert("Unable to load priority list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPriorityList();
  }, []);

  const filteredList = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return priorityList;
    }

    return priorityList.filter((item) => {
      const priorityMatch = item.priorityName?.toLowerCase().includes(value);

      const roleMatch = item.roles?.some((role) =>
        role.name?.toLowerCase().includes(value),
      );

      return priorityMatch || roleMatch;
    });
  }, [search, priorityList]);

  const handleEdit = (priority: Priority) => {
    setSelectedPriority(priority);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setSelectedPriority(null);
    getPriorityList();
  };

  const getPriorityClass = (name?: string) => {
    const value = name?.toLowerCase() || "";

    if (value.includes("critical")) {
      return "critical";
    }

    if (value.includes("high")) {
      return "high";
    }

    if (value.includes("medium")) {
      return "medium";
    }

    return "low";
  };

  const totalRoles = priorityList.reduce(
    (total, item) => total + (item.roles?.length || 0),
    0,
  );

  const configured = priorityList.filter(
    (item) => item.roles && item.roles.length > 0,
  ).length;

  return (
    <div className="priority-page">
      <div className="priority-container">
        {/* HEADER */}

        <div className="priority-header">
          <div className="priority-title">
            <div className="priority-title-icon">
              <FlagIcon />
            </div>

            <div>
              <h1>Priority Management</h1>

              <p>Manage priority levels and their assigned roles</p>
            </div>
          </div>

          <button
            className="refresh-btn"
            onClick={getPriorityList}
            disabled={loading}
          >
            {loading ? <CircularProgress size={17} /> : <RefreshIcon />}
            Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}

        <div className="priority-summary">
          <div className="summary-card blue-card">
            <div className="summary-icon">
              <FlagIcon />
            </div>

            <div>
              <span>Total Priorities</span>
              <strong>{priorityList.length}</strong>
            </div>
          </div>

          <div className="summary-card purple-card">
            <div className="summary-icon">
              <GroupsIcon />
            </div>

            <div>
              <span>Assigned Roles</span>
              <strong>{totalRoles}</strong>
            </div>
          </div>

          <div className="summary-card green-card">
            <div className="summary-icon">
              <FlagIcon />
            </div>

            <div>
              <span>Configured</span>
              <strong>{configured}</strong>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="priority-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Priority Name</th>
                  <th>Assigned Roles</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="table-state">
                      <CircularProgress size={30} />

                      <span>Loading priorities...</span>
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-state">
                      <SearchIcon />

                      <strong>No priorities found</strong>

                      <span>Try another search.</span>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="id-badge">{item.id}</span>
                      </td>

                      <td>
                        <span
                          className={`priority-badge ${getPriorityClass(
                            item.priorityName,
                          )}`}
                        >
                          <FlagIcon />

                          {item.priorityName}
                        </span>
                      </td>

                      <td>
                        {item.roles?.length ? (
                          <div className="roles-cell">
                            {item.roles.map((role) => (
                              <span className="role-chip" key={role.id}>
                                {role.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="no-role">No roles assigned</span>
                        )}
                      </td>

                      <td className="action-cell">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(item)}
                        >
                          <EditOutlinedIcon />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL */}

        {openModal && selectedPriority && (
          <PriorityModal
            open={openModal}
            priority={selectedPriority}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default PriorityPage;
