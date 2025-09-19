import { MantineProvider } from "@mantine/core";

export const LoadingScreen = () => (
  <MantineProvider>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>⏳</div>
        <div style={{ color: '#888', fontSize: 18 }}>Yükleniyor...</div>
      </div>
    </div>
  </MantineProvider>
); 