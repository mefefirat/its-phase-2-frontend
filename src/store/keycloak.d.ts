import Keycloak from 'keycloak-js';

declare module './config/keycloak' {
  const keycloak: Keycloak;
  export default keycloak;
} 