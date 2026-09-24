import React from "react";

export interface Domain {
  Id?: number;
  domainName: string;
  domainCode: string;
}

interface DomainMasterTableProps {
  data: Domain[];
  onEdit: (domain: Domain) => void;
  onDelete: (id: number) => void;
}

const DomainMasterTable: React.FC<DomainMasterTableProps> = ({
  data,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "650px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#0b3b70",
              color: "#fff",
            }}
          >
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Domain Name</th>
            <th style={thStyle}>Domain Code</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: "center",
                  padding: "25px",
                  color: "#777",
                }}
              >
                No Domain Found
              </td>
            </tr>
          ) : (
            data.map((domain) => (
              <tr key={domain.Id}>
                <td style={tdStyle}>{domain.Id}</td>

                <td style={tdStyle}>
                  {domain.domainName}
                </td>

                <td style={tdStyle}>
                  {domain.domainCode}
                </td>

                <td style={tdStyle}>
                  <button
                    onClick={() => onEdit(domain)}
                    style={{
                      background: "#f0ad00",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "7px 14px",
                      marginRight: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      domain.Id !== undefined &&
                      onDelete(domain.Id)
                    }
                    style={{
                      background: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "7px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: "13px 12px",
  textAlign: "center",
  fontWeight: 600,
  border: "1px solid #d9e0e7",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  border: "1px solid #e0e0e0",
  color: "#333",
};

export default DomainMasterTable;