import React from 'react';
import { getTokenStatus, clearTokensFromStorage } from '@/utils/tokenStorage';
import { useGlobalStore } from '@/store/globalStore';

export const TokenStatus: React.FC = () => {
  const [tokenStatus, setTokenStatus] = React.useState(getTokenStatus());
  const { user, isAuthenticated } = useGlobalStore();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTokenStatus(getTokenStatus());
    }, 5000); // Her 5 saniyede bir güncelle

    return () => clearInterval(interval);
  }, []);

  const handleClearTokens = () => {
    clearTokensFromStorage();
    setTokenStatus(getTokenStatus());
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔐 Token Status</h4>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Stored Tokens:</strong> {tokenStatus.hasStoredTokens ? '✅ Yes' : '❌ No'}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Expired:</strong> {tokenStatus.isExpired ? '❌ Yes' : '✅ No'}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Expiring Soon:</strong> {tokenStatus.isExpiringSoon ? '⚠️ Yes' : '✅ No'}
      </div>
      
      {tokenStatus.timeUntilExpiry > 0 && (
        <div style={{ marginBottom: '5px' }}>
          <strong>Time Until Expiry:</strong> {formatTime(tokenStatus.timeUntilExpiry)}
        </div>
      )}
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
      </div>
      
      {user && (
        <div style={{ marginBottom: '5px' }}>
          <strong>User:</strong> {user.name || user.username}
        </div>
      )}
      
      <button
        onClick={handleClearTokens}
        style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '10px',
          marginTop: '5px'
        }}
      >
        Clear Tokens
      </button>
    </div>
  );
}; 