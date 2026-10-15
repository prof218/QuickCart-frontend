'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LogoutIcon from '@mui/icons-material/Logout';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { itemCount, hydrated } = useCart();
  const { status, user, openAuthDialog, logout } = useAuth();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const openMenu = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ maxWidth: 'lg', width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Box
          component={Link}
          href="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'primary.main' }}
        >
          <StorefrontIcon />
          <Typography variant="h6" component="span" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            QuickCart
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Button component={Link} href="/" color="inherit" sx={{ mr: { xs: 0.5, sm: 1 } }}>
          Home
        </Button>

        <IconButton
          component={Link}
          href="/cart"
          color="inherit"
          sx={{ mr: { xs: 0.5, sm: 1 } }}
          aria-label={`Cart${hydrated ? `, ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}
        >
          <Badge badgeContent={hydrated ? itemCount : 0} color="primary" invisible={!hydrated || itemCount === 0}>
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        {status === 'authenticated' && user ? (
          <>
            <IconButton onClick={openMenu} aria-label="Account menu" size="small" sx={{ ml: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 16 }}>{initial}</Avatar>
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu} keepMounted>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} href="/orders" onClick={closeMenu}>
                <ListItemIcon>
                  <ReceiptLongIcon fontSize="small" />
                </ListItemIcon>
                My orders
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeMenu();
                  void logout();
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Log out
              </MenuItem>
            </Menu>
          </>
        ) : status === 'guest' ? (
          <Button variant="contained" onClick={() => openAuthDialog('login')} sx={{ ml: 0.5 }}>
            Log in
          </Button>
        ) : (
          // 'loading' — reserve space to avoid layout shift / hydration flicker
          <Box sx={{ width: 72 }} />
        )}
      </Toolbar>
    </AppBar>
  );
}
