'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LoginIcon from '@mui/icons-material/Login';
import { getMyOrders } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/format';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import EmptyState from '@/components/states/EmptyState';

const statusColor: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
  pending: 'warning',
  paid: 'success',
  failed: 'error',
  cancelled: 'default',
};

export default function OrdersPage() {
  const { status, openAuthDialog } = useAuth();
  // Only fetch once authenticated.
  const authed = status === 'authenticated';
  const { data: orders, loading, error, reload } = useAsyncData(
    async () => (authed ? getMyOrders() : []),
    [authed],
  );

  if (status === 'loading') return <LoadingState label="Loading…" />;

  if (status === 'guest') {
    return (
      <EmptyState
        icon={<ReceiptLongIcon fontSize="inherit" />}
        title="Sign in to view your orders"
        description="Your orders are private to your account."
        action={
          <Button variant="contained" startIcon={<LoginIcon />} onClick={() => openAuthDialog('login')}>
            Log in
          </Button>
        }
      />
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        My Orders
      </Typography>

      {loading && <LoadingState label="Loading your orders…" />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && orders && orders.length === 0 && (
        <EmptyState
          icon={<ReceiptLongIcon fontSize="inherit" />}
          title="No orders yet"
          description="When you place an order, it will show up here."
          action={
            <Button component={Link} href="/" variant="contained">
              Start shopping
            </Button>
          }
        />
      )}

      {!loading && !error && orders && orders.length > 0 && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {orders.map((o) => (
            <Paper key={o.id} variant="outlined" sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{o.orderNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} item(s) · {formatINR(o.amount)}
                  </Typography>
                </Box>
                <Chip label={o.status} color={statusColor[o.status] ?? 'default'} size="small" />
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
