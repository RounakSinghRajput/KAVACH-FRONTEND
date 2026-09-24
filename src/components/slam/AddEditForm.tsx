import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { axiosInstance } from "../../services/axios";
import Select from "react-select";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  dataList: any[]; // pass table data for filter options
}

const SlamLocoFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  dataList,
}) => {
  const [form, setForm] = useState<any>({});

  // API dropdown states
  const [zones, setZones] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [sheds, setSheds] = useState([]);
  const [firms, setFirms] = useState([]);

  // ----------- INIT FORM -----------
  useEffect(() => {
    setForm(
      initialData || {
        contract: "",
        finalTestingCommissioning: null,
        installationCompleted: null,
        loco: "",
        locoBrakeType: "",
        locoManufacturer: "",
        locoOfferedInstallation: null,
        locoOwningDivision: "",
        locoOwningShed: "",
        locoOwningZone: "",
        locoType: "",
        make: "",
        preCommissioningPcc: null,
        remarks: "",
        version: "",
      },
    );
  }, [initialData]);

  // ----------- FETCH API OPTIONS -----------
  useEffect(() => {
    axiosInstance.get("/zone/").then((res) => setZones(res.data?.data || []));
    axiosInstance
      .get("/division/")
      .then((res) => setDivisions(res.data?.data || []));
    axiosInstance.get("/shed/").then((res) => setSheds(res.data?.data || []));
    axiosInstance.get("/firm/").then((res) => setFirms(res.data?.data || []));
  }, []);

  // ----------- FILTER OPTIONS (reuse table data) -----------
  const unique = (key: string) => [
    ...new Set(dataList.map((x) => x[key]).filter(Boolean)),
  ];

  if (!open) return null;

  const Field = ({ label, children }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>
      {children}
    </div>
  );
  const toOptions = (arr: any[], labelKey = "name") =>
    (Array.isArray(arr) ? arr : []).map((item: any) => ({
      label: item[labelKey] || item,
      value: item[labelKey] || item,
    }));
  const CustomSelect = ({ label, value, options, onChange }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>
      <Select
        options={options}
        value={value ? { label: value, value } : null}
        onChange={(selected: any) => onChange(selected?.value)}
        isClearable
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-white w-[900px] max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white">
          <h2 className="text-lg font-semibold">
            {initialData ? "Edit Loco Record" : "Add Loco Record"}
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-5">
            {/* LOCO */}
            <Field label="Loco">
              <input
                value={form.loco}
                onChange={(e) => setForm({ ...form, loco: e.target.value })}
                className="input"
              />
            </Field>

            {/* VERSION */}

            <CustomSelect
              label="Version"
              value={form.version}
              options={toOptions(["3.2", "4"], "")}
              onChange={(val: any) => setForm({ ...form, version: val })}
            />

            {/* CONTRACT */}

            <CustomSelect
              label="Contract"
              value={form.contract}
              options={toOptions(unique("contract"), "")}
              onChange={(val: any) => setForm({ ...form, contract: val })}
            />

            {/* LOCO TYPE */}

            <CustomSelect
              label="Loco Type"
              value={form.locoType}
              options={toOptions(unique("locoType"), "")}
              onChange={(val: any) => setForm({ ...form, locoType: val })}
            />

            {/* BRAKE TYPE */}

            <CustomSelect
              label="Brake Type"
              value={form.locoBrakeType}
              options={toOptions(unique("locoBrakeType"), "")}
              onChange={(val: any) => setForm({ ...form, locoBrakeType: val })}
            />

            {/* MANUFACTURER */}

            <CustomSelect
              label="Manufacturer"
              value={form.locoManufacturer}
              options={toOptions(unique("locoManufacturer"), "")}
              onChange={(val: any) =>
                setForm({ ...form, locoManufacturer: val })
              }
            />

            {/* MAKE (API) */}

            <CustomSelect
              label="Make"
              value={form.make}
              options={toOptions(firms, "name")}
              onChange={(val: any) => setForm({ ...form, make: val })}
            />

            {/* ZONE */}

            <CustomSelect
              label="Zone"
              value={form.locoOwningZone}
              options={toOptions(zones, "name")}
              onChange={(val: any) => setForm({ ...form, locoOwningZone: val })}
            />

            {/* DIVISION */}

            <CustomSelect
              label="Division"
              value={form.locoOwningDivision}
              options={toOptions(divisions, "name")}
              onChange={(val: any) =>
                setForm({ ...form, locoOwningDivision: val })
              }
            />

            {/* SHED */}

            <CustomSelect
              label="Shed"
              value={form.locoOwningShed}
              options={toOptions(sheds, "name")}
              onChange={(val: any) => setForm({ ...form, locoOwningShed: val })}
            />

            {/* DATE FIELDS */}
            {[
              ["locoOfferedInstallation", "Offered Date"],
              ["installationCompleted", "Installation Completed"],
              ["preCommissioningPcc", "PCC Date"],
              ["finalTestingCommissioning", "Final Testing"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <DatePicker
                  selected={form[key]}
                  onChange={(date: Date | null) =>
                    setForm({ ...form, [key]: date })
                  }
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  className="input"
                />
              </Field>
            ))}

            {/* REMARKS */}
            <div className="col-span-2">
              <Field label="Remarks">
                <textarea
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                  className="input min-h-[90px]"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={() => onSubmit(form)}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow"
          >
            {initialData ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlamLocoFormModal;
