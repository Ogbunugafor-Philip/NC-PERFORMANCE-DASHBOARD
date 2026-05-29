import { Box, Button, Card, CardContent, LinearProgress, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../api/auth';
import { errorMessage } from '../../api/axios';
import { SterlingLogo } from '../../components/common/SterlingLogo';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/reportStore';
import { passwordPattern, passwordStrength } from '../../utils/validators';

interface FormValues { current: string; password: string; confirm: string }

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const setRequiresPasswordChange = useAuthStore((state) => state.setRequiresPasswordChange);
  const notify = useNotificationStore((state) => state.notify);
  const { control, handleSubmit, watch } = useForm<FormValues>({ defaultValues: { current: '', password: '', confirm: '' } });
  const strength = passwordStrength(watch('password') || '');
  const mutation = useMutation({
    mutationFn: (values: FormValues) => changePassword(values.current, values.password),
    onSuccess: () => {
      setRequiresPasswordChange(false);
      notify('Password changed successfully', 'success');
      navigate('/dashboard');
    },
    onError: (error) => notify(errorMessage(error, 'Password change failed'), 'error')
  });
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'background.default', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}><SterlingLogo /></Box>
          <Typography variant="h5" textAlign="center">Change Temporary Password</Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 3 }}>This step is required before using the dashboard.</Typography>
          <Box component="form" onSubmit={handleSubmit((values) => mutation.mutate(values))} sx={{ display: 'grid', gap: 2 }}>
            <Controller name="current" control={control} rules={{ required: 'Temporary password is required' }} render={({ field, fieldState }) => (
              <TextField {...field} type="password" label="Temporary Password" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <Controller name="password" control={control} rules={{ required: 'New password is required', pattern: { value: passwordPattern, message: 'Use at least 8 chars, a number and special character' } }} render={({ field, fieldState }) => (
              <TextField {...field} type="password" label="New Password" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <LinearProgress variant="determinate" value={strength} sx={{ height: 8, borderRadius: 8 }} />
            <Controller name="confirm" control={control} rules={{ validate: (value) => value === watch('password') || 'Passwords do not match' }} render={({ field, fieldState }) => (
              <TextField {...field} type="password" label="Confirm New Password" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>Submit</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
