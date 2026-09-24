import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Plus, Download, X, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import Can from "../../components/common/Can";

interface Station {
  id: number;
  name: string;
  code: string;
}

interface TagRow {
  id: number;
  tagNo: string;
  tagType: string;
  latitude: number | null;
  longitude: number | null;
  roadNo: string;
  section: string;
  station: Station | null;
}

/* ====================================================
    Searchable Station Filter (Using Portal for Overlay)
====================================================== */
function StationFilterDropdown({
  stations,
  value,
  onChange,
}: {
  stations: Station[];
  value: string; // "ALL" or stationId
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // Recalculate button coordinates dynamically when opened to absolute position the portal
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 320), // keeps minimum menu box layout wide
      });
    }
    setOpen((p) => !p);
  };

  const selected = useMemo(() => {
    if (value === "ALL") return null;
    return stations.find((s) => String(s.id) === String(value)) ?? null;
  }, [stations, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations.slice(0, 60);
    return stations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
      )
      .slice(0, 120);
  }, [stations, query]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="border border-gray-300 px-3 py-2 bg-white rounded w-48 text-left flex items-center justify-between h-[38px] text-sm focus:ring-1 focus:ring-blue-500 outline-none"
      >
        <span className="truncate text-gray-700">
          {value === "ALL"
            ? "All Stations"
            : selected
              ? `${selected.name} (${selected.code})`
              : "Select Station"}
        </span>
        <span className="ml-2 text-gray-400 text-xs">▼</span>
      </button>

      {/* Render menu layout outside of parent containers using DOM Portals */}
      {open && typeof window !== "undefined" &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: `${coords.top + 4}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b bg-gray-50">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search station name/code..."
                className="w-full border border-gray-300 px-3 py-1.5 rounded text-sm outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div className="max-h-64 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onChange("ALL");
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                  value === "ALL" ? "bg-blue-100/70 font-semibold text-blue-700" : "text-gray-700"
                }`}
              >
                All Stations
              </button>

              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(String(s.id));
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                    String(s.id) === String(value)
                      ? "bg-blue-100/70 font-semibold text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex justify-between gap-3">
                    <span className="truncate">{s.name}</span>
                    <span className="text-gray-400 shrink-0 font-mono text-xs">({s.code})</span>
                  </div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="px-4 py-4 text-sm text-gray-400 text-center font-medium">
                  No stations discovered
                </div>
              )}
            </div>

            <div className="p-2 border-t bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="text-xs px-3 py-1 border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
}

/* ====================================================
    Main TagTable Component
====================================================== */
const TagTable: React.FC = () => {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState<string>("ALL");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);

  const [openModal, setOpenModal] = useState(false);
  const [editTag, setEditTag] = useState<TagRow | null>(null);
  const [form, setForm] = useState({
    stationId: "",
    tagNo: "",
    tagType: "",
    latitude: "",
    longitude: "",
    roadNo: "",
    section: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTags();
    fetchStations();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/tag/");
      setTags(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch tags error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await axiosInstance.get("/station/");
      setStations(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch stations error:", err);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [search, stationFilter, rowsPerPage]);

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tags.filter((t) => {
      const stationOk =
        stationFilter === "ALL" ||
        String(t.station?.id ?? "") === String(stationFilter);

      if (!stationOk) return false;
      if (!q) return true;

      const stationText = `${t.station?.name ?? ""} ${t.station?.code ?? ""}`.toLowerCase();

      return (
        (t.tagNo ?? "").toLowerCase().includes(q) ||
        (t.tagType ?? "").toLowerCase().includes(q) ||
        (t.roadNo ?? "").toLowerCase().includes(q) ||
        (t.section ?? "").toLowerCase().includes(q) ||
        stationText.includes(q)
      );
    });
  }, [tags, search, stationFilter]);

  const totalPages = Math.ceil(filteredTags.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredTags.slice(start, start + rowsPerPage);
  }, [filteredTags, page, rowsPerPage]);

  const exportToExcel = () => {
    const data = filteredTags.map((t, i) => ({
      "S.No": i + 1,
      Station: t.station ? `${t.station.name} (${t.station.code})` : "-",
      "Tag No": t.tagNo,
      "Tag Type": t.tagType,
      Lat: t.latitude,
      Long: t.longitude,
      "Road No": t.roadNo,
      Section: t.section,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tags");
    XLSX.writeFile(wb, "Tags.xlsx");
  };

  const openAdd = () => {
    setEditTag(null);
    setForm({
      stationId: "",
      tagNo: "",
      tagType: "",
      latitude: "",
      longitude: "",
      roadNo: "",
      section: "",
    });
    setOpenModal(true);
  };

  const openEdit = (tag: TagRow) => {
    setEditTag(tag);
    setForm({
      stationId: tag.station?.id ? String(tag.station.id) : "",
      tagNo: tag.tagNo ?? "",
      tagType: tag.tagType ?? "",
      latitude: tag.latitude !== null && tag.latitude !== undefined ? String(tag.latitude) : "",
      longitude: tag.longitude !== null && tag.longitude !== undefined ? String(tag.longitude) : "",
      roadNo: tag.roadNo ?? "",
      section: tag.section ?? "",
    });
    setOpenModal(true);
  };

  const submitForm = async () => {
    if (!form.stationId) {
      alert("Station is required");
      return;
    }
    if (!form.tagNo.trim()) {
      alert("Tag No is required");
      return;
    }
    if (!form.tagType.trim()) {
      alert("Tag Type is required");
      return;
    }

    const payload = {
      stationId: Number(form.stationId),
      tagNo: form.tagNo.trim(),
      tagType: form.tagType.trim(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      roadNo: form.roadNo.trim(),
      section: form.section.trim(),
    };

    try {
      if (editTag) {
        await axiosInstance.put(`/tag/${editTag.id}`, payload);
      } else {
        await axiosInstance.post("/tag/", payload);
      }
      setOpenModal(false);
      fetchTags();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  const deleteTag = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;
    try {
      await axiosInstance.delete(`/tag/${id}`);
      fetchTags();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const handleBulkUpload = async (file: File) => {
    try {
      setUploading(true);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows.length) {
        alert("Excel is empty");
        return;
      }

      for (const r of rows) {
        const stationId = r.stationId || (() => {
          const stationCode = (r.stationCode || "").toString().trim();
          if (!stationCode) return "";
          const st = stations.find((s) => s.code === stationCode);
          return st ? st.id : "";
        })();

        const payload = {
          stationId: Number(stationId),
          tagNo: (r.tagNo || "").toString().trim(),
          tagType: (r.tagType || "").toString().trim(),
          latitude: r.latitude === "" ? null : Number(r.latitude),
          longitude: r.longitude === "" ? null : Number(r.longitude),
          roadNo: (r.roadNo || "").toString().trim(),
          section: (r.section || "").toString().trim(),
        };

        if (!payload.stationId || !payload.tagNo || !payload.tagType) continue;
        await axiosInstance.post("/tag/", payload);
      }

      alert("Bulk upload completed");
      fetchTags();
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Bulk upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Upper Content Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b-2 border-blue-600">
        <h1 className="text-3xl font-bold text-blue-600">Tag Master</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Searchable Station Dropdown Overlay */}
          <StationFilterDropdown
            stations={stations}
            value={stationFilter}
            onChange={(val) => setStationFilter(val)}
          />

          {/* Quick Context Filter Search */}
          <input
            placeholder="Search matching row..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm rounded h-[38px] w-60 outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />

          {/* Bulk File Input Modules */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBulkUpload(file);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border border-orange-500 text-orange-600 px-4 py-1.5 h-[38px] text-sm font-medium rounded hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload"}
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 border border-blue-500 text-blue-600 px-4 py-1.5 h-[38px] text-sm font-medium rounded hover:bg-blue-50 transition-colors"
          >
            <Download size={16} /> Export
          </button>

          <Can>
            <button
              onClick={openAdd}
              title="Add New Tag Record"
              className="w-[38px] h-[38px] rounded-md bg-orange-400 flex items-center justify-center text-white shadow hover:bg-orange-500 transition-colors"
            >
              <Plus size={20} />
            </button>
          </Can>
        </div>
      </div>

      {/* Scrollable Fixed Height Table Wrapper Layout */}
      <div className="border border-gray-200 rounded-lg h-[460px] overflow-y-auto overflow-x-auto shadow-inner relative">
        <table className="w-full border-collapse min-w-[1100px] text-left bg-white">
          <thead>
            <tr className="bg-blue-600 text-white text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <th className="px-4 py-3 font-semibold text-center w-16">S.No</th>
              <th className="px-4 py-3 font-semibold">Station</th>
              <th className="px-4 py-3 font-semibold text-center">Tag No</th>
              <th className="px-4 py-3 font-semibold text-center">Tag Type</th>
              <th className="px-4 py-3 font-semibold text-center">Lat</th>
              <th className="px-4 py-3 font-semibold text-center">Long</th>
              <th className="px-4 py-3 font-semibold text-center">Road No</th>
              <th className="px-4 py-3 font-semibold">Section</th>
              <th className="px-4 py-3 font-semibold text-center sticky right-0 bg-blue-600 w-24">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {loading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 font-medium bg-gray-50/50">
                  Loading data matrix logs...
                </td>
              </tr>
            )}

            {!loading && paginatedData.map((t, i) => (
              <tr key={t.id} className="hover:bg-blue-50/40 even:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5 text-center text-gray-400 border-r border-gray-100 font-medium">
                  {page * rowsPerPage + i + 1}
                </td>
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {t.station ? `${t.station.name} (${t.station.code})` : "—"}
                </td>
                <td className="px-4 py-2.5 text-center font-mono font-semibold text-gray-600">{t.tagNo}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded text-xs border">
                    {t.tagType}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-500">{t.latitude ?? "—"}</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-500">{t.longitude ?? "—"}</td>
                <td className="px-4 py-2.5 text-center font-medium text-gray-600">{t.roadNo}</td>
                <td className="px-4 py-2.5 text-gray-600 font-medium">{t.section}</td>
                <td className="px-4 py-2.5 sticky right-0 bg-white/95 backdrop-blur-sm shadow-[inset_-2px_0_0_rgba(0,0,0,0.02)]">
                  <div className="flex justify-center gap-3.5">
                    <Can>
                      <button
                        onClick={() => openEdit(t)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Edit Row"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteTag(t.id)}
                        className="text-orange-500 hover:text-orange-700 transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && paginatedData.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 font-medium bg-gray-50">
                  No operational records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Elements Control Box */}
      <div className="flex items-center justify-end gap-4 mt-5 pt-3 border-t border-gray-100 text-sm text-gray-600">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          className="border border-gray-300 rounded px-2 py-1 outline-none bg-white focus:border-blue-500 text-gray-700"
        >
          
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>

        <span className="font-medium text-gray-500">
          {filteredTags.length === 0 ? 0 : page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, filteredTags.length)} of {filteredTags.length}
        </span>

        <div className="flex gap-1.5 ml-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(0)}
            className="w-7 h-7 flex items-center justify-center border rounded bg-white hover:bg-gray-50 text-gray-600 text-xs disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            ⏮
          </button>
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="w-7 h-7 flex items-center justify-center border rounded bg-white hover:bg-gray-50 text-gray-600 text-xs disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            ◀
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="w-7 h-7 flex items-center justify-center border rounded bg-white hover:bg-gray-50 text-gray-600 text-xs disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            ▶
          </button>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(totalPages - 1)}
            className="w-7 h-7 flex items-center justify-center border rounded bg-white hover:bg-gray-50 text-gray-600 text-xs disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Modal Popup Layer Overlay Container */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] backdrop-blur-sm">
          <div className="bg-white rounded-xl w-[520px] p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5 pb-2 border-b">
              <h2 className="font-bold text-lg text-gray-800">
                {editTag ? "Edit Tag Record" : "Add Tag Record"}
              </h2>
              <button 
                onClick={() => setOpenModal(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Station</label>
                <select
                  value={form.stationId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stationId: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded bg-white outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                >
                  <option value="">Select Target Station</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tag No</label>
                <input
                  value={form.tagNo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tagNo: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tag No"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tag Type</label>
                <input
                  value={form.tagType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tagType: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Tag Type"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Latitude</label>
                <input
                  value={form.latitude}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, latitude: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Latitude coordinate"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Longitude</label>
                <input
                  value={form.longitude}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, longitude: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Longitude coordinate"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Road No</label>
                <input
                  value={form.roadNo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, roadNo: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Road track code"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Section</label>
                <input
                  value={form.section}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, section: e.target.value }))
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Track layout section"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-3 border-t">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                {editTag ? "Update Changes" : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagTable;