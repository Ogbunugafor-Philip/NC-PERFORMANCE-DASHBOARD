export const formatPercent = (value: number | undefined | null) => `${Number(value || 0).toFixed(1)}%`;
export const formatNumber = (value: number | undefined | null) => Number(value || 0).toLocaleString();
export const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : 'No active report');

export const scoreColor = (value: number) => {
  if (value >= 80) return 'success.main';
  if (value >= 50) return 'warning.main';
  return 'error.main';
};
