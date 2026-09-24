import React from "react";
import Select from "react-select";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

interface FilterState {
  messageType: string;
  divisionName: string;
  firmName: string;
  fromDate: Date | null;
  toDate: Date | null;
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  firms: any[];
  divisions: any[];
  dateError: string;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  resetPagination: () => void;
  showMessageTypeSelector?: boolean;
  placeholderFromDate?: string;
  placeholderToDate?: string;
}

const MESSAGE_TYPES = ["11", "12", "14", "15", "16", "17", "19", "21"];

export default function MessageFilterPanel({
  filters,
  setFilters,
  firms,
  divisions,
  dateError,
  showFilters,
  setShowFilters,
  resetPagination,
  showMessageTypeSelector = true,
  placeholderFromDate = "From Date",
  placeholderToDate = "To Date"
}: FilterPanelProps) {
  if (!showFilters) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {showMessageTypeSelector && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500">Message Type</label>
            <Select
              options={MESSAGE_TYPES.map((t) => ({ label: `Message Type ${t}`, value: t }))}
              value={{ label: `Message Type ${filters.messageType}`, value: filters.messageType }}
              onChange={(selected: any) => {
                setFilters((prev) => ({ ...prev, messageType: selected.value }));
                resetPagination();
              }}
              isSearchable
              className="text-sm"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Firm</label>
          <Select
            options={[{ label: "All Firms", value: "" }, ...firms.map((f: any) => ({ label: f.name, value: f.name }))]}
            value={{ label: filters.firmName || "All Firms", value: filters.firmName || "" }}
            onChange={(selected: any) => {
              setFilters((prev) => ({ ...prev, firmName: selected?.value || "" }));
              resetPagination();
            }}
            isSearchable
            placeholder="Select Firm"
            className="text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Division</label>
          <Select
            options={[{ label: "All Divisions", value: "" }, ...divisions.map((d: any) => ({ label: d.name, value: d.name }))]}
            value={{ label: filters.divisionName || "All Divisions", value: filters.divisionName || "" }}
            onChange={(selected: any) => {
              setFilters((prev) => ({ ...prev, divisionName: selected?.value || "" }));
              resetPagination();
            }}
            isSearchable
            placeholder="Select Division"
            className="text-sm"
          />
        </div>
<LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">From Date</label>
               <DateTimePicker
      value={filters.fromDate ? dayjs(filters.fromDate) : null}
      onChange={(value) => {
        setFilters((prev) => ({
          ...prev,
          fromDate: value ? value.toDate() : null,
        }));
        resetPagination();
      }}
      ampm={false}
      format="DD-MM-YYYY HH:mm:ss"
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
        },
      }}
    />
            </div>

            <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">To Date</label>
           <DateTimePicker
      value={filters.toDate ? dayjs(filters.toDate) : null}
      onChange={(value) => {
        setFilters((prev) => ({
          ...prev,
          toDate: value ? value.toDate() : null,
        }));
        resetPagination();
      }}
      ampm={false}
      format="DD-MM-YYYY HH:mm:ss"
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
        },
      }}
    />
          {dateError && <span className="text-red-500 text-xs mt-1">{dateError}</span>}
        </div>
        </LocalizationProvider>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => {
            setFilters({ messageType: "11", divisionName: "", firmName: "", fromDate: null, toDate: null });
            resetPagination();
          }}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  );
}