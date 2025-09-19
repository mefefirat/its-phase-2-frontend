import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Paper, Title, ThemeIcon, Table, ActionIcon, Pagination } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useJobStore } from '../store/jobStore';
import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconBriefcase, IconArrowLeft, IconX, IconDeviceFloppy, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import type { CreateJobRequest } from '../types/job';
import { useMaterialStore } from '@/features/materials/store/materialStore';
import { useGlobalStore } from '@/store/globalStore';
import { useDebouncedCallback } from '@mantine/hooks';

export default function AddJob() {
  const { addJob } = useJobStore();
  const { materials, fetchMaterialsList, page, total_pages, total } = useMaterialStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const navigate = useNavigate();
  const currentCompany = useGlobalStore((state) => state.currentCompany);
  const companyCodeFromStore = (currentCompany?.company_code ?? (currentCompany?.code != null ? String(currentCompany.code) : '')) as string;

  const form = useForm<CreateJobRequest>({
    initialValues: {
      company_code: companyCodeFromStore,
      material_id: '',
    },
    validate: {
      material_id: (value) => (!value || value.trim().length < 1 ? 'Lütfen Ürün seçiniz' : null),
    },
  });



  const clearMaterials = useCallback(() => {
    useMaterialStore.setState({ materials: [] });
  }, []);

  const searchMaterialsByQuery = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 3) {
      return;
    }
    setMaterialsLoading(true);
    try {
      await fetchMaterialsList({ page: 1, per_page: 10, search: query.trim() });
    } catch {
      notifications.show({ title: 'Hata', message: 'Ürün arama sırasında bir hata oluştu', color: 'red' });
    } finally {
      setMaterialsLoading(false);
    }
  }, [fetchMaterialsList]);

  const debouncedSearch = useDebouncedCallback(searchMaterialsByQuery, 500);

  const handleMaterialSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setSearchQuery(value);

    if (!value.trim() || value.trim().length < 3) {
      clearMaterials();
      setMaterialsLoading(false);
      setSelectedMaterialId('');
      form.setFieldValue('material_id', '');
      return;
    }

    setSelectedMaterialId('');
    form.setFieldValue('material_id', '');
    debouncedSearch(value);
  }, [clearMaterials, debouncedSearch, form]);

  const handleSubmit = async (values: CreateJobRequest) => {
    try {
      setIsSubmitting(true);
      
      const payload: CreateJobRequest = {
        company_code: companyCodeFromStore,
        material_id: (values.material_id || '').trim(),
      };

      const created = await addJob(payload);
      notifications.show({
        title: 'Başarılı',
        message: 'İş başarıyla eklendi',
        color: 'green',
        icon: <IconCheck size={16} />,
      }); 
      if (created && created.id) {
        navigate(`/jobs/edit/${created.id}`);
      } else {
        navigate('/jobs');
      }
      
    } catch (error: any) {
      console.error('Error adding job:', error);
      let errorMessage = 'İş eklenirken bir hata oluştu';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Hata: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamıyor';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      notifications.show({
        title: 'Hata',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/jobs/add');
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconBriefcase color="#fff" stroke={1.5} />
          </ThemeIcon>
          Yeni İş Ekle
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
          <Text size="sm" fw={500} c="dimmed" mb="xs">İlgili ürünü seçerek yeni iş başlatabilirsiniz</Text>
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="SKU Kodu / Ürün Adı"
                placeholder="En az 3 karakter girin..."
                value={searchQuery}
                onChange={handleMaterialSearchChange}
                leftSection={<IconSearch size={16} />}
                rightSection={searchQuery ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label="Temizle"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedMaterialId('');
                      form.setFieldValue('material_id', '');
                      clearMaterials();
                      setMaterialsLoading(false);
                    }}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : null}
                rightSectionPointerEvents="all"
              />
            </Grid.Col>

            {searchQuery.trim().length >= 3 && (
              <Grid.Col span={12}>
                <Table striped withColumnBorders withRowBorders withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={160}>SKU</Table.Th>
                      <Table.Th>Ürün Adı</Table.Th>
                      <Table.Th w={120} style={{ textAlign: 'center' }} align="center">Seç</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {materialsLoading ? (
                      <Table.Tr>
                        <Table.Td colSpan={3}><Text c="dimmed">Yükleniyor...</Text></Table.Td>
                      </Table.Tr>
                    ) : materials.length > 0 ? (
                      materials.map((m) => (
                        <Table.Tr key={m.id} bg={selectedMaterialId === m.id ? 'var(--mantine-color-blue-light)' : undefined}>
                          <Table.Td>{m.sku}</Table.Td>
                          <Table.Td>{m.material_name}</Table.Td>
                          <Table.Td align="center">
                            <Button size="xs" variant={selectedMaterialId === m.id ? 'filled' : 'light'} onClick={() => {
                              const id = m.id || '';
                              const nextId = selectedMaterialId === id ? '' : id;
                              setSelectedMaterialId(nextId);
                              form.setFieldValue('material_id', nextId);
                            }}> {selectedMaterialId === m.id ? 'Seçili' : 'Seç'} </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>
                          <Text c="dimmed">Ürün bulunamadı</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              <Group justify="flex-end" mt="md">
                <Text size="sm" color="gray">Toplam Kayıt: {typeof total === 'number' ? total : (materials?.length || 0)}</Text>
                {!!total_pages && (
                  <>
                    <Text size="sm" color="gray">Sayfa: {page} / {total_pages}</Text>
                    <Pagination
                      total={total_pages}
                      value={page}
                      onChange={async (newPage) => {
                        setMaterialsLoading(true);
                        try {
                          await fetchMaterialsList({ page: newPage, per_page: 10, search: searchQuery.trim() });
                        } finally {
                          setMaterialsLoading(false);
                        }
                      }}
                      style={{ alignSelf: 'center' }}
                      size="sm"
                    />
                  </>
                )}
              </Group>
              </Grid.Col>
            )}
          </Grid>
        </Paper>

        <Group justify="flex-end" mt="lg">
          <Button 
            type="submit" 
            size="xs" 
            loading={isSubmitting}
            disabled={!((form.values.material_id || '').trim().length > 0)}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Kaydet ve Devam Et
          </Button>
        </Group>
      </form>
    </>
  );
}
