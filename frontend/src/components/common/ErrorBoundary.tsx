import { Alert, Box, Button } from '@mui/material';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" action={<Button onClick={() => location.reload()}>Reload</Button>}>
            Something went wrong while loading the dashboard.
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
