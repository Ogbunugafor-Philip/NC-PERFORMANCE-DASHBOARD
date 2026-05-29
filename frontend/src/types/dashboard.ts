export interface DashboardMetric {
  target: number;
  actual: number;
  valid: number;
  invalid: number;
  invalid_percentage: number;
  achievement_percentage: number;
  current_daily_run_rate: number;
  required_daily_run_rate: number;
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  name: string;
  dao_code: string;
  position: string;
  cluster_head_id?: string | null;
  ind_achievement_percentage: number;
  bus_achievement_percentage: number;
  scorecard: number;
}

export interface DashboardSummary {
  report_date: string | null;
  individual: DashboardMetric;
  business: DashboardMetric;
  scorecard: number;
  ranking: string;
  team_summary: Record<string, number | string | null>;
  leaderboard: LeaderboardRow[];
  cluster_leaderboard: LeaderboardRow[];
}

export interface ReportStatus {
  active_report: { id: string; report_date: string; uploaded_at: string; is_active: boolean } | null;
  total_reports: number;
  total_records: number;
}
