import React from "react";

export interface Domain {
  Id: number;
  domainName?: string;
  domainCode?: string;
}

export interface KavachEquipment {
  id?: number;

  // Current backend response
  domain?: Domain;

  // Optional direct DOMAIN_ID response support
  domainId?: number;

  equipmentName: string;
  unitCode: string;
}

interface Props {
  data: KavachEquipment[];
  onEdit: (item: KavachEquipment) => void;
  onDelete: (id: number) => void;
}

const KavachEquipmentMasterTable: React.FC<Props> = ({
  data,
  onEdit,
  onDelete,
}) => {
  /*
   * Get DOMAIN_ID.
   *
   * Backend may return:
   *
   * {
   *   "domain": {
   *      "Id": 1
   *   }
   * }
   *
   * or:
   *
   * {
   *   "domainId": 1
   * }
   */
  const getDomainId = (
    item: KavachEquipment
  ): number | string => {
    if (item.domainId !== undefined && item.domainId !== null) {
      return item.domainId;
    }

    if (
      item.domain?.Id !== undefined &&
      item.domain?.Id !== null
    ) {
      return item.domain.Id;
    }

    return "-";
  };

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        background: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#0b3b70",
              color: "#ffffff",
            }}
          >
            <th style={thStyle}>ID</th>

            <th style={thStyle}>
              DOMAIN_ID
            </th>

            <th style={thStyle}>
              EQUIPMENT_NAME
            </th>

            <th style={thStyle}>
              UNIT_CODE
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
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: "25px",
                  color: "#777",
                }}
              >
                No equipment found
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id}>
                {/* ID */}
                <td style={tdStyle}>
                  {item.id ?? "-"}
                </td>

                {/* DOMAIN_ID */}
                <td style={tdStyle}>
                  {getDomainId(item)}
                </td>

                {/* EQUIPMENT_NAME */}
                <td
                  style={{
                    ...tdStyle,
                    textAlign: "left",
                  }}
                >
                  {item.equipmentName || "-"}
                </td>

                {/* UNIT_CODE */}
                <td style={tdStyle}>
                  {item.unitCode || "-"}
                </td>

                {/* ACTIONS */}
                <td style={tdStyle}>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    style={editButtonStyle}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        item.id !== undefined
                      ) {
                        onDelete(item.id);
                      }
                    }}
                    style={deleteButtonStyle}
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

// =====================================================
// TABLE HEADER STYLE
// =====================================================

const thStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  border: "1px solid #d5d5d5",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

// =====================================================
// TABLE DATA STYLE
// =====================================================

const tdStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "center",
  border: "1px solid #dddddd",
  color: "#173b63",
};

// =====================================================
// EDIT BUTTON
// =====================================================

const editButtonStyle: React.CSSProperties = {
  background: "#f2ad00",
  color: "#ffffff",
  border: "none",
  borderRadius: "5px",
  padding: "8px 15px",
  marginRight: "8px",
  cursor: "pointer",
  fontWeight: 600,
};

// =====================================================
// DELETE BUTTON
// =====================================================

const deleteButtonStyle: React.CSSProperties = {
  background: "#dc3545",
  color: "#ffffff",
  border: "none",
  borderRadius: "5px",
  padding: "8px 15px",
  cursor: "pointer",
  fontWeight: 600,
};

export default KavachEquipmentMasterTable;