import React from "react";

export interface KavachIssue {
  id?: number;
  issueCode: string;
  issueName: string;
}

interface Props {
  data: KavachIssue[];
  onEdit: (issue: KavachIssue) => void;
  onDelete: (id: number) => void;
}

const KavachIssueMasterTable: React.FC<Props> = ({
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
          minWidth: "700px",
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

            <th style={thStyle}>
              Issue Code
            </th>

            <th style={thStyle}>
              Issue Name
            </th>

            <th style={thStyle}>
              Actions
            </th>
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
                No Issue Found
              </td>
            </tr>
          ) : (
            data.map((issue) => (
              <tr key={issue.id}>
                <td style={tdStyle}>
                  {issue.id}
                </td>

                <td style={tdStyle}>
                  {issue.issueCode}
                </td>

                <td style={tdStyle}>
                  {issue.issueName}
                </td>

                <td style={tdStyle}>
                  <button
                    onClick={() => onEdit(issue)}
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
                    onClick={() => {
                      if (issue.id !== undefined) {
                        onDelete(issue.id);
                      }
                    }}
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

export default KavachIssueMasterTable;