import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import ChartTab from "../../components/slam/ChartTab";

interface Props {
  open: boolean;
  onClose: () => void;

  // firm | locoType | manufacturer
  type: "firm" | "locoType" | "manufacturer";

  // KERNEX / WAG9HC / CLW
  value: string;

  // total count (optional)
  total?: number;
}

const DrillDownModal: React.FC<Props> = ({
  open,
  onClose,
  type,
  value,
  total,
}) => {
  const getTabs = () => {
    switch (type) {
      case "firm":
        return ["Zone", "Shed", "Loco Type", "Manufacturer", "Year"];

      case "locoType":
        return ["Zone", "Shed", "Manufacturer", "Firm", "Year"];

      case "manufacturer":
        return ["Zone", "Shed", "Firm", "Loco Type", "Year"];

      default:
        return [];
    }
  };

  const tabs = getTabs();

  const [activeTab, setActiveTab] = useState("Zone");

  useEffect(() => {
    if (open) {
      setActiveTab(getTabs()[0]);
    }
  }, [open, type, value]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[92vw] max-w-7xl h-[90vh] overflow-hidden shadow-2xl">
        {/* HEADER */}

        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-xl">
            {value}

            {total ? ` - ${total} Locos` : ""}
          </h2>

          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* TABS */}

        <div className="flex gap-3 border-b p-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg border transition

                ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                }

              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* BODY */}

        <div className="p-5 h-[calc(90vh-130px)] overflow-auto">
          <ChartTab
            key={`${type}-${value}-${activeTab}`}
            type={type}
            tab={activeTab}
            value={value}
          />
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;
