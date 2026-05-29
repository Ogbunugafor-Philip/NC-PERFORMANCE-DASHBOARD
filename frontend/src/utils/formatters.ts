export const formatPercent = (value: number | undefined | null) => `${Number(value || 0).toFixed(1)}%`;
export const formatNumber = (value: number | undefined | null) => Number(value || 0).toLocaleString();
export const formatDate = (value?: string | null): string => {
  if (!value) return 'No active report';
  // Parse as local date to avoid UTC-midnight timezone shift
  const [year, month, day] = String(value).split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const scoreColor = (value: number) => {
  if (value >= 80) return 'success.main';
  if (value >= 50) return 'warning.main';
  return 'error.main';
};
