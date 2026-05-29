import { createTheme } from '@mui/material/styles';

export const sterlingRed = '#E4002B';
export const deepBlack = '#1A1A1A';
export const lightGrey = '#F5F5F5';

const theme = createTheme({
  palette: {
    primary: { main: sterlingRed, contrastText: '#FFFFFF' },
    secondary: { main: deepBlack, contrastText: '#FFFFFF' },
    background: { default: lightGrey, paper: '#FFFFFF' },
    success: { main: '#16803C' },
    warning: { main: '#B7791F' },
    error: { main: sterlingRed },
    text: { primary: '#1A1A1A', secondary: '#5A5A5A' }
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h4: { fontWeight: 800, letterSpacing: 0 },
    h5: { fontWeight: 800, letterSpacing: 0 },
    h6: { fontWeight: 700, letterSpacing: 0 },
    button: { fontWeight: 700, textTransform: 'none' }
  },
  shape: { borderRadius: 8 },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        // Larger touch target on mobile only — desktop padding unchanged
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '10px 18px',
          '@media (max-width:767px)': { minHeight: 44 },
        },
        containedPrimary: { '&:hover': { boxShadow: 'none', backgroundColor: '#B80022' } }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #E6E6E6', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 800, backgroundColor: '#FAFAFA' },
        root: { borderBottomColor: '#ECECEC' }
      }
    },
    MuiTextField: {
      defaultProps: { size: 'small' }
    },
    MuiSelect: {
      defaultProps: { size: 'small' }
    },
    // 16px input font on mobile prevents iOS auto-zoom
    MuiInputBase: {
      styleOverrides: {
        input: { '@media (max-width:767px)': { fontSize: 16 } }
      }
    },
    // Bottom-sheet dialogs on mobile; centered modal on desktop (unchanged)
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width:767px)': {
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0,
            width: '100%',
            maxWidth: '100%',
            borderRadius: '16px 16px 0 0',
            maxHeight: '92vh',
          },
        },
      }
    },
    MuiTab: {
      styleOverrides: {
        root: { '@media (max-width:767px)': { minHeight: 48, minWidth: 'auto', padding: '8px 12px' } }
      }
    }
  }
});

export default theme;
