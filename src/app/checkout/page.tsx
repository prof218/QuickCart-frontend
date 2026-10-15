'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useNotify } from '@/context/NotificationContext';
import { formatINR } from '@/lib/format';
import { createPaymentOrder, verifyPayment, markPaymentFailed } from '@/lib/api';
import {
  loadRazorpayScript,
  openRazorpayCheckout,
  type RazorpaySuccessResponse,
  type RazorpayFailureResponse,
} from '@/lib/razorpay';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';

const phoneRe = /^\+?[0-9]{7,15}$/;
type Status = 'idle' | 'processing' | 'verifying';

export default function CheckoutPage() {
  const { items, subtotal, itemCount, hydrated, clearCart } = useCart();
  const { status: authStatus, user, openAuthDialog } = useAuth();
  const notify = useNotify();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  // Prefill the form from the signed-in user once it loads (intentional sync-from-store).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setName((n) => n || user.name);
      setEmail((e) => e || user.email);
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (authStatus === 'loading' || !hydrated) return <LoadingState label="Loading checkout…" />;

  if (authStatus === 'guest') {
    return (
      <EmptyState
        title="Login required to check out"
        description="Please sign in or create an account to continue to checkout."
        action={
          <Button variant="contained" startIcon={<LoginIcon />} onClick={() => openAuthDialog('login')}>
            Log in
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBagOutlinedIcon fontSize="inherit" />}
        title="Your cart is empty"
        description="Add some products before checking out."
        action={
          <Button component={Link} href="/" variant="contained">
            Browse products
          </Button>
        }
      />
    );
  }

  const handlePay = async () => {
    if (!phoneRe.test(phone.trim())) {
      setPhoneError('Enter a valid phone number (7–15 digits)');
      return;
    }
    setPhoneError('');
    setStatus('processing');

    let session;
    try {
      // Backend validates products/stock and computes the amount server-side.
      session = await createPaymentOrder({
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        items: items.map((l) => ({ productId: l.id, quantity: l.quantity })),
      });

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Could not load the payment gateway. Please try again.');
    } catch (err) {
      setStatus('idle');
      notify.error(err instanceof Error ? err.message : 'Could not start checkout.');
      return;
    }

    const onSuccess = async (resp: RazorpaySuccessResponse) => {
      setStatus('verifying');
      try {
        const result = await verifyPayment({
          orderId: session.orderId,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        });
        if (result.paymentStatus === 'paid') {
          clearCart(); // only after the backend confirms payment
          notify.success('Payment successful!');
          router.push(`/orders/${session.orderId}`);
        } else {
          setStatus('idle');
          notify.error('We could not confirm your payment. Check “My orders” for status.');
        }
      } catch (err) {
        // Verification failed server-side — the order was NOT marked paid.
        setStatus('idle');
        notify.error(err instanceof Error ? err.message : 'Payment verification failed.');
      }
    };

    const onDismiss = () => {
      setStatus('idle');
      notify.info('Checkout cancelled — your cart is saved.');
      void markPaymentFailed({ orderId: session.orderId, reason: 'user_dismissed' }).catch(() => {});
    };

    const onFailure = (resp: RazorpayFailureResponse) => {
      // A single failed attempt — DON'T mark the order failed, because Razorpay keeps the
      // modal open for a retry on the same order. The order is only marked failed on
      // dismissal (onDismiss). This keeps safe retries working.
      notify.error(resp?.error?.description || 'That payment attempt failed. You can try again.');
    };

    openRazorpayCheckout(
      {
        key: session.razorpayKeyId,
        amount: session.amount,
        currency: session.currency,
        name: 'QuickCart',
        description: `Order ${session.orderNumber}`,
        order_id: session.razorpayOrderId,
        prefill: { name: name.trim(), email: email.trim(), contact: phone.trim() },
        theme: { color: '#2563EB' },
        handler: onSuccess,
        modal: { ondismiss: onDismiss },
      },
      onFailure,
    );
  };

  const busy = status !== 'idle';

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Checkout
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Contact details */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Contact details
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              disabled={busy}
              autoComplete="name"
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={busy}
              autoComplete="email"
            />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={Boolean(phoneError)}
              helperText={phoneError || 'For order/delivery updates'}
              fullWidth
              disabled={busy}
              autoComplete="tel"
            />
          </Stack>
        </Paper>

        {/* Order summary */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Order summary
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={1.25} sx={{ mt: 1 }}>
            {items.map((l) => (
              <Box key={l.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography sx={{ minWidth: 0 }} noWrap>
                  {l.name} × {l.quantity}
                </Typography>
                <Typography sx={{ fontWeight: 600 }}>{formatINR(l.price * l.quantity)}</Typography>
              </Box>
            ))}
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>Total ({itemCount} item{itemCount === 1 ? '' : 's'})</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatINR(subtotal)}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            The final amount is recalculated and charged securely by the server.
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<LockIcon />}
            onClick={handlePay}
            disabled={busy}
          >
            {status === 'processing' ? 'Starting…' : status === 'verifying' ? 'Verifying…' : `Pay ${formatINR(subtotal)}`}
          </Button>
          <Button component={Link} href="/cart" fullWidth sx={{ mt: 1 }} disabled={busy}>
            Back to cart
          </Button>
        </Paper>
      </Box>

      {/* Blocking overlay while the server verifies the payment — never a fake success. */}
      <Backdrop open={status === 'verifying'} sx={{ zIndex: (t) => t.zIndex.modal + 1, color: '#fff', flexDirection: 'column', gap: 2 }}>
        <CircularProgress color="inherit" />
        <Typography>Verifying your payment…</Typography>
      </Backdrop>
    </Box>
  );
}
