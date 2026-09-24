import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Download, X, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import { ContentLoading } from "../../components/common/LoadingScreen";
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

interface Firm {
  id: number;
  name: string;
}

interface Station {
  id: number;
  name: string;
  code: string;
  firm: string;
  sectionId: number;
  division: Division;
}

const StationTable: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);

  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);

  // ===== ACTIVE FILTERS (applied on table) =====
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [firmFilter, setFirmFilter] = useState("");

  // ===== FILTER MODAL STATE (temporary) =====
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    search: "",
    zoneFilter: "",
    divisionFilter: "",
    firmFilter: "",
  });

  // modal for add/edit
  const [openModal, setOpenModal] = useState(false);
  const [editStation, setEditStation] = useState<Station | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    firmId: "",
    sectionId: "",
    divisionId: "",
  });

  const isReadOnly = true;

  useEffect(() => {
    fetchStations();
    fetchZones();
    fetchDivisions();
    fetchFirms();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/station/");
      setStations(res.data.data ?? []);
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

  const fetchFirms = async () => {
    try {
      const res = await axiosInstance.get("/firm/");
      setFirms(res.data.data ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ===== Division options depend on zone selection ===== */
  const filteredDivisionOptions = useMemo(() => {
    if (!zoneFilter) return divisions;
    return divisions.filter((d) => d.zone?.id === Number(zoneFilter));
  }, [divisions, zoneFilter]);

  const filteredDivisionOptionsForModal = useMemo(() => {
    if (!tempFilters.zoneFilter) return divisions;
    return divisions.filter(
      (d) => d.zone?.id === Number(tempFilters.zoneFilter),
    );
  }, [divisions, tempFilters.zoneFilter]);

  /* ---------- SEARCH + FILTER LOGIC ---------- */
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const zoneCode = s.division?.zone?.code ?? "";
      const divisionCode = s.division?.code ?? "";

      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        zoneCode.toLowerCase().includes(search.toLowerCase()) ||
        divisionCode.toLowerCase().includes(search.toLowerCase()) ||
        String(s.sectionId ?? "").includes(search) ||
        (s.firm ?? "").toLowerCase().includes(search.toLowerCase());

      const matchZone = zoneFilter
        ? s.division?.zone?.id === Number(zoneFilter)
        : true;

      const matchDivision = divisionFilter
        ? s.division?.id === Number(divisionFilter)
        : true;

      const matchFirm = firmFilter
        ? (s.firm ?? "").toLowerCase() === firmFilter.toLowerCase()
        : true;

      return matchSearch && matchZone && matchDivision && matchFirm;
    });
  }, [stations, search, zoneFilter, divisionFilter, firmFilter]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredStations.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredStations.slice(start, start + rowsPerPage);
  }, [filteredStations, page, rowsPerPage]);

  /* ---------- EXCEL EXPORT ---------- */
  const exportToExcel = () => {
    const data = filteredStations.map((s, i) => ({
      "S.No": i + 1,
      "Zone Code": s.division?.zone?.code ?? "",
      "Division Code": s.division?.code ?? "",
      "Section Id": s.sectionId ?? "",
      "Station Name": s.name ?? "",
      "Station Code": s.code ?? "",
      Firm: s.firm ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stations");
    XLSX.writeFile(wb, "Stations.xlsx");
  };

  /* ---------- FILTER MODAL HANDLERS ---------- */
  const openFilterModal = () => {
    setTempFilters({
      search,
      zoneFilter,
      divisionFilter,
      firmFilter,
    });
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setSearch(tempFilters.search);
    setZoneFilter(tempFilters.zoneFilter);
    setDivisionFilter(tempFilters.divisionFilter);
    setFirmFilter(tempFilters.firmFilter);
    setPage(0);
    setFilterModalOpen(false);
  };

  const clearFilters = () => {
    setTempFilters({
      search: "",
      zoneFilter: "",
      divisionFilter: "",
      firmFilter: "",
    });
  };

  /* ---------- ADD / EDIT ---------- */
  const openAdd = () => {
    setEditStation(null);
    setForm({
      name: "",
      code: "",
      firmId: "",
      sectionId: "",
      divisionId: "",
    });
    setOpenModal(true);
  };

  const openEdit = (station: Station) => {
    // match firm id from firm name
    const firmObj = firms.find(
      (f) => f.name.toLowerCase() === (station.firm ?? "").toLowerCase(),
    );

    setEditStation(station);
    setForm({
      name: station.name ?? "",
      code: station.code ?? "",
      firmId: firmObj ? String(firmObj.id) : "",
      sectionId: String(station.sectionId ?? ""),
      divisionId: String(station.division?.id ?? ""),
    });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.name || !form.code || !form.sectionId || !form.divisionId) {
      alert("Name, Code, Section Id and Division are required");
      return;
    }

    const firmName = form.firmId
      ? (firms.find((f) => f.id === Number(form.firmId))?.name ?? "")
      : "";

    const payload = {
      name: form.name,
      code: form.code,
      firm: firmName, // backend response shows firm as string
      sectionId: Number(form.sectionId),
      divisionId: Number(form.divisionId),
    };

    try {
      if (editStation) {
        await axiosInstance.put(`/station/${editStation.id}`, payload);
      } else {
        await axiosInstance.post("/station/", payload);
      }

      setOpenModal(false);
      fetchStations();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  /* ---------- DELETE ---------- */
  const deleteStation = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this station?"))
      return;

    try {
      await axiosInstance.delete(`/station/${id}`);
      fetchStations();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Station Master</h1>
      <div className="flex justify-end mb-4">
        <Can>
          <button
            onClick={openAdd}
            disabled={isReadOnly}
            className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus />
          </button>
        </Can>

        <div className="flex gap-3 items-center">
          {/* Filter Button */}
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
              <th className="border px-3 py-2">Section Id</th>
              <th className="border px-3 py-2">Station Name</th>
              <th className="border px-3 py-2">Station Code</th>
              <th className="border px-3 py-2">Firm</th>
              <th className="border px-3 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && <ContentLoading />}

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
                  <td className="border px-3 py-2 text-center">
                    {s.sectionId ?? "-"}
                  </td>
                  <td className="border px-3 py-2 text-center">{s.name}</td>
                  <td className="border px-3 py-2 text-center">{s.code}</td>
                  <td className="border px-3 py-2 text-center">
                    {s.firm || "-"}
                  </td>

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
                        <button
                          onClick={() => deleteStation(s.id)}
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
                <td colSpan={8} className="py-6 text-center text-gray-500">
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
          {Math.min((page + 1) * rowsPerPage, filteredStations.length)} of{" "}
          {filteredStations.length}
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
              <input
                placeholder="Search (name/code/zone/division/firm/sectionId)"
                value={tempFilters.search}
                onChange={(e) =>
                  setTempFilters((p) => ({ ...p, search: e.target.value }))
                }
                className="col-span-2 w-full border px-3 py-2 rounded"
              />

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

              <select
                value={tempFilters.firmFilter}
                onChange={(e) =>
                  setTempFilters((p) => ({
                    ...p,
                    firmFilter: e.target.value,
                  }))
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">All Firms</option>
                {firms.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>

              <div />
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[420px] p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">
                {editStation ? "Edit Station" : "Add Station"}
              </h2>
              <button onClick={() => setOpenModal(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Station Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Station Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />

              <input
                placeholder="Section Id"
                value={form.sectionId}
                onChange={(e) =>
                  setForm({ ...form, sectionId: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

              {/* Firm dropdown (from /firm/) */}
              <select
                value={form.firmId}
                onChange={(e) => setForm({ ...form, firmId: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select Firm</option>
                {firms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

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
                {editStation ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationTable;
