// src/store/globalStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseKeycloakToken, hasCompanyRole, hasRoleInAnyCompany, type CompanyAccess } from '@/utils/keycloakTokenParser';
import { tokenStorage } from '@/utils/tokenStorage';

// Basit company interface
interface CurrentCompany {
  id: string;
  name: string;
  code: number;
  roles: string[];
  // Extended company details
  company_code?: string;
  company_name?: string;
  gln?: string | null;
  gcp?: string;
}

// Keycloak kullanıcı bilgileri (genişletilmiş)
interface KeycloakUser {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  createdTimestamp?: number;
  // Company access bilgileri
  companyAccesses: CompanyAccess[];
  isGlobalAdmin: boolean;
  // Database role (admin/worker)
  role?: 'admin' | 'worker';
  // Default company ID
  defaultCompanyId?: string;
  // Validation flags
  hasValidDefaultCompany: boolean;
  hasCompanyAccess: boolean;
}

// Global store state interface
interface GlobalState {
  // Mevcut şirket bilgileri (user'ın default company'sinden set edilir)
  currentCompany: CurrentCompany | null;
  
  // Admin durumu (global admin)
  isAdmin: boolean;
  
  // Keycloak kullanıcı bilgileri (genişletilmiş)
  user: KeycloakUser | null;

  // Basit görüntü adı (ör. full_name)
  fullName: string | null;
  
  // Authentication durumu
  isAuthenticated: boolean;
  
  // Uygulama genel ayarları
  settings: {
    theme: 'light' | 'dark';
    language: string;
    // Printer ayarları
    printers: {
      palletPrinter: string | null; // Palet için seçili printer
      labelPrinter: string | null;  // Diğer etiketler için seçili printer
    };
  };
  
  // Loading states
  isLoading: boolean;
  isUserLoading: boolean;
  
  // Session bilgileri
  sessionInfo: {
    loginTime?: Date;
    lastActivity?: Date;
    tokenExpiry?: Date;
  } | null;
  
  // Actions
  setCurrentCompany: (company: CurrentCompany) => void;
  clearCurrentCompany: () => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setUser: (user: KeycloakUser | null) => void;
  setFullName: (fullName: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setSettings: (settings: Partial<GlobalState['settings']>) => void;
  setPrinterSettings: (printers: Partial<GlobalState['settings']['printers']>) => void;
  setLoading: (loading: boolean) => void;
  setUserLoading: (loading: boolean) => void;
  setSessionInfo: (sessionInfo: Partial<GlobalState['sessionInfo']>) => void;
  setUserRole: (role: 'admin' | 'worker') => void;
  
  // Keycloak specific actions
  updateUserFromKeycloak: (keycloakData: {
    profile?: any;
    tokenParsed?: any;
    realmAccess?: any;
    subject?: string;
  }) => void;
  
  // Company access helper methods
  hasCompanyRole: (companyId: string, role: string) => boolean;
  hasRoleInAnyCompany: (role: string) => boolean;
  getCurrentCompanyRoles: () => string[];
  getDefaultCompanyId: () => string | null;
  setDefaultCompanyAsCurrent: () => boolean;
  
  // Utility actions
  reset: () => void;
  logout: () => void;
}

// Initial state
const initialState = {
  currentCompany: null,
  isAdmin: false,
  user: null,
  fullName: null,
  isAuthenticated: false,
  settings: {
    theme: 'light' as const,
    language: 'tr',
    printers: {
      palletPrinter: null,
      labelPrinter: null,
    },
  },
  isLoading: false,
  isUserLoading: false,
  sessionInfo: null,
};

// Global store oluşturma
export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Şirket seçimi
      setCurrentCompany: (company: CurrentCompany) => {
        set({ currentCompany: company });
      },
      
      // Şirket seçimini temizleme
      clearCurrentCompany: () => {
        set({ currentCompany: null });
      },
      
      // Admin durumu ayarlama
      setIsAdmin: (isAdmin) => {
        set({ isAdmin });
      },
      
      // Kullanıcı ayarlama
      setUser: (user) => {
        set({ user });
      },

      // Basit görüntü adı ayarlama
      setFullName: (fullName) => {
        set({ fullName });
      },
      
      // Authentication durumu
      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
        
        if (authenticated) {
          set((state) => ({
            sessionInfo: {
              ...state.sessionInfo,
              loginTime: new Date(),
              lastActivity: new Date()
            }
          }));
        } else {
          // Logout durumunda token'ları temizle
          tokenStorage.clearTokens();
        }
      },
      
      // Ayarları güncelleme
      setSettings: (newSettings) => 
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),
      
      // Printer ayarlarını güncelleme
      setPrinterSettings: (newPrinters) =>
        set((state) => ({
          settings: {
            ...state.settings,
            printers: { ...state.settings.printers, ...newPrinters }
          }
        })),
      
      // Loading states
      setLoading: (loading) => set({ isLoading: loading }),
      setUserLoading: (loading) => set({ isUserLoading: loading }),
      
      // Session bilgileri
      setSessionInfo: (newSessionInfo) =>
        set((state) => ({
          sessionInfo: { ...state.sessionInfo, ...newSessionInfo }
        })),
      
      // Kullanıcı role'ünü güncelleme
      setUserRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null
        })),
      
      // Keycloak'tan kullanıcı bilgilerini güncelleme
      updateUserFromKeycloak: ({ profile, tokenParsed, realmAccess, subject }) => {
        // Token'ı parse et (profile bilgisiyle birlikte)
        const parsedData = parseKeycloakToken(tokenParsed || {}, realmAccess, profile);
        
        // Profile bilgilerini ekle
        const user: KeycloakUser = {
          ...parsedData,
          name: profile?.firstName && profile?.lastName 
            ? `${profile.firstName} ${profile.lastName}` 
            : parsedData.name,
          email: profile?.email || parsedData.email,
          emailVerified: profile?.emailVerified || parsedData.emailVerified,
        };
        
        set({ 
          user, 
          isAdmin: parsedData.isGlobalAdmin,
          isAuthenticated: true
        });
        
        // Session bilgilerini güncelle
        if (tokenParsed?.exp) {
          set((state) => ({
            sessionInfo: {
              ...state.sessionInfo,
              tokenExpiry: new Date(tokenParsed.exp * 1000),
              lastActivity: new Date()
            }
          }));
        }
      },
      
      // Company role kontrolü
      hasCompanyRole: (companyId: string, role: string) => {
        const { user } = get();
        if (!user) return false;
        return hasCompanyRole(user.companyAccesses, companyId, role);
      },
      
      // Herhangi bir company'de role kontrolü  
      hasRoleInAnyCompany: (role: string) => {
        const { user } = get();
        if (!user) return false;
        return hasRoleInAnyCompany(user.companyAccesses, role);
      },
      
      // Seçili company'nin rollerini getir
      getCurrentCompanyRoles: () => {
        const { user, currentCompany } = get();
        if (!user || !currentCompany) return [];
        
        const companyAccess = user.companyAccesses.find(ca => ca.companyId === currentCompany.id);
        return companyAccess?.roles || [];
      },
      
      // Default company ID'sini getir
      getDefaultCompanyId: () => {
        const { user } = get();
        return user?.defaultCompanyId || null;
      },
      
      // Default company'yi current company olarak set et
      setDefaultCompanyAsCurrent: () => {
        const { user, setCurrentCompany } = get();
        
        if (!user?.defaultCompanyId) {
          return false;
        }
        
        // User'ın company access'leri arasında default company'yi bul
        const defaultCompanyAccess = user.companyAccesses.find(
          ca => ca.companyId === user.defaultCompanyId
        );
        
        if (!defaultCompanyAccess) {
          return false;
        }
        
        // Current company olarak set et
        const currentCompany: CurrentCompany = {
          id: defaultCompanyAccess.companyId,
          name: defaultCompanyAccess.companyName,
          code: parseInt(defaultCompanyAccess.companyId),
          roles: defaultCompanyAccess.roles,
          // The following fields are not available from access info
          company_code: undefined,
          company_name: defaultCompanyAccess.companyName,
          gln: undefined,
          gcp: undefined,
        };
        
        setCurrentCompany(currentCompany);
        return true;
      },
      
      // Logout işlemi
      logout: () => {
        const { reset } = get();
        // Token'ları temizle
        tokenStorage.clearTokens();
        reset();
      },
      
      // Tüm store'u sıfırlama
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'global-store', // localStorage key
      partialize: (state) => ({
        currentCompany: state.currentCompany,
        isAdmin: state.isAdmin,
        user: state.user,
        fullName: state.fullName,
        settings: state.settings,
        sessionInfo: state.sessionInfo,
        // isAuthenticated'i persist etmiyoruz - her seferinde Keycloak'tan kontrol edelim
      }),
      version: 4, // Persist versiyonu artırıldı
      migrate: (persistedState: any, version: number) => {
        // Eski versiyon uyumluluğu için
        if (version < 4) {
          return {
            ...persistedState,
            currentCompany: null, // selectedCompany'den currentCompany'ye geçiş
            sessionInfo: null,
            isAuthenticated: false,
          };
        }
        return persistedState;
      },
    }
  )
);

// Güncellenmiş hook'lar
export const useCurrentCompanyId = () => {
  const currentCompany = useGlobalStore((state) => state.currentCompany);
  return currentCompany?.id || null;
};

export const useCurrentCompany = () => {
  const currentCompany = useGlobalStore((state) => state.currentCompany);
  return currentCompany;
};

export const useIsCompanySelected = () => {
  const currentCompany = useGlobalStore((state) => state.currentCompany);
  return currentCompany !== null;
};

// Mevcut company'nin rollerini al
export const useCurrentCompanyRoles = () => {
  const getCurrentCompanyRoles = useGlobalStore((state) => state.getCurrentCompanyRoles);
  return getCurrentCompanyRoles();
};

// Kullanıcının herhangi bir company'de belirli bir rolü var mı
export const useHasRole = (role: string) => {
  const hasRoleInAnyCompany = useGlobalStore((state) => state.hasRoleInAnyCompany);
  const isAdmin = useGlobalStore((state) => state.isAdmin);
  return isAdmin || hasRoleInAnyCompany(role);
};

// Belirli bir company'de belirli bir rolü var mı
export const useHasCompanyRole = (companyId: string, role: string) => {
  const hasCompanyRole = useGlobalStore((state) => state.hasCompanyRole);
  const isAdmin = useGlobalStore((state) => state.isAdmin);
  return isAdmin || hasCompanyRole(companyId, role);
};

// Mevcut company'de belirli bir rolü var mı
export const useHasCurrentCompanyRole = (role: string) => {
  const currentCompanyId = useCurrentCompanyId();
  const hasCompanyRole = useGlobalStore((state) => state.hasCompanyRole);
  const isAdmin = useGlobalStore((state) => state.isAdmin);
  
  if (!currentCompanyId) return false;
  return isAdmin || hasCompanyRole(currentCompanyId, role);
};

export const useIsAdmin = () => {
  const isAdmin = useGlobalStore((state) => state.isAdmin);
  return isAdmin;
};

// Kullanıcının database role'ünü kontrol et
export const useUserRole = () => {
  const user = useGlobalStore((state) => state.user);
  return user?.role || 'worker'; // Default olarak worker
};

// Kullanıcı admin mi kontrol et (hem Keycloak hem de database role)
export const useIsUserAdmin = () => {
  const isAdmin = useGlobalStore((state) => state.isAdmin);
  const userRole = useUserRole();
  return isAdmin || userRole === 'admin';
};

// Kullanıcı role'ünü güncellemek için hook
export const useSetUserRole = () => {
  const setUserRole = useGlobalStore((state) => state.setUserRole);
  return setUserRole;
};

export const useCurrentUser = () => {
  const user = useGlobalStore((state) => state.user);
  const isAuthenticated = useGlobalStore((state) => state.isAuthenticated);
  return { user, isAuthenticated };
};

export const useDefaultCompanyId = () => {
  const getDefaultCompanyId = useGlobalStore((state) => state.getDefaultCompanyId);
  return getDefaultCompanyId();
};

export const useSessionInfo = () => {
  const sessionInfo = useGlobalStore((state) => state.sessionInfo);
  return sessionInfo;
};

export const useLoadingStates = () => {
  const isLoading = useGlobalStore((state) => state.isLoading);
  const isUserLoading = useGlobalStore((state) => state.isUserLoading);
  return { isLoading, isUserLoading };
};

// Printer ayarları için hook'lar
export const usePrinterSettings = () => {
  const printers = useGlobalStore((state) => state.settings?.printers || { palletPrinter: null, labelPrinter: null });
  const setPrinterSettings = useGlobalStore((state) => state.setPrinterSettings);
  return { printers, setPrinterSettings };
};

export const usePalletPrinter = () => {
  const palletPrinter = useGlobalStore((state) => state.settings?.printers?.palletPrinter || null);
  const setPrinterSettings = useGlobalStore((state) => state.setPrinterSettings);
  return { 
    palletPrinter, 
    setPalletPrinter: (printerId: string | null) => 
      setPrinterSettings({ palletPrinter: printerId })
  };
};

export const useLabelPrinter = () => {
  const labelPrinter = useGlobalStore((state) => state.settings?.printers?.labelPrinter || null);
  const setPrinterSettings = useGlobalStore((state) => state.setPrinterSettings);
  return { 
    labelPrinter, 
    setLabelPrinter: (printerId: string | null) => 
      setPrinterSettings({ labelPrinter: printerId })
  };
};