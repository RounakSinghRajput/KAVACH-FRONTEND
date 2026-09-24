import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { axiosInstance } from "../../services/axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface Firm {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  ticketNo: string;
  trainNo: string;
  locoNo: string;
  fromStation: string;
  toStation: string;
  description: string;
  status: string;
  assignTo?: string;
  targetDate?: string;
  firm?: Firm;
  [key: string]: any;
}

const CmsTicketAssigned = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assignedTicket, setAssignedTicket] = useState<Ticket | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionRow, setActionRow] = useState<any>(null);

  const [actionData, setActionData] = useState({
    ticketNo: "",
    status: "",
    oemRemark: "",
    finalClosingRemarks: "",
  });

  const fetchTickets = async () => {
    try {
      const authStr = localStorage.getItem("auth");

      let isAdmin = false;

      if (authStr) {
        const auth = JSON.parse(authStr);

        const roles = auth?.user?.roles || [];

        isAdmin = roles.some((r: string) =>
          r.toUpperCase().includes("ROLE_ADMIN"),
        );
      }

      const endpoint = isAdmin ? "/cms/getAllAssigned" : "/cms/assigned";

      const res = await axiosInstance.get(endpoint);
      const data = res.data;

      setTickets(data);

      if (data.length > 0) {
        const latestTicket = data[0]; // newest ticket

        const lastSeenTicket = localStorage.getItem("lastAssignedTicket");

        if (latestTicket.ticketNo !== lastSeenTicket) {
          setAssignedTicket(latestTicket);
          setShowPopup(true);

          localStorage.setItem("lastAssignedTicket", latestTicket.ticketNo);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchTickets();
  }, []);
  // ================== 3. SUBMIT FUNCTION ==================
  const handleActionSubmit = async () => {
    try {
      const payload = {
        ticketNo: actionData.ticketNo,
        status: actionData.status,
        oemRemark: actionData.oemRemark,
        finalClosingRemarks: actionData.finalClosingRemarks,
      };

      await axiosInstance.post("/cms/action", payload);

      alert("Updated Successfully ✅");

      setShowActionModal(false);
      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  /* ---------------------- COUNTS ---------------------- */

  const openCount = tickets.filter((t) => t.status === "OPEN").length;

  const closeCount = tickets.filter((t) => t.status === "CLOSED").length;

  const progressCount = tickets.filter(
    (t) => t.status === "IN_PROGRESS",
  ).length;

  const assignedCount = tickets.length;

  /* ---------------------- TABLE ---------------------- */

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        header: "Ticket",
        accessorFn: (row) => row.ticketNo,
      },
      {
        header: "Train",
        accessorFn: (row) => row.trainNo,
      },
      {
        header: "Loco",
        accessorFn: (row) => row.locoNo,
      },
      {
        header: "From",
        accessorFn: (row) => row.fromStation,
      },
      {
        header: "To",
        accessorFn: (row) => row.toStation,
      },
      {
        header: "Status",
        cell: ({ row }) => (
          <span className="px-3 py-1 text-xs rounded-full bg-yellow-200 text-yellow-800">
            {row.original.status}
          </span>
        ),
      },
      {
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {/* View Button */}
            <button
              onClick={() => setSelectedTicket(row.original)}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
            >
              View
            </button>

            {/* Action Button */}
            <button
              onClick={() => {
                setActionRow(row.original);

                setActionData({
                  ticketNo: row.original.ticketNo,
                  status: "",
                  oemRemark: "",
                  finalClosingRemarks: "",
                });

                setShowActionModal(true);
              }}
              className="px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 text-xs"
            >
              Action
            </button>
          </div>
        ),
      },
    ],
    [],
  );
  const authStr = localStorage.getItem("auth");

  let role = "";

  if (authStr) {
    const auth = JSON.parse(authStr);
    role = auth?.user?.roles?.[0] || "";
  }

  const isAdmin = role.includes("ROLE_ADMIN");

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left */}
          <div>
            <h1 className="text-2xl font-bold text-blue-700 dark:text-white">
              Assigned Tickets
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ticket Assignment Dashboard
            </p>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold">
              Total: {tickets.length}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6">
        {/* ---------------- DASHBOARD CARDS ---------------- */}

        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="text-blue-600 text-3xl">📄</div>
            <div>
              <p className="text-sm text-gray-500">Assigned Tickets</p>
              <h3 className="text-xl font-semibold">{assignedCount}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex items-center gap-4 border-l-4 border-green-500">
            <div className="text-green-600 text-3xl">✔</div>
            <div>
              <p className="text-sm text-gray-500">Closed Tickets</p>
              <h3 className="text-xl font-semibold">{closeCount}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex items-center gap-4 border-l-4 border-orange-500">
            <div className="text-orange-600 text-3xl">⏳</div>

            <div>
              <p className="text-sm text-gray-500">In Progress</p>

              <h3 className="text-xl font-semibold">{progressCount}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 flex items-center gap-4 border-l-4 border-yellow-500">
            <div className="text-yellow-600 text-3xl">⚠</div>
            <div>
              <p className="text-sm text-gray-500">Open Tickets</p>
              <h3 className="text-xl font-semibold">{openCount}</h3>
            </div>
          </div>
        </div>

        {/* ---------------- TABLE ---------------- */}

        <div className="bg-white dark:bg-gray-800 shadow rounded-xl overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 font-semibold">
            Assigned Tickets
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="text-left px-6 py-3 font-medium text-gray-600 dark:text-gray-200"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- ASSIGNED POPUP ---------------- */}

        {showPopup && assignedTicket && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[500px] p-6">
              <h2 className="text-lg font-semibold text-red-500 mb-3">
                🎫 New Ticket Assigned
              </h2>

              <p className="mb-2">
                <b>Ticket:</b> {assignedTicket.ticketNo}
              </p>
              <p className="mb-2">
                <b>Train:</b> {assignedTicket.trainNo}
              </p>
              <p className="mb-4">
                <b>Description:</b> {assignedTicket.description}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPopup(false);
                    setSelectedTicket(assignedTicket);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  View Details
                </button>

                <button
                  onClick={() => setShowPopup(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showActionModal &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-blue-900/30 backdrop-blur-[2px]"
                onClick={() => setShowActionModal(false)}
              />

              {/* Modal */}
              <div className="relative bg-white w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden border border-blue-100">
                {/* 📘 Pure Blue Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      Ticket Action
                    </h2>
                    <p className="text-xs text-blue-100 mt-0.5 font-mono">
                      ID: {actionData.ticketNo}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowActionModal(false)}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>

                {/* 📋 Body */}
                <div className="p-8 space-y-6">
                  {/* Ticket Number */}
                  <div>
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">
                      Ticket Number
                    </label>
                    <input
                      value={actionData.ticketNo}
                      disabled
                      className="w-full h-11 border border-blue-50 rounded-xl px-4 bg-blue-50/50 text-blue-900 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">
                      Update Status
                    </label>
                    <div className="relative">
                      <select
                        value={actionData.status}
                        onChange={(e) =>
                          setActionData({
                            ...actionData,
                            status: e.target.value,
                          })
                        }
                        className="w-full h-12 border border-blue-100 rounded-xl px-4 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="">Select Status</option>
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                      <div className="absolute right-4 top-4 pointer-events-none text-blue-400">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Remark Section */}
                  <div>
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">
                      {isAdmin ? "Final Closing Remark" : "OEM Remark"}
                    </label>

                    <textarea
                      rows={4}
                      value={
                        isAdmin
                          ? actionData.finalClosingRemarks
                          : actionData.oemRemark
                      }
                      onChange={(e) =>
                        setActionData({
                          ...actionData,
                          [isAdmin ? "finalClosingRemarks" : "oemRemark"]:
                            e.target.value,
                        })
                      }
                      placeholder={
                        isAdmin
                          ? "Enter final closing remarks..."
                          : "Enter OEM remarks..."
                      }
                      className="w-full border border-blue-100 rounded-xl px-4 py-3 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* ⚡ Footer */}
                <div className="px-8 py-5 bg-blue-50/50 border-t border-blue-50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="px-6 py-2 rounded-xl text-blue-600 font-semibold hover:bg-blue-100 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleActionSubmit}
                    className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-transform active:scale-95"
                  >
                    Submit Action
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
        {/* ---------------- INFO MODAL ---------------- */}

        {selectedTicket && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[70%] max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
              {/* HEADER */}

              <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-2">
                <h2 className="font-semibold text-sm">CMS TicketDetails</h2>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="bg-white text-blue-600 px-3 py-1 text-xs rounded"
                >
                  Close
                </button>
              </div>

              {/* BODY */}

              <div className="overflow-y-auto max-h-[70vh] p-4">
                <div className="grid md:grid-cols-2 gap-2">
                  {Object.entries(selectedTicket).map(([key, value]) => {
                    if (typeof value === "object") return null;

                    return (
                      <div
                        key={key}
                        className="flex text-sm border border-gray-200 dark:border-gray-700 rounded overflow-hidden"
                      >
                        {/* LABEL */}

                        <div className="w-1/2 px-3 py-2 bg-gray-100 dark:bg-gray-800 font-medium capitalize">
                          {key}
                        </div>

                        {/* VALUE */}

                        <div className="w-1/2 px-3 py-2 bg-white dark:bg-gray-900">
                          {value || "-"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CmsTicketAssigned;
