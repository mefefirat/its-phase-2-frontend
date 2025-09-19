import Keycloak from 'keycloak-js';
import { tokenStorage, saveTokensToStorage, clearTokensFromStorage } from '@/utils/tokenStorage';

// Dokümantasyondaki önerilen format
const keycloak = new Keycloak({
  url: "https://sso.oraxai.com",
  realm: "ORAXAI",
  clientId: "ORAXAI-FRONTEND"
});


// Event handlers - init'den ÖNCE tanımlanmalı
keycloak.onReady = (authenticated) => {
  if (import.meta.env.DEV) console.log('🔐 Keycloak ready. Authenticated:', authenticated);
  
  if (authenticated) {
    // Token'ları localStorage'a kaydet
    saveTokensToStorage();
  }
};

keycloak.onAuthSuccess = () => {
  if (import.meta.env.DEV) console.log('✅ Authentication successful');
  // Token'ları localStorage'a kaydet
  saveTokensToStorage();
};

keycloak.onAuthError = (errorData) => {
  if (import.meta.env.DEV) console.error('❌ Authentication error:', errorData);
  // Hata durumunda token'ları temizle
  clearTokensFromStorage();
};

keycloak.onAuthRefreshSuccess = () => {
  if (import.meta.env.DEV) console.log('🔄 Token refresh successful');
  // Yeni token'ları localStorage'a kaydet
  saveTokensToStorage();
};

keycloak.onAuthRefreshError = () => {
  if (import.meta.env.DEV) console.log('❌ Token refresh failed');
  // Refresh hatası durumunda token'ları temizle
  clearTokensFromStorage();
  // Remember Me için otomatik yenileme denemesi
  keycloak.login();
};

keycloak.onTokenExpired = () => {
  if (import.meta.env.DEV) console.log('⏰ Token expired, attempting refresh...');
  keycloak.updateToken(30).catch(() => {
    if (import.meta.env.DEV) console.log('❌ Refresh failed, redirecting to login');
    clearTokensFromStorage();
    keycloak.login();
  });
};

keycloak.onAuthLogout = () => {
  if (import.meta.env.DEV) console.log('🚪 User logged out');
  // Logout durumunda token'ları temizle
  clearTokensFromStorage();
};

// Resmi dokümantasyona göre init fonksiyonu
export const initKeycloak = async () => {
  try {
    console.log('🚀 Initializing Keycloak...');
    
    // Önce stored token'ları kontrol et
    const tokenStatus = tokenStorage.getTokenStatus();
    console.log('🔍 Token status:', tokenStatus);
    
    if (tokenStatus.hasStoredTokens && !tokenStatus.isExpired) {
      console.log('📥 Found valid stored tokens, applying...');
      const applied = await tokenStorage.applyStoredTokens();
      
      if (applied) {
        console.log('✅ Stored tokens applied successfully');
        // Token'lar uygulandı, şimdi Keycloak'u initialize et
      }
    }
    
    // Dokümantasyondaki önerilen silent check-sso konfigürasyonu
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
      checkLoginIframe: true,
      checkLoginIframeInterval: 5,
      enableLogging: true,
      useNonce: true,
      pkceMethod: 'S256',
      silentCheckSsoFallback: true
    });

    console.log('✅ Keycloak initialized. Authenticated:', authenticated);

    if (authenticated) {
      try {
        // User profile yükle
        const profile = await keycloak.loadUserProfile();
        console.log('👤 User profile loaded:', profile);
        
        // Token'ları localStorage'a kaydet
        saveTokensToStorage();
        
        // Remember Me için token bilgilerini kontrol et
        checkRememberMeStatus();
        
        // Otomatik token yenileme ayarla
        setupTokenRefresh();
        
      } catch (profileError) {
        console.warn('⚠️ Profile loading failed:', profileError);
      }
    } else {
      // Authenticate olmamışsa stored token'ları temizle
      clearTokensFromStorage();
    }

    return authenticated;

  } catch (error) {
    console.error('❌ Keycloak initialization failed:', error);
    // Hata durumunda stored token'ları temizle
    clearTokensFromStorage();
    throw error;
  }
};

// Remember Me durumunu kontrol et
const checkRememberMeStatus = () => {
  if (keycloak.refreshToken) {
    try {
      const payload = JSON.parse(atob(keycloak.refreshToken.split('.')[1]));
      const expireTime = new Date(payload.exp * 1000);
      const now = new Date();
      const daysLeft = Math.floor((expireTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (import.meta.env.DEV) {
        console.log('🕐 Refresh token expires at:', expireTime);
        console.log('📅 Days left:', daysLeft);
      }
      
      if (daysLeft > 7) {
        if (import.meta.env.DEV) console.log('✅ Remember Me is active - Long term session detected');
      } else {
        if (import.meta.env.DEV) console.log('⚠️ Short term session - Remember Me may not be active');
      }
    } catch (e) {
      if (import.meta.env.DEV) console.log('Could not parse refresh token');
    }
  }
};

// Dokümantasyona göre otomatik token yenileme
const setupTokenRefresh = () => {
  if (import.meta.env.DEV) console.log('🔧 Setting up automatic token refresh...');
  const intervalId = setInterval(async () => {
    try {
      const refreshed = await keycloak.updateToken(70);
      if (refreshed) {
        if (import.meta.env.DEV) console.log('🔄 Token automatically refreshed');
        // Yeni token'ları localStorage'a kaydet
        saveTokensToStorage();
      } else {
        if (import.meta.env.DEV) console.log('✅ Token still valid');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Automatic token refresh failed:', error);
      // Refresh hatası durumunda token'ları temizle
      clearTokensFromStorage();
    }
  }, 60000); // Her dakika kontrol et
  return intervalId;
};

// Login fonksiyonu - Remember Me için özel options
export const login = (rememberMe = false) => {
  console.log('🔑 Redirecting to login...', rememberMe ? '(Remember Me enabled)' : '');
  
  const loginOptions: any = {
    redirectUri: window.location.origin
  };
  
  // Remember Me için daha uzun süreli session isteme
  if (rememberMe) {
    loginOptions.scope = 'openid profile email offline_access';
  }
  
  return keycloak.login(loginOptions);
};

export const logout = () => {
  console.log('🚪 Logging out...');
  // Logout öncesi token'ları temizle
  clearTokensFromStorage();
  return keycloak.logout({
    redirectUri: window.location.origin
  });
};

// Dokümantasyona göre token refresh
export const updateToken = async (minValidity = 5) => {
  try {
    const refreshed = await keycloak.updateToken(minValidity);

    console.log('🔄 Token refreshed');
    console.log('🔄 Token:', keycloak.token);
    console.log('🔄 RefreshToken:', keycloak.refreshToken);
    console.log('🔄 TokenParsed:', keycloak.tokenParsed);
    console.log('🔄 Subject:', keycloak.subject);
    console.log('🔄 Profile:', keycloak.profile);
    console.log('🔄 TokenStatus:', tokenStorage.getTokenStatus());
    console.log('🔄 TokenStorage:', tokenStorage);
    console.log(refreshed ? '🔄 Token refreshed' : '✅ Token still valid');
    
    if (refreshed) {
      // Yeni token'ları localStorage'a kaydet
      saveTokensToStorage();
    }
    
    return refreshed;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    // Refresh hatası durumunda token'ları temizle
    clearTokensFromStorage();
    throw error;
  }
};

// API çağrıları için token ile fetch
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  try {
    // Token'ı yenile
    await keycloak.updateToken(30);
    
    // Authorization header ekle
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${keycloak.token}`,
        ...(options.headers || {})
      }
    });
    
    return response;
  } catch (error) {
    console.error('❌ Authenticated request failed:', error);
    throw error;
  }
};

// Helper functions
export const getToken = () => keycloak.token;
export const getRefreshToken = () => keycloak.refreshToken;
export const isAuthenticated = () => keycloak.authenticated;
export const getUserProfile = () => keycloak.profile;
export const hasRealmRole = (role: string) => keycloak.hasRealmRole(role);
export const hasResourceRole = (role: string, resource: string) => keycloak.hasResourceRole(role, resource);
export const isTokenExpired = (minValidity = 0) => keycloak.isTokenExpired(minValidity);

// Debug fonksiyonu
export const debugKeycloak = () => {
  if (!import.meta.env.DEV) return;
  console.log('=== KEYCLOAK DEBUG (Official) ===');
  console.log('Authenticated:', keycloak.authenticated);
  console.log('Token:', keycloak.token ? 'Present' : 'Missing');
  console.log('RefreshToken:', keycloak.refreshToken ? 'Present' : 'Missing');
  console.log('TokenParsed:', keycloak.tokenParsed);
  console.log('Subject:', keycloak.subject);
  console.log('Profile:', keycloak.profile);
  
  // Token storage durumunu da göster
  const tokenStatus = tokenStorage.getTokenStatus();
  console.log('=== TOKEN STORAGE STATUS ===');
  console.log('Token Status:', tokenStatus);
};

export default keycloak;