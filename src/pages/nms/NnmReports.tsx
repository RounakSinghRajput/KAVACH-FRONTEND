import { useEffect, useState } from "react";
// import { axiosInstance } from "../../services/axios";
// import DynamicReportPage from "../nms/Report";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  Search,
  // Eye,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { axiosInstance } from "../../services/axios";
import Select from "react-select";

interface SubPacket {
  id: number;
  code: string;
  name: string;
  color: string;
}

interface Packet {
  id: number;
  name: string;
  subPackets: SubPacket[];
}

const VALID_DIVISIONS = [
  "Secunderabad",
  "Hyderabad",
  "Vadodara",
  "Agra",
  "Delhi",
  "Kota",
  "Din Dayal Upadhyay",
  "Howrah",
  "Asansol",
];

const ReportsDashboard = () => {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(
    sessionStorage.getItem("selectedDivision") || "ALL",
  );
  const [divisions, setDivisions] = useState<any[]>([]);

  const navigate = useNavigate();

  const isValidDivision = VALID_DIVISIONS.includes(division);

  const isDivisionSelected = division !== "ALL";
  const hasData = VALID_DIVISIONS.includes(division);

  const loadDivisions = async () => {
    const res = await axiosInstance.get("/division/");
    setDivisions(res.data?.data || []);
  };

  useEffect(() => {
    loadPackets();
    loadDivisions();
  }, []);

  useEffect(() => {
    loadPackets();
  }, []);
  useEffect(() => {
    setExpanded([]);
    sessionStorage.setItem("selectedDivision", division);
  }, [division]);
  const loadPackets = async () => {
    try {
      // hardcoded data
      const data: Packet[] = [
        {
          id: 1,
          name: "STATION REGULAR",
          subPackets: [
            {
              id: 1,
              code: "MA",
              name: "MOVEMENT AUTHORITY",
              color: "from-blue-500 to-blue-700",
            },
            {
              id: 2,
              code: "SSP",
              name: "STATIC SPEED PROFILE",
              color: "from-cyan-500 to-cyan-700",
            },
            {
              id: 3,
              code: "GP",
              name: "GRADIENT PROFILE",
              color: "from-violet-500 to-violet-700",
            },
            {
              id: 4,
              code: "LGP",
              name: "LC GATE PROFILE",
              color: "from-orange-500 to-orange-700",
            },
            {
              id: 5,
              code: "TSP",
              name: "TURNOUT SPEED PROFILE",
              color: "from-emerald-500 to-emerald-700",
            },
            {
              id: 6,
              code: "TLI",
              name: "TAG LINKING INFO",
              color: "from-rose-500 to-rose-700",
            },
            {
              id: 7,
              code: "TCD",
              name: "TRACK CONDITION DATA",
              color: "from-sky-500 to-sky-700",
            },
            {
              id: 8,
              code: "TP",
              name: "TSR PROFILE",
              color: "from-teal-500 to-teal-700",
            },
            {
              id: 9,
              code: "AA",
              name: "ACCESS AUTHORITY",
              color: "from-purple-500 to-purple-700",
            },
            {
              id: 10,
              code: "AE",
              name: "ADDITIONAL EMERGENCY",
              color: "from-red-500 to-red-700",
            },
          ],
        },
        {
          id: 2,
          name: "STATION POSITION INFO",
          subPackets: [
            {
              id: 9,
              code: "SP1",
              name: "SIGNAL POSITION",
              color: "from-indigo-500 to-indigo-700",
            },
            {
              id: 10,
              code: "SP2",
              name: "POINT MACHINE POSITION",
              color: "from-pink-500 to-pink-700",
            },
          ],
        },
        {
          id: 3,
          name: "LOCO POSITION INFO",
          subPackets: [
            {
              id: 11,
              code: "LR",
              name: "LOCO REGULAR",
              color: "from-green-500 to-green-700",
            },
            {
              id: 12,
              code: "AR",
              name: "ACCESS REQUEST",
              color: "from-blue-500 to-blue-700",
            },
          ],
        },
        {
          id: 4,
          name: "KAVACH HEALTH",
          subPackets: [
            {
              id: 13,
              code: "SH",
              name: "STATION HEALTH",
              color: "from-blue-500 to-blue-700",
            },
            {
              id: 14,
              code: "LH",
              name: "LOCO HEALTH",
              color: "from-blue-500 to-blue-700",
            },
          ],
        },
      ];

      setPackets(data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleExpand = (id: number) => {
    if (expanded.includes(id)) {
      setExpanded(expanded.filter((x) => x !== id));
    } else {
      setExpanded([...expanded, id]);
    }
  };

  const expandAll = () => {
    setExpanded(packets.map((x) => x.id));
  };

  const collapseAll = () => {
    setExpanded([]);
  };

  const handleView = (report: SubPacket) => {
    navigate(
      `/nms-report-view/${report.id}/${report.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
      {
        state: {
          division,
        },
      },
    );
  };

  const filteredPackets = packets
    .map((packet) => {
      const matchedReports = packet.subPackets.filter(
        (report) =>
          report.name.toLowerCase().includes(search.toLowerCase()) ||
          report.code.toLowerCase().includes(search.toLowerCase()),
      );

      const packetMatch = packet.name
        .toLowerCase()
        .includes(search.toLowerCase());

      if (packetMatch) return packet;

      if (matchedReports.length > 0) {
        return {
          ...packet,
          subPackets: matchedReports,
        };
      }

      return null;
    })
    .filter((packet): packet is Packet => packet !== null);

  const EmptyState = () => (
    <div className="mt-16 flex justify-center">
      <div className="relative bg-white/70 backdrop-blur-xl border border-blue-100 p-8 rounded-3xl text-center shadow-lg max-w-md w-full">
        {/* Icon Circle */}
        <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 mb-4 shadow-inner">
          <span className="text-2xl">📊</span>
        </div>

        {/* Title */}
        <h2 className="text-blue-800 font-semibold text-xl tracking-wide">
          Select a Division
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-sm mt-2 leading-relaxed">
          Choose a division from the dropdown above to view available reports.
        </p>

        {/* Divider */}
        <div className="my-5 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>

        {/* Hint */}
        <p className="text-xs text-gray-400">
          Only selected divisions have report data
        </p>
      </div>
    </div>
  );

  const NoDataState = () => (
    <div className="mt-16 flex justify-center">
      <div className="bg-white border border-yellow-200 p-8 rounded-3xl text-center shadow-md max-w-md w-full">
        <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-yellow-100 mb-4">
          <span className="text-2xl">📭</span>
        </div>

        <h2 className="text-yellow-700 font-semibold text-xl">
          No Reports Found
        </h2>

        <p className="text-gray-600 text-sm mt-2">
          No data available for the selected division.
        </p>
      </div>
    </div>
  );
  const divisionOptions = [
    { value: "ALL", label: "All Divisions" },
    ...VALID_DIVISIONS.map((d) => ({
      value: d,
      label: d,
    })),
  ];
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl shadow-lg p-5 text-white border border-blue-300/30">
        <div className="flex items-center gap-3">
          <BarChart3 size={30} className="text-blue-100" />

          <h1 className="text-2xl font-bold tracking-wide">
            Reports Dashboard
          </h1>
        </div>

        {/* <p className="mt-1 text-blue-100 text-sm">
          Select reports to view analytics and packet data
        </p> */}
      </div>

      {/* Search */}
      <div className="mt-6 bg-white rounded-2xl shadow-md px-5 py-4 flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-[400px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            placeholder="Search reports..."
            disabled={!isValidDivision}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500
      ${!isValidDivision ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
        </div>
        {/* Division (React Select) */}
        <div className="flex items-center gap-2 min-w-[260px]">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
            Division:
          </label>

          <div className="flex-1 min-w-[180px]">
            <Select
              options={divisionOptions}
              value={divisionOptions.find((d) => d.value === division)}
              onChange={(selected) => setDivision(selected?.value || "ALL")}
              isSearchable
              placeholder="Select..."
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "12px",
                  minHeight: "42px",
                  borderColor: "#e5e7eb",
                  boxShadow: "none",
                }),
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* <button className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow whitespace-nowrap">
            {packets.reduce((a, b) => a + b.subPackets.length, 0)} Reports
          </button> */}

          <button
            onClick={collapseAll}
            className="border px-3 py-2.5 rounded-xl font-medium hover:bg-slate-100 whitespace-nowrap"
          >
            Collapse
          </button>

          <button
            onClick={expandAll}
            className="border px-3 py-2.5 rounded-xl font-medium hover:bg-slate-100 whitespace-nowrap"
          >
            Expand
          </button>
        </div>
      </div>

      {/* Packets */}
      {/* Packets */}
      <div className="mt-5">
        {!isDivisionSelected ? (
          <EmptyState />
        ) : !hasData ? (
          <NoDataState />
        ) : (
          <div className="space-y-4">
            {filteredPackets.map((packet) => {
              const isOpen = expanded.includes(packet.id);

              return (
                <div
                  key={packet.id}
                  className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                >
                  {/* Packet Header */}
                  <div
                    onClick={() => {
                      if (!isValidDivision) return;
                      toggleExpand(packet.id);
                    }}
                    className={`px-5 py-4 flex justify-between items-center transition
    ${
      !isValidDivision
        ? "cursor-not-allowed bg-gray-100 opacity-60"
        : "cursor-pointer hover:bg-slate-50"
    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen size={18} className="text-blue-600" />

                      <h2 className="text-base font-semibold text-slate-800">
                        {packet.name}
                      </h2>

                      <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                        {packet.subPackets.length}
                      </span>
                    </div>

                    {isOpen ? (
                      <ChevronUp size={18} className="text-slate-500" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-500" />
                    )}
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div className="p-4 bg-slate-50 border-t">
                      {packet.name === "STATION REGULAR" ? (
                        <>
                          {/* Title */}
                          <h3 className="text-blue-700 font-semibold mb-4">
                            Station to onboard regular
                          </h3>

                          {/* First 8 Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {packet.subPackets.slice(0, 8).map((report) => (
                              <div
                                key={report.id}
                                className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 overflow-hidden group"
                              >
                                <div
                                  className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${report.color}`}
                                />

                                <div className="p-4 pl-5">
                                  <span
                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${report.color}`}
                                  >
                                    {report.code}
                                  </span>

                                  <h3 className="mt-3 text-sm font-semibold text-slate-800">
                                    {report.name}
                                  </h3>

                                  <button
                                    onClick={() => handleView(report)}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Divider */}
                          <div className="border-t my-8"></div>

                          {/* Bottom 2 Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {packet.subPackets.slice(8).map((report) => (
                              <div
                                key={report.id}
                                className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 overflow-hidden group"
                              >
                                <div
                                  className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${report.color}`}
                                />

                                <div className="p-4 pl-5">
                                  <span
                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${report.color}`}
                                  >
                                    {report.code}
                                  </span>

                                  <h3 className="mt-3 text-sm font-semibold text-slate-800">
                                    {report.name}
                                  </h3>

                                  <button
                                    onClick={() => handleView(report)}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {packet.subPackets.map((report) => (
                            <div
                              key={report.id}
                              className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition duration-300 overflow-hidden group"
                            >
                              <div
                                className={`absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${report.color}`}
                              />

                              <div className="p-4 pl-5">
                                <span
                                  className={`inline-flex px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${report.color}`}
                                >
                                  {report.code}
                                </span>

                                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                                  {report.name}
                                </h3>

                                <button
                                  onClick={() => handleView(report)}
                                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;
