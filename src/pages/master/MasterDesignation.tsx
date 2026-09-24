import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download, X } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";
import { useNotify } from "../../context/notification-context";
import Can from "../../components/common/Can";

/* ================= TYPES ================= */

interface Department {
  id: number;
  name: string;
}

interface Designation {
  id: number;
  name: string;
  department: Department;
}

const DesignationTable: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);

  const [openModal, setOpenModal] = useState(false);
  const [editDesignation, setEditDesignation] = useState<Designation | null>(
    null,
  );

  const [form, setForm] = useState({
    name: "",
    department_id: "",
  });

  const { showAlert, confirm } = useNotify();

  useEffect(() => {
    fetchDesignations();
    fetchDepartments();
  }, []);

  /* ================= FETCH API ================= */

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/designation/");
      setDesignations(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axiosInstance.get("/department/");
      setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= SEARCH ================= */

  const filteredData = useMemo(() => {
    return designations.filter((d) =>
      `${d.name} ${d.department?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [designations, search]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  /* ================= EXPORT ================= */

  const exportToExcel = () => {
    const data = filteredData.map((d, i) => ({
      "S.No": i + 1,
      Designation: d.name,
      Department: d.department?.name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Designation");
    XLSX.writeFile(wb, "Designation.xlsx");
  };

  /* ================= ADD / EDIT ================= */

  const openAdd = () => {
    setEditDesignation(null);
    setForm({ name: "", department_id: "" });
    setOpenModal(true);
  };

  const openEdit = (designation: Designation) => {
    setEditDesignation(designation);
    setForm({
      name: designation.name,
      department_id: String(designation.department?.id),
    });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name || !form.department_id) {
      showAlert("All fields required", "warning");
      return;
    }

    try {
      const payload = {
        name: form.name,
        department_id: form.department_id,
        ...(editDesignation && { id: editDesignation.id }),
      };

      // SAME PAYLOAD FOR BOTH
      if (editDesignation) {
        await axiosInstance.put("/designation/", payload);
        showAlert("Designation updated successfully", "success");
      } else {
        await axiosInstance.post("/designation/", payload);
        showAlert("Designation added successfully", "success");
      }

      setOpenModal(false);
      fetchDesignations();
    } catch (err) {
      showAlert("Operation failed", "error");
    }
  };

  /* ================= DELETE ================= */

  const deleteDesignation = (id: number) => {
    confirm({
      title: "Delete Designation",
      message: "Are you sure you want to delete this designation?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/designation/${id}`);
          fetchDesignations();
          showAlert("Designation deleted successfully", "success");
        } catch (err) {
          showAlert("Delete failed", "error");
        }
      },
    });
  };

  /* ================= UI ================= */

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        Designation Master
      </h1>
      <div className="flex justify-end mb-4">
        <Can>
          <button
            onClick={openAdd}
            className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center text-white"
          >
            <Plus />
          </button>
        </Can>

        <div className="flex gap-3">
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="border px-3 py-2 rounded w-64"
          />

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 border border-blue-500 text-blue-600 px-4 py-2 rounded"
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-sm">
              <th className="border px-3 py-2">S.No</th>
              <th className="border px-3 py-2">Designation</th>
              <th className="border px-3 py-2">Department</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((d, i) => (
              <tr key={d.id} className="even:bg-gray-100 text-sm">
                <td className="border px-3 py-2 text-center">
                  {page * rowsPerPage + i + 1}
                </td>

                <td className="border px-3 py-2 text-center font-semibold">
                  {d.name}
                </td>

                <td className="border px-3 py-2 text-center text-gray-600">
                  {d.department?.name}
                </td>

                <td className="border px-3 py-2">
                  <div className="flex justify-center gap-4">
                    <Can>
                      <button
                        onClick={() => openEdit(d)}
                        className="text-green-600"
                      >
                        <Pencil size={18} />
                      </button>
                    </Can>
                    <Can>
                      <button
                        onClick={() => deleteDesignation(d.id)}
                        className="text-orange-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  Data Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <TablePagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredData.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
      />

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">
                {editDesignation ? "Edit Designation" : "Add Designation"}
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <X />
              </button>
            </div>

            <input
              placeholder="Designation Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border px-3 py-2 rounded mb-3"
            />

            {/* ✅ DEPARTMENT DROPDOWN */}
            <select
              value={form.department_id}
              onChange={(e) =>
                setForm({ ...form, department_id: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={submitForm}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {editDesignation ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationTable;
