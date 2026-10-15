'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';

interface ProductImageProps {
  src: string;
  alt: string;
  sx?: SxProps<Theme>;
}

/**
 * Product image with a consistent background and a graceful fallback: if the
 * remote image fails to load, a neutral placeholder with an icon is shown instead
 * of a broken-image glyph.
 */
export default function ProductImage({ src, alt, sx }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <Box
        role="img"
        aria-label={alt}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          color: 'text.disabled',
          ...sx,
        }}
      >
        <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48 }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      sx={{ objectFit: 'cover', bgcolor: 'grey.100', display: 'block', ...sx }}
    />
  );
}
