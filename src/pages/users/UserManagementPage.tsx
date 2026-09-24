import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Download, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import { api } from "../../services/api"; // Path to your API file containing api.auth.getCurrentUser
import AddUserForm from "../../components/AddUserForm/AddUser";
import TablePagination from "../../components/common/TablePaginatio";
import { useNotify } from "../../context/notification-context";

/* ================= TYPES ================= */

interface Role {
  id: number;
  name: string;
}

interface RoleFromApi {
  id: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  empCode?: string | null;
  name: string;
  status: "Active" | "Inactive";
  mobile?: string | null;
  roles: RoleFromApi[];
  firm?: { id: number }[];
  zone?: { id: number; code: string };
  division?: { id: number }[];
  remarks?: string | null;
}

/* ================= HELPERS ================= */

const safeText = (value: any) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

/* ================= COMPONENT ================= */

export default function UserManagementPage() {
  const { showAlert, confirm } = useNotify();

  // Logged-in user role check state
  const [isRdsoAdmin, setIsRdsoAdmin] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleMap, setRoleMap] = useState<Record<number, string>>({});

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showFilters, setShowFilters] = useState(false);

  const [zoneMap, setZoneMap] = useState<Record<number, string>>({});
  const [divisionMap, setDivisionMap] = useState<Record<number, string>>({});
  const [firmMap, setFirmMap] = useState<Record<number, string>>({});

  /* ================= FETCH DATA ================= */

  // Retrieve current logged-in user details from auth storage via api helper
  const checkCurrentUserRole = async () => {
    try {
      const authPayload = await api.auth.getCurrentUser();
      if (authPayload?.user?.roles) {
        const hasRdsoRole = authPayload.user.roles.includes("ROLE_RDSO_ADMIN");
        setIsRdsoAdmin(hasRdsoRole);
      }
    } catch (error) {
      console.error("Failed to read auth state:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/user/");

      const normalizedUsers = (res.data.data ?? []).map((u: any) => ({
        ...u,
        roles: Array.isArray(u.roles) ? u.roles : [],
        division: Array.isArray(u.division) ? u.division : [],
        firm: Array.isArray(u.firm) ? u.firm : [],
      }));

      setUsers(normalizedUsers);
    } catch {
      showAlert("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await axiosInstance.get("/zone/");
      const list = res.data.data ?? [];

      const map: Record<number, string> = {};
      list.forEach((z: any) => (map[z.id] = z.name));

      setZoneMap(map);
    } catch {
      showAlert("Failed to load zones", "error");
    }
  };

  const fetchDivisions = async () => {
    try {
      const res = await axiosInstance.get("/division/");
      const list = res.data.data ?? [];

      const map: Record<number, string> = {};
      list.forEach((d: any) => (map[d.id] = d.name));

      setDivisionMap(map);
    } catch {
      showAlert("Failed to load divisions", "error");
    }
  };

  const fetchFirms = async () => {
    try {
      const res = await axiosInstance.get("/firm/");
      const list = res.data.data ?? [];

      const map: Record<number, string> = {};
      list.forEach((f: any) => (map[f.id] = f.name));

      setFirmMap(map);
    } catch {
      showAlert("Failed to load firms", "error");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axiosInstance.get("/role/");
      const roleList: Role[] = res.data.data ?? [];
      setRoles(roleList);

      const map: Record<number, string> = {};
      roleList.forEach((r) => (map[r.id] = r.name));
      setRoleMap(map);
    } catch {
      showAlert("Failed to load roles", "error");
    }
  };

  useEffect(() => {
    checkCurrentUserRole();
    fetchUsers();
    fetchRoles();
    fetchZones();
    fetchDivisions();
    fetchFirms();
  }, []);

  useEffect(() => setPage(0), [search, roleFilter, statusFilter]);

  /* ================= FILTER DATA ================= */

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();

    return users.filter((u) => {
      const searchOk =
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q);

      const roleOk =
        roleFilter === "ALL" ||
        (Array.isArray(u.roles) &&
          u.roles.some((r) => roleMap[r.id] === roleFilter));

      const statusOk = statusFilter === "ALL" || u.status === statusFilter;

      return searchOk && roleOk && statusOk;
    });
  }, [users, search, roleFilter, statusFilter, roleMap]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  /* ================= ACTIONS ================= */

  const openAdd = () => {
    setEditUser(null);
    setOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setOpen(true);
  };

  const remove = (id: number) => {
    confirm({
      title: "Delete User",
      message: "Are you sure you want to delete this user?",
      onConfirm: async () => {
        await axiosInstance.delete(`/user/delete/${id}`);
        fetchUsers();
        showAlert("User deleted successfully", "success");
      },
    });
  };

  const exportExcel = () => {
    const data = filteredUsers.map((u, i) => ({
      "S.No": i + 1,
      Name: u.name,
      Username: u.username,
      Email: u.email,
      Mobile: u.mobile ?? "-",
      "Emp Code": u.empCode ?? "-",
      Roles: Array.isArray(u.roles)
        ? u.roles.map((r) => roleMap[r.id]).join(", ")
        : "-",
      Status: u.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users.xlsx");
  };

  /* ================= UI ================= */

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg">
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">User Management</h1>
      <div className="flex items-center justify-between mb-4">
        {/* LEFT: Search */}
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-52 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* RIGHT: Add + Filters + Export */}
        <div className="flex items-center gap-3">
          {/* Add User Button (Hidden for ROLE_RDSO_ADMIN) */}
          {/* {!isRdsoAdmin && ( */}
          <button
            onClick={openAdd}
            title="Add"
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center text-white shadow"
          >
            <Plus size={22} />
          </button>
          {/* // )} */}

          {/* Filters */}
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="h-11 px-4 border rounded-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter size={18} />
            <span>Filters</span>

            {(roleFilter !== "ALL" || statusFilter !== "ALL") && (
              <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {(roleFilter !== "ALL" ? 1 : 0) +
                  (statusFilter !== "ALL" ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Export */}
          <button
            onClick={exportExcel}
            className="h-11 px-4 border border-blue-500 text-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-50"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* FILTERS */}
      {showFilters && (
        <div className="mb-4 rounded-xl border bg-white shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Clear */}
            <button
              onClick={() => {
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="border rounded px-4 py-2 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-blue-600 text-white">
            <tr>
              {[
                "S.No",
                "Name",
                "Username",
                "Zone",
                "Division",
                "Firm",
                "Roles",
                "Status",
                !isRdsoAdmin && "Actions", // Hide Header for ROLE_RDSO_ADMIN
              ]
                .filter(Boolean)
                .map((h) => (
                  <th key={String(h)} className="border px-3 py-2 text-sm">
                    {h}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((u, i) => (
              <tr key={u.id} className="hover:bg-blue-50 transition-colors">
                <td className="td text-center">{page * rowsPerPage + i + 1}</td>

                <td className="td">{safeText(u.name)}</td>
                <td className="td">{u.username}</td>

                <td className="td">{u.zone?.code || "-"}</td>

                <td className="td">
                  {Array.isArray(u.division)
                    ? u.division.map((d) => divisionMap[d.id]).join(", ")
                    : "-"}
                </td>

                <td className="td">
                  {Array.isArray(u.firm)
                    ? u.firm.map((f) => firmMap[f.id]).join(", ")
                    : "-"}
                </td>

                <td className="td">
                  {Array.isArray(u.roles)
                    ? u.roles.map((r) => roleMap[r.id]).join(", ")
                    : "-"}
                </td>

                <td className="td">
                  <StatusPill status={u.status} />
                </td>

                {/* Hide Actions Column for ROLE_RDSO_ADMIN */}
                {!isRdsoAdmin && (
                  <td className="td">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEdit(u)}
                        title="Edit"
                        className="p-1 rounded hover:bg-blue-100"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        onClick={() => remove(u.id)}
                        title="Delete"
                        className="p-1 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredUsers.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
      />

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <AddUserForm
            editUser={editUser}
            onClose={() => setOpen(false)}
            onSuccess={() => {
              fetchUsers();
              showAlert(
                editUser
                  ? "User updated successfully"
                  : "User added successfully",
                "success",
              );
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === "Active";

  return (
    <span
      className={`px-3 py-1 text-xs font-semibold rounded-full ${
        isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}
