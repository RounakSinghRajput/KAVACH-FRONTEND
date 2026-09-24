import React, { useEffect, useState } from "react";

import { axiosInstance } from "../../services/axios";

import { Priority, Role } from "./PriorityTypes";

import "./Priority.css";

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import FlagIcon from "@mui/icons-material/Flag";
import CircularProgress from "@mui/material/CircularProgress";

interface Props {
  open: boolean;
  priority: Priority | null;
  onClose: () => void;
}

const PriorityModal: React.FC<Props> = ({ open, priority, onClose }) => {
  const [priorityName, setPriorityName] = useState("");

  const [roles, setRoles] = useState<Role[]>([]);

  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const [roleSearch, setRoleSearch] = useState("");

  const [saving, setSaving] = useState(false);

  const [loadingRoles, setLoadingRoles] = useState(false);

  useEffect(() => {
    if (!open) return;

    loadRoles();

    if (priority) {
      setPriorityName(priority.priorityName || "");

      setSelectedRoles(priority.roles?.map((role) => role.id) || []);
    } else {
      setPriorityName("");
      setSelectedRoles([]);
    }

    setRoleSearch("");
  }, [open, priority]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await axiosInstance.get("/role/");

      const data = Array.isArray(response.data?.data) ? response.data.data : [];

      setRoles(data);
    } catch (error) {
      console.error(error);

      alert("Unable to load roles.");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleChange = (id: number) => {
    setSelectedRoles((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const filteredRoles = roles.filter((role) =>
    role.name?.toLowerCase().includes(roleSearch.toLowerCase().trim()),
  );

  const handleSave = async () => {
    if (!priorityName.trim()) {
      alert("Please enter Priority Name.");
      return;
    }

    if (selectedRoles.length === 0) {
      alert("Please select at least one Role.");
      return;
    }

    setSaving(true);

    const payload = {
      priorityName: priorityName.trim(),

      roles: selectedRoles.map((id) => ({ id })),
    };

    try {
      if (priority) {
        await axiosInstance.put(`/priority/${priority.id}`, payload);

        alert("Priority Updated Successfully.");
      } else {
        await axiosInstance.post("/priority", payload);

        alert("Priority Added Successfully.");
      }

      onClose();
    } catch (error) {
      console.error(error);

      alert("Unable to save Priority.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="priority-modal-overlay">
      <div className="priority-modal">
        {/* HEADER */}

        <div className="priority-modal-header">
          <div className="modal-title-wrap">
            <div className="modal-title-icon">
              <FlagIcon />
            </div>

            <div>
              <h2>{priority ? "Update Priority" : "Add Priority"}</h2>

              <p>Configure priority and authorized roles</p>
            </div>
          </div>

          <button
            className="modal-close-btn"
            onClick={onClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
        </div>

        {/* BODY */}

        <div className="priority-modal-body">
          <div className="form-field">
            <label>Priority Name</label>

            <input
              type="text"
              value={priorityName}
              placeholder="Enter priority name"
              onChange={(e) => setPriorityName(e.target.value)}
            />
          </div>

          <div className="role-section">
            <div className="role-section-header"></div>

            <div className="role-search">
              <SearchIcon />

              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
              />
            </div>

            <div className="role-list">
              {loadingRoles ? (
                <div className="role-state">
                  <CircularProgress size={26} />
                  Loading roles...
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="role-state">No roles found.</div>
              ) : (
                filteredRoles.map((role) => {
                  const checked = selectedRoles.includes(role.id);

                  return (
                    <label
                      key={role.id}
                      className={`role-item ${checked ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleRoleChange(role.id)}
                      />

                      <span className="custom-checkbox">
                        {checked && <CheckIcon />}
                      </span>

                      <span>{role.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="priority-modal-footer">
          <button
            className="modal-cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="modal-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress
                  size={17}
                  sx={{
                    color: "#fff",
                  }}
                />
                Saving...
              </>
            ) : (
              <>
                <CheckIcon />

                {priority ? "Update Priority" : "Save Priority"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriorityModal;
