import axios from '@/config/axios';
import { authStorage, type AuthUser } from '@/utils/authStorage';
import { useGlobalStore } from '@/store/globalStore';

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>('/v1/auth/login', { username, password });
  const data = res.data;
  authStorage.save({ token: data.token, user: data.user });
  // Update global auth state immediately so guards see authenticated status
  const globalStore = useGlobalStore.getState();
  globalStore.setAuthenticated(true);
  // Set full name for global usage if available
  if (data.user?.full_name) {
    globalStore.setFullName(data.user.full_name);
  } else if (data.user) {
    const guess = [
      // Some backends send first_name/last_name, attempt a fallback
      (data.user as any).first_name,
      (data.user as any).last_name
    ].filter(Boolean).join(' ');
    if (guess) globalStore.setFullName(guess);
  }
  return data;
}

export function logout() {
  authStorage.clear();
}




