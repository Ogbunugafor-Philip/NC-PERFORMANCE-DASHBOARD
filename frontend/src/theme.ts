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
        root: { borderRadius: 8, boxShadow: 'none', padding: '10px 18px' },
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
    }
  }
});

export default theme;
