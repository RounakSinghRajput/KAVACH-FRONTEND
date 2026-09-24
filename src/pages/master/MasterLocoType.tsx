import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download, X } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import { FloatingInput } from "../../components/common/FloatingInput";
import { useNotify } from "../../context/notification-context";
import Can from "../../components/common/Can";

interface LocoType {
  id: number;
  name: string;
}

const LocoTypeTable: React.FC = () => {
  const [locoTypes, setLocoTypes] = useState<LocoType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);

  // modal & form
  const [openModal, setOpenModal] = useState(false);
  const [editLocoType, setEditLocoType] = useState<LocoType | null>(null);
  const [form, setForm] = useState({ name: "" });
  const { showAlert, confirm } = useNotify();

  useEffect(() => {
    fetchLocoTypes();
  }, []);

  const fetchLocoTypes = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/locoType/");
      setLocoTypes(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SEARCH ---------- */
  const filteredLocoTypes = useMemo(() => {
    return locoTypes.filter((l) =>
      l.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [locoTypes, search]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredLocoTypes.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLocoTypes.slice(start, start + rowsPerPage);
  }, [filteredLocoTypes, page, rowsPerPage]);

  /* ---------- EXCEL EXPORT ---------- */
  const exportToExcel = () => {
    const data = filteredLocoTypes.map((l, i) => ({
      "S.No": i + 1,
      "Loco Type Name": l.name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LocoTypes");
    XLSX.writeFile(wb, "LocoTypes.xlsx");
  };

  /* ---------- ADD / EDIT ---------- */
  const openAdd = () => {
    setEditLocoType(null);
    setForm({ name: "" });
    setOpenModal(true);
  };

  const openEdit = (locoType: LocoType) => {
    setEditLocoType(locoType);
    setForm({ name: locoType.name });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      showAlert("Loco type name is required", "error");
      return;
    }

    try {
      if (editLocoType) {
        await axiosInstance.put("/locoType/", {
          id: editLocoType.id,
          name: form.name,
        });
        showAlert("Loco type updated successfully", "success");
      } else {
        await axiosInstance.post("/locoType/", form);
        showAlert("Loco type added successfully", "success");
      }

      setOpenModal(false);
      fetchLocoTypes();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  /* ---------- DELETE ---------- */
  const deleteLocoType = (id: number) => {
    confirm({
      title: "Delete Loco Type",
      message: "Are you sure you want to delete this loco type?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/locoType/${id}`);
          fetchLocoTypes();

          showAlert("Loco type deleted successfully", "success");
        } catch (err) {
          console.error(err);
          showAlert("Failed to delete loco type", "error");
        }
      },
    });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        Loco Type Master
      </h1>
      <div className="flex justify-end mb-4">
        <Can>
          {" "}
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

      {/* Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-sm">
              <th className="border px-3 py-2">S.No</th>
              <th className="border px-3 py-2">Loco Type Name</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              paginatedData.map((l, i) => (
                <tr key={l.id} className="even:bg-gray-100 text-sm">
                  <td className="border px-3 py-2 text-center">
                    {page * rowsPerPage + i + 1}
                  </td>

                  <td className="border px-3 py-2 text-center">{l.name}</td>

                  <td className="border px-3 py-2">
                    <div className="flex justify-center gap-4">
                      <Can>
                        <button
                          onClick={() => openEdit(l)}
                          className="text-blue-600"
                        >
                          <Pencil size={18} />
                        </button>
                      </Can>
                      <Can>
                        <button
                          onClick={() => deleteLocoType(l.id)}
                          className="text-orange-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && paginatedData.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-end gap-4 mt-4 text-sm text-gray-600">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          className="border rounded px-2 py-1"
        >
          <option value={7}>7</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>

        <span>
          {page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, filteredLocoTypes.length)} of{" "}
          {filteredLocoTypes.length}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(0)}
            className="px-2 disabled:text-gray-300"
          >
            ⏮
          </button>
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="px-2 disabled:text-gray-300"
          >
            ◀
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="px-2 disabled:text-gray-300"
          >
            ▶
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(totalPages - 1)}
            className="px-2 disabled:text-gray-300"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">
                {editLocoType ? "Edit Loco Type" : "Add Loco Type"}
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <X />
              </button>
            </div>

            <FloatingInput
              label="Loco Type"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
            />

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
                {editLocoType ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocoTypeTable;
