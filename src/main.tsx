// src/main.tsx
import ReactDOM from "react-dom/client";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';
import { Router } from "@/Router";
import '@mantine/dates/styles.css';
import '@/styles/web.css';
import '@/styles/rf.css';
// Keycloak init kaldırıldı; login route kullanılacak

const root = ReactDOM.createRoot(document.getElementById("root")!);

const App = () => {
  // Auth init artık gerekli değil; Router içindeki PrivateRoute kontrol ediyor

  return (
    <MantineProvider>
      <Notifications position="top-right" zIndex={1000} />
      <Router />
    </MantineProvider>
  );
};

root.render(<App />);