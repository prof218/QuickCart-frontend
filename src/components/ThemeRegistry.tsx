'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import theme from '@/lib/theme';
import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';

/**
 * Client-side provider stack for MUI + cart. Creating the theme inside a client
 * component keeps non-serializable theme functions off the server/client boundary,
 * and AppRouterCacheProvider wires Emotion SSR for the App Router (no FOUC / hydration issues).
 */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 4 } }}>
                  {children}
                </Container>
              </Box>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
