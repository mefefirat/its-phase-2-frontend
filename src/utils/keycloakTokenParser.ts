// src/utils/keycloakTokenParser.ts
interface KeycloakToken {
  groups?: string[];
  realm_access?: {
    roles?: string[];
  };
  resource_access?: {
    [key: string]: {
      roles?: string[];
    };
  };
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  sub?: string;
  iat?: number;
  exp?: number;
  // User attributes
  default_company?: string;
  // Attributes bazen array olarak da gelebilir
  attributes?: {
    default_company?: string[];
  };
}

export interface CompanyAccess {
  companyId: string;
  companyName: string;
  roles: string[];
  isActive: boolean;
}

interface ParsedUserData {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  emailVerified?: boolean;
  isGlobalAdmin: boolean;
  companyAccesses: CompanyAccess[];
  createdTimestamp?: number;
  // Default company bilgisi
  defaultCompanyId?: string;
  hasCompanyAccess: boolean;
  hasValidDefaultCompany: boolean;
}

// Token'dan company access bilgilerini parse et
export function parseKeycloakToken(tokenParsed: KeycloakToken, realmAccess?: any, profile?: any): ParsedUserData {
  // Temel kullanıcı bilgileri
  const userData: ParsedUserData = {
    id: tokenParsed.sub || '',
    username: tokenParsed.preferred_username,
    firstName: tokenParsed.given_name,
    lastName: tokenParsed.family_name,
    name: tokenParsed.name || (tokenParsed.given_name && tokenParsed.family_name 
      ? `${tokenParsed.given_name} ${tokenParsed.family_name}` 
      : tokenParsed.preferred_username),
    email: tokenParsed.email,
    emailVerified: tokenParsed.email_verified,
    isGlobalAdmin: false,
    companyAccesses: [],
    createdTimestamp: tokenParsed.iat ? tokenParsed.iat * 1000 : undefined,
    hasCompanyAccess: false,
    hasValidDefaultCompany: false
  };

  // Default company'yi parse et - Çoklu kaynak kontrolü
  let defaultCompanyId = tokenParsed.default_company;
  
  // 1. Token'da direkt olarak kontrol et
  if (!defaultCompanyId && tokenParsed.attributes?.default_company) {
    const defaultCompanyAttr = tokenParsed.attributes.default_company;
    defaultCompanyId = Array.isArray(defaultCompanyAttr) 
      ? defaultCompanyAttr[0] 
      : defaultCompanyAttr;
  }
  
  // 2. Profile'dan kontrol et (loadUserProfile sonrası)
  if (!defaultCompanyId && profile?.attributes?.default_company) {
    const defaultCompanyAttr = profile.attributes.default_company;
    defaultCompanyId = Array.isArray(defaultCompanyAttr) 
      ? defaultCompanyAttr[0] 
      : defaultCompanyAttr;
  }
  
  userData.defaultCompanyId = defaultCompanyId;

  // Global admin kontrolü (realm roller)
  const realmRoles = realmAccess?.roles || tokenParsed.realm_access?.roles || [];
  userData.isGlobalAdmin = realmRoles.includes('admin') || 
                           realmRoles.includes('super-admin') || 
                           realmRoles.includes('realm-admin');

  // Groups'lardan company bilgilerini çıkar
  const groups = tokenParsed.groups || [];
  
  groups.forEach(groupPath => {
    // Group path format: /1001[Berko İlaç]/warehouse-manager veya /1003[Novartis İlaç]/forklift-operator
    const pathParts = groupPath.split('/').filter(part => part.length > 0);
    
    if (pathParts.length >= 2) {
      const companyPart = pathParts[0];
      const role = pathParts[1];
      
      // Company ID ve Company Name'i parse et
      // Format: "1001[Berko İlaç]"
      const companyMatch = companyPart.match(/^(\d+)\[(.+)\]$/);
      
      if (companyMatch) {
        const companyId = companyMatch[1];        // "1001"
        const companyName = companyMatch[2];      // "Berko İlaç"
        
        // Bu company için access var mı kontrol et
        let companyAccess = userData.companyAccesses.find(ca => ca.companyId === companyId);
        
        if (!companyAccess) {
          // Yeni company access oluştur
          companyAccess = {
            companyId,
            companyName,
            roles: [],
            isActive: true
          };
          userData.companyAccesses.push(companyAccess);
        }
        
        // Role'ü ekle (duplicate kontrolü ile)
        if (!companyAccess.roles.includes(role)) {
          companyAccess.roles.push(role);
        }
      } else {
        if (import.meta.env.DEV) console.warn(`⚠️ Invalid group format: ${groupPath} - Expected format: /1001[Company Name]/role`);
      }
    } else {
      if (import.meta.env.DEV) console.warn(`⚠️ Invalid group path: ${groupPath} - Expected at least 2 parts`);
    }
  });

  userData.hasCompanyAccess = userData.companyAccesses.length > 0;
  userData.hasValidDefaultCompany = !!(
    userData.defaultCompanyId &&
    userData.companyAccesses.some(ca => ca.companyId === userData.defaultCompanyId)
  );

  return userData;
}

// Company listesi için format dönüştürme
export function convertToCompanySelections(companyAccesses: CompanyAccess[]): any[] {
  return companyAccesses.map(access => ({
    id: access.companyId,
    name: access.companyName,
    code: parseInt(access.companyId), // Company code as number
    roles: access.roles,
    isActive: access.isActive,
    // Ek bilgiler
    roleCount: access.roles.length,
    displayName: `${access.companyName} (${access.companyId})`
  }));
}

// Kullanıcının belirli bir company'de belirli bir role sahip olup olmadığını kontrol et
export function hasCompanyRole(companyAccesses: CompanyAccess[], companyId: string, role: string): boolean {
  const companyAccess = companyAccesses.find(ca => ca.companyId === companyId);
  return companyAccess?.roles.includes(role) || false;
}

// Kullanıcının herhangi bir company'de belirli bir role sahip olup olmadığını kontrol et
export function hasRoleInAnyCompany(companyAccesses: CompanyAccess[], role: string): boolean {
  return companyAccesses.some(ca => ca.roles.includes(role));
}

// Kullanıcının erişebileceği company'leri getir
export function getAccessibleCompanies(companyAccesses: CompanyAccess[]): CompanyAccess[] {
  return companyAccesses.filter(ca => ca.isActive && ca.roles.length > 0);
}

// Debug için token ve profile'ı kontrol etme
export function debugTokenAndProfile(tokenParsed: any, profile?: any): void {
  if (!import.meta.env.DEV) return;
  console.log('🧪 Debug: Token and Profile Analysis');
  
  console.log('📄 Token contents:');
  console.log('- default_company in token:', tokenParsed.default_company);
  console.log('- attributes in token:', tokenParsed.attributes);
  console.log('- groups in token:', tokenParsed.groups);
  
  if (profile) {
    console.log('👤 Profile contents:');
    console.log('- attributes in profile:', profile.attributes);
    console.log('- default_company in profile:', profile.attributes?.default_company);
  } else {
    console.log('👤 Profile: Not loaded');
  }
  
  // Keycloak instance kontrolü
  if (typeof window !== 'undefined' && (window as any).keycloak) {
    const keycloak = (window as any).keycloak;
    console.log('🔑 Keycloak instance:');
    console.log('- Token parsed:', keycloak.tokenParsed);
    console.log('- Profile:', keycloak.profile);
  }
}