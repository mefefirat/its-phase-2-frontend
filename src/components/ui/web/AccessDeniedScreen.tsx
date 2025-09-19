import { MantineProvider } from "@mantine/core";

export const AccessDeniedScreen = ({ message, onLogout }: { message: string, onLogout: () => void }) => (
  <MantineProvider>
    <div style={{
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff3cd',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        border: '1px solid #ffc107'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#856404', marginBottom: '20px' }}>Erişim Engellendi</h2>
        <p style={{ color: '#664d03', marginBottom: '30px', lineHeight: '1.5' }}>
          {message}
        </p>
        <p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '30px' }}>
          Lütfen sistem yöneticiniz ile iletişime geçin.
        </p>
        <button
          onClick={onLogout}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#ffc107',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🚪 Çıkış Yap
        </button>
      </div>
    </div>
  </MantineProvider>
); 