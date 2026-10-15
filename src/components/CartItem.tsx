'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import type { CartLine } from '@/types';
import { formatINR } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import QuantitySelector from '@/components/QuantitySelector';
import ProductImage from '@/components/ProductImage';

export default function CartItem({ line }: { line: CartLine }) {
  const { updateQuantity, removeItem } = useCart();
  const lineSubtotal = line.price * line.quantity;
  const atStockCap = line.stock > 0 && line.quantity >= line.stock;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '72px 1fr', sm: '88px 1fr auto' },
        gap: 2,
        alignItems: 'center',
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        component={Link}
        href={`/products/${line.id}`}
        sx={{ display: 'block', width: { xs: 72, sm: 88 }, height: { xs: 72, sm: 88 } }}
      >
        <ProductImage
          src={line.image}
          alt={line.name}
          sx={{ width: '100%', height: '100%', borderRadius: 2 }}
        />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          component={Link}
          href={`/products/${line.id}`}
          sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none' }}
        >
          {line.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatINR(line.price)} each
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
          <QuantitySelector
            value={line.quantity}
            max={line.stock > 0 ? line.stock : line.quantity}
            onChange={(q) => updateQuantity(line.id, q)}
            size="small"
          />
          <Button
            size="small"
            color="inherit"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => removeItem(line.id)}
            aria-label={`Remove ${line.name} from cart`}
          >
            Remove
          </Button>
        </Box>
        {atStockCap && (
          <Typography variant="caption" color="warning.main">
            Reached available stock ({line.stock})
          </Typography>
        )}
      </Box>

      <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' }, textAlign: { xs: 'right', sm: 'right' } }}>
        <Typography sx={{ fontWeight: 700 }}>{formatINR(lineSubtotal)}</Typography>
      </Box>
    </Box>
  );
}
