import React, { useState, useMemo } from "react";

// Types for structured data
interface Firm {
  type: string;
  link: string;
}

interface Section {
  name: string;
  firms: Firm[];
}

interface Division {
  name: string;
  borderColor: string;
  iconBg: string;
  sections: Section[];
}

/* ===== Grouped Divisions Data ===== */
const divisionsData: Division[] = [
  {
    name: "Agra Division",
    borderColor: "border-red-400 hover:border-red-500",
    iconBg: "bg-red-500",
    sections: [
      {
        name: "VRBD-LC563",
        firms: [{ type: "HBL", link: "http://10.102.20.122/nms" }],
      },
    ],
  },
  {
    name: "Asansol Division",
    borderColor: "border-orange-400 hover:border-orange-500",
    iconBg: "bg-orange-500",
    sections: [
      {
        name: "CAM-KHANA",
        firms: [{ type: "HBL", link: "http://10.164.5.201/nms" }],
      },
    ],
  },
  {
    name: "DDU Division",
    borderColor: "border-purple-400 hover:border-purple-500",
    iconBg: "bg-purple-600",
    sections: [
      {
        name: "CCK-SYJ",
        firms: [{ type: "HBL", link: "http://10.167.33.173/nms" }],
      },
    ],
  },
  {
    name: "Delhi Division",
    borderColor: "border-pink-400 hover:border-pink-500",
    iconBg: "bg-pink-500",
    sections: [
      {
        name: "TKJ-PWL",
        firms: [{ type: "MEDHA", link: "http://10.0.0.1/nms" }],
      },
    ],
  },
  {
    name: "Howrah Division",
    borderColor: "border-blue-500 hover:border-blue-600",
    iconBg: "bg-blue-600",
    sections: [
      {
        name: "KHANA-HWH",
        firms: [{ type: "HBL", link: "http://10.162.0.181/nms" }],
      },
    ],
  },
  {
    name: "Kota Division",
    borderColor: "border-sky-400 hover:border-sky-500",
    iconBg: "bg-sky-500",
    sections: [
      {
        name: "IBH265-IBH1",
        firms: [{ type: "HBL", link: "http://10.149.93.1/nms" }],
      },
    ],
  },
  {
    name: "Mumbai Division",
    borderColor: "border-teal-400 hover:border-teal-500",
    iconBg: "bg-teal-500",
    sections: [
      {
        name: "GVD-VR",
        firms: [{ type: "MEDHA", link: "http://10.80.37.71/" }],
      },
      {
        name: "ST-UBR",
        firms: [{ type: "MEDHA", link: "http://10.80.37.70/" }],
      },
    ],
  },
  {
    name: "PRYJ Division",
    borderColor: "border-amber-400 hover:border-amber-500",
    iconBg: "bg-amber-500",
    sections: [
      {
        name: "NCR-B",
        firms: [{ type: "KERNEX", link: "https://10.110.3.35/nms" }],
      },
    ],
  },
  {
    name: "Ratlam Division",
    borderColor: "border-emerald-500 hover:border-emerald-600",
    iconBg: "bg-emerald-500",
    sections: [
      {
        name: "DHD_BIO - IBNAD",
        firms: [{ type: "MEDHA", link: "http://10.39.209.121/" }],
      },
    ],
  },
  {
    name: "Secunderabad Division",
    borderColor: "border-lime-500 hover:border-lime-600",
    iconBg: "bg-lime-500",
    sections: [
      {
        name: "SNF-VKB",
        firms: [{ type: "MEDHA", link: "http://10.54.22.222/" }],
      },
    ],
  },
  {
    name: "Vadodara Division",
    borderColor: "border-cyan-500 hover:border-cyan-600",
    iconBg: "bg-cyan-500",
    sections: [
      {
        name: "BJW-ADI",
        firms: [{ type: "HBL", link: "http://10.35.251.23/nms" }],
      },
      {
        name: "BRC-GDA",
        firms: [{ type: "MEDHA", link: "http://14.99.201.102/" }],
      },
      {
        name: "VS-URN",
        firms: [{ type: "MEDHA", link: "http://10.35.152.76/" }],
      },
    ],
  },
];

export const NMSLogsPage: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filterOptions = ["ALL", "HBL", "MEDHA", "KERNEX"];

  const handleClick = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Filter divisions and their sections dynamically based on the active button filter
  const filteredDivisions = useMemo(() => {
    if (selectedFilter === "ALL") return divisionsData;

    return divisionsData
      .map((division) => {
        const filteredSections = division.sections
          .map((section) => ({
            ...section,
            firms: section.firms.filter(
              (f) => f.type.toUpperCase() === selectedFilter,
            ),
          }))
          .filter((section) => section.firms.length > 0);

        return {
          ...division,
          sections: filteredSections,
        };
      })
      .filter((division) => division.sections.length > 0);
  }, [selectedFilter]);

  const getTagStyles = (type: string) => {
    switch (type.toUpperCase()) {
      case "HBL":
        return "bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200";
      case "MEDHA":
        return "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border border-emerald-200";
      case "KERNEX":
        return "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8 bg-slate-50/50 min-h-screen">
      {/* ===== HEADER SECTION ===== */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Live NMS Divisions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
            Divisional NMS Dashboard
          </h1>
        </div>

        {/* ===== FILTER BUTTONS ===== */}
        <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-xl border border-slate-200">
          {filterOptions.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== CARDS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredDivisions.map((division) => {
          const totalFirms = division.sections.reduce(
            (acc, sec) => acc + sec.firms.length,
            0,
          );

          return (
            <div
              key={division.name}
              className={`bg-white rounded-2xl border-2 ${division.borderColor} p-4 flex flex-col justify-between shadow-sm transition-all duration-200 hover:shadow-md h-[220px]`}
            >
              <div>
                {/* Division Header (Icon + Name + Firm Count) */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 ${division.iconBg} rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm`}
                  >
                    {/* Building Icon */}
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 2H9c-1.1 0-2 .9-2 2v3H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h10v16H9V4zM5 9h2v11H5V9zm4 2h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {division.name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {totalFirms} {totalFirms === 1 ? "Firm" : "Firms"}{" "}
                      Available
                    </p>
                  </div>
                </div>

                {/* Section List (Scrollable if > 2 sections) */}
                <div className="space-y-2 max-h-[105px] overflow-y-auto pr-1">
                  {division.sections.map((section, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-2"
                    >
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">
                        {section.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {section.firms.map((firm, fIdx) => (
                          <button
                            key={`${firm.type}-${fIdx}`}
                            onClick={(e) => handleClick(e, firm.link)}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md transition-transform active:scale-95 ${getTagStyles(
                              firm.type,
                            )}`}
                          >
                            <span>{firm.type.toUpperCase()}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-blue-600 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  {division.sections.length}{" "}
                  {division.sections.length === 1 ? "Section" : "Sections"}
                </span>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
