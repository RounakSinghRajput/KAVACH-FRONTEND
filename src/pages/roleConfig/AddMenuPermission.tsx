import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  Switch,
  Button,
  Autocomplete,
  Divider,
  Stack,
  Chip,
  InputAdornment,
  Checkbox,
  IconButton,
} from "@mui/material";

import {
  Person,
  Apps,
  Link as LinkIcon,
  Save,
  RestartAlt,
  Visibility,
  Layers,
  Settings,
  Route,
} from "@mui/icons-material";

import { api } from "../../services/api";
import { useNotify } from "../../context/notification-context";

type RoleType = {
  id: number;
  name: string;
};

type MenuPermissionForm = {
  navMenu: string;
  navSubmenu: string;
  link: string;
  menuIcon: string;
  subMenuIcon: string;
  sequence: number;
  active: boolean;
  roles: RoleType[];
};

const MenuPermissionPage = () => {
  const { showAlert } = useNotify();

  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<MenuPermissionForm>({
    navMenu: "",
    navSubmenu: "",
    link: "",
    menuIcon: "",
    subMenuIcon: "",
    sequence: 1,
    active: true,
    roles: [],
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const data = await api.menu.getRoles();
      setRoles(data);
    } catch {
      showAlert("Failed to load roles", "error");
    }
  };

  const handleChange = (field: keyof MenuPermissionForm, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (
      !form.roles.length ||
      !form.navMenu.trim() ||
      !form.navSubmenu.trim() ||
      !form.menuIcon.trim() ||
      !form.subMenuIcon.trim() ||
      !form.link.trim() ||
      form.sequence < 0
    ) {
      showAlert("Please fill all required fields", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        roles: form.roles.map((role) => ({
          id: role.id,
        })),
      };

      await api.menu.createRoleMenuPermission(payload);

      showAlert("Menu permission created successfully", "success");

      setForm({
        navMenu: "",
        navSubmenu: "",
        link: "",
        menuIcon: "",
        subMenuIcon: "",
        sequence: 1,
        active: true,
        roles: [],
      });
    } catch {
      showAlert("Failed to save permission", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
          Menu Management
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#64748b",
            mt: 1,
          }}
        >
          Configure navigation modules, access roles, and route permissions.
        </Typography>
      </Box>

      {/* BOTTOM ROW */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.4fr 1fr",
          },
          gap: 4,
        }}
      >
        {/* NAVIGATION SETUP */}
        <Card
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 5,
            background:
              "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #faf5ff 100%)",
            border: "1px solid rgba(99,102,241,0.12)",
            boxShadow: "0 20px 50px rgba(79,70,229,0.10)",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography fontWeight={800} fontSize={18} color="#1e293b">
                Menu Structure
              </Typography>

              <Typography fontSize={13} color="#64748b" sx={{ mt: 0.5 }}>
                Configure menu structure and role access.
              </Typography>
            </Box>

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={roles}
              getOptionLabel={(option) => option.name}
              value={form.roles}
              onChange={(_, value) => handleChange("roles", value)}
              fullWidth
              limitTags={3}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assign Roles"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "red",
                      borderRadius: 3,
                      background: "#ffffff",
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Person sx={{ color: "#6366f1" }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  InputLabelProps={{
                    sx: {
                      "& .MuiFormLabel-asterisk": {
                        color: "#dc2626",
                        fontWeight: 700,
                      },
                    },
                  }}
                />
              )}
            />
            <TextField
              fullWidth
              required
              label="Module Name"
              value={form.navMenu}
              onChange={(e) => handleChange("navMenu", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Apps sx={{ color: "#6366f1" }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: {
                  "& .MuiFormLabel-asterisk": {
                    color: "#dc2626",
                    fontWeight: 700,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              required
              label="Submodule Name"
              value={form.navSubmenu}
              onChange={(e) => handleChange("navSubmenu", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Layers sx={{ color: "#8b5cf6" }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: {
                  "& .MuiFormLabel-asterisk": {
                    color: "#dc2626",
                    fontWeight: 700,
                  },
                },
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Menu Icon"
                  value={form.menuIcon}
                  onChange={(e) => handleChange("menuIcon", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Visibility sx={{ color: "#0ea5e9" }} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    sx: {
                      "& .MuiFormLabel-asterisk": {
                        color: "#dc2626",
                        fontWeight: 700,
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Submenu Icon"
                  value={form.subMenuIcon}
                  onChange={(e) => handleChange("subMenuIcon", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Visibility sx={{ color: "#06b6d4" }} />
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{
                    sx: {
                      "& .MuiFormLabel-asterisk": {
                        color: "#dc2626",
                        fontWeight: 700,
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Stack>
        </Card>

        {/* CONFIGURATION */}
        <Card
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 5,
            background:
              "linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #eff6ff 100%)",
            border: "1px solid rgba(14,165,233,0.12)",
            boxShadow: "0 20px 50px rgba(14,165,233,0.08)",
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography fontWeight={800} fontSize={18} color="#1e293b">
                Navigation
              </Typography>

              <Typography fontSize={13} color="#64748b" sx={{ mt: 0.5 }}>
                Set route and activation details.
              </Typography>
            </Box>

            <TextField
              fullWidth
              required
              type="number"
              label="Sequence"
              value={form.sequence}
              onChange={(e) => {
                const value = Number(e.target.value);
                handleChange("sequence", value < 0 ? 0 : value);
              }}
              inputProps={{
                min: 0,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Settings sx={{ color: "#10b981" }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: {
                  "& .MuiFormLabel-asterisk": {
                    color: "#dc2626",
                    fontWeight: 700,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Route Path"
              required
              value={form.link}
              onChange={(e) => handleChange("link", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Route sx={{ color: "#f59e0b" }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                sx: {
                  "& .MuiFormLabel-asterisk": {
                    color: "#dc2626",
                    fontWeight: 700,
                  },
                },
              }}
            />

            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                background: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography fontWeight={700}>Active Status</Typography>

                <Typography fontSize={13} color="#64748b">
                  Enable or disable menu visibility
                </Typography>
              </Box>

              <Switch
                checked={form.active}
                onChange={(e) => handleChange("active", e.target.checked)}
              />
            </Box>
          </Stack>
        </Card>
      </Box>

      {/* ACTIONS */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        sx={{ mt: 4 }}
      >
        <Button variant="outlined" startIcon={<RestartAlt />}>
          Reset
        </Button>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Permission
        </Button>
      </Stack>
    </Box>
  );
};

export default MenuPermissionPage;
