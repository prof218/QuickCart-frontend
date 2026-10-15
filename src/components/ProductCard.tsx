'use client';

import Link from 'next/link';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';
import type { Product } from '@/types';
import ProductImage from '@/components/ProductImage';
import { formatINR } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useNotify } from '@/context/NotificationContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { requireAuth } = useAuth();
  const notify = useNotify();
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    // Purchase action — requires login. requireAuth runs this now if authenticated,
    // otherwise opens the login dialog and resumes it after a successful sign-in.
    requireAuth(() => {
      addItem(product, 1);
      notify.success(`Added ${product.name} to cart`);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1200);
    });
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow .2s ease, border-color .2s ease, transform .2s ease',
        '&:hover': { boxShadow: 4, borderColor: 'transparent', transform: 'translateY(-2px)' },
      }}
    >
      <CardActionArea component={Link} href={`/products/${product.id}`} sx={{ flexShrink: 0 }}>
        <ProductImage src={product.image} alt={product.name} sx={{ width: '100%', aspectRatio: '1 / 1' }} />
      </CardActionArea>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Chip label={product.category} size="small" variant="outlined" />
          {outOfStock ? (
            <Chip label="Out of stock" size="small" color="error" variant="outlined" />
          ) : (
            <Chip label={`In stock: ${product.stock}`} size="small" color="success" variant="outlined" />
          )}
        </Box>

        <Typography
          variant="subtitle1"
          component={Link}
          href={`/products/${product.id}`}
          sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', display: 'block' }}
        >
          {product.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.description}
        </Typography>

        <Typography variant="h6" sx={{ mt: 1.5 }}>
          {formatINR(product.price)}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          fullWidth
          variant={justAdded ? 'outlined' : 'contained'}
          color={justAdded ? 'success' : 'primary'}
          startIcon={justAdded ? <CheckCircleIcon /> : <AddShoppingCartIcon />}
          disabled={outOfStock}
          onClick={handleAdd}
          aria-label={`Add ${product.name} to cart`}
        >
          {outOfStock ? 'Out of stock' : justAdded ? 'Added' : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
}
