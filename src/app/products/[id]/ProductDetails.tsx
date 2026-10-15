'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import MuiLink from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import BoltIcon from '@mui/icons-material/Bolt';
import { getProduct } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatINR } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useNotify } from '@/context/NotificationContext';
import QuantitySelector from '@/components/QuantitySelector';
import ProductImage from '@/components/ProductImage';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';

export default function ProductDetails({ id }: { id: string }) {
  const { addItem } = useCart();
  const { requireAuth } = useAuth();
  const notify = useNotify();
  const router = useRouter();
  const { data: product, loading, error, reload } = useAsyncData(() => getProduct(id), [id]);

  const [quantity, setQuantity] = useState(1);

  if (loading) return <LoadingState label="Loading product…" />;
  if (error || !product) return <ErrorState message={error ?? 'Product not found'} onRetry={reload} />;

  const outOfStock = product.stock <= 0;
  // Keep the selected quantity valid against the latest stock.
  const safeQuantity = Math.min(Math.max(1, quantity), Math.max(1, product.stock));

  const handleAdd = () => {
    requireAuth(() => {
      addItem(product, safeQuantity);
      notify.success(`Added ${safeQuantity} × ${product.name} to cart`);
    });
  };

  const handleBuyNow = () => {
    requireAuth(() => {
      addItem(product, safeQuantity);
      router.push('/cart');
    });
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'start',
        }}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          sx={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        />

        <Box>
          <Chip label={product.category} size="small" variant="outlined" sx={{ mb: 1.5 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>

          <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
            {formatINR(product.price)}
          </Typography>

          {outOfStock ? (
            <Chip label="Out of stock" color="error" variant="outlined" sx={{ mb: 2 }} />
          ) : (
            <Chip label={`In stock: ${product.stock}`} color="success" variant="outlined" sx={{ mb: 2 }} />
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {product.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {!outOfStock && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
              <Typography component="span" sx={{ fontWeight: 600 }}>
                Quantity
              </Typography>
              <QuantitySelector value={safeQuantity} max={product.stock} onChange={setQuantity} />
              <Typography variant="body2" color="text.secondary">
                Max {product.stock}
              </Typography>
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<AddShoppingCartIcon />}
              disabled={outOfStock}
              onClick={handleAdd}
              sx={{ minWidth: 200 }}
            >
              {outOfStock ? 'Out of stock' : 'Add to Cart'}
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<BoltIcon />}
              disabled={outOfStock}
              onClick={handleBuyNow}
              sx={{ minWidth: 200 }}
            >
              Buy Now
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
