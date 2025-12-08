import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#007AFF' : '#0A84FF',
    },
    secondary: {
      main: mode === 'light' ? '#5856D6' : '#5E5CE6',
    },
    background: {
      default: mode === 'light' ? '#FFFFFF' : '#1C1C1E',
      paper: mode === 'light' ? '#F2F2F7' : '#2C2C2E',
    },
    text: {
      primary: mode === 'light' ? '#000000' : '#FFFFFF',
      secondary: mode === 'light' ? '#3C3C43' : '#EBEBF5',
    },
    divider: mode === 'light' ? '#C6C6C8' : '#3A3A3C',
  },
  spacing: 8,
  typography: {
    fontFamily: [
      '"SF Pro Text"',
      '"SF Pro Display"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.4 },
    body2: { lineHeight: 1.4 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%' },
        body: {
          minHeight: '100dvh',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1C1C1E',
        },
        '#root': { minHeight: '100dvh' },
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          minHeight: 44,
          minWidth: 88,
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 44,
          height: 44,
        }
      }
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 88,
          minHeight: 44,
          paddingTop: 8,
          paddingBottom: 8,
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
});
