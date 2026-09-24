import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";


import BugReportIcon from "@mui/icons-material/BugReport";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlagIcon from "@mui/icons-material/Flag";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

import { axiosInstance } from "../../services/axios";

import "./SystemFaults.css";

/* =========================================================
   TYPES
========================================================= */

type Priority = {
  id: number;
  priorityName: string;
};

type FailureCategory = {
  id: number;
  name: string;
};

type FailureSubCategory = {
  id: number;
  name: string;
  failureCategory: FailureCategory;
};

export type Fault = {
  id: number;
  faultCode: string;
  faultName: string;
  failureCategory?: FailureCategory | null;
  failureSubCategory?: FailureSubCategory | null;
  priority: Priority | null;
};

/* =========================================================
   PRIORITY CHIP
========================================================= */

function PriorityChip({ priority }: { priority?: string }) {
  const value = priority?.trim().toLowerCase();

  const config = value?.includes("critical")
    ? {
        label: priority || "Critical",
        color: "#C62828",
        bg: "#FFF1F2",
        border: "#FECDD3",
        icon: <ErrorIcon />,
      }
    : value?.includes("high")
    ? {
        label: priority || "High",
        color: "#C62828",
        bg: "#FFF1F2",
        border: "#FECDD3",
        icon: <ErrorOutlineIcon />,
      }
    : value?.includes("medium")
      ? {
          label: priority || "Medium",
          color: "#B45309",
          bg: "#FFF7ED",
          border: "#FED7AA",
          icon: <WarningAmberIcon />,
        }
      : value?.includes("low")
        ? {
            label: priority || "Low",
            color: "#15803D",
            bg: "#F0FDF4",
            border: "#BBF7D0",
            icon: <CheckCircleIcon />,
          }
        : {
            label: priority || "N/A",
            color: "#475569",
            bg: "#F8FAFC",
            border: "#E2E8F0",
            icon: <FlagIcon />,
          };

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size="small"
      sx={{
        height: 28,
        borderRadius: "8px",
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        fontSize: "12px",
        fontWeight: 600,
        "& .MuiChip-icon": {
          color: config.color,
          fontSize: 16,
        },
        "& .MuiChip-label": {
          px: 1,
        },
      }}
    />
  );
}

/* =========================================================
   SUMMARY CARDS
========================================================= */

function SummaryCards({ faults }: { faults: Fault[] }) {
  const total = faults.length;

  const critical = faults.filter((fault) =>
  fault.priority?.priorityName?.toLowerCase().includes("critical"),
  ).length;


  const high = faults.filter((fault) =>
    fault.priority?.priorityName?.toLowerCase().includes("high"),
  ).length;

  const medium = faults.filter((fault) =>
    fault.priority?.priorityName?.toLowerCase().includes("medium"),
  ).length;

  const low = faults.filter((fault) =>
    fault.priority?.priorityName?.toLowerCase().includes("low"),
  ).length;

   const na = faults.filter(
  (fault) =>
    !fault.priority ||
    !fault.priority.priorityName ||
    ["n/a", "[n/a]", "na"].includes(
      fault.priority.priorityName.trim().toLowerCase(),
    ),
   ).length;

  const cards = [
    {
      title: "Total Faults",
      value: total,
      color: "#1565C0",
      bg: "#EAF3FF",
      icon: <BugReportIcon />,
    },
     {
    title: "Critical Priority",
    value: critical,
    color: "#7C2D12",
    bg: "#FFF1F2",
    icon: <ErrorIcon />,
    },
    {
      title: "High Priority",
      value: high,
      color: "#D32F2F",
      bg: "#FFF0F1",
      icon: <ErrorOutlineIcon />,
    },
    {
      title: "Medium Priority",
      value: medium,
      color: "#ED6C02",
      bg: "#FFF6E8",
      icon: <WarningAmberIcon />,
    },
    {
      title: "Low Priority",
      value: low,
      color: "#2E7D32",
      bg: "#EDF8EF",
      icon: <CheckCircleOutlineIcon />,
    },
      {
    title: "N/A",
    value: na,
    color: "#475569",
    bg: "#F1F5F9",
    icon: <FlagIcon />,
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(6, 1fr)",
        },
        gap: { xs: 1.75, md: 2.25 },
        mb: 3.5,
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.title}
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            minWidth: 0,
            borderRadius: "16px",
            border: "1px solid #E8EDF3",
            background: "linear-gradient(145deg, #FFFFFF 0%, #FBFCFE 100%)",
            boxShadow: "0 5px 18px rgba(15, 23, 42, 0.07)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: card.color,
            },
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: "0 10px 26px rgba(15, 23, 42, 0.11)",
            },
          }}
        >
          <CardContent
            sx={{
              minHeight: 112,
              p: { xs: 2, md: 2.25 },
              "&:last-child": {
                pb: { xs: 2, md: 2.25 },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                height: "100%",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#64748B",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.2px",
                  }}
                >
                  {card.title}
                </Typography>

                <Typography
                  sx={{
                    color: card.color,
                    fontSize: { xs: 28, md: 30 },
                    fontWeight: 750,
                    lineHeight: 1.15,
                    mt: 0.75,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 50,
                  height: 50,
                  minWidth: 50,
                  borderRadius: "14px",
                  backgroundColor: card.bg,
                  color: card.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${card.color}18`,
                  "& svg": {
                    fontSize: 27,
                  },
                }}
              >
                {card.icon}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

/* =========================================================
   SEARCH + FILTER
========================================================= */

function SearchFilter({
  search,
  priority,
  setSearch,
  setPriority,
  onAdd,
}: {
  search: string;
  priority: string;
  setSearch: (value: string) => void;
  setPriority: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{
        width: { xs: "100%", lg: "auto" },
        flexShrink: 0,
      }}
    >
      <TextField
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fault..."
        sx={{
          width: { xs: "100%", sm: 190 },
          "& .MuiOutlinedInput-root": {
            height: 42,
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            fontSize: "13px",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1976D2",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1976D2",
              borderWidth: "1.5px",
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <SearchIcon
              sx={{
                color: "#64748B",
                mr: 0.75,
                fontSize: 19,
              }}
            />
          ),
        }}
      />

      <TextField
        select
        size="small"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        // placeholder="Priorities..."
        sx={{
          width: { xs: "100%", sm: 145 },
          "& .MuiOutlinedInput-root": {
            height: 42,
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            fontSize: "13px",
          },
        }}
        InputProps={{
          startAdornment: (
            <FilterListIcon
              sx={{
                color: "#64748B",
                mr: 0.5,
                fontSize: 18,
              }}
            />
          ),
        }}
      >
        <MenuItem value="">All Priorities</MenuItem>
        <MenuItem value="critical">P1[Critical]</MenuItem>
        <MenuItem value="high">P2[High]</MenuItem>
        <MenuItem value="medium">P3[Medium]</MenuItem>
        <MenuItem value="low">P4[Low]</MenuItem>
        <MenuItem value="na">[N/A]</MenuItem>
      </TextField>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{
          height: 42,
          minWidth: 118,
          px: 1.75,
          borderRadius: "10px",
          textTransform: "none",
          fontWeight: 700,
          fontSize: "13px",
          whiteSpace: "nowrap",
          background: "linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)",
          boxShadow: "0 4px 10px rgba(46, 125, 50, 0.20)",
          "&:hover": {
            background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)",
          },
        }}
      >
        Add Fault
      </Button>
    </Stack>
  );
}

/* =========================================================
   FAULT TABLE
========================================================= */

function FaultTable({
  loading,
  faults,
  onEdit,
  onDelete,
  onView,
}: {
  loading: boolean;
  faults: Fault[];
  onEdit: (fault: Fault) => void;
  onDelete: (fault: Fault) => void;
  onView: (fault: Fault) => void;
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [faults]);

  const paginatedRows = faults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const actionButtonSx = {
    width: 34,
    height: 34,
    borderRadius: "9px",
    transition: "all 0.18s ease",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 5px 18px rgba(15, 23, 42, 0.07)",
      }}
    >
      <TableContainer
        sx={{
          overflowX: "auto",
          "&::-webkit-scrollbar": {
            height: 7,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CBD5E1",
            borderRadius: 10,
          },
        }}
      >
        <Table
          sx={{
            minWidth: 900,
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #EEF2F6",
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                background: "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
              }}
            >
              {[
                "ID",
                "Fault Code",
                "Fault Name",
                "Failure Category",
                "Failure Sub Category",
                "Priority",
              ].map((heading) => (
                <TableCell
                  key={heading}
                  sx={{
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "12px",
                    letterSpacing: "0.25px",
                    py: 1.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {heading}
                </TableCell>
              ))}

              <TableCell
                align="center"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.25px",
                  py: 1.6,
                  whiteSpace: "nowrap",
                  width: 145,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                  <Box>
                    <SearchIcon
                      sx={{
                        fontSize: 42,
                        color: "#CBD5E1",
                        mb: 1,
                      }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      No faults found
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#94A3B8",
                        mt: 0.5,
                      }}
                    >
                      Try changing your search or priority filter.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((fault, index) => (
                <TableRow
                  key={fault.id}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: "#F8FBFF",
                    },
                    "&:last-child td": {
                      borderBottom: 0,
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      color: "#64748B",
                      fontWeight: 600,
                      py: 1.7,
                    }}
                  >
                    {page * rowsPerPage + index + 1}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#1565C0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fault.faultCode}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1E293B",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fault.faultName}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {fault.failureCategory?.name ? (
                      <Chip
                        label={fault.failureCategory.name}
                        size="small"
                        sx={{
                          height: 28,
                          borderRadius: "8px",
                          backgroundColor: "#F1F5F9",
                          color: "#475569",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      />
                    ) : (
                      <Typography
                        component="span"
                        sx={{
                          color: "#94A3B8",
                          fontSize: 13,
                        }}
                      >
                        —
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {fault.failureSubCategory?.name ? (
                      <Chip
                        label={fault.failureSubCategory.name}
                        size="small"
                        sx={{
                          height: 28,
                          borderRadius: "8px",
                          backgroundColor: "#F8FAFC",
                          color: "#475569",
                          border: "1px solid #E2E8F0",
                          fontSize: "12px",
                          fontWeight: 600,
                          maxWidth: 210,
                          "& .MuiChip-label": {
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    ) : (
                      <Typography
                        component="span"
                        sx={{
                          color: "#94A3B8",
                          fontSize: 13,
                        }}
                      >
                        —
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <PriorityChip priority={fault.priority?.priorityName} />
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip title="View fault">
                        <IconButton
                          onClick={() => onView(fault)}
                          sx={{
                            ...actionButtonSx,
                            color: "#0288D1",
                            "&:hover": {
                              backgroundColor: "#E1F5FE",
                            },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit fault">
                        <IconButton
                          onClick={() => onEdit(fault)}
                          sx={{
                            ...actionButtonSx,
                            color: "#1565C0",
                            "&:hover": {
                              backgroundColor: "#E3F2FD",
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete fault">
                        <IconButton
                          onClick={() => onDelete(fault)}
                          sx={{
                            ...actionButtonSx,
                            color: "#D32F2F",
                            "&:hover": {
                              backgroundColor: "#FFEBEE",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          borderTop: "1px solid #EEF2F6",
          backgroundColor: "#FBFCFE",
        }}
      >
        <TablePagination
          component="div"
          count={faults.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          sx={{
            "& .MuiTablePagination-toolbar": {
              minHeight: 52,
              px: 2,
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                color: "#64748B",
                fontSize: "12px",
              },
          }}
        />
      </Box>
    </Paper>
  );
}

/* =========================================================
   ADD / EDIT DIALOG
========================================================= */

function FaultDialog({
  open,
  onClose,
  refresh,
  editData,
  showMessage,
}: {
  open: boolean;
  onClose: () => void;
  refresh: () => void;
  editData: Fault | null;
  showMessage: (message: string, severity: "success" | "error") => void;
}) {
  const [loading, setLoading] = useState(false);

  const [priorityList, setPriorityList] = useState<Priority[]>([]);

  const [categoryList, setCategoryList] = useState<FailureCategory[]>([]);

  const [allSubCategories, setAllSubCategories] = useState<
    FailureSubCategory[]
  >([]);

  const [subCategoryList, setSubCategoryList] = useState<FailureSubCategory[]>(
    [],
  );

  const [failureCategoryId, setFailureCategoryId] = useState("");

  const [failureSubCategoryId, setFailureSubCategoryId] = useState("");

  const [faultCode, setFaultCode] = useState("");
  const [faultName, setFaultName] = useState("");
  const [priorityId, setPriorityId] = useState("");

  const [errors, setErrors] = useState({
    faultCode: "",
    faultName: "",
    priority: "",
    failureCategory: "",
    failureSubCategory: "",
  });

  useEffect(() => {
    if (open) {
      getPriorities();
      getFailureCategories();
      getFailureSubCategories();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (editData) {
      setFaultCode(editData.faultCode || "");
      setFaultName(editData.faultName || "");
      setPriorityId(editData.priority?.id ? String(editData.priority.id) : "");

      const categoryId = editData.failureCategory?.id
        ? String(editData.failureCategory.id)
        : "";

      const subCategoryId = editData.failureSubCategory?.id
        ? String(editData.failureSubCategory.id)
        : "";

      setFailureCategoryId(categoryId);
      setFailureSubCategoryId(subCategoryId);

      if (categoryId && allSubCategories.length > 0) {
        setSubCategoryList(
          allSubCategories.filter(
            (item) =>
              item.failureCategory &&
              String(item.failureCategory.id) === categoryId,
          ),
        );
      }
    } else {
      clearForm();
    }
  }, [editData, open, allSubCategories]);

  const clearForm = () => {
    setFaultCode("");
    setFaultName("");
    setPriorityId("");
    setFailureCategoryId("");
    setFailureSubCategoryId("");
    setSubCategoryList([]);

    setErrors({
      faultCode: "",
      faultName: "",
      priority: "",
      failureCategory: "",
      failureSubCategory: "",
    });
  };

  const getPriorities = async () => {
    try {
      const response = await axiosInstance.get("/priority");

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      setPriorityList(data);
    } catch (error) {
      console.error("Priority API Error:", error);
      showMessage("Unable to fetch priorities", "error");
    }
  };

  const getFailureCategories = async () => {
    try {
      const response = await axiosInstance.get("/failureCategory/");

      const data: FailureCategory[] = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setCategoryList(data);
    } catch (error) {
      console.error("Failure Category API Error:", error);
      showMessage("Unable to fetch failure categories", "error");
    }
  };

  const getFailureSubCategories = async () => {
    try {
      const response = await axiosInstance.get("/failureSubCategory/");

      const data: FailureSubCategory[] = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setAllSubCategories(data);
      setSubCategoryList([]);
    } catch (error) {
      console.error("Failure Sub Category API Error:", error);
      showMessage("Unable to fetch failure sub categories", "error");
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const selectedCategoryId = String(categoryId);

    setFailureCategoryId(selectedCategoryId);
    setFailureSubCategoryId("");

    const filtered = allSubCategories.filter(
      (item) =>
        item.failureCategory &&
        String(item.failureCategory.id) === selectedCategoryId,
    );

    setSubCategoryList(filtered);

    setErrors((prev) => ({
      ...prev,
      failureCategory: "",
      failureSubCategory: "",
    }));
  };

  const validate = () => {
    let valid = true;

    const newErrors = {
      faultCode: "",
      faultName: "",
      priority: "",
      failureCategory: "",
      failureSubCategory: "",
    };

    if (!faultCode.trim()) {
      newErrors.faultCode = "Fault Code is required";
      valid = false;
    }

    if (!faultName.trim()) {
      newErrors.faultName = "Fault Name is required";
      valid = false;
    }

    if (!failureCategoryId) {
      newErrors.failureCategory = "Please select failure category";
      valid = false;
    }

    if (!failureSubCategoryId) {
      newErrors.failureSubCategory = "Please select failure sub category";
      valid = false;
    }

    if (!priorityId) {
      newErrors.priority = "Please select priority";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const body = {
      faultCode: faultCode.trim(),
      faultName: faultName.trim(),
      failureCategory: {
        id: Number(failureCategoryId),
      },
      failureSubCategory: {
        id: Number(failureSubCategoryId),
      },
      priority: {
        id: Number(priorityId),
      },
    };

    try {
      setLoading(true);

      if (editData?.id) {
        await axiosInstance.put(`/fault/${editData.id}`, body);

        showMessage("Fault updated successfully.", "success");
      } else {
        await axiosInstance.post("/fault", body);

        showMessage("Fault created successfully.", "success");
      }

      await refresh();
      clearForm();
      onClose();
    } catch (error) {
      console.error("Save Fault Error:", error);

      showMessage("Unable to save fault.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#fff",
      borderRadius: 2,
      minHeight: 54,
      fontSize: "14px",
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#1976D2",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: "14px",
    },
    "& .MuiFormHelperText-root": {
      marginLeft: "4px",
      marginTop: "5px",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 680,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
          m: 2,
        },
      }}
    >
      {/* HEADER */}

      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
          color: "#fff",
          px: { xs: 2.5, sm: 3.5 },
          py: 2.2,
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        {editData ? "Update System Fault" : "Create System Fault"}
      </DialogTitle>

      {/* BODY */}

      <DialogContent
        sx={{
          backgroundColor: "#F8FAFC",
          px: { xs: 2, sm: 3.5 },
          pt: { xs: 3, sm: 3.25 },
          pb: 3.5,
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            columnGap: 2.25,
            rowGap: 2.5,
            mt: { xs: 1.5, sm: 2.5 },
          }}
        >
          {/* FAULT CODE */}

          <TextField
            fullWidth
            label="Fault Code"
            InputLabelProps={{ shrink: true }}
            placeholder="Enter fault code"
            value={faultCode}
            error={!!errors.faultCode}
            helperText={errors.faultCode}
            onChange={(e) => {
              setFaultCode(e.target.value);
              setErrors((prev) => ({
                ...prev,
                faultCode: "",
              }));
            }}
            sx={fieldSx}
          />

          {/* FAULT NAME */}

          <TextField
            fullWidth
            label="Fault Name"
            InputLabelProps={{ shrink: true }}
            placeholder="Enter fault name"
            value={faultName}
            error={!!errors.faultName}
            helperText={errors.faultName}
            onChange={(e) => {
              setFaultName(e.target.value);
              setErrors((prev) => ({
                ...prev,
                faultName: "",
              }));
            }}
            sx={fieldSx}
          />

          {/* FAILURE CATEGORY */}

          <TextField
            fullWidth
            select
            label="Failure Category"
            InputLabelProps={{ shrink: true }}
            value={failureCategoryId}
            error={!!errors.failureCategory}
            helperText={errors.failureCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            sx={fieldSx}
          >
            <MenuItem value="">
              <em>Select Failure Category</em>
            </MenuItem>

            {categoryList.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          {/* FAILURE SUB CATEGORY */}

          <TextField
            fullWidth
            select
            label="Failure Sub Category"
            InputLabelProps={{ shrink: true }}
            value={failureSubCategoryId}
            disabled={!failureCategoryId}
            error={!!errors.failureSubCategory}
            helperText={
              errors.failureSubCategory ||
              (!failureCategoryId ? "Select Failure Category first" : "")
            }
            onChange={(e) => {
              setFailureSubCategoryId(e.target.value);

              setErrors((prev) => ({
                ...prev,
                failureSubCategory: "",
              }));
            }}
            sx={{
              ...fieldSx,
              "& .MuiOutlinedInput-root": {
                ...fieldSx["& .MuiOutlinedInput-root"],
                backgroundColor: failureCategoryId ? "#fff" : "#F1F5F9",
              },
            }}
          >
            <MenuItem value="">
              <em>
                {failureCategoryId
                  ? "Select Failure Sub Category"
                  : "Select Failure Category first"}
              </em>
            </MenuItem>

            {subCategoryList.length === 0 && failureCategoryId ? (
              <MenuItem disabled>No sub-categories found</MenuItem>
            ) : (
              subCategoryList.map((subCategory) => (
                <MenuItem key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </MenuItem>
              ))
            )}
          </TextField>

          {/* PRIORITY */}

          <TextField
            fullWidth
            select
            label="Priority"
            InputLabelProps={{ shrink: true }}
            value={priorityId}
            error={!!errors.priority}
            helperText={errors.priority}
            onChange={(e) => {
              setPriorityId(e.target.value);
              setErrors((prev) => ({
                ...prev,
                priority: "",
              }));
            }}
            sx={fieldSx}
          >
            <MenuItem value="">
              <em>Select Priority</em>
            </MenuItem>

            {priorityList.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.priorityName}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>

      {/* FOOTER */}

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3.5 },
          py: 2,
          backgroundColor: "#fff",
          borderTop: "1px solid #E2E8F0",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            minWidth: 100,
            height: 42,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#CBD5E1",
            color: "#475569",
            "&:hover": {
              borderColor: "#94A3B8",
              backgroundColor: "#F8FAFC",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            minWidth: 120,
            height: 42,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            background: "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
            boxShadow: "0 4px 12px rgba(21, 101, 192, 0.25)",
            "&:hover": {
              background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)",
              boxShadow: "0 6px 16px rgba(21, 101, 192, 0.35)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={21} color="inherit" />
          ) : editData ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  fault,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  fault: Fault | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
  loading: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        sx={{
          color: "#d32f2f",
          fontWeight: 600,
        }}
      >
        Delete System Fault
      </DialogTitle>

      <DialogContent>
        <Typography mb={2}>
          Are you sure you want to delete this fault?
        </Typography>

        <Stack spacing={1}>
          <Typography>
            <b>Fault Code:</b> {fault?.faultCode}
          </Typography>

          <Typography>
            <b>Fault Name:</b> {fault?.faultName}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DeleteForeverIcon />
            )
          }
          disabled={loading}
          onClick={() => {
            if (fault) {
              onConfirm(fault.id);
            }
          }}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   VIEW DIALOG
========================================================= */

function ViewDialog({
  open,
  fault,
  onClose,
}: {
  open: boolean;
  fault: Fault | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="dialog-title">System Fault Details</DialogTitle>

      <DialogContent>
        <Box className="view-details">
          <Box>
            <Typography className="detail-label">Fault Code</Typography>

            <Typography className="detail-value">
              {fault?.faultCode || "-"}
            </Typography>
          </Box>

          <Box>
            <Typography className="detail-label">Fault Name</Typography>

            <Typography className="detail-value">
              {fault?.faultName || "-"}
            </Typography>
          </Box>

          <Box>
            <Typography className="detail-label">Failure Category</Typography>

            <Typography className="detail-value">
              {fault?.failureCategory?.name || "-"}
            </Typography>
          </Box>

          <Box>
            <Typography className="detail-label">
              Failure Sub Category
            </Typography>

            <Typography className="detail-value">
              {fault?.failureSubCategory?.name || "-"}
            </Typography>
          </Box>

          <Box>
            <Typography className="detail-label">Priority</Typography>

            <PriorityChip priority={fault?.priority?.priorityName} />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SystemFaults() {
  const [faults, setFaults] = useState<Fault[]>([]);

  const [loading, setLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [priority, setPriority] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);

  const [editData, setEditData] = useState<Fault | null>(null);

  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  /* =========================================================
     MESSAGE
  ========================================================= */

  const showMessage = (message: string, severity: "success" | "error") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  /* =========================================================
     GET FAULTS
  ========================================================= */

  const getFaults = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/fault");

      const data = Array.isArray(response.data) ? response.data : [];

      setFaults(data);
    } catch (error) {
      console.error("Get Faults Error:", error);

      showMessage("Unable to fetch faults.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL API CALL
  ========================================================= */

  useEffect(() => {
    getFaults();
  }, []);

  /* =========================================================
     SEARCH + PRIORITY FILTER
  ========================================================= */

  const filteredFaults = useMemo(() => {
  const searchValue = search.trim().toLowerCase();
  const priorityValue = priority.trim().toLowerCase();

  return faults.filter((fault) => {
    const matchesSearch =
      !searchValue ||
      fault.faultCode?.toLowerCase().includes(searchValue) ||
      fault.faultName?.toLowerCase().includes(searchValue);

    const priorityName =
      fault.priority?.priorityName?.trim().toLowerCase() || "";

    let matchesPriority = true;

    if (priorityValue === "na") {
      matchesPriority =
        !fault.priority ||
        !fault.priority.priorityName ||
        fault.priority.priorityName.trim().toLowerCase() === "n/a" ||
        fault.priority.priorityName.trim().toLowerCase() === "[n/a]";
    } else if (priorityValue) {
      matchesPriority = priorityName.includes(priorityValue);
    }

    return matchesSearch && matchesPriority;
  });
}, [faults, search, priority]);

  /* =========================================================
     ADD
  ========================================================= */

  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (fault: Fault) => {
    setEditData(fault);
    setDialogOpen(true);
  };

  /* =========================================================
     VIEW
  ========================================================= */

  const handleView = (fault: Fault) => {
    setSelectedFault(fault);
    setViewOpen(true);
  };

  /* =========================================================
     DELETE OPEN
  ========================================================= */

  const handleDelete = (fault: Fault) => {
    setSelectedFault(fault);
    setDeleteOpen(true);
  };

  /* =========================================================
     DELETE API
  ========================================================= */

  const handleDeleteConfirm = async (id: number) => {
    try {
      setDeleteLoading(true);

      await axiosInstance.delete(`/fault/${id}`);

      showMessage("Fault deleted successfully.", "success");

      setDeleteOpen(false);
      setSelectedFault(null);

      await getFaults();
    } catch (error) {
      console.error("Delete Fault Error:", error);

      showMessage("Unable to delete fault.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box
      className="system-fault-page"
      sx={{
        minHeight: "100%",
        backgroundColor: "#F5F7FA",
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 2, md: 3 },
      }}
    >
      {/* HEADER */}
      <Box
        className="fault-header"
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", lg: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          pb: 2,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "23px", md: "29px" },
              lineHeight: 1.2,
              color: "#0F172A",
              fontWeight: 750,
              letterSpacing: "-0.4px",
            }}
          >
            System Faults List and Their Priorities
          </Typography>

          <Typography
            mt={0.75}
            sx={{
              fontSize: "13px",
              color: "#64748B",
            }}
          >
            Monitor, manage and maintain system fault priorities
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{
            width: { xs: "100%", lg: "auto" },
            flexShrink: 0,
          }}
        >
          <SearchFilter
            search={search}
            priority={priority}
            setSearch={setSearch}
            setPriority={setPriority}
            onAdd={handleAdd}
          />

          <Tooltip title="Refresh fault list">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={getFaults}
              sx={{
                height: 42,
                px: 1.8,
                minWidth: 105,
                flexShrink: 0,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "13px",
                borderColor: "#BFDBFE",
                color: "#1565C0",
                backgroundColor: "#FFFFFF",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "#1976D2",
                  backgroundColor: "#EFF6FF",
                },
              }}
            >
              Refresh
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      {/* SUMMARY */}
      <SummaryCards faults={faults} />

      {/* TABLE */}
      <FaultTable
        loading={loading}
        faults={filteredFaults}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* ADD / EDIT */}
      <FaultDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditData(null);
        }}
        refresh={getFaults}
        editData={editData}
        showMessage={showMessage}
      />

      {/* DELETE */}
      <DeleteDialog
        open={deleteOpen}
        fault={selectedFault}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedFault(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      {/* VIEW */}
      <ViewDialog
        open={viewOpen}
        fault={selectedFault}
        onClose={() => {
          setViewOpen(false);
          setSelectedFault(null);
        }}
      />

      {/* LOADER */}
      <Backdrop
        open={loading}
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 999,
          flexDirection: "column",
        }}
      >
        <CircularProgress color="inherit" />

        <Typography mt={2}>Loading System Faults...</Typography>
      </Backdrop>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({
            ...prev,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((prev) => ({
              ...prev,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
