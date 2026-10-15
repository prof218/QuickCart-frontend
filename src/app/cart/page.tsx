'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/format';
import CartItem from '@/components/CartItem';
import EmptyState from '@/components/states/EmptyState';
import LoadingState from '@/components/states/LoadingState';

export default function CartPage() {
  const { items, subtotal, itemCount, clearCart, hydrated } = useCart();
  const { requireAuth } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    // Purchase action — gated. Guests get the login dialog; the intent resumes after login.
    requireAuth(() => router.push('/checkout'));
  };

  // Cart is restored from localStorage after mount — show loading until then.
  if (!hydrated) return <LoadingState label="Loading your cart…" />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<RemoveShoppingCartIcon fontSize="inherit" />}
        title="Your cart is empty"
        description="Browse the store and add a few things you like."
        action={
          <Button component={Link} href="/" variant="contained" startIcon={<ShoppingBagOutlinedIcon />}>
            Start shopping
          </Button>
        }
      />
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Your Cart
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
          alignItems: 'start',
        }}
      >
        <Paper variant="outlined" sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
          {items.map((line) => (
            <CartItem key={line.id} line={line} />
          ))}
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button component={Link} href="/" color="inherit">
              Continue shopping
            </Button>
            <Button color="error" onClick={clearCart}>
              Clear cart
            </Button>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Stack spacing={1.5} sx={{ my: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Items</Typography>
              <Typography>{itemCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>{formatINR(subtotal)}</Typography>
            </Box>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>Estimated total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatINR(subtotal)}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Taxes and the final amount are confirmed securely at checkout.
          </Typography>
          <Button onClick={handleCheckout} variant="contained" fullWidth size="large">
            Proceed to Checkout
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
