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
  
  // Set user role and admin status from login response
  if (data.user) {
    // Check if user has admin role
    const isAdmin = (data.user as any).role === 'admin' || 
                   (data.user as any).is_admin === true ||
                   (data.user as any).isAdmin === true;
    
    globalStore.setIsAdmin(isAdmin);
    
    // Set user role
    if ((data.user as any).role) {
      globalStore.setUserRole((data.user as any).role);
    }
    
    // Debug: Log the user data to see what we're getting
    if (import.meta.env.DEV) {
      console.log('🔍 Login response user data:', data.user);
      console.log('🔍 Detected admin status:', isAdmin);
      console.log('🔍 User role:', (data.user as any).role);
    }
  }
  
  return data;
}

export function logout() {
  authStorage.clear();
  // Clear global store state
  const globalStore = useGlobalStore.getState();
  globalStore.logout();
}




