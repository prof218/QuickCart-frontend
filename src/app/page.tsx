'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Link from 'next/link';
import { getProducts } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import ProductCard from '@/components/ProductCard';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import EmptyState from '@/components/states/EmptyState';

export default function HomePage() {
  const { data: products, loading, error, reload } = useAsyncData(() => getProducts(), []);

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 4 },
          borderRadius: 3,
          color: 'common.white',
          background: 'linear-gradient(120deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)',
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          Gadgets & accessories, delivered fast
        </Typography>
        <Typography sx={{ mt: 0.5, opacity: 0.9, maxWidth: 560 }}>
          Hand-picked electronics at honest prices. Browse freely — sign in when you&apos;re ready to buy.
        </Typography>
      </Box>

      {loading && <LoadingState label="Loading products…" />}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && products && products.length === 0 && (
        <EmptyState
          icon={<Inventory2OutlinedIcon fontSize="inherit" />}
          title="No products yet"
          description="There are no products to show right now. Please check back later."
        />
      )}

      {!loading && !error && products && products.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, sm: 2.5 },
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Box>
      )}

      <Box sx={{ mt: 4, display: { xs: 'block', sm: 'none' } }}>
        <Button component={Link} href="/cart" variant="outlined" fullWidth>
          View cart
        </Button>
      </Box>
    </Box>
  );
}
