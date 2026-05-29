export type UserPosition = 'ADMIN' | 'RSM' | 'CLUSTER_HEAD' | 'FSO';

export interface UserProfile {
  id: string;
  name: string;
  dao_code: string;
  email?: string | null;
  position: UserPosition;
  is_active: boolean;
  is_first_login: boolean;
  cluster_head_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  requires_password_change: boolean;
}
