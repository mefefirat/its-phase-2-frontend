export interface User {
  id: string;
  sso_id: string;
  username: string;
  email: string;
  full_name?: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'teamleader' | 'operator' | 'workkerf1' | 'workkerf2';
  is_active: boolean;
  default_company: string;
  is_deleted: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
} 