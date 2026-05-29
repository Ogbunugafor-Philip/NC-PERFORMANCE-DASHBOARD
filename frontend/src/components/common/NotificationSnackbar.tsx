import { Alert, Snackbar } from '@mui/material';
import { useNotificationStore } from '../../store/reportStore';

export const NotificationSnackbar = () => {
  const { open, message, severity, close } = useNotificationStore();
  return (
    <Snackbar open={open} autoHideDuration={5000} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={close} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};
