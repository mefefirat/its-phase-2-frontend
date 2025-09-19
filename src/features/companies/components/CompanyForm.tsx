import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Paper, Title, ThemeIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCompanyStore } from '../store/companyStore';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconBuilding, IconArrowLeft, IconX, IconDeviceFloppy } from '@tabler/icons-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Company } from '../types/company';

interface CompanyFormProps {
  initialData?: Partial<Company>;
  editMode?: boolean;
  companyId?: string;
}

export default function CompanyForm({ initialData, editMode = false, companyId }: CompanyFormProps) {
  const { addCompany, editCompany, fetchCompanyById } = useCompanyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  
  // URL'den editMode ve companyId'yi belirle
  const isEditModeFromUrl = location.pathname.includes('/edit/');
  const companyIdFromUrl = isEditModeFromUrl ? params.id : undefined;
  
  // Props'tan gelen değerler varsa onları kullan, yoksa URL'den al
  const finalEditMode = editMode || isEditModeFromUrl;
  const finalCompanyId = companyId || companyIdFromUrl;

  const form = useForm<Partial<Company>>({
    initialValues: initialData || {
      company_code: '',
      company_name: '',
      gln: '',
      gcp: '',
    },
    validate: {
      company_code: (value) => (!value || value.trim().length < 1 ? 'Lütfen Firma Kodu giriniz' : null),
      company_name: (value) => (!value || value.trim().length < 2 ? 'Lütfen Firma Adı giriniz' : null),
      gcp: (value) => (!value || value.trim().length < 1 ? 'Lütfen GCP giriniz' : null),
      // gln opsiyoneldir; boş olabilir
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      if (finalEditMode && finalCompanyId) {
        await fetchCompanyData();
      } 
    };

    initializeForm();
  }, [finalEditMode, finalCompanyId]);

  const fetchCompanyData = async () => {
    if (!finalCompanyId) return;
    
    setIsLoading(true);
    try {
      const companyData = await fetchCompanyById(finalCompanyId);
      form.setValues({
        company_code: companyData.company_code,
        company_name: companyData.company_name,
        gln: companyData.gln ?? '',
        gcp: companyData.gcp,
      });
    } catch (error: any) {
      // Store zaten error notification gösterdi
      console.error('Failed to load company data:', error);
      
      // Kritik hata - formu kullanamaz durumda
      // Kullanıcıyı geri yönlendir
      navigate('/definitions/companies');
    } finally {
      setIsLoading(false);
    }
  };

  // UI LAYER - SADECE UI STATE VE LOADING HANDLE ET
  const handleSubmit = async (values: Partial<Company>) => {
    setIsSubmitting(true);
    
    try {
      const payload: Partial<Company> = {
        company_code: (values.company_code || '').trim(),
        company_name: (values.company_name || '').trim(),
        gcp: (values.gcp || '').trim(),
        gln: values.gln && values.gln.toString().trim() !== '' ? String(values.gln).trim() : undefined,
      };

      if (finalEditMode && finalCompanyId) {
        await editCompany(finalCompanyId, payload);
      } else {
        await addCompany(payload);
      }
      
      // Store zaten success notification gösterdi
      // Başarılı ise navigate et
      navigate('/definitions/companies');
      
    } catch (error: any) {
      // Store zaten error notification gösterdi
      // Sadece UI-specific işlemler yap
      console.error(finalEditMode ? 'Form update failed:' : 'Form submission failed:', error);
      
      // Sadece kritik durumlarda ek işlem yap
      // Örneğin: network hatası durumunda formu reset etme, focus vs.
      
    } finally {
      setIsSubmitting(false); // UI state'ini her durumda temizle
    }
  };

  const handleBack = () => {
    navigate('/definitions/companies');
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconBuilding color="#fff" stroke={1.5} />
          </ThemeIcon>
          {finalEditMode ? 'Firma Düzenle' : 'Yeni Firma Ekle'}
        </Title>
        <Button 
          leftSection={<IconArrowLeft size={16} />} 
          variant="light" 
          onClick={handleBack}
          size="xs"
        >
          Geri Dön
        </Button>
      </Group>
      
      <LoadingOverlay visible={isLoading} />
      <form onSubmit={form.onSubmit(handleSubmit)} autoComplete='off'>
        <Paper p="lg" withBorder mb="lg">
          <Text size="sm" fw={500} c="dimmed" mb="xs">Firma Bilgileri</Text>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Firma Kodu"
                placeholder="Ör: ABC001"
                {...form.getInputProps('company_code')}
                withAsterisk
                required
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Firma Adı"
                placeholder="Ör: ABC Ticaret ve Sanayi A.Ş."
                {...form.getInputProps('company_name')}
                withAsterisk
                required
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                description="GLN, Global Location Number, bir firma için benzersiz bir numaradır."
                label="GLN"
                placeholder="Ör: 1234567890123"
                {...form.getInputProps('gln')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                description="GCP, Global Company Prefix, bir firma için benzersiz bir numaradır."
                label="GCP"
                placeholder="Ör: 1234567"
                {...form.getInputProps('gcp')}
                withAsterisk
                required
              />
            </Grid.Col>
          </Grid>
        </Paper>

        <Group justify="flex-end" mt="lg">
          <Button variant="light" size="xs" onClick={handleBack} leftSection={<IconX size={16} />}>
            Vazgeç
          </Button>
          <Button 
            type="submit" 
            size="xs" 
            loading={isSubmitting}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Kaydet
          </Button>
        </Group>
      </form>
    </>
  );
}