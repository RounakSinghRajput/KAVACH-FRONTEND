interface Props {
  page: number;
  rowsPerPage: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPageOptions?: number[];
}

export default function TablePagination({
  page,
  rowsPerPage,
  totalCount,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}: Props) {
  const start = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, totalCount);

  return (
    <div className="flex items-center justify-end gap-4 mt-4 text-sm text-gray-600">
      <span>Rows per page:</span>

      <select
        value={rowsPerPage}
        onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        className="border rounded px-2 py-1"
      >
        {rowsPerPageOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <span>
        {start}–{end} of {totalCount}
      </span>

      <div className="flex gap-2">
        <button
          disabled={page === 0}
          onClick={() => onPageChange(0)}
          className="px-2 disabled:text-gray-300"
        >
          ⏮
        </button>

        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="px-2 disabled:text-gray-300"
        >
          ◀
        </button>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="px-2 disabled:text-gray-300"
        >
          ▶
        </button>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(totalPages - 1)}
          className="px-2 disabled:text-gray-300"
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
