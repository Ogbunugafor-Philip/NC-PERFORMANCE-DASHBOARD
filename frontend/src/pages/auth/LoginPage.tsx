import { Box, Button, Card, CardContent, Divider, Link, TextField, Typography } from '@mui/material';
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
    onError: (error) => notify(errorMessage(error, 'Login failed'), 'error'),
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#F5F5F5',
        backgroundImage: 'radial-gradient(ellipse at 60% 20%, rgba(228,0,43,0.06) 0%, transparent 60%)',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        {/* Logo above card */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              backgroundColor: '#fff',
              borderRadius: 2,
              px: 3,
              py: 1.5,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              mb: 2,
            }}
          >
            <SterlingLogo width={160} />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#1A1A1A', mt: 1.5, mb: 0.5 }}
          >
            NC Performance Dashboard
          </Typography>
          <Typography sx={{ color: '#888', fontSize: 14 }}>
            North Central Region &nbsp;|&nbsp; Sterling Bank
          </Typography>
        </Box>

        {/* Login card */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            border: '1px solid rgba(228,0,43,0.10)',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 0.5, color: '#1A1A1A' }}
            >
              Sign In
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 14, mb: 3 }}>
              Enter your DAO code or email to access your dashboard
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit((values) => mutation.mutate(values))}
              sx={{ display: 'grid', gap: 2 }}
            >
              <Controller
                name="identifier"
                control={control}
                rules={{ required: 'DAO Code or Email is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="DAO Code or Email"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="password"
                    label="Password"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={mutation.isPending}
                sx={{
                  mt: 0.5,
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '0.02em',
                }}
              >
                {mutation.isPending ? 'Signing in…' : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Link component={RouterLink} to="/first-login" sx={{ fontSize: 13 }}>
                First Time Login
              </Link>
              <Link component={RouterLink} to="/first-login" sx={{ fontSize: 13 }}>
                Forgot Password?
              </Link>
            </Box>
          </CardContent>
        </Card>

        <Typography
          sx={{ textAlign: 'center', mt: 3, color: '#aaa', fontSize: 12 }}
        >
          Sterling Bank © 2025 &nbsp;|&nbsp; North Central Region
        </Typography>
      </Box>
    </Box>
  );
};
