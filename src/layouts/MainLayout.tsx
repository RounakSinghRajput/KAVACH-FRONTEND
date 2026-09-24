// import React, { useState } from "react";
// import IR from "../myGallery/IR.png";
// import {
//   Box,
//   Drawer,
//   AppBar,
//   Toolbar,
//   List,
//   Typography,
//   Divider,
//   IconButton,
//   ListItem,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Collapse,
//   Avatar,
//   Menu,
//   MenuItem,
//   useTheme,
//   useMediaQuery,
//   Tooltip,
// } from "@mui/material";
// import {
//   Menu as MenuIcon,
//   ChevronLeft,
//   LayoutDashboard,
//   Radio,
//   AlertTriangle,
//   FileWarning,
//   Activity,
//   Package,
//   Wifi,
//   Radio as RadioIcon,
//   MapPin,
//   Cpu,
//   Train,
//   Map,
//   Building2,
//   MapPinned,
//   Users,
//   FileText,
//   Settings,
//   LogOut,
//   ChevronDown,
//   ChevronRight,
//   Moon,
//   Sun,
//   UserCircle,
// } from "lucide-react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
// import { signOut } from "../store/slices/authSlice";
// import { toggleTheme } from "../store/slices/appSlice";
// import type { UserRole } from "../types";

// const DRAWER_WIDTH = 280;
// const DRAWER_WIDTH_COLLAPSED = 65;

// interface MenuItem {
//   title: string;
//   icon: React.ReactNode;
//   path?: string;
//   children?: MenuItem[];
//   roles?: UserRole[];
// }

// const menuItems: MenuItem[] = [
//   // {
//   //   title: "Dashboard",
//   //   icon: <LayoutDashboard size={20} />,
//   //   path: "/dashboard",
//   // },
//   // {
//   //   title: "NMS",
//   //   icon: <Radio size={20} />,
//   //   children: [
//   //     {
//   //       title: "Divisional NMS ",
//   //       icon: <Radio size={20} />,
//   //       path: "/nms-logs",
//   //     },
//   //     {
//   //       title: "Real-Time NMS Logs",
//   //       icon: <Radio size={20} />,
//   //       path: "/real-time-logs",
//   //     },
//   //   ],
//   // },
//   {
//     title: "Divisional NMS ",
//     icon: <Radio size={20} />,
//     path: "/nms-logs",
//   },
//   {
//     title: "NMS Dashboard",
//     icon: <Radio size={20} />,
//     path: "/real-time-logs",
//   },
//   {
//     title: "SLAM Loco Details",
//     icon: <Train size={20} />,
//     path: "/slam-loco",
//   },
//   {
//     title: "LOCO Dashboard",
//     icon: <Train size={20} />,
//     path: "/loco-dashboard",
//     // roles: ["SUPER_ADMIN", "RAILWAY_BOARD", "ZONE_USER", "DIVISION_USER"],
//   },

//   // {
//   //   title: "SURAKSHA",
//   //   icon: <AlertTriangle size={20} />,
//   //   children: [
//   //     {
//   //       title: "Failure Reporting",
//   //       icon: <FileWarning size={18} />,
//   //       path: "/fracas/reporting",
//   //     },
//   //     {
//   //       title: "Failure Analysis",
//   //       icon: <Activity size={18} />,
//   //       path: "/fracas/analysis",
//   //     },
//   //     {
//   //       title: "Corrective Action",
//   //       icon: <Package size={18} />,
//   //       path: "/fracas/corrective-action",
//   //     },
//   //   ],
//   // },
//   // {
//   //   title: "Assets Management",
//   //   icon: <Package size={20} />,
//   //   children: [
//   //     { title: "RFID Tags", icon: <Wifi size={18} />, path: "/assets/rfid" },
//   //     {
//   //       title: "Towers / Radios",
//   //       icon: <RadioIcon size={18} />,
//   //       path: "/assets/towers",
//   //     },
//   //     {
//   //       title: "Trackside Equipment",
//   //       icon: <MapPin size={18} />,
//   //       path: "/assets/trackside",
//   //     },
//   //     {
//   //       title: "Onboard (LOCO) Units",
//   //       icon: <Cpu size={18} />,
//   //       path: "/assets/onboard",
//   //     },
//   //   ],
//   // },
//   // {
//   //   title: "LOCO Management",
//   //   icon: <Train size={20} />,
//   //   path: "/loco-dashboard",
//   //   // roles: ["SUPER_ADMIN", "RAILWAY_BOARD", "ZONE_USER", "DIVISION_USER"],
//   // },
//   // {
//   //   title: "Section Management",
//   //   icon: <Map size={20} />,
//   //   path: "/sections",
//   //   roles: ["SUPER_ADMIN", "RAILWAY_BOARD", "ZONE_USER", "DIVISION_USER"],
//   // },
//   // {
//   //   title: "Division Management",
//   //   icon: <Building2 size={20} />,
//   //   path: "/divisions",
//   //   roles: ["SUPER_ADMIN", "RAILWAY_BOARD", "ZONE_USER"],
//   // },
// {
//   title: "Zone Management",
//   icon: <MapPinned size={20} />,
//   path: "/zones",
//   roles: ["SUPER_ADMIN", "RAILWAY_BOARD"],
// },
//   // {
//   //   title: "User Management",
//   //   icon: <Users size={20} />,
//   //   path: "/users",
//   //   roles: ["SUPER_ADMIN"],
//   // },
//   // {
//   //   title: "Reports & Audits",
//   //   icon: <FileText size={20} />,
//   //   path: "/reports",
//   // },
//   // {
//   //   title: "Settings",
//   //   icon: <Settings size={20} />,
//   //   path: "/settings",
//   // },
// ];

// export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));
//   const isTablet = useMediaQuery(theme.breakpoints.down("md"));

//   const [open, setOpen] = useState(!isMobile);
//   const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const dispatch = useAppDispatch();
//   const { user } = useAppSelector((state) => state.auth);
//   const { themeMode } = useAppSelector((state) => state.app);

//   const handleDrawerToggle = () => {
//     setOpen(!open);
//   };

//   const handleMenuClick = (item: MenuItem) => {
//     if (item.children) {
//       setExpandedMenus((prev) =>
//         prev.includes(item.title)
//           ? prev.filter((t) => t !== item.title)
//           : [...prev, item.title]
//       );
//     } else if (item.path) {
//       navigate(item.path);
//       if (isMobile) {
//         setOpen(false);
//       }
//     }
//   };
//   const HEADER_HEIGHT = 80;

//   const handleSignOut = async () => {
//     await dispatch(signOut());
//     navigate("/login");
//   };

//   const hasAccess = (roles?: UserRole[]) => {
//     if (!roles || !user) return true;
//     return roles.includes(user.role);
//   };

//   const isActive = (path?: string) => {
//     if (!path) return false;
//     return (
//       location.pathname === path || location.pathname.startsWith(path + "/")
//     );
//   };

//   const drawerWidth = open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED;

//   const drawer = (
//     <Box
//       sx={{
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//         bgcolor: "background.paper",
//       }}
//     >
//       <Box
//         sx={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: open ? "space-between" : "center",
//           p: 2.5,
//           minHeight: HEADER_HEIGHT,
//           height: HEADER_HEIGHT,

//           background:
//             theme.palette.mode === "dark"
//               ? "linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)"
//               : "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
//           color: "white",
//         }}
//       >
//         {open && (
//           <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
//             <Box
//               sx={{
//                 width: 40,
//                 height: 40,
//                 borderRadius: 2,
//                 bgcolor: "rgba(255,255,255,0.2)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <Train size={24} />
//             </Box>
//             <Box>
//               {/* <Typography
//                 variant="h6"
//                 fontWeight={700}
//                 sx={{ lineHeight: 1.2 }}
//               >
//                 KAVACH
//               </Typography> */}
//               <Typography
//                 variant="h6"
//                 fontWeight={700}
//                 sx={{ opacity: 0.8, fontSize: "1.5rem" }}
//                 // sx={{ lineHeight: 1.2 }}
//               >
//                 SURAKSHA
//               </Typography>
//             </Box>
//           </Box>
//         )}
//         {!open && (
//           <Box
//             sx={{
//               width: 40,
//               height: 40,
//               borderRadius: 2,
//               bgcolor: "rgba(255,255,255,0.2)",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <Train size={24} />
//           </Box>
//         )}
//         <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
//           {open ? <ChevronLeft size={22} /> : <MenuIcon size={22} />}
//         </IconButton>
//       </Box>

//       <Divider />

//       <List sx={{ flex: 1, overflowY: "auto", py: 2, px: 1.5 }}>
//         {menuItems.map((item) => {
//           if (!hasAccess(item.roles)) return null;

//           const active = isActive(item.path);
//           const expanded = expandedMenus.includes(item.title);

//           return (
//             <Box key={item.title} sx={{ mb: 0.5 }}>
//               <Tooltip title={!open ? item.title : ""} placement="right">
//                 <ListItem disablePadding sx={{ display: "block" }}>
//                   <ListItemButton
//                     onClick={() => handleMenuClick(item)}
//                     sx={{
//                       minHeight: 48,
//                       justifyContent: open ? "initial" : "center",
//                       px: 2,
//                       py: 1.5,
//                       borderRadius: 2,
//                       mb: 0.5,
//                       backgroundColor: active
//                         ? theme.palette.mode === "dark"
//                           ? "rgba(33, 150, 243, 0.15)"
//                           : "rgba(25, 118, 210, 0.08)"
//                         : "transparent",
//                       borderLeft: active
//                         ? `4px solid ${theme.palette.primary.main}`
//                         : "4px solid transparent",
//                       transition: "all 0.2s ease-in-out",
//                       "&:hover": {
//                         backgroundColor:
//                           theme.palette.mode === "dark"
//                             ? "rgba(255, 255, 255, 0.05)"
//                             : "rgba(0, 0, 0, 0.04)",
//                         borderLeft: `4px solid ${theme.palette.primary.light}`,
//                         transform: "translateX(2px)",
//                       },
//                     }}
//                   >
//                     <ListItemIcon
//                       sx={{
//                         minWidth: 0,
//                         mr: open ? 2.5 : "auto",
//                         justifyContent: "center",
//                         color: active ? "primary.main" : "text.secondary",
//                         transition: "color 0.2s ease-in-out",
//                       }}
//                     >
//                       {item.icon}
//                     </ListItemIcon>
//                     {open && (
//                       <>
//                         <ListItemText
//                           primary={item.title}
//                           primaryTypographyProps={{
//                             fontSize: 14,
//                             fontWeight: active ? 800 : 700,
//                             color: active ? "primary.main" : "text.primary",
//                             letterSpacing: "0.3px",
//                           }}
//                         />
//                         {item.children &&
//                           (expanded ? (
//                             <ChevronDown
//                               size={18}
//                               color={theme.palette.text.secondary}
//                             />
//                           ) : (
//                             <ChevronRight
//                               size={18}
//                               color={theme.palette.text.secondary}
//                             />
//                           ))}
//                       </>
//                     )}
//                   </ListItemButton>
//                 </ListItem>
//               </Tooltip>

//               {item.children && open && (
//                 <Collapse in={expanded} timeout="auto" unmountOnExit>
//                   <List component="div" disablePadding sx={{ pl: 2, pr: 0.5 }}>
//                     {item.children.map((child) => (
//                       <Tooltip
//                         key={child.title}
//                         title={!open ? child.title : ""}
//                         placement="right"
//                       >
//                         <ListItem
//                           disablePadding
//                           sx={{ display: "block", mb: 0.5 }}
//                         >
//                           <ListItemButton
//                             onClick={() => handleMenuClick(child)}
//                             sx={{
//                               minHeight: 40,
//                               pl: 4,
//                               pr: 2,
//                               py: 1,
//                               borderRadius: 2,
//                               backgroundColor: isActive(child.path)
//                                 ? theme.palette.mode === "dark"
//                                   ? "rgba(33, 150, 243, 0.1)"
//                                   : "rgba(25, 118, 210, 0.05)"
//                                 : "transparent",
//                               borderLeft: isActive(child.path)
//                                 ? `3px solid ${theme.palette.primary.main}`
//                                 : "3px solid transparent",
//                               transition: "all 0.2s ease-in-out",
//                               "&:hover": {
//                                 backgroundColor:
//                                   theme.palette.mode === "dark"
//                                     ? "rgba(255, 255, 255, 0.05)"
//                                     : "rgba(0, 0, 0, 0.04)",
//                                 borderLeft: `3px solid ${theme.palette.primary.light}`,
//                                 transform: "translateX(2px)",
//                               },
//                             }}
//                           >
//                             <ListItemIcon
//                               sx={{
//                                 minWidth: 0,
//                                 mr: 2,
//                                 color: isActive(child.path)
//                                   ? "primary.main"
//                                   : "text.secondary",
//                               }}
//                             >
//                               {child.icon}
//                             </ListItemIcon>
//                             <ListItemText
//                               primary={child.title}
//                               primaryTypographyProps={{
//                                 fontSize: 13,
//                                 fontWeight: isActive(child.path) ? 800 : 700,
//                                 color: isActive(child.path)
//                                   ? "primary.main"
//                                   : "text.primary",
//                                 letterSpacing: "0.3px",
//                               }}
//                             />
//                           </ListItemButton>
//                         </ListItem>
//                       </Tooltip>
//                     ))}
//                   </List>
//                 </Collapse>
//               )}
//             </Box>
//           );
//         })}
//       </List>
//     </Box>
//   );

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         minHeight: "100vh",
//         width: "100%",
//         maxWidth: "100vw",
//         overflow: "hidden",
//       }}
//     >
//       <AppBar
//         position="fixed"
//         elevation={1}
//         sx={{
//           width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
//           ml: { md: `${drawerWidth}px` },
//           transition: theme.transitions.create(["width", "margin"], {
//             easing: theme.transitions.easing.sharp,
//             duration: theme.transitions.duration.leavingScreen,
//           }),
//         }}
//       >
//         <Toolbar
//           sx={{
//             minHeight: HEADER_HEIGHT,
//             height: HEADER_HEIGHT,
//             px: { xs: 1, sm: 2, md: 3 },
//           }}
//         >
//           {/* Mobile menu */}
//           {isMobile && (
//             <IconButton
//               color="inherit"
//               edge="start"
//               onClick={handleDrawerToggle}
//               sx={{ mr: 1 }}
//             >
//               <MenuIcon />
//             </IconButton>
//           )}

//           {/* LOGO + TEXT */}
//           <Box
//             sx={{
//               display: "flex",
//               alignItems: "center",
//               gap: 1.5,
//               flexGrow: 1,
//               minWidth: 0,
//             }}
//           >
//             {/* Logo */}
//             <Box
//               sx={{
//                 height: 44,
//                 width: 44,
//                 borderRadius: "50%",
//                 bgcolor: "rgba(255,255,255,0.9)",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
//                 flexShrink: 0,
//               }}
//             >
//               <Box
//                 component="img"
//                 src={IR}
//                 alt="Indian Railways"
//                 sx={{ height: 30, width: 30 }}
//               />
//             </Box>

//             {/* HEADER TEXT */}
//             <Typography
//               sx={{
//                 fontWeight: 800,
//                 letterSpacing: "0.4px",
//                 lineHeight: 1.25,
//                 opacity: 0.95,

//                 fontSize: {
//                   xs: "1rem",
//                   sm: "1.15rem",
//                   md: "1.35rem",
//                   lg: "1.5rem",
//                   xl: "1.6rem",
//                 },

//                 whiteSpace: {
//                   xs: "nowrap",
//                   sm: "normal",
//                 },

//                 wordBreak: "break-word",
//               }}
//             >
//               {isMobile
//                 ? "SURAKSHA"
//                 : "System for Unified Reporting & Analysis for Kavach Safety & Health Assessment"}
//             </Typography>
//           </Box>

//           {/* Theme toggle */}
//           <IconButton color="inherit" onClick={() => dispatch(toggleTheme())}>
//             {themeMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
//           </IconButton>

//           {/* User avatar */}
//           <IconButton
//             onClick={(e) => setAnchorEl(e.currentTarget)}
//             sx={{ ml: 1 }}
//           >
//             <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
//               {user?.full_name?.charAt(0).toUpperCase()}
//             </Avatar>
//           </IconButton>
//           <Menu
//             anchorEl={anchorEl}
//             open={Boolean(anchorEl)}
//             onClose={() => setAnchorEl(null)}
//           >
//             <MenuItem>
//               <Typography variant="body2">{user?.full_name}</Typography>
//             </MenuItem>

//             <Divider />

//             <MenuItem
//               onClick={() => {
//                 setAnchorEl(null);
//                 handleSignOut();
//               }}
//             >
//               <ListItemIcon>
//                 <LogOut size={18} />
//               </ListItemIcon>
//               Logout
//             </MenuItem>
//           </Menu>
//         </Toolbar>
//       </AppBar>

//       <Drawer
//         variant={isMobile ? "temporary" : "permanent"}
//         open={open}
//         onClose={handleDrawerToggle}
//         sx={{
//           width: drawerWidth,
//           flexShrink: 0,
//           "& .MuiDrawer-paper": {
//             width: drawerWidth,
//             boxSizing: "border-box",
//             transition: theme.transitions.create("width", {
//               easing: theme.transitions.easing.sharp,
//               duration: theme.transitions.duration.enteringScreen,
//             }),
//           },
//         }}
//         ModalProps={{
//           keepMounted: true,
//         }}
//       >
//         {drawer}
//       </Drawer>

//       <Box
//         component="main"
//         sx={{
//           flexGrow: 1,
//           p: { xs: 1.5, sm: 2, md: 3 },
//           width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
//           maxWidth: "100%",
//           minHeight: "100vh",
//           backgroundColor: "background.default",
//           overflow: "auto",
//           transition: theme.transitions.create(["width", "margin"], {
//             easing: theme.transitions.easing.sharp,
//             duration: theme.transitions.duration.leavingScreen,
//           }),
//         }}
//       >
//         <Toolbar />
//         <Box sx={{ width: "100%", maxWidth: "100%" }}>{children}</Box>
//       </Box>
//     </Box>
//   );
// };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import React, { useState, useEffect } from "react";
import IR from "../myGallery/IR.jpeg";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft,
  Radio,
  Train,
  ChevronDown,
  ChevronRight,
  UserCircle,
  LogOut,
  Layers,
  Table,
  AlertTriangle,
  Radar,
  MapPin,
  Locate,
  Gauge,
  ClipboardList,
  PanelLeft,
  FileBarChart,
  ReceiptText,
  Blinds,
  Package2,
  LayoutDashboard,
  Settings,
  FileHeart,
  BookPlus,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { signOut } from "../store/slices/authSlice";
import { api } from "../services/api";
import { formatRole } from "../utils/formateRole";
import CRIS from "../myGallery/CRIS.jpg";

/* =======================
   CONSTANTS (UNCHANGED)
   ======================= */

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 65;

/* =======================
   ROLE HELPERS (LOGIC ONLY)
   ======================= */

const getPrimaryRole = (roles?: string[]) => roles?.[0] ?? "";

const getAvatarColorByRole = (role?: string) => {
  switch (role) {
    case "ROLE_SUPER_ADMIN":
      return "#c62828";
    case "ROLE_ADMIN":
      return "#6a1b9a";
    case "ROLE_RAILWAY_BOARD":
      return "#2e7d32";
    case "ROLE_ZONE_USER":
      return "#1565c0";
    case "ROLE_DIVISION_USER":
      return "#ef6c00";
    default:
      return "#1976d2";
  }
};

const iconMap: Record<string, any> = {
  UserCircle,
  Locate,
  MapPin,
  Radio,
  Package2,
  Train,
  Gauge,
  AlertTriangle,
  Radar,
  ClipboardList,
  Layers,
  Table,
  FileBarChart,
  PanelLeft,
  ReceiptText,
  Blinds,
  LayoutDashboard,
  Settings,
  FileHeart,
  BookPlus,
};

/* =======================
   MENU TYPES (UNCHANGED)
   ======================= */

// interface MenuItemType {
//   title: string;
//   icon: React.ReactNode;
//   path?: string;
//   children?: MenuItemType[];
//   roles?: string[];
// }
interface MenuItemType {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItemType[];
  roles?: string[];

  permissions?: {
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
    list?: boolean;
    download?: boolean;
    filter?: boolean;
  };
}

const MENU_ORDER = [
  "NMS",
  "NMS Report",
  "NMS Reports",
  "Loco Report",
  "Loco Health Reports",
  "Station Health Reports",
  "Loco Packets",
  "OB Kavach Logs",
  "OBK S-Kavach",
  "NMS Loco Station Detection",
  "SLAM Loco Details",
  "Impact",
  "Administration",
  "Kavach Control Room",
  "ICMS",
  "CMS",
  "GIS",
  "Ref-Data",
  "Master Data",
];
/* =======================
   MENU ITEMS (UNCHANGED)
   ======================= */

const transformMenuData = (apiData: any[]): MenuItemType[] => {
  const grouped: Record<string, MenuItemType> = {};

  apiData.forEach((item) => {
    if (!item.active) return;

    if (!grouped[item.navMenu]) {
      const ParentIcon = iconMap[item.menuIcon] || UserCircle;

      grouped[item.navMenu] = {
        title: item.navMenu,
        icon: <ParentIcon size={20} />,
        children: [],
      };
    }

    const ChildIcon = iconMap[item.subMenuIcon] || UserCircle;

    grouped[item.navMenu].children?.push({
      title: item.navSubmenu,
      icon: <ChildIcon size={18} />,
      path: item.link,
      permissions: {
        add: item.add,
        edit: item.edit,
        delete: item.delete,
        list: item.list,
        download: item.download,
        filter: item.filter,
      },
    });
  });

  return Object.values(grouped).sort((a, b) => {
    const aIndex = MENU_ORDER.indexOf(a.title);
    const bIndex = MENU_ORDER.indexOf(b.title);

    if (aIndex === -1) return 999;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
};

// const menuItems: MenuItemType[] = [
//   {
//     title: "NMS",
//     icon: <Radio size={20} />,
//     children: [
//       {
//         title: "Divisional NMS ",
//         icon: <Radio size={20} />,
//         path: "/nms-logs",
//       },
//       {
//         title: "NMS Dashboard",
//         icon: <Radio size={20} />,
//         path: "/real-time-logs",
//       },
//       {
//         title: "NMS Message Details",
//         icon: <Radio size={20} />,
//         roles: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
//         path: "/live-nms",
//       },
//       {
//         title: "NMS Packets",
//         icon: <Radio size={20} />,
//         path: "/nms-packets",
//       },
//     ],
//   },
//   {
//     title: "NMS Reports",
//     icon: <FileBarChart size={20} />,
//     roles: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
//     path: "/nms-reports",
//   },
//   {
//     title: "OB Kavach Logs",
//     icon: <ClipboardList size={20} />,
//     path: "/nms-loco-logs",
//   },
//   {
//     title: "SLAM Loco Details",
//     icon: <Train size={20} />,
//     path: "/slam-loco-dashboard",
//   },

//   {
//     title: "Administration",
//     icon: <UserCircle size={20} />,
//     roles: ["ROLE_ADMIN"],
//     children: [
//       {
//         title: "User Management",
//         icon: <UserCircle size={20} />,
//         path: "/user-management",
//       },
//     ],
//   },
//   {
//     title: "Kavach Control Room",
//     icon: <Gauge size={20} />,
//     children: [
//       {
//         title: "Incidences Entry",
//         icon: <AlertTriangle size={15} />,
//         path: "/incidences-entry",
//       },
//     ],
//   },
//   {
//     title: "ICMS",
//     icon: <PanelLeft size={20} />,
//     children: [
//       {
//         title: "ICMS Failure Register",
//         icon: <AlertTriangle size={15} />,
//         path: "/icms-failure-register",
//       },
//     ],
//   },
//   {
//     title: "CMS",
//     icon: <Radar size={20} />,
//     children: [
//       {
//         title: "CMS register",
//         icon: <AlertTriangle size={15} />,
//         path: "/cms-register",
//       },
//       {
//         title: "Assigned Tickets",
//         icon: <Radar size={20} />,
//         path: "/assigned-tickets",
//       },
//     ],
//   },

//   {
//     title: "Asset GIS",
//     icon: <Locate size={20} />,
//     children: [
//       {
//         title: "Tower",
//         icon: <MapPin size={20} />,
//         path: "/tower",
//       },
//       {
//         title: "Tag",
//         icon: <MapPin size={20} />,
//         path: "/tag",
//       },
//     ],
//   },
//   {
//     title: "Master Data",
//     icon: <Layers size={20} />,
//     children: [
//       {
//         title: "Onboard Kavach",
//         icon: <Table size={15} />,
//         path: "/kavachOnboard",
//       },
//       {
//         title: "Station Kavach",
//         icon: <Table size={15} />,
//         path: "/kavachStation",
//       },
//       {
//         title: "Role",
//         icon: <Table size={15} />,
//         path: "/role",
//       },
//       {
//         title: "Department",
//         icon: <Table size={15} />,
//         path: "/department",
//       },
//       {
//         title: "Designation",
//         icon: <Table size={15} />,
//         path: "/designation",
//       },
//       {
//         title: "Firm",
//         icon: <Table size={15} />,
//         path: "/firm",
//       },
//       {
//         title: "Zone",
//         icon: <Table size={15} />,
//         path: "/zone",
//       },
//       {
//         title: "Division",
//         icon: <Table size={15} />,
//         path: "/division",
//       },
//       {
//         title: "Section",
//         icon: <Table size={15} />,
//         path: "/section",
//       },
//       {
//         title: "Station",
//         icon: <Table size={15} />,
//         path: "/station",
//       },
//       {
//         title: "Shed",
//         icon: <Table size={15} />,
//         path: "/shed",
//       },
//       {
//         title: "Loco Type",
//         icon: <Table size={15} />,
//         path: "/locoType",
//       },
//       {
//         title: "Failure category",
//         icon: <Table size={15} />,
//         path: "/failureCategory",
//       },
//       {
//         title: "Failure Sub Category",
//         icon: <Table size={15} />,
//         path: "/failureSubCategory",
//       },
//       {
//         title: "Incident Category",
//         icon: <Table size={15} />,
//         path: "/incidentCategory",
//       },
//       {
//         title: "Incident Sub Category",
//         icon: <Table size={15} />,
//         path: "/IncidentSubCategory",
//       },
//       {
//         title: "Tag Details",
//         icon: <Table size={15} />,
//         path: "/tag-details",
//       },
//       {
//         title: "Assets Tower",
//         icon: <Table size={15} />,
//         path: "/tower-details",
//       },
//       {
//         title: "Nms Structure",
//         icon: <Table size={15} />,
//         path: "/msgType/",
//       },
//     ],
//   },
// ];

/* =======================
   MAIN LAYOUT
   ======================= */

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(!isMobile);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user, session } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        if (!user?.id) return;

        const menuResponse = await api.menu.getByUserId(user.id);

        const formattedMenu = transformMenuData(menuResponse);

        setMenuItems(formattedMenu);

        if (formattedMenu.length === 0) {
          navigate("/no-access");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchMenu();
  }, [user?.id]);

  const HEADER_HEIGHT = 80;

  const handleDrawerToggle = () => setOpen(!open);

  const handleMenuClick = (item: MenuItemType) => {
    if (item.children) {
      setExpandedMenus((prev) =>
        prev.includes(item.title) ? [] : [item.title],
      );
    } else if (item.path) {
      navigate(item.path);
      if (isMobile) setOpen(false);
    }
  };

  const handleSignOut = async () => {
    await dispatch(signOut());
    navigate("/login");
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles || !user?.roles) return true;
    return roles.some((r) => user.roles.includes(r));
  };

  const isActive = (path?: string) =>
    path
      ? location.pathname === path || location.pathname.startsWith(path + "/")
      : false;

  const drawerWidth = open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED;

  /* =======================
     DRAWER (UI RESTORED)
     ======================= */

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          p: 2.5,
          minHeight: HEADER_HEIGHT,
          height: HEADER_HEIGHT,

          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)"
              : "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
          color: "white",
        }}
      >
        {open && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Train size={24} />
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ opacity: 0.8, fontSize: "1.5rem" }}
            >
              SURAKSHA
            </Typography>
          </Box>
        )}

        {!open && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Train size={24} />
          </Box>
        )}

        <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
          {open ? <ChevronLeft size={22} /> : <MenuIcon size={22} />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflowY: "auto", py: 2, px: 1.5 }}>
        {menuItems.map((item) => {
          if (!hasAccess(item.roles)) return null;

          const active =
            isActive(item.path) ||
            item.children?.some((child) => isActive(child.path));

          const expanded = expandedMenus.includes(item.title);

          return (
            <Box key={item.title} sx={{ mb: 0.5 }}>
              <Tooltip title={!open ? item.title : ""} placement="right">
                <Box>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleMenuClick(item)}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? "initial" : "center",
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        backgroundColor: active
                          ? theme.palette.mode === "dark"
                            ? "rgba(33,150,243,0.15)"
                            : "rgba(25,118,210,0.08)"
                          : "transparent",
                        borderLeft: active
                          ? `4px solid ${theme.palette.primary.main}`
                          : "4px solid transparent",
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2.5 : "auto",
                          color: active ? "primary.main" : "text.secondary",
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      {open && (
                        <>
                          <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                              fontSize: 14,
                              fontWeight: active ? 800 : 700,
                            }}
                          />
                          {item.children &&
                            (expanded ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            ))}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>

                  {item.children && (
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 2 }}>
                        {item.children
                          .filter((child) => hasAccess(child.roles)) // ✅ ADD THIS
                          .map((child) => {
                            const childActive = isActive(child.path);

                            return (
                              <ListItem
                                key={child.title}
                                disablePadding
                                sx={{ mb: 0.5 }}
                              >
                                <ListItemButton
                                  onClick={() => handleMenuClick(child)}
                                  sx={{
                                    minHeight: 40,
                                    pl: 4,
                                    pr: 2,
                                    borderRadius: 2,
                                    backgroundColor: childActive
                                      ? theme.palette.mode === "dark"
                                        ? "rgba(33,150,243,0.1)"
                                        : "rgba(25,118,210,0.05)"
                                      : "transparent",
                                    borderLeft: childActive
                                      ? `3px solid ${theme.palette.primary.main}`
                                      : "3px solid transparent",
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 0,
                                      mr: 2,
                                      color: childActive
                                        ? "primary.main"
                                        : "text.secondary",
                                    }}
                                  >
                                    {child.icon}
                                  </ListItemIcon>

                                  {open && (
                                    <ListItemText
                                      primary={child.title}
                                      primaryTypographyProps={{
                                        fontSize: 13,
                                        fontWeight: childActive ? 800 : 700,
                                      }}
                                    />
                                  )}
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              </Tooltip>
            </Box>
          );
        })}
      </List>
    </Box>
  );

  /* =======================
     APP BAR (UI RESTORED)
     ======================= */

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderRadius: 0,
        }}
      >
        <Toolbar
          sx={{
            minHeight: HEADER_HEIGHT,
            height: HEADER_HEIGHT,
            px: { xs: 1, sm: 2, md: 3 },
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* ===== MOBILE MENU ===== */}
          {isMobile && (
            <IconButton onClick={handleDrawerToggle} color="inherit">
              <MenuIcon />
            </IconButton>
          )}

          {/* ===== BRAND CLUSTER ===== */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.6,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                height: 48, // ✅ reduced
                width: 48, // ✅ reduced
                borderRadius: "50%",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,

                // ✅ brighter premium ring + depth
                boxShadow: `
      0 0 0 2px rgba(255,255,255,0.65),
      0 6px 16px rgba(0,0,0,0.18)
    `,

                // ✅ same animation (kept)
                animation: "logoIn .4s ease",
                "@keyframes logoIn": {
                  from: { opacity: 0, transform: "scale(.88)" },
                  to: { opacity: 1, transform: "scale(1)" },
                },

                // ✅ micro hover lift
                transition: "all .18s ease",
                "&:hover": {
                  transform: "translateY(-1px) scale(1.03)",
                  boxShadow: `
        0 0 0 3px rgba(255,255,255,0.75),
        0 10px 22px rgba(0,0,0,0.25)
      `,
                },
              }}
            >
              <Box
                component="img"
                src={IR}
                sx={{
                  height: 34, // ✅ tighter fit
                  width: 34,
                  objectFit: "contain",
                  filter: "contrast(1.1) brightness(1.05)", // ✅ slight pop
                }}
              />
            </Box>

            {/* TEXT STACK */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: 0,
                animation: "titleIn .35s ease",
                "@keyframes titleIn": {
                  from: { opacity: 0, transform: "translateY(5px)" },
                  to: { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {/* BIG TITLE */}
              <Typography
                noWrap
                sx={{
                  fontWeight: 900,
                  letterSpacing: 0.8,
                  fontSize: {
                    xs: "1.2rem",
                    sm: "1.4rem",
                    md: "1.55rem",
                    lg: "1.65rem",
                  },
                  lineHeight: 1,
                }}
              >
                SURAKSHA
              </Typography>
              {!isMobile && (
                <Box
                  sx={{
                    height: 1.5,
                    width: { sm: 100, md: 140, lg: 180 },
                    my: 0.5,
                    borderRadius: 2,
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.25))",
                    opacity: 0.9,
                  }}
                />
              )}

              {/* SUBTITLE BELOW — NOT SIDE */}
              {!isMobile && (
                <Typography
                  sx={{
                    fontSize: 14,
                    opacity: 0.92,
                    letterSpacing: 0.25,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "60vw",
                  }}
                >
                  System for Unified Reporting & Analysis for Kavach Safety &
                  Health Assessment
                </Typography>
              )}
            </Box>
          </Box>

          {/* ===== RIGHT CONTROLS ===== */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Theme Toggle */}
            {/* <IconButton
              onClick={() => dispatch(toggleTheme())}
              color="inherit"
              sx={{
                transition: "all .18s",
                "&:hover": {
                  transform: "translateY(-1px)",
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              {themeMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton> */}

            {/* Avatar */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                borderRadius: 2,
                "&:hover": {
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  fontWeight: 800,
                  bgcolor: getAvatarColorByRole(getPrimaryRole(user?.roles)),
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.7)",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </Avatar>
            </IconButton>
          </Box>

          {/* ===== PROFILE MENU ===== */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 230,
                borderRadius: 2.5,
                p: 1,
                boxShadow: "0 16px 36px rgba(0,0,0,0.22)",
              },
            }}
          >
            <Box sx={{ px: 1.5, py: 1 }}>
              <Typography fontWeight={800}>{user?.name}</Typography>
              <Typography fontSize={11} color="text.secondary">
                {formatRole(user?.roles)}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate("/profile");
              }}
            >
              <ListItemIcon>
                <UserCircle size={18} />
              </ListItemIcon>
              Profile
            </MenuItem>

            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                handleSignOut();
              }}
            >
              <ListItemIcon>
                <LogOut size={18} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": { width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          overflowX: "hidden", // ✅ important
        }}
      >
        <Toolbar />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 1.5,
            px: 2,
            width: "100%", // ✅ force exact width
            maxWidth: "100%", // ✅ prevent overflow
            boxSizing: "border-box", // ✅ include padding inside width
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              flexWrap: "wrap",
              textAlign: "center",
            }}
          >
            <Box
              component="img"
              src={CRIS}
              alt="CRIS Logo"
              sx={{ height: 35 }}
            />

            <Box sx={{ fontWeight: 700, fontSize: 14 }}>
              Centre for Railway Information Systems (CRIS)
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
