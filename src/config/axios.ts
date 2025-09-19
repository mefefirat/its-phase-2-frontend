import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useGlobalStore } from '@/store/globalStore';
import { authStorage } from '@/utils/authStorage';
import { notificationService } from '@/features/shared/services/notificationService';

// Use environment variable with a type-safe fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8282/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
});

// Global store reference
const globalStore = useGlobalStore.getState();

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      globalStore.setAuthenticated(true);
      globalStore.setSessionInfo({ lastActivity: new Date() });
    }
    return config;
  },
  (error: unknown) => {
    // Request oluşturma hatası
    console.error('❌ Request configuration error:', error);
    notificationService.showError('İstek hazırlanırken hata oluştu. Lütfen tekrar deneyin.');
    return Promise.reject(error);
  }
);

// Add response interceptor - SADECE GLOBAL/SYSTEM ERRORS
axiosInstance.interceptors.response.use(
  (response: any) => {
    // Başarılı response'larda da son aktivite zamanını güncelle
    globalStore.setSessionInfo({
      lastActivity: new Date()
    });
    
    return response;
  },
  async (error: any) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    // SADECE SISTEMSEL HATALARI HANDLE ET
    if (status === 401) {
      // Authentication - sistemsel hata
      globalStore.reset();
      globalStore.setAuthenticated(false);
      authStorage.clear();
      notificationService.showSessionExpired();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else if (!error.response) {
      // Network error - no response received - sistemsel hata
      console.error('❌ Network error:', error.message);
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        notificationService.showNetworkError();
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        notificationService.showTimeoutError();
      } else {
        notificationService.showError('Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edin.');
      }
    }
    
    // DİĞER TÜM HATALARI SADECE LOG'LA - HANDLE ETME!
    // Business logic errors (400, 403, 404, 409, 422, 429, 500, etc.) store katmanında handle edilecek
    console.error(`❌ HTTP ${status}: ${method} ${url}`, error.response?.data);
    
    return Promise.reject(error); // Her zaman reject et - üst katman handle etsin
  }
);

// Request/Response logging (development için)
if (import.meta.env.DEV) {
  axiosInstance.interceptors.request.use(
    (config) => {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.params) {
        console.log('🔍 Request params:', config.params);
      }
      return config;
    }
  );
  
  axiosInstance.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.log(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
      return Promise.reject(error);
    }
  );
}

// Global error handler için export
export const handleGlobalError = (error: any) => {
  console.error('🚨 Unhandled application error:', error);
  
  if (error.name === 'ChunkLoadError') {
    notificationService.showSystemUpdate();
  } else {
    notificationService.showError('Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.');
  }
};

// Network status monitoring
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  if (!isOnline) {
    isOnline = true;
    notificationService.showInfo('İnternet bağlantısı yeniden kuruldu.');
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  notificationService.showError('İnternet bağlantısı kesildi. Lütfen bağlantınızı kontrol edin.');
});

export default axiosInstance;