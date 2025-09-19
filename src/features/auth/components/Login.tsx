import { useState } from 'react';
import { Button, Card, TextInput, PasswordInput, Stack, Title, Alert } from '@mantine/core';
import { login } from '@/features/auth/services/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/company-selection');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ width: 380 }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={3} ta="center">Giriş Yap</Title>
            {error && <Alert color="red">{error}</Alert>}
            <TextInput label="Kullanıcı Adı" value={username} onChange={(e) => setUsername(e.currentTarget.value)} required autoFocus />
            <PasswordInput label="Şifre" value={password} onChange={(e) => setPassword(e.currentTarget.value)} required />
            <Button type="submit" loading={loading} fullWidth>Giriş</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}




