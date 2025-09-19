import { TextInput, Button, Group, Text, LoadingOverlay, Paper, Title, ThemeIcon, Stack, Badge, Progress, Table, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useJobStore } from '../store/jobStore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy, IconQrcode, IconPlus, IconMinus } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Job, UpdateJobRequest } from '../types/job';

export default function JobScan() {
  const { fetchJobById, fetchJobPackHierarchyRecursive, jobPackHierarchy } = useJobStore();
  const { jobPackages } = useJobStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [scannedItems, setScannedItems] = useState<number>(0);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [childrenByParent, setChildrenByParent] = useState<Record<string, any[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Record<string, boolean>>({});
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const jobId = params.id;

  const form = useForm<{ barcode: string }>({
    initialValues: {
      barcode: '',
    },
  });

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) return;
      
      setIsLoading(true);
      try {
        const jobData = await fetchJobById(jobId);
        setJob(jobData);
        setScannedItems(jobData.scanned_items ?? 0);
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

  // Barcode input'una focus yap (sayfa yüklendiğinde)
  useEffect(() => {
    if (barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }, 300);
    }
  }, []);

  const handleBack = () => {
    navigate(`/jobs/edit/${jobId}`);
  };

  const handleScanSubmit = async (values: { barcode: string }) => {
    if (!jobId) return;
    try {
      setIsSubmitting(true);
      const scan = useJobStore.getState().scanJob;
      const response = await scan({
        job_id: jobId,
        barcode: values.barcode,
      });

      console.log(response);
      // API'den gelen scanned_items zaten toplam değer
      if (response?.scanned_items !== undefined) {
        setScannedItems(response.scanned_items);
      }
      // Clear input after successful scan
      form.setFieldValue('barcode', '');
      // Focus back to input for next scan
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }, 100);
    } catch (e) {
      // Store already shows error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sayfa yüklendiğinde paket listesini çek
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        const { fetchJobPackages } = useJobStore.getState();
        await fetchJobPackages(jobId);
      } catch (e) {
        // Hata store tarafından gösterilir
      }
    })();
  }, [jobId]);

  const toggleExpand = async (parentId: string) => {
    if (!jobId) return;
    setExpandedRows((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
    // If expanding and children not loaded yet, fetch
    if (!expandedRows[parentId] && !childrenByParent[parentId]) {
      try {
        setLoadingChildren((prev) => ({ ...prev, [parentId]: true }));
        const { fetchJobPackages } = useJobStore.getState();
        const children = await fetchJobPackages(jobId, parentId);
        setChildrenByParent((prev) => ({ ...prev, [parentId]: children }));
      } catch (e) {
        // error notification is handled in store
      } finally {
        setLoadingChildren((prev) => ({ ...prev, [parentId]: false }));
      }
    }
  };

  const renderRows = (items: any[]) => {
    return items.map((pkg) => (
      <>
        <Table.Tr key={pkg.id}>
          <Table.Td>
            <ActionIcon
              variant="light"
              size="sm"
              onClick={() => toggleExpand(pkg.id)}
              loading={!!loadingChildren[pkg.id]}
              aria-label={expandedRows[pkg.id] ? 'Daralt' : 'Genişlet'}
            >
              {expandedRows[pkg.id] ? <IconMinus size={16} /> : <IconPlus size={16} />}
            </ActionIcon>
          </Table.Td>
          <Table.Td>{pkg.label ?? '-'}</Table.Td>
          <Table.Td>
            <code style={{ color: 'black' }}>{pkg.barcode}</code>
          </Table.Td>
        </Table.Tr>
        {expandedRows[pkg.id] && (
          <Table.Tr>
            <Table.Td colSpan={3}>
              <Table striped withTableBorder withRowBorders withColumnBorders highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 44 }}></Table.Th>
                    <Table.Th>Label</Table.Th>
                    <Table.Th>Barcode</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {childrenByParent[pkg.id] && childrenByParent[pkg.id].length > 0 ? (
                    renderRows(childrenByParent[pkg.id])
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text size="sm" c="dimmed">Alt kayıt bulunamadı</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.Td>
          </Table.Tr>
        )}
      </>
    ));
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="green">
            <IconQrcode color="#fff" stroke={1.5} />
          </ThemeIcon>
          {job?.material_name ? `${job.material_name} - Tarama` : 'İş Tarama'}
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
      
      {/* Job Information */}
      <Paper withBorder p="lg" mb="lg">
        <Stack gap="md">
          <Text size="lg" fw={600}>İş Bilgileri</Text>
          
          <Group grow>
            <div>
              <Text size="sm" fw={500} c="dimmed">GTIN</Text>
              <Text size="sm" fw={500} c="black">{job?.gtin ? job.gtin : '-'}</Text>
            </div>
            <div>
              <Text size="sm" fw={500} c="dimmed">SKU</Text>
              <Text size="sm" fw={500} c="black">{job?.sku ? job.sku : '-'}</Text>
            </div>
            <div>
              <Text size="sm" fw={500} c="dimmed">Lot No</Text>
              <Text size="sm" fw={500} c="black">{job?.lot ? job.lot : '-'}</Text>
            </div>
          </Group>

          {hierarchyList.length > 0 && (
            <div>
              <Text size="sm" fw={500} c="dimmed" mb="xs">Paket Hiyerarşisi</Text>
              {hierarchyList.map((node: any) => (
                <Text key={node.id} size="sm" c="dimmed" mb="xs" component="div">
                  <Badge>{node?.code}</Badge> {node?.label} İçi Adet : <code style={{ color: 'black' }}>{node?.capacity_items ?? '-'}</code>
                </Text>
              ))}
            </div>
          )}
        </Stack>
      </Paper>

      {/* Progress and Scanning */}
      <Paper withBorder p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>Tarama İlerlemesi</Text>
            <Text size="lg" fw={600}>{scannedItems} / {job?.planned_items ?? 0}</Text>
          </Group>
          
          <Progress 
            value={(scannedItems && job?.planned_items ? Math.min(100, (scannedItems / (job?.planned_items || 1)) * 100) : 0)} 
            size="lg" 
            striped 
            animated 
          />

          <Text size="md" fw={500} c="dimmed">KAREKOD OKUT</Text>
          
          <form onSubmit={form.onSubmit(handleScanSubmit)} autoComplete='off'>
            <Group justify="space-between">
              <TextInput
                {...form.getInputProps('barcode')}
                ref={barcodeInputRef}
                size="md"
                flex={1}
                autoFocus
                placeholder="Barkod okutun..."
              />
              <Button 
                type="submit" 
                size="md" 
                loading={isSubmitting}
                leftSection={<IconDeviceFloppy size={16} />}
              >
                Kaydet
              </Button>
            </Group>
          </form>
        </Stack>
      </Paper>

      <Paper withBorder p="lg" mt="lg">
        <Stack gap="md">
          <Text size="lg" fw={600}>Paketler</Text>
          <Table striped withTableBorder  withRowBorders withColumnBorders stickyHeader stickyHeaderOffset={60}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 44 }}></Table.Th>
                <Table.Th>Label</Table.Th>
                <Table.Th>Barcode</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobPackages && jobPackages.length > 0 ? (
                renderRows(jobPackages)
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text size="sm" c="dimmed">Kayıt bulunamadı</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>
    </>
  );
}
