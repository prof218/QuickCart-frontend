'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number; // typically available stock
  onChange: (next: number) => void;
  size?: 'small' | 'medium';
}

export default function QuantitySelector({
  value,
  min = 1,
  max,
  onChange,
  size = 'medium',
}: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <IconButton size={size} onClick={dec} disabled={value <= min} aria-label="Decrease quantity">
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography
        component="span"
        aria-live="polite"
        sx={{ minWidth: 36, textAlign: 'center', fontWeight: 600, userSelect: 'none' }}
      >
        {value}
      </Typography>
      <IconButton
        size={size}
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
