import { createTheme } from '@mui/material/styles';

/**
 * Shared MUI theme — clean, professional e-commerce look.
 * Created in a client component (ThemeRegistry) so no non-serializable
 * props cross the server/client boundary.
 */
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' }, // blue
    secondary: { main: '#F59E0B' }, // amber
    background: { default: '#F7F8FA', paper: '#FFFFFF' },
    success: { main: '#16A34A' },
    error: { main: '#DC2626' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      'Roboto, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #ECEEF1' },
      },
    },
  },
});

export default theme;
