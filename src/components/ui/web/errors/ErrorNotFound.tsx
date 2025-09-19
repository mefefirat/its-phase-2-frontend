// src/components/ErrorNotFound.tsx
import { Center, Title, Text, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";

export function ErrorNotFound() {
  const navigate = useNavigate();

  return (
    <Center style={{ height: "80vh", flexDirection: "column", textAlign: "center" }}>
      <Title order={1}>404</Title>
      <Text size="lg" mt="sm">
        Üzgünüz, aradığınız sayfa bulunamadı.
      </Text>
      <Button mt="md" onClick={() => navigate("/")}>
        Ana Sayfaya Dön
      </Button>
    </Center>
  );
}
