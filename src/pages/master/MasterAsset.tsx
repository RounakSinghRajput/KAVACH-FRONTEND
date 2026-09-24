import React, { useEffect, useMemo, useState } from "react";
import { Plus, Download, X, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";
import { useNotify } from "../../context/notification-context";
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

interface Station {
  id: number;
  name: string;
  code: string;
  locationType: string;
  division: Division;
  firm?: string;
}

interface AssetRow {
  id: number;
  assetId: string;
  station: Station | null;
  latitude: string | null;
  longitude: string | null;
  doc: string | null;
  codalLife: string | null;
  warrantyPeriod: string | null;
}

const TowerTable: React.FC = () => {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  // search
  const [search, setSearch] = useState("");

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);

  // add modal
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    assetId: "",
    stationId: "",
    latitude: "",
    longitude: "",
    doc: "",
    codalLife: "",
    warrantyPeriod: "",
  });

  const { showAlert, confirm } = useNotify();

  useEffect(() => {
    fetchAssets();
    fetchStations();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/asset/");
      setAssets(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch asset error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await axiosInstance.get("/station/");
      setStations(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch station error:", err);
    }
  };

  /* ---------- SEARCH ---------- */
  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return assets;

    return assets.filter((a) => {
      const stationName = a.station?.name ?? "";
      const stationCode = a.station?.code ?? "";
      const divisionCode = a.station?.division?.code ?? "";
      const firm = a.station?.firm ?? "";
      const locationType = a.station?.locationType ?? "";

      return (
        (a.assetId ?? "").toLowerCase().includes(q) ||
        stationName.toLowerCase().includes(q) ||
        stationCode.toLowerCase().includes(q) ||
        divisionCode.toLowerCase().includes(q) ||
        firm.toLowerCase().includes(q) ||
        locationType.toLowerCase().includes(q)
      );
    });
  }, [assets, search]);

  /* ---------- PAGINATION ---------- */
  const totalPages = Math.ceil(filteredAssets.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAssets.slice(start, start + rowsPerPage);
  }, [filteredAssets, page, rowsPerPage]);

  /* ---------- EXCEL EXPORT ---------- */
  const exportToExcel = () => {
    const data = filteredAssets.map((a, i) => ({
      "S.No": i + 1,
      "Asset Name": a.assetId,
      "Asset Type": "Tower",
      Division: a.station?.division?.code ?? "-",
      Station: a.station ? `${a.station.name} (${a.station.code})` : "-",
      Firm: a.station?.firm ?? "-",
      Location: a.station?.locationType ?? "-",
      Latitude: a.latitude ?? "-",
      Longitude: a.longitude ?? "-",
      DOC: a.doc ?? "-",
      "Codal Life": a.codalLife ?? "-",
      "Warranty Period": a.warrantyPeriod ?? "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TowerAssets");
    XLSX.writeFile(wb, "TowerAssets.xlsx");
  };

  /* ---------- OPEN ADD ---------- */
  const openAdd = () => {
    setForm({
      assetId: "",
      stationId: "",
      latitude: "",
      longitude: "",
      doc: "",
      codalLife: "",
      warrantyPeriod: "",
    });
    setOpenModal(true);
  };

  /* ---------- SUBMIT ADD ---------- */
  const submitForm = async () => {
    if (!form.assetId.trim()) {
      showAlert("Asset Name (Tower) is required", "error");
      return;
    }
    if (!form.stationId) {
      showAlert("Station is required", "error");
      return;
    }

    const payload = {
      assetId: form.assetId.trim(),
      stationId: Number(form.stationId),
      latitude: form.latitude ? String(form.latitude) : "",
      longitude: form.longitude ? String(form.longitude) : "",
      doc: form.doc ?? "",
      codalLife: form.codalLife ?? "",
      warrantyPeriod: form.warrantyPeriod ?? "",
    };

    try {
      await axiosInstance.post("/asset/", payload);
      setOpenModal(false);
      fetchAssets();
    } catch (err) {
      console.error(err);
      showAlert("Add failed", "error");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Asset Master</h1>
      {/* Header */}
      <div className="flex justify-end mb-4">
        {/* ✅ ADD BUTTON */}
        <Can>
          {" "}
          <button
            onClick={openAdd}
            className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center text-white"
          >
            <Plus />
          </button>
        </Can>

        <div className="flex gap-3 items-center">
          <input
            placeholder="Search (Asset/Station/Division/Firm/Location)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="border px-3 py-2 rounded w-80"
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
      <div className="border rounded overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-blue-600 text-white text-sm">
              <th className="border px-3 py-2 whitespace-nowrap">S.No</th>
              <th className="border px-3 py-2 whitespace-nowrap">
                Asset Name (Tower)
              </th>
              <th className="border px-3 py-2 whitespace-nowrap">Asset Type</th>
              <th className="border px-3 py-2 whitespace-nowrap">Division</th>
              <th className="border px-3 py-2 whitespace-nowrap">Station</th>
              <th className="border px-3 py-2 whitespace-nowrap">Firm</th>
              <th className="border px-3 py-2 whitespace-nowrap">
                Location (Type)
              </th>
              <th className="border px-3 py-2 whitespace-nowrap">Latitude</th>
              <th className="border px-3 py-2 whitespace-nowrap">Longitude</th>
              <th className="border px-3 py-2 whitespace-nowrap">DOC</th>
              <th className="border px-3 py-2 whitespace-nowrap">Codal Life</th>
              <th className="border px-3 py-2 whitespace-nowrap">
                Warranty Period
              </th>

              <th className="border px-3 py-2 whitespace-nowrap sticky right-0 bg-blue-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={13} className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}

            {!loading &&
              paginatedData.map((a, i) => (
                <tr key={a.id} className="even:bg-gray-100 text-sm">
                  <td className="border px-3 py-2 text-center">
                    {page * rowsPerPage + i + 1}
                  </td>

                  <td className="border px-3 py-2 text-center">{a.assetId}</td>
                  <td className="border px-3 py-2 text-center">Tower</td>

                  <td className="border px-3 py-2 text-center">
                    {a.station?.division?.code ?? "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.station ? `${a.station.name} (${a.station.code})` : "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.station?.firm || "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.station?.locationType || "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.latitude ?? "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.longitude ?? "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.doc || "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.codalLife || "-"}
                  </td>

                  <td className="border px-3 py-2 text-center">
                    {a.warrantyPeriod || "-"}
                  </td>

                  {/* 🔒 Disabled Action Icons */}
                  <td className="border px-3 py-2 sticky right-0 bg-white">
                    <div className="flex justify-center gap-4 opacity-40 cursor-not-allowed">
                      <button disabled className="text-green-600">
                        <Pencil size={18} />
                      </button>
                      <button disabled className="text-orange-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {!loading && paginatedData.length === 0 && (
              <tr>
                <td colSpan={13} className="py-6 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <TablePagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredAssets.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
      />

      {/* ✅ ADD MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[560px] p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Add Tower Asset</h2>
              <button onClick={() => setOpenModal(false)}>
                <X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-600">
                  Asset Name (Tower)
                </label>
                <input
                  value={form.assetId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, assetId: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="RT-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Station</label>
                <select
                  value={form.stationId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stationId: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Station</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Latitude</label>
                <input
                  value={form.latitude}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, latitude: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="19.147887"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Longitude</label>
                <input
                  value={form.longitude}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, longitude: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="77.508756"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">DOC</label>
                <input
                  value={form.doc}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, doc: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="DOC"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Codal Life</label>
                <input
                  value={form.codalLife}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, codalLife: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="year"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-gray-600">Warranty Period</label>
                <input
                  value={form.warrantyPeriod}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, warrantyPeriod: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                  placeholder="year"
                />
              </div>
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
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TowerTable;
