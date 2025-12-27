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
          height: '100vh',
          minHeight: '100dvh',
          overflow: 'hidden',
          width: '100%',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1C1C1E',
        },
        '#root': {
          height: '100vh',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
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
          minWidth: 80, // 88 -> 80
          minHeight: 44, // 40 -> 44 (保持与容器一致)
          paddingTop: 2, // 4 -> 2
          paddingBottom: 2, // 4 -> 2
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem', // 0.75rem -> 0.7rem
            '&.Mui-selected': {
              fontSize: '0.7rem',
            }
          }
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
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1C1C1E', // 改回白色或深色背景
            '& fieldset': {
              borderColor: mode === 'light' ? '#E0E0E0' : '#3A3A3C', // 恢复边框颜色
              borderWidth: 1, // 恢复边框宽度
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? '#BDBDBD' : '#636366', // 悬停加深
              borderWidth: 1,
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
              borderColor: mode === 'light' ? '#007AFF' : '#0A84FF',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1C1C1E', // 改回白色或深色背景
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? '#E0E0E0' : '#3A3A3C', // 恢复边框颜色
            borderWidth: 1, // 恢复边框宽度
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? '#BDBDBD' : '#636366', // 悬停加深
            borderWidth: 1,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: mode === 'light' ? '#007AFF' : '#0A84FF',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 36, // 42 -> 36
          height: 22, // 26 -> 22
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(14px)', // 16px -> 14px
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: mode === 'light' ? '#007AFF' : '#0A84FF',
                opacity: 1,
                border: 0,
              },
              '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
              },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              color: '#007AFF',
              border: '6px solid #fff',
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
              color: mode === 'light' ? '#e9e9ea' : '#39393d',
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: mode === 'light' ? 0.7 : 0.3,
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 18, // 22 -> 18
            height: 18, // 22 -> 18
          },
          '& .MuiSwitch-track': {
            borderRadius: 22 / 2, // 26/2 -> 22/2
            backgroundColor: mode === 'light' ? '#E9E9EA' : '#39393D',
            opacity: 1,
            transition: 'background-color 500ms',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          marginTop: 8,
          boxShadow: mode === 'light' 
            ? '0px 4px 20px rgba(0, 0, 0, 0.08)' 
            : '0px 4px 20px rgba(0, 0, 0, 0.4)',
          border: mode === 'light' ? '1px solid #E5E5EA' : '1px solid #38383A',
        },
        list: {
          padding: '4px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 12px',
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'light' ? 'rgba(0, 122, 255, 0.12)' : 'rgba(10, 132, 255, 0.16)',
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(0, 122, 255, 0.16)' : 'rgba(10, 132, 255, 0.20)',
            },
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          '& .MuiFormControlLabel-label': {
            marginLeft: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
  },
});
