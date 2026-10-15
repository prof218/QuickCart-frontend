'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Record<string, string>;

export default function AuthDialog() {
  const { dialogOpen, dialogMode, setDialogMode, closeAuthDialog, login, register } = useAuth();
  const isRegister = dialogMode === 'register';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset transient form state whenever the dialog opens or the mode switches.
  // Intentional setState-in-effect: syncing local form state to the dialog's open/mode.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (dialogOpen) {
      setErrors({});
      setGeneralError(null);
      setConfirm('');
      setPassword('');
      setShowPassword(false);
    }
  }, [dialogOpen, dialogMode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): Errors => {
    const e: Errors = {};
    if (isRegister && !name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!emailRe.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (isRegister && password.length < 8) e.password = 'At least 8 characters';
    else if (isRegister && !(/[A-Za-z]/.test(password) && /[0-9]/.test(password)))
      e.password = 'Include a letter and a number';
    if (isRegister && confirm !== password) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setGeneralError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      // Success: AuthProvider closes the dialog and resumes any pending action.
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      // Map server-side field errors (zod details) where possible.
      const fieldErrors: Errors = {};
      if (apiErr?.details && Array.isArray(apiErr.details)) {
        for (const d of apiErr.details as Array<{ path?: string; message?: string }>) {
          if (d.path && d.message) fieldErrors[d.path] = d.message;
        }
      }
      if (Object.keys(fieldErrors).length > 0) setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setGeneralError(apiErr?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onClose={submitting ? undefined : closeAuthDialog}
      maxWidth="xs"
      fullWidth
      aria-labelledby="auth-dialog-title"
    >
      <DialogTitle id="auth-dialog-title" sx={{ pb: 0.5 }}>
        {isRegister ? 'Create your account' : 'Login required to continue'}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isRegister
            ? 'Sign up to add products to your cart and check out securely.'
            : 'Please sign in or create an account to add products to your cart and continue shopping.'}
        </Typography>

        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        <Box component="form" id="auth-form" onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <TextField
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              autoFocus
              margin="dense"
              autoComplete="name"
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            fullWidth
            autoFocus={!isRegister}
            margin="dense"
            autoComplete="email"
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password || (isRegister ? 'Min 8 chars, with a letter and a number' : '')}
            fullWidth
            margin="dense"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {isRegister && (
            <TextField
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={Boolean(errors.confirm)}
              helperText={errors.confirm}
              fullWidth
              margin="dense"
              autoComplete="new-password"
            />
          )}
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            component="button"
            type="button"
            onClick={() => !submitting && setDialogMode(isRegister ? 'login' : 'register')}
            sx={{ fontWeight: 600, verticalAlign: 'baseline' }}
          >
            {isRegister ? 'Log in' : 'Create account'}
          </Link>
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={closeAuthDialog} color="inherit" disabled={submitting}>
          Continue browsing
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          type="submit"
          form="auth-form"
          variant="contained"
          disabled={submitting}
        >
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
