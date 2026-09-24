import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download, X, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import Can from "../../components/common/Can";

interface Zone {
  id: number;
  name: string;
  code: string;
}

interface Division {
  id: number;
  name: string;
  code: string;
  zone: Zone;
}

interface Section {
  id: number;
  name: string;
  code: string;
  division: Division;
}

const SectionTable: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [loading, setLoading] = useState(false);

  // Search always visible
  const [search, setSearch] = useState("");

  // Applied filters (used for table filtering)
  const [zoneFilter, setZoneFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");

  // Filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    zoneFilter: "",
    divisionFilter: "",
  });

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // modal & form
  const [openModal, setOpenModal] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    divisionId: "",
  });

  const isReadOnly = true;

  useEffect(() => {
    fetchSections();
    fetchZones();
    fetchDivisions();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/section/");
      setSections(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await axiosInstance.get("/zone/");
      setZones(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDivisions = async () => {
    try {
      const res = await axiosInstance.get("/division/");
      setDivisions(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ===== Division dropdown depends on zone (Applied) ===== */
  const filteredDivisionOptions = useMemo(() => {
    if (!zoneFilter) return divisions;
    return divisions.filter((d) => d.zone?.id === Number(zoneFilter));
  }, [divisions, zoneFilter]);

  /* ===== Division dropdown depends on zone (Modal temp) ===== */
  const filteredDivisionOptionsForModal = useMemo(() => {
    if (!tempFilters.zoneFilter) return divisions;
    return divisions.filter(
      (d) => d.zone?.id === Number(tempFilters.zoneFilter),
    );
  }, [divisions, tempFilters.zoneFilter]);

  /* ---------- SEARCH + FILTER LOGIC ---------- */
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const zoneCode = s.division?.zone?.code ?? "";
      const divisionCode = s.division?.code ?? "";

      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        zoneCode.toLowerCase().includes(search.toLowerCase()) ||
        divisionCode.toLowerCase().includes(search.toLowerCase());

      const matchZone = zoneFilter
        ? s.division?.zone?.id === Number(zoneFilter)
        : true;

      const matchDivision = divisionFilter
        ? s.division?.id === Number(divisionFilter)
        : true;

      return matchSearch && matchZone && matchDivision;
    });
  }, [sections, search, zoneFilter, divisionFilter]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredSections.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSections.slice(start, start + rowsPerPage);
  }, [filteredSections, page, rowsPerPage]);

  /* ---------- EXCEL EXPORT ---------- */
  const exportToExcel = () => {
    const data = filteredSections.map((s, i) => ({
      "S.No": i + 1,
      "Zone Code": s.division?.zone?.code ?? "",
      "Division Code": s.division?.code ?? "",
      "Section Name": s.name ?? "",
      "Section Code": s.code ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sections");
    XLSX.writeFile(wb, "Sections.xlsx");
  };

  /* ---------- FILTER MODAL HANDLERS ---------- */
  const openFilterModal = () => {
    setTempFilters({
      zoneFilter,
      divisionFilter,
    });
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setZoneFilter(tempFilters.zoneFilter);
    setDivisionFilter(tempFilters.divisionFilter);
    setPage(0);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    setTempFilters({
      zoneFilter: "",
      divisionFilter: "",
    });
  };

  /* ---------- ADD / EDIT ---------- */
  const openAdd = () => {
    setEditSection(null);
    setForm({ name: "", code: "", divisionId: "" });
    setOpenModal(true);
  };

  const openEdit = (section: Section) => {
    setEditSection(section);
    setForm({
      name: section.name ?? "",
      code: section.code ?? "",
      divisionId: String(section.division?.id ?? ""),
    });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name || !form.code || !form.divisionId) {
      alert("Name, Code and Division are required");
      return;
    }

    const payload = {
      name: form.name,
      code: form.code,
      divisionId: Number(form.divisionId),
    };

    try {
      if (editSection) {
        await axiosInstance.put(`/secttion/${editSection.id}`, payload);
      } else {
        await axiosInstance.post("/secttion/", payload);
      }

      setOpenModal(false);
      fetchSections();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  /* ---------- DELETE ---------- */
  const deleteSection = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this section?"))
      return;

    try {
      await axiosInstance.delete(`/secttion/${id}`);
      fetchSections();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Section Master</h1>
      <div className="flex justify-end mb-4">
        <Can>
          {" "}
          <button
            onClick={openAdd}
            disabled={isReadOnly}
            className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus />
          </button>
        </Can>

        <div className="flex gap-3 items-center">
          {/* Search always visible */}
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="border px-3 py-2 rounded w-64"
          />

          {/* Filters button */}
          <button
            onClick={openFilterModal}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            <Filter size={18} />
            Filters
          </button>

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
              <th className="border px-3 py-2">Zone Code</th>
              <th className="border px-3 py-2">Division Code</th>
              <th className="border px-3 py-2">Section Name</th>
              <th className="border px-3 py-2">Section Code</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              paginatedData.map((s, i) => (
                <tr key={s.id} className="even:bg-gray-100 text-sm">
                  <td className="border px-3 py-2 text-center">
                    {page * rowsPerPage + i + 1}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {s.division?.zone?.code ?? "-"}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {s.division?.code ?? "-"}
                  </td>
                  <td className="border px-3 py-2 text-center">{s.name}</td>
                  <td className="border px-3 py-2 text-center">{s.code}</td>

                  <td className="border px-3 py-2">
                    <div className="flex justify-center gap-4">
                      <Can>
                        <button
                          onClick={() => openEdit(s)}
                          disabled={isReadOnly}
                          className="text-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Pencil size={18} />
                        </button>
                      </Can>
                      <Can>
                        <button
                          onClick={() => deleteSection(s.id)}
                          disabled={isReadOnly}
                          className="text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
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
                <td colSpan={6} className="py-6 text-center text-gray-500">
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
          {Math.min((page + 1) * rowsPerPage, filteredSections.length)} of{" "}
          {filteredSections.length}
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

      {/* ===== FILTER MODAL ===== */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[520px] p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Filters</h2>
              <button onClick={() => setFilterModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Zone */}
              <select
                value={tempFilters.zoneFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setTempFilters((p) => ({
                    ...p,
                    zoneFilter: value,
                    divisionFilter: "",
                  }));
                }}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">All Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>

              {/* Division */}
              <select
                value={tempFilters.divisionFilter}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    divisionFilter: e.target.value,
                  }))
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">All Divisions</option>
                {filteredDivisionOptionsForModal.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border rounded"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[440px] p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">
                {editSection ? "Edit Section" : "Add Section"}
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Section Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                placeholder="Section Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />

              <select
                value={form.divisionId}
                onChange={(e) =>
                  setForm({ ...form, divisionId: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select Division</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

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
                {editSection ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionTable;
