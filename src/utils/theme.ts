import { createTheme, ThemeOptions } from '@mui/material/styles';

const getThemeOptions = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#1565C0' : '#42A5F5',
      dark: '#0D47A1',
      light: '#64B5F6',
    },
    secondary: {
      main: mode === 'light' ? '#F57C00' : '#FFB74D',
      dark: '#E65100',
      light: '#FFD54F',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#F57C00',
      light: '#FFB74D',
      dark: '#E65100',
    },
    success: {
      main: '#388E3C',
      light: '#66BB6A',
      dark: '#2E7D32',
    },
    info: {
      main: '#0288D1',
      light: '#4FC3F7',
      dark: '#01579B',
    },
    background: {
      default: mode === 'light' ? '#F5F7FA' : '#0A0E27',
      paper: mode === 'light' ? '#FFFFFF' : '#1A1D35',
    },
    text: {
      primary: mode === 'light' ? '#212121' : '#FFFFFF',
      secondary: mode === 'light' ? '#616161' : '#B0B0B0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01562em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.65rem',
      fontWeight: 600,
      letterSpacing: '-0.00833em',
      lineHeight: 1.25,
    },
    h3: {
      fontSize: '1.4rem',
      fontWeight: 600,
      letterSpacing: '0em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.2rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.05rem',
      fontWeight: 600,
      letterSpacing: '0em',
      lineHeight: 1.35,
    },
    h6: {
      fontSize: '0.95rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
      lineHeight: 1.35,
    },
    body1: {
      fontSize: '0.875rem',
      letterSpacing: '0.00938em',
      lineHeight: 1.4,
    },
    body2: {
      fontSize: '0.8125rem',
      letterSpacing: '0.01071em',
      lineHeight: 1.35,
    },
    button: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      letterSpacing: '0.02857em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.3,
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1.35,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
        sizeSmall: {
          padding: '4px 10px',
          fontSize: '0.75rem',
        },
        sizeLarge: {
          padding: '8px 18px',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAlert: {
  styleOverrides: {
    root: {
      borderRadius: 14,
      fontWeight: 600,
      padding: '10px 14px',
      alignItems: 'center',
      boxShadow: mode === 'light'
        ? '0 10px 28px rgba(0,0,0,0.12)'
        : '0 12px 32px rgba(0,0,0,0.45)',
    },

    icon: {
      fontSize: 22,
      marginRight: 8,
    },

    message: {
      fontSize: '0.85rem',
      lineHeight: 1.4,
    },

    action: {
      marginRight: 4,
    },

    /* ✅ Severity styles — TYPE SAFE */
    standard: {
      '&[data-severity="success"]': {
        backgroundColor: mode === 'light' ? '#ecfdf5' : '#052e1f',
      },
      '&[data-severity="error"]': {
        backgroundColor: mode === 'light' ? '#fef2f2' : '#2a0b0b',
      },
      '&[data-severity="warning"]': {
        backgroundColor: mode === 'light' ? '#fffbeb' : '#2a1f05',
      },
      '&[data-severity="info"]': {
        backgroundColor: mode === 'light' ? '#eff6ff' : '#0b1e33',
      },
    },
  },
},


MuiSnackbar: {
  defaultProps: {
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'right',
    },
  },
},

    
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '0.8125rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px 12px',
          fontSize: '0.8125rem',
        },
        head: {
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '10px 12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          height: '26px',
        },
        sizeSmall: {
          fontSize: '0.6875rem',
          height: '22px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          minHeight: '36px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.8125rem',
        },
        secondary: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
          fontSize: '1.05rem',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 20px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light'
            ? '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)'
            : '0px 4px 12px rgba(0, 0, 0, 0.5), 0px 2px 4px rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
          border: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'box-shadow 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 0,
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0px 2px 8px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)'
            : '0px 4px 12px rgba(0, 0, 0, 0.5), 0px 2px 4px rgba(0, 0, 0, 0.3)',
          border: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: mode === 'light' ? '1px solid #E0E0E0' : '1px solid #333',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: mode === 'light' ? '1px solid #E0E0E0' : '1px solid #333',
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme(getThemeOptions(mode));
};
