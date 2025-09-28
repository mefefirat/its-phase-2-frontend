import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Paper, Title, ThemeIcon, Select, NumberInput, Stack, Badge } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useJobStore } from '../store/jobStore';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconBriefcase, IconArrowLeft, IconX, IconDeviceFloppy, IconQrcode } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Job, UpdateJobRequest } from '../types/job';

export default function EditJob() {
  const { editJob, fetchJobById, fetchJobPackHierarchyRecursive, jobPackHierarchy } = useJobStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const jobId = params.id;

  const form = useForm<UpdateJobRequest & { job_number?: number }>({
    initialValues: {
      planned_items: 0,
      lot: '',
      manufacture_date: '',
      expiry_date: '',
      job_number: 0,
    },
    validate: {
      planned_items: (value) => (value === undefined || value < 0 ? 'Planlanan adet 0 veya daha büyük olmalıdır' : null),
    },
  });

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) return;
      
      setIsLoading(true);
      try {
        const jobData = await fetchJobById(jobId);
        setJob(jobData);
        const toDateOnly = (value?: string | null) => (value ? value.slice(0, 10) : '');
        form.setValues({
          planned_items: jobData.planned_items,
          lot: jobData.lot ?? '',
          manufacture_date: toDateOnly(jobData.manufacture_date ?? null),
          expiry_date: toDateOnly(jobData.expiry_date ?? null),
          job_number: jobData.job_number ?? 0,
        });
      } catch (error: any) {
        notifications.show({
          title: 'Hata',
          message: 'İş bilgileri yüklenirken bir hata oluştu',
          color: 'red',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  // Paket hiyerarşisini sayfa açılışında yükle
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        await fetchJobPackHierarchyRecursive(jobId);
      } catch (e) {
        // Hata store tarafından bildiriliyor
      }
    })();
  }, [jobId, fetchJobPackHierarchyRecursive]);

  // Hiyerarşi listesini normalize et (API data veya düz liste olabilir)
  const hierarchyList = useMemo(() => {
    const raw: any = jobPackHierarchy as any;
    if (!raw) return [] as any[];
    if (Array.isArray(raw)) return raw as any[];
    if (Array.isArray(raw?.data)) return raw.data as any[];
    return [] as any[];
  }, [jobPackHierarchy]);

  const handleSubmit = async (values: UpdateJobRequest) => {
    if (!jobId) return;
    
    try {
      setIsSubmitting(true);
      
      const normalizeDate = (value?: string | null) => (value && value.trim() !== '' ? value : null);
      const payload: UpdateJobRequest = {
        planned_items: values.planned_items,
        lot: values.lot,
        manufacture_date: normalizeDate(values.manufacture_date ?? null),
        expiry_date: normalizeDate(values.expiry_date ?? null),
      };

      await editJob(jobId, payload);
      notifications.show({
        title: 'Başarılı',
        message: 'İş başarıyla güncellendi',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      if (job?.status === 'draft') {
        navigate(`/jobs/scan/${jobId}`);
      } else {
        navigate(`/jobs?status=in_progress`);
      }
      
    } catch (error: any) {
      console.error('Error updating job:', error);
      let errorMessage = 'İş güncellenirken bir hata oluştu';
      
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
    navigate('/jobs');
  };


  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconBriefcase color="#fff" stroke={1.5} />
          </ThemeIcon>
          {job?.material_name ? `${job.material_name}` : ''}
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
          
          <Grid>
            <Grid.Col span={6}>
               <Stack>
               <TextInput
                label="İş Emri No:"
                placeholder="Ör: 7000001"
                {...form.getInputProps('job_number')}
                required
                readOnly
              />
                
               <TextInput
                label="Parti / Batch / Lot No:"
                placeholder="Ör: LOT-2024-001"
                {...form.getInputProps('lot')}
                required
              />

              <TextInput
                type="date"
                label="Üretim Tarihi"
                placeholder="Tarih seçiniz..."
                {...form.getInputProps('manufacture_date')}
                required
              />

              <TextInput
                type="date"
                label="Son Kullanma Tarihi"
                placeholder="Tarih seçiniz..."
                {...form.getInputProps('expiry_date')}
                required
              />

              <NumberInput
                label="Üretim Miktarı"
                placeholder="0"
                {...form.getInputProps('planned_items')}
                withAsterisk
                required
                min={0}
                
              />

               </Stack>

               
            </Grid.Col>

            <Grid.Col span={6}>

              <Paper withBorder p="xs" bg="gray.1" mt="25px" h={345}>
                <Stack gap="0">
                  
                <Text size="sm"  fw={500} c="dimmed">GTIN</Text>
                  <Text size="sm"  fw={500} c="black" mb="xs">{job?.gtin ? job.gtin : ''}</Text>
                  <Text size="sm"  fw={500} c="dimmed">SKU</Text>
                  <Text size="sm"  fw={500} c="black" mb="xs">{job?.sku ? job.sku : ''}</Text>

                  {hierarchyList.map((node: any) => (
                    <Text key={node.id} size="sm" c="dimmed" mb="xs" component="div">
                      <Badge>{node?.code}</Badge>  {node?.label} İçi Adet : <code style={{ color: 'black' }}>{node?.capacity_items ?? '-'}</code>
                    </Text>
                  ))}
                  
                  
              </Stack>
              </Paper>
              


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
            {job?.status === 'draft' ? 'Kaydet ve Devam Et' : 'Güncelle'}
          </Button>
        </Group>
      </form>
    </>
  );
}
