import React from "react";

export interface Equipment {
  id: number;
  equipmentName?: string;
  unitCode?: string;
}

export interface KavachEquipmentIssueMap {
  id?: number;

  equipment?: Equipment;
  equipmentId?: number;

  /*
   * Backend can return ISSUE_ID through:
   *
   * issueId
   *
   * OR because of @ManyToOne:
   *
   * issue: {
   *   id: 1
   * }
   */
  issue?: {
    id: number;
  };

  issueId?: number;

  faultName?: string;

  details?: string;

  finalCode: string;
}

interface Props {
  data: KavachEquipmentIssueMap[];

  onEdit: (
    item: KavachEquipmentIssueMap
  ) => void;

  onDelete: (
    id: number
  ) => void;
}

const KavachEquipmentIssueMapTable: React.FC<Props> = ({
  data,
  onEdit,
  onDelete,
}) => {

  // =====================================================
  // GET EQUIPMENT ID
  // =====================================================

  const getEquipmentId = (
    item: KavachEquipmentIssueMap
  ): number | string => {

    if (
      item.equipmentId !== undefined &&
      item.equipmentId !== null
    ) {
      return item.equipmentId;
    }

    if (
      item.equipment?.id !== undefined &&
      item.equipment?.id !== null
    ) {
      return item.equipment.id;
    }

    return "-";
  };

  // =====================================================
  // GET ISSUE ID
  // =====================================================

  const getIssueId = (
    item: KavachEquipmentIssueMap
  ): number | string => {

    if (
      item.issueId !== undefined &&
      item.issueId !== null
    ) {
      return item.issueId;
    }

    if (
      item.issue?.id !== undefined &&
      item.issue?.id !== null
    ) {
      return item.issue.id;
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
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >

        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <thead>

          <tr
            style={{
              background: "#0b3b70",
              color: "#ffffff",
            }}
          >

            <th style={thStyle}>
              ID
            </th>

            <th style={thStyle}>
              EQUIPMENT_ID
            </th>

            <th style={thStyle}>
              ISSUE_ID
            </th>

            <th style={thStyle}>
              FAULT_NAME
            </th>

            <th style={thStyle}>
              DETAILS
            </th>

            <th style={thStyle}>
              FINAL_CODE
            </th>

            <th style={thStyle}>
              Actions
            </th>

          </tr>

        </thead>

        {/* =================================================
            TABLE BODY
        ================================================= */}

        <tbody>

          {data.length === 0 ? (

            <tr>

              <td
                colSpan={7}
                style={{
                  textAlign: "center",
                  padding: "25px",
                  color: "#777",
                }}
              >
                No equipment issue mapping found
              </td>

            </tr>

          ) : (

            data.map((item, index) => (

              <tr
                key={
                  item.id ??
                  `equipment-issue-${index}`
                }
              >

                {/* =================================================
                    ID
                ================================================= */}

                <td style={tdStyle}>
                  {item.id ?? "-"}
                </td>

                {/* =================================================
                    EQUIPMENT_ID
                ================================================= */}

                <td style={tdStyle}>
                  {getEquipmentId(item)}
                </td>

                {/* =================================================
                    ISSUE_ID
                ================================================= */}

                <td style={tdStyle}>
                  {getIssueId(item)}
                </td>

                {/* =================================================
                    FAULT_NAME
                ================================================= */}

                <td
                  style={{
                    ...tdStyle,
                    textAlign: "left",
                  }}
                >
                  {item.faultName || "-"}
                </td>

                {/* =================================================
                    DETAILS
                ================================================= */}

                <td
                  style={{
                    ...tdStyle,
                    textAlign: "left",
                    maxWidth: "350px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.details || ""}
                >
                  {item.details || "-"}
                </td>

                {/* =================================================
                    FINAL_CODE
                ================================================= */}

                <td style={tdStyle}>
                  {item.finalCode || "-"}
                </td>

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <td style={tdStyle}>

                  <button
                    type="button"
                    onClick={() =>
                      onEdit(item)
                    }
                    style={editButtonStyle}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {

                      if (
                        item.id !== undefined &&
                        item.id !== null
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
  verticalAlign: "middle",
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

export default KavachEquipmentIssueMapTable;