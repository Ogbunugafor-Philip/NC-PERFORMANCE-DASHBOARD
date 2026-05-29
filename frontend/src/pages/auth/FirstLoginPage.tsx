import { Box, Button, Card, CardContent, Link, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { firstLogin } from '../../api/auth';
import { errorMessage } from '../../api/axios';
import { SterlingLogo } from '../../components/common/SterlingLogo';
import { useNotificationStore } from '../../store/reportStore';
import { daoCodePattern } from '../../utils/validators';

interface FormValues { dao_code: string; email: string }

export const FirstLoginPage = () => {
  const notify = useNotificationStore((state) => state.notify);
  const { control, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { dao_code: '', email: '' } });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => firstLogin(values.dao_code, values.email),
    onSuccess: () => {
      notify('A temporary password has been sent to your email', 'success');
      reset();
    },
    onError: (error) => notify(errorMessage(error, 'First time setup failed'), 'error')
  });
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'background.default', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}><SterlingLogo /></Box>
          <Typography variant="h5" textAlign="center">Welcome — First Time Setup</Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 3 }}>Verify your DAO code and receive a temporary password.</Typography>
          <Box component="form" onSubmit={handleSubmit((values) => mutation.mutate(values))} sx={{ display: 'grid', gap: 2 }}>
            <Controller name="dao_code" control={control} rules={{ required: 'DAO Code is required', pattern: { value: daoCodePattern, message: 'Invalid DAO code format' } }} render={({ field, fieldState }) => (
              <TextField {...field} label="DAO Code" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <Controller name="email" control={control} rules={{ required: 'Email is required', pattern: { value: /.+@.+\..+/, message: 'Enter a valid email' } }} render={({ field, fieldState }) => (
              <TextField {...field} label="Email Address" error={!!fieldState.error} helperText={fieldState.error?.message} />
            )} />
            <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>Submit</Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}><Link component={RouterLink} to="/login">Back to login</Link></Box>
        </CardContent>
      </Card>
    </Box>
  );
};
