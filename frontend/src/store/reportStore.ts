import { create } from 'zustand';

type Severity = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  message: string;
  severity: Severity;
  open: boolean;
  notify: (message: string, severity?: Severity) => void;
  close: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: '',
  severity: 'info',
  open: false,
  notify: (message, severity = 'info') => set({ message, severity, open: true }),
  close: () => set({ open: false })
}));
