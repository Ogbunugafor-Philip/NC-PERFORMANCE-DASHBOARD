import { Box, Button, Card, CardContent, Link, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { errorMessage } from '../../api/axios';
import { SterlingLogo } from '../../components/common/SterlingLogo';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/reportStore';

interface FormValues { identifier: string; password: string }

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const notify = useNotificationStore((state) => state.notify);
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: { identifier: '', password: '' } });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => login(values.identifier, values.password),
    onSuccess: (data) => {
      setAuth(data.access_token, data.requires_password_change);
      navigate(data.requires_password_change ? '/change-password' : '/dashboard');
    },
    onError: (error) => notify(errorMessage(error, 'Login failed'), 'error')
  });
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'background.default', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}><SterlingLogo /></Box>
          <Typography textAlign="center" variant="h5">NC Performance Dashboard</Typography>
          <Typography textAlign="center" color="text.secondary" sx={{ mb: 3 }}>Sign in with your DAO code or email</Typography>
          <Box component="form" onSubmit={handleSubmit((values) => mutation.mutate(values))} sx={{ display: 'grid', gap: 2 }}>
            <Controller name="identifier" control={control} rules={{ required: 'DAO Code or Email is required' }} render={({ field, fieldState }) => (
              <TextField {...field} label="DAO Code or Email" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <Controller name="password" control={control} rules={{ required: 'Password is required' }} render={({ field, fieldState }) => (
              <TextField {...field} type="password" label="Password" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>Login</Button>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Link component={RouterLink} to="/first-login">First Time Login / Sign Up</Link>
            <Link component={RouterLink} to="/first-login">Forgot Password</Link>
          </Box>
        </CardContent>
      </Card>
      <Typography sx={{ position: 'fixed', bottom: 18 }} color="text.secondary" variant="body2">Sterling Bank © 2025 | North Central Region</Typography>
    </Box>
  );
};
