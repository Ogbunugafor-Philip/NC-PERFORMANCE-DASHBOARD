import type { UserPosition } from './auth';

export interface StaffPayload {
  name: string;
  dao_code: string;
  position: UserPosition;
  cluster_head_id?: string | null;
}

export interface StaffMember extends StaffPayload {
  id: string;
  email?: string | null;
  is_active: boolean;
  is_first_login: boolean;
  created_at: string;
  updated_at: string;
}
