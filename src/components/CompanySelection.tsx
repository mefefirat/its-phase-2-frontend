import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  Select, 
  Button, 
  Group, 
  Stack,
  Loader,
  Center,
  Alert
} from '@mantine/core';
import { IconBuilding, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useCompanyStore } from '@/features/companies/store/companyStore';
import { useGlobalStore, useCurrentUser, useCurrentCompany } from '@/store/globalStore';
import type { Company } from '@/features/companies/types/company';

const CompanySelection: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useCurrentUser();
  const currentCompany = useCurrentCompany();
  const { setCurrentCompany } = useGlobalStore();
  const { companies, loading, fetchCompaniesList } = useCompanyStore();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Component mount olduğunda dropdown companies'leri yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompaniesList();
    }
  }, [isAuthenticated, fetchCompaniesList]);

  // Eğer zaten bir şirket seçilmişse dashboard'a yönlendir
  useEffect(() => {
    if (isAuthenticated && currentCompany) {
      navigate('/jobs', { replace: true });
    }
  }, [isAuthenticated, currentCompany, navigate]);

  // Eğer kullanıcı authenticate değilse login'e yönlendir
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleCompanySelect = (companyId: string | null) => {
    setSelectedCompanyId(companyId || '');
    setError(''); // Hata mesajını temizle
  };

  const handleContinue = async () => {
    if (!selectedCompanyId) {
      setError('Lütfen bir şirket seçiniz.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Seçilen company'yi bul
      const selectedCompany = companies.find(company => company.id === selectedCompanyId);
      
      if (!selectedCompany) {
        setError('Seçilen şirket bulunamadı.');
        return;
      }

      // Global store'a current company olarak set et
      const currentCompany = {
        id: selectedCompany.id!,
        name: selectedCompany.company_name,
        code: Number(selectedCompany.company_code) || 0,
        roles: [], // Bu bilgiyi token'dan alabiliriz, şimdilik boş bırakıyoruz
        company_code: selectedCompany.company_code,
        company_name: selectedCompany.company_name,
        gln: selectedCompany.gln ?? null,
        gcp: selectedCompany.gcp,
      };

      setCurrentCompany(currentCompany);

      // Dashboard'a yönlendir
      navigate('/jobs');
      
    } catch (err) {
      console.error('Company selection error:', err);
      setError('Şirket seçimi sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading durumu
  if (loading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Container size="sm">
          <Paper p="xl" radius="md" shadow="sm" withBorder style={{ width: 480 }}>
            <Center>
              <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text size="sm" c="dimmed">Şirketler yükleniyor...</Text>
              </Stack>
            </Center>
          </Paper>
        </Container>
      </Stack>
    );
  }

  // Şirket bulunamadı durumu
  if (!loading && companies.length === 0) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Container size="sm">
          <Paper p="xl" radius="md" shadow="sm" withBorder style={{ width: 480 }}>
            <Stack gap="md">
              <Group gap="sm">
                <IconAlertCircle size={24} color="var(--mantine-color-orange-6)" />
                <Title order={3}>Şirket Bulunamadı</Title>
              </Group>
              <Text c="dimmed">
                Hesabınızla ilişkili herhangi bir şirket bulunamadı. 
                Lütfen sistem yöneticisi ile iletişime geçin.
              </Text>
              <Button 
                variant="light" 
                onClick={() => navigate('/login')}
                fullWidth
              >
                Giriş Sayfasına Dön
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Stack>
    );
  }

  return (
    <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
      <Container size="sm">
        <Paper p="xl" radius="md" shadow="sm" withBorder style={{ width: 480 }}>
        <Stack gap="lg">
          {/* Header */}
          <Stack gap="sm" align="center">
            <IconBuilding size={48} color="var(--mantine-color-blue-6)" />
            <Title order={2} ta="center">Şirket Seçimi</Title>
            <Text c="dimmed" ta="center" size="sm">
              Devam etmek için lütfen bir şirket seçiniz
            </Text>
          </Stack>

          {/* User Info */}
          {user && (
            <Alert 
              icon={<IconCheck size={16} />} 
              color="green" 
              variant="light"
              radius="md"
            >
              <Text size="sm">
                <strong>Hoş geldiniz:</strong> {user.name || user.username}
              </Text>
            </Alert>
          )}

          {/* Company Selection */}
          <Stack gap="md">
            <Text size="sm" fw={500}>Şirket Seçiniz</Text>
            <Select
              placeholder="Şirket seçiniz..."
              data={companies.map(company => ({
              value: company.id!,
              label: company.company_name,
              description: `GLN: ${company.gln ?? '-'}`
            }))}
              value={selectedCompanyId}
              onChange={handleCompanySelect}
              searchable
              clearable
              size="md"
              radius="md"
              error={error ? true : false}
            />
            
            {error && (
              <Text size="sm" c="red">
                {error}
              </Text>
            )}
          </Stack>

          {/* Action Buttons */}
          <Group justify="center" gap="md">
            <Button 
              onClick={handleContinue}
              loading={isSubmitting}
              disabled={!selectedCompanyId}
              size="md"
            >
              Devam Et
            </Button>
          </Group>
        </Stack>
        </Paper>
      </Container>
    </Stack>
  );
};

export default CompanySelection;
