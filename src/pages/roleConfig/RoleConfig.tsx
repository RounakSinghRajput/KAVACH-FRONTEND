import React, { useState, useEffect } from "react";
import {
  addRoleMenuPermission,
  fetchRoleMatrix,
  removeRoleMenuPermission,
  RoleDTO,
  RoleMenuMatrixDTO,
  RoleMatrixResponseDTO,
} from "../../api/roleApi";
import { useNotify } from "../../context/notification-context";
import MenuPermissionPage from "./AddMenuPermission";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
// ── Helpers ────────────────────────────────────────────────────────────────────
function groupByMenu(matrix: RoleMenuMatrixDTO[]) {
  return matrix.reduce<Record<string, RoleMenuMatrixDTO[]>>((acc, row) => {
    (acc[row.navMenu] = acc[row.navMenu] || []).push(row);
    return acc;
  }, {});
}

const MENU_COLORS: Record<string, string> = {
  Dashboard: "#6366f1",
  Reports: "#0ea5e9",
  "User Mgmt": "#10b981",
  Settings: "#f59e0b",
  Audit: "#ef4444",
};
const DEFAULT_COLOR = "#8b5cf6";
function menuColor(menu: string) {
  return MENU_COLORS[menu] ?? DEFAULT_COLOR;
}

// ── StatCard ───────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: string | number;
  accent: string;
}> = ({ label, value, accent }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statValue, color: accent }}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const RoleConfig: React.FC = () => {
  const [data, setData] = useState<RoleMatrixResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [localMatrix, setLocalMatrix] = useState<RoleMenuMatrixDTO[]>([]);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [collapsedMenus, setCollapsedMenus] = useState<Set<string>>(new Set());
  const [activePage, setActivePage] = useState<"roleConfig" | "menuPermission">(
    "roleConfig",
  );
  const { showAlert } = useNotify();

  useEffect(() => {
    const loadData = async () => {
      const matrixData = await fetchRoleMatrix();
      setData(matrixData);
      const sortedMatrix = [...matrixData.matrix].sort(
        (a: RoleMenuMatrixDTO, b: RoleMenuMatrixDTO) => a.id - b.id,
      );
      setLocalMatrix(sortedMatrix);

      const groupedMenus = Object.keys(groupByMenu(sortedMatrix));
      setCollapsedMenus(new Set(groupedMenus.slice(1)));

      setLoading(false);
    };

    loadData();
  }, []);

  const toggleAccess = async (rowId: number, roleId: number) => {
    const key = `${rowId}-${roleId}`;
    if (pendingActions.has(key)) return;

    const row = localMatrix.find((r) => r.id === rowId);
    const current = row?.roleAccess[roleId] ?? false;

    setPendingActions((prev) => new Set(prev).add(key));

    try {
      const success = current
        ? await removeRoleMenuPermission(rowId, roleId)
        : await addRoleMenuPermission(rowId, roleId);

      if (!success) {
        throw new Error("API update failed");
      }

      setLocalMatrix((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, roleAccess: { ...r.roleAccess, [roleId]: !current } }
            : r,
        ),
      );

      showAlert(
        current ? "Removed Successfully" : "Added Successfully",
        "success",
      );
    } catch (error) {
      console.error("Permission toggle error:", error);
      showAlert("Action failed. Please try again.", "error");
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const toggleMenu = (menu: string) => {
    setCollapsedMenus((prev) => {
      const next = new Set(prev);
      next.has(menu) ? next.delete(menu) : next.add(menu);
      return next;
    });
  };

  const filtered = localMatrix
    .filter(
      (row) =>
        row.navMenu.toLowerCase().includes(search.toLowerCase()) ||
        row.navSubmenu.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.id - b.id); // Sort by sequence (ID)
  const grouped = groupByMenu(filtered);

  // ── Loading ──
  if (loading)
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading permission matrix…</p>
      </div>
    );

  const roles = data!.roles.sort((a, b) => a.id - b.id); // Sort by sequence (ID)
  const totalAccess = localMatrix.reduce(
    (s, row) => s + Object.values(row.roleAccess).filter(Boolean).length,
    0,
  );
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const data: any[][] = [];

    const header = ["Menu", "Submenu", ...roles.map((r) => r.name)];
    data.push(header);

    Object.entries(groupByMenu(filtered)).forEach(([menu, rows]) => {
      rows.forEach((row, index) => {
        const rowData = [
          index === 0 ? menu : "",
          row.navSubmenu,
          ...roles.map((role) => (row.roleAccess[role.id] ? "✓ YES" : "✗ NO")),
        ];

        data.push(rowData);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // column widths
    ws["!cols"] = [{ wch: 22 }, { wch: 35 }, ...roles.map(() => ({ wch: 16 }))];

    // freeze top row
    ws["!freeze"] = {
      xSplit: 2,
      ySplit: 1,
    };

    const range = XLSX.utils.decode_range(ws["!ref"] || "");

    for (let R = 0; R <= range.e.r; ++R) {
      for (let C = 0; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        // header row
        if (R === 0) {
          ws[cellRef].s = {
            font: {
              bold: true,
              color: { rgb: "FFFFFF" },
            },
            fill: {
              fgColor: { rgb: "4F46E5" },
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
            },
            border: {
              top: { style: "thin", color: { rgb: "D1D5DB" } },
              bottom: { style: "thin", color: { rgb: "D1D5DB" } },
              left: { style: "thin", color: { rgb: "D1D5DB" } },
              right: { style: "thin", color: { rgb: "D1D5DB" } },
            },
          };
        }

        // menu column
        else if (C === 0 && ws[cellRef].v) {
          ws[cellRef].s = {
            font: {
              bold: true,
              color: { rgb: "FFFFFF" },
            },
            fill: {
              fgColor: { rgb: "7C3AED" },
            },
            alignment: {
              vertical: "center",
            },
          };
        }

        // YES cells
        else if (
          typeof ws[cellRef].v === "string" &&
          ws[cellRef].v.includes("YES")
        ) {
          ws[cellRef].s = {
            font: {
              bold: true,
              color: { rgb: "15803D" },
            },
            fill: {
              fgColor: { rgb: "DCFCE7" },
            },
            alignment: {
              horizontal: "center",
            },
          };
        }

        // NO cells
        else if (
          typeof ws[cellRef].v === "string" &&
          ws[cellRef].v.includes("NO")
        ) {
          ws[cellRef].s = {
            font: {
              bold: true,
              color: { rgb: "B91C1C" },
            },
            fill: {
              fgColor: { rgb: "FEE2E2" },
            },
            alignment: {
              horizontal: "center",
            },
          };
        }

        // normal cells
        else {
          ws[cellRef].s = {
            border: {
              top: { style: "thin", color: { rgb: "E2E8F0" } },
              bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              left: { style: "thin", color: { rgb: "E2E8F0" } },
              right: { style: "thin", color: { rgb: "E2E8F0" } },
            },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, ws, "Role Matrix");

    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([buffer], {
        type: "application/octet-stream",
      }),
      "Role-Permission-Matrix.xlsx",
    );
  };

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.headerTop}>
        <div style={styles.segmentWrap}>
          <button
            onClick={() => setActivePage("roleConfig")}
            style={{
              ...styles.segmentBtn,
              ...(activePage === "roleConfig" ? styles.segmentActive : {}),
            }}
          >
            <span style={styles.iconBadge}>🔐</span>
            Menu Permission
          </button>

          <button
            onClick={() => setActivePage("menuPermission")}
            style={{
              ...styles.segmentBtn,
              ...(activePage === "menuPermission" ? styles.segmentActive : {}),
            }}
          >
            <span style={styles.iconBadge}>⚙</span>Menu Config
          </button>
        </div>

        {activePage === "roleConfig" && (
          <div style={styles.statsRow}>
            <StatCard label="Roles" value={roles.length} accent="#6366f1" />
            <StatCard
              label="Submenus"
              value={localMatrix.length}
              accent="#0ea5e9"
            />
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      {activePage === "roleConfig" && (
        <div style={styles.toolbar}>
          <div style={styles.searchWrap}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              style={styles.searchInput}
              placeholder="Search menu or submenu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={styles.smallHint}>
              Click any permission cell to add/remove access instantly.
            </span>
            <button style={styles.exportBtn} onClick={exportToExcel}>
              Export Excel
            </button>
          </div>
        </div>
      )}

      {/* ── Matrix Table ── */}
      {activePage === "roleConfig" ? (
        <>
          <div style={styles.tableWrap}>
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {/* color stripe column */}
                    <th
                      style={{
                        width: 6,
                        padding: 0,
                        borderBottom: "2px solid #e2e8f0",
                        position: "sticky",
                        top: 0,
                        zIndex: 25,
                        background: "#f8fafc",
                      }}
                    />
                    <th style={styles.thSub}>Submenu</th>
                    {roles.map((role) => (
                      <th key={role.id} style={styles.thRole}>
                        <div style={styles.roleChip}>{role.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([menu, rows]) => {
                    const color = menuColor(menu);
                    const collapsed = collapsedMenus.has(menu);
                    const menuAccess = rows.reduce(
                      (s, r) =>
                        s + Object.values(r.roleAccess).filter(Boolean).length,
                      0,
                    );
                    const menuPct = Math.round(
                      (menuAccess / (rows.length * roles.length)) * 100,
                    );

                    return (
                      <React.Fragment key={menu}>
                        {/* Group Header */}
                        <tr
                          style={styles.groupRow}
                          onClick={() => toggleMenu(menu)}
                        >
                          {/* sticky color stripe */}
                          <td
                            style={{
                              background: color,
                              width: 6,
                              padding: 0,
                              position: "sticky",
                              left: -1,
                              zIndex: 30,
                            }}
                          />
                          <td style={styles.groupStickyCell}>
                            <div style={styles.groupInner}>
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={color}
                                strokeWidth="2.5"
                                style={{
                                  transform: collapsed
                                    ? "rotate(-90deg)"
                                    : "rotate(0)",
                                  transition: "transform 0.2s",
                                  flexShrink: 0,
                                }}
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>

                              <span style={{ ...styles.groupName, color }}>
                                {menu}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Data Rows */}
                        {!collapsed &&
                          rows.map((row, i) => (
                            <tr
                              key={row.id}
                              style={{
                                background: i % 2 === 0 ? "#fafbfc" : "#fff",
                                transition: "background 0.1s",
                              }}
                            >
                              <td
                                style={{
                                  background: color,
                                  opacity: 0.18,
                                  width: 6,
                                  padding: 0,
                                  position: "sticky",
                                  left: 0,
                                  zIndex: 15,
                                }}
                              />
                              <td style={styles.tdSub}>
                                <span style={styles.submenuText}>
                                  {row.navSubmenu}
                                </span>
                              </td>
                              {roles.map((role) => {
                                const on = row.roleAccess[role.id] ?? false;
                                const actionKey = `${row.id}-${role.id}`;
                                const pending = pendingActions.has(actionKey);
                                return (
                                  <td key={role.id} style={styles.tdCell}>
                                    <button
                                      title={`${role.name}: ${on ? "Has access" : "No access"}`}
                                      type="button"
                                      disabled={pending}
                                      style={{
                                        ...styles.chip,
                                        ...(on
                                          ? {
                                              background: "#dcfce7",
                                              color: "#15803d",
                                              boxShadow: "0 0 0 1.5px #86efac",
                                            }
                                          : {
                                              background: "#fee2e2",
                                              color: "#b91c1c",
                                              boxShadow: "0 0 0 1.5px #fca5a5",
                                            }),
                                        cursor: pending ? "wait" : "pointer",
                                        opacity: pending ? 0.7 : 1,
                                      }}
                                      onClick={() =>
                                        toggleAccess(row.id, role.id)
                                      }
                                    >
                                      {on ? (
                                        <svg
                                          width="13"
                                          height="13"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                        >
                                          <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                      ) : (
                                        <svg
                                          width="13"
                                          height="13"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                        >
                                          <path d="M18 6 6 18M6 6l12 12" />
                                        </svg>
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <span style={styles.legendItem}>
              <span
                style={{
                  ...styles.legendDot,
                  background: "#dcfce7",
                  boxShadow: "0 0 0 1.5px #86efac",
                }}
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="3"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              Has access
            </span>
            <span style={styles.legendItem}>
              <span
                style={{
                  ...styles.legendDot,
                  background: "#fee2e2",
                  boxShadow: "0 0 0 1.5px #fca5a5",
                }}
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
              No access
            </span>
            <span style={{ ...styles.legendItem, color: "#475569" }}>
              Click a cell to toggle access instantly.
            </span>
          </div>
        </>
      ) : (
        <MenuPermissionPage />
      )}
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    fontSize: 15,
    background: "#f1f5f9",
    minHeight: "100vh",
    padding: "28px 32px",
    boxSizing: "border-box",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: 16,
    background: "#f1f5f9",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#64748b", fontSize: 14 },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 20,
  },
  eyebrow: {
    display: "inline-block",
    background: "#ede9fe",
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "3px 10px",
    borderRadius: 20,
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 4px",
    lineHeight: 1.2,
  },
  subtitle: { fontSize: 14, color: "#64748b", margin: 0 },

  statsRow: { display: "flex", gap: 10 },
  statCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "12px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    textAlign: "center" as const,
    minWidth: 90,
  },
  statValue: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 500 },

  // Toolbar
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
    flexWrap: "wrap" as const,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "8px 14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    minWidth: 250,
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#334155",
    background: "transparent",
    width: "100%",
  },
  savedBadge: {
    background: "#dcfce7",
    color: "#16a34a",
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
  },
  smallHint: {
    color: "#475569",
    fontSize: 13,
    fontWeight: 600,
  },
  btnEdit: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(99,102,241,0.35)",
  },
  btnSave: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
  },
  btnDiscard: {
    background: "#fff",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "9px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  editBanner: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 14,
    padding: "9px 14px",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 10,
    fontSize: 13,
    color: "#92400e",
    fontWeight: 500,
  },

  // Table
  tableWrap: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tableScroll: {
    overflowX: "auto" as const,
    overflowY: "auto" as const,
    maxHeight: "75vh", // adjust as needed
    position: "relative" as const,
  },

  table: {
    width: "100%",
    // borderCollapse: "collapse" as const,
    borderCollapse: "separate" as const,
    border: "1px solid #e2e8f0",
    borderSpacing: 0,
  },

  thSub: {
    textAlign: "left" as const,
    padding: "13px 16px",
    borderBottom: "2px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    fontSize: 11,
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    minWidth: 170,

    position: "sticky",
    top: 0,
    left: -1,
    zIndex: 30,
    background: "#f8fafc",
  },
  thRole: {
    textAlign: "center" as const,
    padding: "10px 8px",
    borderBottom: "2px solid #e2e8f0",
    borderLeft: "1px solid #e2e8f0",
    minWidth: 95,

    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "#f8fafc",
  },
  roleChip: {
    display: "inline-block",
    background: "#e0f2fe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 22,
    letterSpacing: "0.04em",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.12)",
  },

  // Group row
  groupRow: {
    cursor: "pointer",
    background: "#f8fafc",
    userSelect: "none" as const,
  },
  groupCell: { padding: "9px 14px", borderBottom: "1px solid #e2e8f0" },
  groupInner: { display: "flex", alignItems: "center", gap: 10 },
  groupName: { fontSize: 13, fontWeight: 800, minWidth: 100 },
  groupCount: { fontSize: 12, color: "#94a3b8" },
  miniTrack: {
    flex: 1,
    maxWidth: 100,
    height: 4,
    background: "#e2e8f0",
    borderRadius: 99,
    overflow: "hidden",
  },
  miniFill: { height: "100%", borderRadius: 99, transition: "width 0.4s" },
  groupPct: {
    fontSize: 12,
    fontWeight: 700,
    minWidth: 30,
    textAlign: "right" as const,
  },

  // Data rows
  tdSub: {
    padding: "10px 16px",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    verticalAlign: "middle" as const,

    position: "sticky",
    left: -1,
    background: "#fff",
    zIndex: 10,
  },
  submenuText: { fontSize: 13.5, color: "#334155", fontWeight: 500 },
  tdCell: {
    textAlign: "center" as const,
    padding: "8px 6px",
    borderBottom: "1px solid #e2e8f0",
    borderLeft: "1px solid #e2e8f0",
    verticalAlign: "middle" as const,
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: 9,
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },

  // Legend
  legend: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    marginTop: 14,
    fontSize: 12,
    color: "#64748b",
  },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  segmentWrap: {
    display: "inline-flex",
    alignItems: "center",
    padding: 4,
    gap: 4,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    marginBottom: 20,
  },

  segmentBtn: {
    border: "none",
    outline: "none",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s ease",
  },

  segmentActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.22)",
  },

  iconBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.18)",
    fontSize: 11,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 16,
  },
  groupStickyCell: {
    padding: "9px 14px",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    left: -1,
    background: "#f8fafc",
    zIndex: 29,
    minWidth: 170,
  },
  exportBtn: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
  },
};

export default RoleConfig;
