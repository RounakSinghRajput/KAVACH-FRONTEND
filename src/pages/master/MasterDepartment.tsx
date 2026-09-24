import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { axiosInstance } from "../../services/axios";
import TablePagination from "../../components/common/TablePaginatio";

interface Department {
  id: number;
  name: string;
}

const DepartmentTable: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(7);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const res = await axiosInstance.get("/department/");
    setDepartments(res.data.data);
  };

  /* SEARCH */
  const filteredData = useMemo(() => {
    return departments.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [departments, search]);

  /* PAGINATION */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  /* EXPORT */
  const exportToExcel = () => {
    const data = filteredData.map((d, i) => ({
      "S.No": i + 1,
      Name: d.name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Departments");
    XLSX.writeFile(wb, "Departments.xlsx");
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* HEADER */}

      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        Department Master
      </h1>
      <div className="flex justify-end mb-4 gap-3">
        <input
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="border px-3 py-2 rounded w-64"
        />

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 border border-blue-500 text-blue-600 px-4 py-2 rounded"
        >
          <Download size={18} /> Export
        </button>
      </div>

      {/* TABLE */}
      <div className="border rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-sm">
              <th className="border px-3 py-2">S.No</th>
              <th className="border px-3 py-2">Department Name</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((d, i) => (
              <tr key={d.id} className="even:bg-gray-100 text-sm">
                <td className="border px-3 py-2 text-center">
                  {page * rowsPerPage + i + 1}
                </td>

                <td className="border px-3 py-2 text-center font-semibold">
                  {d.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <TablePagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={filteredData.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
      />
    </div>
  );
};

export default DepartmentTable;
