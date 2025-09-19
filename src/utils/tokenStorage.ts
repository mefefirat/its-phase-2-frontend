import keycloak from '@/config/keycloak';

interface StoredTokenData {
  token: string;
  refreshToken: string;
  tokenExpiry: number;
  refreshTokenExpiry: number;
  userId: string;
  timestamp: number;
}

const TOKEN_STORAGE_KEY = 'oraxai_auth_tokens';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export class TokenStorage {
  private static instance: TokenStorage;
  
  private constructor() {}
  
  public static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  // Token'ları localStorage'a kaydet
  public saveTokens(): void {
    if (!keycloak.authenticated || !keycloak.token) {
      return;
    }

    try {
      const tokenData: StoredTokenData = {
        token: keycloak.token,
        refreshToken: keycloak.refreshToken || '',
        tokenExpiry: keycloak.tokenParsed?.exp ? keycloak.tokenParsed.exp * 1000 : 0,
        refreshTokenExpiry: this.getRefreshTokenExpiry(),
        userId: keycloak.subject || '',
        timestamp: Date.now()
      };

      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
    } catch (error) {
    }
  }

  // Token'ları localStorage'dan yükle
  public loadTokens(): StoredTokenData | null {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const tokenData: StoredTokenData = JSON.parse(stored);
      
      // Token'ların geçerliliğini kontrol et
      if (this.isTokenExpired(tokenData)) {
        this.clearTokens();
        return null;
      }

      return tokenData;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  // Token'ları localStorage'dan temizle
  public clearTokens(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
    }
  }

  // Token'ların geçerliliğini kontrol et
  public isTokenExpired(tokenData: StoredTokenData): boolean {
    const now = Date.now();
    
    // Access token'ın süresi dolmuş mu?
    if (tokenData.tokenExpiry && now >= tokenData.tokenExpiry) {
      return true;
    }

    // Refresh token'ın süresi dolmuş mu?
    if (tokenData.refreshTokenExpiry && now >= tokenData.refreshTokenExpiry) {
      return true;
    }

    return false;
  }

  // Token'ların yakında süresi dolacak mı kontrol et
  public isTokenExpiringSoon(tokenData: StoredTokenData): boolean {
    const now = Date.now();
    const timeUntilExpiry = tokenData.tokenExpiry - now;
    
    return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD;
  }

  // Stored token'ları Keycloak'a uygula
  public async applyStoredTokens(): Promise<boolean> {
    const tokenData = this.loadTokens();
    
    if (!tokenData) {
      return false;
    }

    try {
      // Keycloak instance'ına token'ları manuel olarak set et
      // Bu Keycloak'un internal state'ini günceller
      (keycloak as any).token = tokenData.token;
      (keycloak as any).refreshToken = tokenData.refreshToken;
      (keycloak as any).tokenParsed = this.parseToken(tokenData.token);
      (keycloak as any).refreshTokenParsed = this.parseToken(tokenData.refreshToken);
      (keycloak as any).authenticated = true;
      (keycloak as any).subject = tokenData.userId;

      return true;
    } catch (error) {
      return false;
    }
  }

  // Token'ı parse et (JWT decode)
  private parseToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // Refresh token'ın süresini hesapla
  private getRefreshTokenExpiry(): number {
    if (!keycloak.refreshToken) return 0;
    
    try {
      const refreshTokenParsed = this.parseToken(keycloak.refreshToken);
      return refreshTokenParsed?.exp ? refreshTokenParsed.exp * 1000 : 0;
    } catch (error) {
      return 0;
    }
  }

  // Token'ların durumunu kontrol et
  public getTokenStatus(): {
    hasStoredTokens: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    timeUntilExpiry: number;
  } {
    const tokenData = this.loadTokens();
    
    if (!tokenData) {
      return {
        hasStoredTokens: false,
        isExpired: false,
        isExpiringSoon: false,
        timeUntilExpiry: 0
      };
    }

    const now = Date.now();
    const timeUntilExpiry = tokenData.tokenExpiry - now;

    return {
      hasStoredTokens: true,
      isExpired: this.isTokenExpired(tokenData),
      isExpiringSoon: this.isTokenExpiringSoon(tokenData),
      timeUntilExpiry: Math.max(0, timeUntilExpiry)
    };
  }
}

// Singleton instance
export const tokenStorage = TokenStorage.getInstance();

// Helper functions
export const saveTokensToStorage = () => tokenStorage.saveTokens();
export const loadTokensFromStorage = () => tokenStorage.loadTokens();
export const clearTokensFromStorage = () => tokenStorage.clearTokens();
export const applyStoredTokens = () => tokenStorage.applyStoredTokens();
export const getTokenStatus = () => tokenStorage.getTokenStatus(); 