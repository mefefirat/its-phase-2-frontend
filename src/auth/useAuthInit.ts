// Deprecated: Keycloak tabanlı init kaldırıldı. Dosya boş bırakıldı veya kaldırılabilir.
export function useAuthInit() {
  return { isLoading: false, isAccessDenied: false, accessDeniedMessage: '', handleLogout: () => {} } as const;
}