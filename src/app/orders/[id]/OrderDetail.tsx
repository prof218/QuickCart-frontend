'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoginIcon from '@mui/icons-material/Login';
import { getOrder } from '@/lib/api';
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

export default function OrderDetail({ id }: { id: string }) {
  const { status: authStatus, openAuthDialog } = useAuth();
  const authed = authStatus === 'authenticated';
  const { data: order, loading, error, reload } = useAsyncData(
    () => (authed ? getOrder(id) : Promise.reject(new Error('auth'))),
    [authed, id],
  );

  if (authStatus === 'loading') return <LoadingState label="Loading…" />;
  if (authStatus === 'guest') {
    return (
      <EmptyState
        title="Sign in to view this order"
        description="Orders are private to your account."
        action={
          <Button variant="contained" startIcon={<LoginIcon />} onClick={() => openAuthDialog('login')}>
            Log in
          </Button>
        }
      />
    );
  }

  if (loading) return <LoadingState label="Loading order…" />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} />;

  const paid = order.paymentStatus === 'paid';

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      {paid ? (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 56 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mt: 1 }}>
            Order confirmed
          </Typography>
          <Typography color="text.secondary">Thank you! Your payment was verified successfully.</Typography>
        </Box>
      ) : order.paymentStatus === 'failed' ? (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button component={Link} href="/cart" color="inherit" size="small">Back to cart</Button>}>
          This order was not completed. No payment was captured.
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Payment is pending for this order.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Order
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{order.orderNumber}</Typography>
          </Box>
          <Chip label={order.status} color={statusColor[order.status] ?? 'default'} />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack divider={<Divider flexItem />} spacing={1.25}>
          {order.items.map((it, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ minWidth: 0 }} noWrap>
                {it.name} × {it.quantity}
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatINR(it.price * it.quantity)}</Typography>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>Total paid</Typography>
          <Typography sx={{ fontWeight: 700 }}>{formatINR(order.amount)}</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
        <Button component={Link} href="/" variant="contained">
          Continue shopping
        </Button>
        <Button component={Link} href="/orders" variant="outlined">
          My orders
        </Button>
      </Box>
    </Box>
  );
}
