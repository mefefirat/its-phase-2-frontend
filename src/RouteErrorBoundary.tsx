import { ErrorBoundary } from "react-error-boundary";
import { Center, Text, Button } from "@mantine/core";

function Fallback({ error, resetErrorBoundary }: any) {
  return (
    <Center style={{ flexDirection: "column", padding: 20 }}>
      <Text color="red">Bir şeyler ters gitti:</Text>
      <Text>{error.message}</Text>
      <Button onClick={resetErrorBoundary}>Tekrar Dene</Button>
    </Center>
  );
}

export function RouteErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      {children}
    </ErrorBoundary>
  );
}
