import { TextInput, Button, Group, Text, LoadingOverlay, Paper, Title, ThemeIcon, Stack, Badge, Progress, Table, ActionIcon, Box, Grid, Menu, Modal, Loader } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useForm } from '@mantine/form';
import { useJobStore } from '../store/jobStore';
import { useSidebarStore } from '@/store/menuStore';
import { useIsUserAdmin } from '@/store/globalStore';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IconArrowLeft, IconDeviceFloppy, IconQrcode, IconPlus, IconMinus, IconPrinter, IconSettings, IconX, IconChevronDown, IconChevronUp, IconCheck, IconLockX, IconDotsVertical, IconRefresh } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Job, UpdateJobRequest } from '../types/job';
import { diagnosePrinterIssues } from '@/utils/printerUtils';
import { normalizeText } from '@/utils/normalizeText';
import { pharmaValidator } from '@/utils/pharmaValidator';
import ZebraPrinterSelector, { ZebraPrinterSelectorRef } from '@/shared/printer/ZebraPrinterSelector';

export default function JobScan() {
  const { fetchJobById, fetchJobPackHierarchyRecursive, jobPackHierarchy } = useJobStore();
  const { jobPackages } = useJobStore();
  const { fetchJobPackageHierarchyByLatestScan, jobPackageHierarchyByLatestScan } = useJobStore();
  const { fetchLastScannedByJob, lastScanned } = useJobStore();
  const isUserAdmin = useIsUserAdmin();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [scannedItems, setScannedItems] = useState<number>(0);
  // last scanned list is now provided by store: lastScanned
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [childrenByParent, setChildrenByParent] = useState<Record<string, any[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Record<string, boolean>>({});
  const [scansByParent, setScansByParent] = useState<Record<string, any[]>>({});
  const [canPrint, setCanPrint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [isJobInfoExpanded, setIsJobInfoExpanded] = useState(true);
  const depthBgColors = ['#ffffff', '#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6'];
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [overlay, setOverlay] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCheckingPrinter, setIsCheckingPrinter] = useState(false);
  const [printerDiagnosis, setPrinterDiagnosis] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [selectedPalletPrinter, setSelectedPalletPrinter] = useState<any>(null);
  const [selectedLabelPrinter, setSelectedLabelPrinter] = useState<any>(null);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { closeSidebar } = useSidebarStore();
  
  // Printer selector ref'leri
  const palletPrinterSelectorRef = useRef<ZebraPrinterSelectorRef>(null);
  const labelPrinterSelectorRef = useRef<ZebraPrinterSelectorRef>(null);
  
  const jobId = params.id;

  // İş tamamlanma durumu
  const isCompleted = !!job && (
    job.status === 'completed' ||
    !!job.completed_at ||
    (scannedItems >= (job?.planned_items ?? 0) && (job?.planned_items ?? 0) > 0)
  );

  const form = useForm<{ barcode: string }>({
    initialValues: {
      barcode: '',
    },
  });

  // Yazdırma için gerekli bilgilerin kontrolü
  const checkPrintRequirements = () => {
    const hasRequiredFields = !!(job?.material_name && job?.gtin && job?.lot && job?.expiry_date);
    const hasPrinters = !!(selectedPalletPrinter && selectedLabelPrinter);
    setCanPrint(hasRequiredFields && hasPrinters);
  };

  // Yazdırma fonksiyonu
  const handlePrintLabel = async (
    barcode: string,
    material_name?: string | null,
    gtin?: string | null,
    lot?: string | null,
    expiry_date?: string | null,
    code?: string
  ) => {
    if (!selectedLabelPrinter) {
      setErrorMessage('Label printer seçilmemiş. Lütfen yazdırma için label printer seçin.');
      return;
    }

    // Gerekli alanların kontrolü
    if (!material_name || !gtin || !lot || !expiry_date) {
      setErrorMessage('Yazdırma için gerekli bilgiler eksik (Material Name, GTIN, Lot, Expiry Date).');
      return;
    }

    // Code'a göre tip belirleme
    const getTypeLabel = (code?: string) => {
      switch (code) {
        case 'P': return 'PALET';
        case 'C': return 'KOLI';
        case 'S': return 'BAG';
        case 'B': return 'KOLI ICI KUTU';
        case 'E': return 'KUCUK BAG';
        default: return 'BAG ETIKETI';
      }
    };


    const zplContent = `^XA
^PW479
^LL319

^GB479,319,2,B^FS

^FO15,15^A0N,30,30^FDURUN^FS
^FO15,50^A0N,25,25^FD${normalizeText(material_name)}^FS

^FO15,110^GB449,2,2^FS

^FO15,125^A0N,20,20^FDGTIN:^FS
^FO70,125^A0N,20,20^FD${gtin}^FS
^FO230,125^A0N,20,20^FDLOT:^FS
^FO280,125^A0N,20,20^FD${lot}^FS

^FO15,155^A0N,20,20^FDSKT:^FS
^FO70,155^A0N,20,20^FD${expiry_date}^FS
^FO230,155^A0N,20,20^FDTIP:^FS
^FO280,155^A0N,20,20^FD${getTypeLabel(code)}^FS

^FO15,185^GB449,2,2^FS

^BY1.5,2,70
^FO40,210^BCN,70,N,N,N
^FD${barcode}^FS

^CF0,16
^FO0,290^FB479,1,0,C,0^FD${barcode}^FS

^XZ`;




    console.log("Yazdırma işlemi başlatılıyor...");
    
    try {
      // Seçilen label printer ile yazdırma yapacağız
      const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        selectedLabelPrinter.send(
          zplContent,
          () => resolve({ success: true }),
          (error: string) => resolve({ success: false, error })
        );
      });
      console.log("Print result:", result);
      
      if (result.success) {
        console.log("Yazdırma başarılı");
        setErrorMessage(null); // Clear any previous errors on success
      } else {
        console.error("Yazdırma hatası:", result);
        let errorMsg = `Yazdırma hatası: ${result.error || 'Bilinmeyen hata'}`;
        
        if (result.error) {
          // Özel hata mesajları ve çözüm önerileri
          if (result.error.includes('connection closed') || result.error.includes('writing to port')) {
            errorMsg += '\n\n💡 Çözüm önerileri:\n';
            errorMsg += '• Printer\'ı kapatıp açın\n';
            errorMsg += '• USB kablosunu çıkarıp takın\n';
            errorMsg += '• BrowserPrint uygulamasını yeniden başlatın\n';
            errorMsg += '• "Printer Tanısı" butonuna tıklayın';
          } else if (result.error.includes('timeout')) {
            errorMsg += '\n\n⏱️ Printer yanıt vermiyor:\n';
            errorMsg += '• Printer\'ın açık olduğundan emin olun\n';
            errorMsg += '• Printer\'ın hazır durumda olduğunu kontrol edin\n';
            errorMsg += '• Kağıt sıkışması olup olmadığına bakın';
          }
        }
        
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error("Yazdırma exception:", error);
      setErrorMessage('Yazdırma işlemi sırasında bir hata oluştu');
    }
  };

  // Printer tanı fonksiyonu
  const handlePrinterDiagnosis = async () => {
    setIsCheckingPrinter(true);
    try {
      const diagnosis = await diagnosePrinterIssues('label');
      setPrinterDiagnosis(diagnosis);
      setShowDiagnostics(true);
      console.log("Printer diagnosis:", diagnosis);
    } catch (error) {
      setErrorMessage('Printer tanısı sırasında bir hata oluştu');
    } finally {
      setIsCheckingPrinter(false);
    }
  };

  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId) return;
      
      setIsLoading(true);
      try {
        const jobData = await fetchJobById(jobId);
        setJob(jobData);
        setScannedItems(jobData.scanned_items ?? 0);
      } catch (error: any) {
        setErrorMessage('İş bilgileri yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  // Job verisi yüklendiğinde yazdırma gereksinimlerini kontrol et
  useEffect(() => {
    checkPrintRequirements();
  }, [job, selectedPalletPrinter, selectedLabelPrinter]);

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

  // En son taramaya göre paket hiyerarşisini yükle
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        await fetchJobPackageHierarchyByLatestScan(jobId);
      } catch (e) {
        // Hata store tarafından bildiriliyor
      }
    })();
  }, [jobId, fetchJobPackageHierarchyByLatestScan]);

  // Sayfa yüklenince son tarananları çek
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        await fetchLastScannedByJob(jobId);
      } catch (e) {
        // Hata store tarafından bildiriliyor
      }
    })();
  }, [jobId, fetchLastScannedByJob]);

  // Hiyerarşi listesini normalize et (API data veya düz liste olabilir)
  const hierarchyList = useMemo(() => {
    const raw: any = jobPackHierarchy as any;
    if (!raw) return [] as any[];
    if (Array.isArray(raw)) return raw as any[];
    if (Array.isArray(raw?.data)) return raw.data as any[];
    return [] as any[];
  }, [jobPackHierarchy]);

  // Barcode input'una focus yap (sayfa yüklendiğinde) - şimdilik kapatıldı
  // useEffect(() => {
  //   if (barcodeInputRef.current) {
  //     setTimeout(() => {
  //       barcodeInputRef.current?.focus();
  //       barcodeInputRef.current?.select();
  //     }, 300);
  //   }
  // }, []);

  // Modal açıldığında input'a odaklan
  useEffect(() => {
    if (isScanModalOpen) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }, 100);
    }
  }, [isScanModalOpen]);


  const handleBack = () => {
    navigate(`/jobs/edit/${jobId}`);
  };

  const handleScanSubmit = async (values: { barcode: string }) => {
    if (!jobId) return;
    
    // Son taranan barkodu state'e kaydet
    setLastScannedBarcode(values.barcode);
    
    try {
      setIsSubmitting(true);
      
      // Karekod validasyonu yap
      const validationResult = pharmaValidator(values.barcode);
      console.log(validationResult);
      
      if (!validationResult.status) {
        setErrorMessage(validationResult.message || 'Karekod validasyon hatası');
        // Hata durumunda input'u temizle
        form.setFieldValue('barcode', '');
        setTimeout(() => {
          barcodeInputRef.current?.focus();
          barcodeInputRef.current?.select();
        }, 100);
        return;
      }
      
      // Validasyon başarılı - bilgileri al
      const serialNumber = validationResult.serial;
      const gtinFromBarcode = validationResult.gtin;
      const lotFromBarcode = validationResult.lot;
      const expiryFromBarcode = validationResult.exp;
      
      console.log('Validasyon başarılı - Serial:', serialNumber);
      console.log('Karekod Bilgileri:', { gtinFromBarcode, lotFromBarcode, expiryFromBarcode });
      
      if (!serialNumber) {
        setErrorMessage('Serial numarası bulunamadı');
        // Hata durumunda input'u temizle
        form.setFieldValue('barcode', '');
        setTimeout(() => {
          barcodeInputRef.current?.focus();
          barcodeInputRef.current?.select();
        }, 100);
        return;
      }

      // Job bilgileriyle karşılaştırma
      const jobGtin = job?.gtin;
      const jobLot = job?.lot;
      const jobExpiry = job?.expiry_date;
      
      const mismatches: string[] = [];
      
      // GTIN karşılaştırması
      if (jobGtin && gtinFromBarcode !== jobGtin) {
        mismatches.push(`GTIN: Karekod (${gtinFromBarcode}) ≠ Job (${jobGtin})`);
      }
      
      // Lot karşılaştırması
      if (jobLot && lotFromBarcode !== jobLot) {
        mismatches.push(`Lot: Karekod (${lotFromBarcode}) ≠ Job (${jobLot})`);
      }
      
      // Son kullanma tarihi karşılaştırması (YYYYMMDD formatında)
      if (jobExpiry && expiryFromBarcode !== jobExpiry.replace(/-/g, '')) {
        mismatches.push(`Son Kullanma: Karekod (${expiryFromBarcode}) ≠ Job (${jobExpiry})`);
      }
      
      // Eşleşmeyen bilgiler varsa hata göster
      if (mismatches.length > 0) {
        setErrorMessage(`Karekod bilgileri job bilgileriyle eşleşmiyor:\n${mismatches.join('\n')}`);
        // Hata durumunda input'u temizle
        form.setFieldValue('barcode', '');
        setTimeout(() => {
          barcodeInputRef.current?.focus();
          barcodeInputRef.current?.select();
        }, 100);
        return;
      }
        
      // Serial değerini kullanarak API'ye gönder
      const scan = useJobStore.getState().scanJob;
      const response = await scan({
        job_id: jobId,
        barcode: serialNumber, // Serial değerini gönder
      });

        console.log("RESPONSEEEEE",response);
        // API'den gelen scanned_items zaten toplam değer
        if (response?.scanned_items !== undefined) {
          setScannedItems(response.scanned_items);
        }

        // Son tarananları güncelleme, aşağıda hiyerarşi yenilendikten sonra tek sefer yapılacak

        // Print functionality - if print is true, print all barcodes in data array
        if (response?.print === true && response?.data && Array.isArray(response.data)) {
          for (const item of response.data) {
            if (item.barcode) {
              await handlePrintLabel(
                item.barcode,
                job?.material_name,
                job?.gtin,
                job?.lot,
                job?.expiry_date,
                item.code
              );
              // Small delay between prints to avoid overwhelming the printer
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          // Yazdırma işlemi tamamlandığında listeler güncel
        }

        // Barkod tarama işleminden sonra tüm açık paketleri kapat ve önbelleği temizle
        setExpandedRows({}); // Tüm açık paketleri kapat
        setChildrenByParent({}); // Alt paket verilerini temizle
        setScansByParent({}); // Scan verilerini temizle
        setLoadingChildren({}); // Loading durumlarını temizle

        // En son tarama hiyerarşisini tazele
        await fetchJobPackageHierarchyByLatestScan(jobId);
        // Son tarananları tazele
        await useJobStore.getState().fetchLastScannedByJob(jobId);

        // Clear input after successful scan
        form.setFieldValue('barcode', '');
        // Clear any previous errors on successful scan
        setErrorMessage(null);
        // Focus back to input for next scan
        setTimeout(() => {
          barcodeInputRef.current?.focus();
          barcodeInputRef.current?.select();
        }, 100);
    } catch (error: any) {
      
      // API'den gelen hata mesajını göster
      const errorMessage = error?.response?.data?.error || 'Tarama işlemi sırasında bir hata oluştu';
      setErrorMessage(errorMessage);
      
      // Hata durumunda input'u temizle ki kullanıcı yeniden tarama yapabilsin
      form.setFieldValue('barcode', '');
      
      // Input'a focus yap ki kullanıcı hemen yeni barkod tarayabilsin
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }, 100);
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

  const toggleExpand = async (parentId: string, siblingIds?: string[]) => {
    if (!jobId) return;
    const willExpand = !expandedRows[parentId];
    setExpandedRows((prev) => {
      const isExpanding = !prev[parentId];
      const next: Record<string, boolean> = { ...prev, [parentId]: !prev[parentId] };
      // When expanding, collapse other siblings at the same level
      if (isExpanding && siblingIds && siblingIds.length > 0) {
        for (const id of siblingIds) {
          if (id !== parentId) {
            next[id] = false;
          }
        }
      }
      return next;
    });
    // Always re-fetch fresh data when expanding
    if (willExpand) {
      try {
        setLoadingChildren((prev) => ({ ...prev, [parentId]: true }));
        const { fetchJobPackages } = useJobStore.getState();
        const children = await fetchJobPackages(jobId, parentId);
        setChildrenByParent((prev) => ({ ...prev, [parentId]: children }));
        // If there are no child packages, load scans for this package; otherwise clear scans list
        if (!children || children.length === 0) {
          const { fetchJobScans } = useJobStore.getState();
          const scans = await fetchJobScans(parentId);
          setScansByParent((prev) => ({ ...prev, [parentId]: scans }));
        } else {
          setScansByParent((prev) => ({ ...prev, [parentId]: [] }));
        }
      } catch (e) {
        // error notification is handled in store
      } finally {
        setLoadingChildren((prev) => ({ ...prev, [parentId]: false }));
      }
    }
  };

  const handleClickClosePackage = (jobPackageId: string) => {
    console.log('jobPackageId', jobPackageId);
    modals.openConfirmModal({
      title: 'Yarım kapatma onayı',
      centered: true,
      children: (
        <Text size="sm">
          Bu paketi yarım kapatmak üzeresiniz. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?
        </Text>
      ),
      labels: { confirm: 'Evet, kapat', cancel: 'Vazgeç' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await useJobStore.getState().forceClosePackage(jobPackageId);
          if (jobId) {
            await fetchJobPackageHierarchyByLatestScan(jobId);
            await useJobStore.getState().fetchLastScannedByJob(jobId);
          }
        } catch (e) {
          // error notification is handled in store
        }
      },
    });
  };

  const renderRows = (items: any[], depth: number = 0) => {
    const nextDepth = depth + 1;
    return items.map((pkg) => (
      <React.Fragment key={pkg.id}>
        <Table.Tr>
          <Table.Td>
            <ActionIcon
              variant="light"
              size="sm"
              onClick={() => toggleExpand(pkg.id, items.map((i: any) => i.id))}
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
          <Table.Td>
            {pkg.barcode ? (
            <ActionIcon
              variant="light"
              size="sm"
              onClick={() => handlePrintLabel(
                pkg.barcode,
                job?.material_name,
                job?.gtin,
                job?.lot,
                job?.expiry_date,
                pkg.code
              )}
              aria-label="Etiket Yazdır"
              color="blue"
              disabled={!canPrint}
            >
              <IconPrinter size={16} />
            </ActionIcon>
            ) : null}
          </Table.Td>
        </Table.Tr>
        {expandedRows[pkg.id] && (
          <Table.Tr>
            <Table.Td colSpan={4}>
              <Box style={{ backgroundColor: depthBgColors[Math.min(nextDepth, depthBgColors.length - 1)], borderRadius: 8, padding: 8 }}>
                <Table striped withTableBorder withRowBorders withColumnBorders style={{ backgroundColor: depthBgColors[Math.min(nextDepth, depthBgColors.length - 1)] }}>
                <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 44 }}></Table.Th>
                      <Table.Th>Label</Table.Th>
                      <Table.Th>Barcode</Table.Th>
                    <Table.Th style={{ width: 50, textAlign: 'center' }}>
                      <Button 
                        variant="subtle" 
                        size="md"
                        onClick={async () => {
                          if (!jobId) return;
                          const { fetchJobPackages } = useJobStore.getState();
                          await fetchJobPackages(jobId);
                        }} 
                        style={{ padding: '4px', minWidth: 'auto', width: '32px', height: '32px' }}
                        title="Yenile"
                      >
                        <IconRefresh size={18} />
                      </Button>
                    </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {childrenByParent[pkg.id] && childrenByParent[pkg.id].length > 0 ? (
                      renderRows(childrenByParent[pkg.id], nextDepth)
                    ) : scansByParent[pkg.id] && scansByParent[pkg.id].length > 0 ? (
                      scansByParent[pkg.id].map((scan: any) => (
                        <Table.Tr key={scan.id}>
                          <Table.Td></Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">Taranan Barkod</Text>
                          </Table.Td>
                          <Table.Td>
                            <code style={{ color: 'black' }}>{scan.barcode}</code>
                          </Table.Td>
                          <Table.Td>
                          
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={4}>
                          <Text size="sm" c="dimmed">Alt kayıt bulunamadı</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Box>
            </Table.Td>
          </Table.Tr>
        )}
      </React.Fragment>
    ));
  };

 

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="green">
            <IconQrcode color="#fff" stroke={1.5} />
          </ThemeIcon>
          {job?.material_name ? `${normalizeText(job.material_name)}` : ''}
        </Title>
       
      </Group>
      
      <LoadingOverlay visible={isLoading} />
      
      {/* Job Information */}
      <Paper withBorder p="lg" mb="lg" style={{ position: 'relative' }}>
        <Group justify="space-between" mb="10px">
          <Text size="lg" fw={600}>İş Bilgileri</Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => setIsJobInfoExpanded(!isJobInfoExpanded)}
            style={{ cursor: 'pointer' }}
          >
            {isJobInfoExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>

       
        
        {isJobInfoExpanded && (
          <>
            <Grid>
              <Grid.Col span={3}>
                <Text size="sm" fw={500} c="dimmed">GTIN</Text>
                <Text size="sm" fw={500} c="black">{job?.gtin ? job.gtin : '-'}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" fw={500} c="dimmed">SKU</Text>
                <Text size="sm" fw={500} c="black">{job?.sku ? job.sku : '-'}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" fw={500} c="dimmed">Lot No</Text>
                <Text size="sm" fw={500} c="black">{job?.lot ? job.lot : '-'}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" fw={500} c="dimmed">Son Kullanma Tarihi</Text>
                <Text size="sm" fw={500} c="black">{job?.expiry_date ? job.expiry_date : '-'}</Text>
              </Grid.Col>
            </Grid>

            {hierarchyList.length > 0 && (
              <Grid mt="10px">
                {hierarchyList.map((node: any) => (
                  <Grid.Col span={3}>
                    <Text key={node.id} size="sm" c="dimmed" mb="xs" component="div">
                      <Badge>{node?.code}</Badge> {node?.label} İçi Adet : <code style={{ color: 'black' }}>{node?.capacity_items ?? '-'}</code>
                    </Text>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </>
        )}
      </Paper>

      <Paper withBorder p="lg" mb="lg">
          <Title order={3} mb="md">Printer Ayarları</Title>
          <Grid>
            <Grid.Col span={6}>
              <ZebraPrinterSelector
                ref={palletPrinterSelectorRef}
                label="Palet Printeri Seçin"
                placeholder="Palet yazdırmak için bir printer seçin"
                storeType="pallet"
                showRefreshButton={true}
                autoLoadOnMount={true}
                disabled={false}
                onChange={(device, deviceId) => {
                  setSelectedPalletPrinter(device);
                }}
                onError={(error) => {
                  console.error('Palet printer hatası:', error);
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <ZebraPrinterSelector
                ref={labelPrinterSelectorRef}
                label="Etiket Printeri Seçin"
                placeholder="Etiket yazdırmak için bir printer seçin"
                storeType="label"
                showRefreshButton={true}
                autoLoadOnMount={true}
                disabled={false}
                onChange={(device, deviceId) => {
                  setSelectedLabelPrinter(device);
                }}
                onError={(error) => {
                  console.error('Label printer hatası:', error);
                }}
              />
            </Grid.Col>
          </Grid>
        </Paper>

      {isCompleted && (
        <Paper withBorder p="lg" mb="lg" bg="green.0">
          <Group align="center" gap="sm">
            <ThemeIcon color="green" variant="filled" radius="sm">
              <IconCheck size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} c="green">İş başarıyla tamamlandı</Text>
              <Text size="sm" c="green.9">Toplam {scannedItems} / {job?.planned_items ?? 0}</Text>
            </div>
          </Group>
        </Paper>
      )}

      {/* error message area */}


      {(!canPrint) && (
        <Paper p="sm" bg="red.0" withBorder mb="lg">
          {!canPrint && (
            <>
              <Text size="sm" c="red" fw={500}>
                ⚠️ Etiket yazdırmak için gerekli bilgiler eksik veya printer seçilmemiş:
              </Text>
              <Stack gap="xs" mt="xs">
                {!job?.material_name && <Text size="xs" c="red">• Material Name eksik</Text>}
                {!job?.gtin && <Text size="xs" c="red">• GTIN eksik</Text>}
                {!job?.lot && <Text size="xs" c="red">• Lot eksik</Text>}
                {!job?.expiry_date && <Text size="xs" c="red">• Son Kullanma Tarihi eksik</Text>}
                {!selectedLabelPrinter && <Text size="xs" c="red">• Label Printer seçilmemiş</Text>}
                {!selectedPalletPrinter && <Text size="xs" c="red">• Palet Printer seçilmemiş</Text>}
              </Stack>
            </>
          )}

         
        </Paper>
      )}

      {/* Printer Diagnostics */}
      {showDiagnostics && printerDiagnosis && (
        <Paper withBorder p="lg" mb="lg" bg="orange.0">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600} c="orange">🔧 Printer Tanı Sonuçları</Text>
              <ActionIcon variant="subtle" onClick={() => setShowDiagnostics(false)}>
                <IconX size={16} />
              </ActionIcon>
            </Group>
            
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>BrowserPrint Durumu:</Text>
                <Text size="sm" c={printerDiagnosis.browserPrintAvailable ? "green" : "red"}>
                  {printerDiagnosis.browserPrintAvailable ? "✅ Mevcut" : "❌ Bulunamadı"}
                </Text>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Servis Durumu:</Text>
                <Text size="sm" c={printerDiagnosis.serviceReachable ? "green" : "red"}>
                  {printerDiagnosis.serviceReachable ? "✅ Erişilebilir" : "❌ Ulaşılamıyor"}
                </Text>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Printer Ayarı:</Text>
                <Text size="sm" c={printerDiagnosis.printerConfigured ? "green" : "red"}>
                  {printerDiagnosis.printerConfigured ? "✅ Ayarlandı" : "❌ Ayarlanmadı"}
                  {printerDiagnosis.configuredPrinterId && ` (${printerDiagnosis.configuredPrinterId})`}
                </Text>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Text size="sm" fw={500}>Cihaz Durumu:</Text>
                <Text size="sm" c={printerDiagnosis.deviceFound ? "green" : "red"}>
                  {printerDiagnosis.deviceFound ? "✅ Bulundu" : "❌ Bulunamadı"}
                </Text>
              </Grid.Col>
            </Grid>

            {printerDiagnosis.availableDevices?.length > 0 && (
              <div>
                <Text size="sm" fw={500} mb="xs">Mevcut Cihazlar ({printerDiagnosis.availableDevices.length}):</Text>
                <Stack gap="xs">
                  {printerDiagnosis.availableDevices.map((device: any, index: number) => (
                    <Group key={index} gap="sm" bg="white" p="xs" style={{ borderRadius: 4 }}>
                      <Text size="xs" fw={500}>{device.name || 'İsimsiz'}</Text>
                      <Text size="xs" c="dimmed">ID: {device.uid}</Text>
                      {device.uid === printerDiagnosis.configuredPrinterId && (
                        <Text size="xs" c="green" fw={500}>✅ Seçili</Text>
                      )}
                    </Group>
                  ))}
                </Stack>
              </div>
            )}

            {printerDiagnosis.issues?.length > 0 && (
              <div>
                <Text size="sm" fw={500} c="red" mb="xs">❌ Sorunlar:</Text>
                <Stack gap="xs">
                  {printerDiagnosis.issues.map((issue: string, index: number) => (
                    <Text key={index} size="xs" c="red">• {issue}</Text>
                  ))}
                </Stack>
              </div>
            )}

            {printerDiagnosis.recommendations?.length > 0 && (
              <div>
                <Text size="sm" fw={500} c="blue" mb="xs">💡 Öneriler:</Text>
                <Stack gap="xs">
                  {printerDiagnosis.recommendations.map((rec: string, index: number) => (
                    <Text key={index} size="xs" c="blue">• {rec}</Text>
                  ))}
                </Stack>
              </div>
            )}
          </Stack>
        </Paper>
      )}

      <Paper withBorder p="lg" mb="lg">
        <Button 
          onClick={async () => {
            // Modal'ı hemen aç, printer kontrolü yapmayacağız çünkü artık manuel seçim yapıyoruz
            setIsScanModalOpen(true);
            setErrorMessage(null);
          }}
        > KAREKOD OKUTMAYA BAŞLA</Button>
      </Paper>

      {/* Progress and Scanning - Modal */}
      {!isCompleted && (
        <Modal opened={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="Taramaya Başla" size="xl" centered overlayProps={{ opacity: 2, blur: 5, color: '#000' }} p="xl">
          <Stack gap="md">

          {isCheckingPrinter && (
            <Group gap="sm" align="center" bg="yellow.0" p="lg">
              <Loader size="sm" />
              <Text size="sm">Printer kontrol ediliyor...</Text>
            </Group>
          )}

          {errorMessage && !isCheckingPrinter && (
            <Group gap="sm" align="flex-start" bg="red.0" p="lg">
              <ThemeIcon color="red" size="sm" radius="sm">
                <IconArrowLeft size={16} style={{ transform: 'rotate(45deg)' }} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500} c="red" mb="xs">
                  KAREKOD : {lastScannedBarcode}
                </Text>
                
                <Text size="sm" c="red" style={{ whiteSpace: 'pre-line' }}>
                  {errorMessage}
                </Text>
              </div>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => setErrorMessage(null)}
                aria-label="Hatayı kapat"
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          )}

            
            <Group justify="space-between">
              <Text size="lg" fw={600}>İlerleme Durumu</Text>
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
              <Group justify="space-between" mb="xl">
                <TextInput
                  {...form.getInputProps('barcode')}
                  ref={barcodeInputRef}
                  size="lg"
                  flex={1}
                  placeholder="Barkod okutun..."
                  
                />
                <Button 
                  type="submit" 
                  size="lg" 
                  loading={isSubmitting}
                  leftSection={<IconDeviceFloppy size={16} />}
                  disabled={!canPrint}
                >
                  Kaydet
                </Button>
              </Group>
            </form>
          </Stack>
        </Modal>
      )}


      <Paper withBorder p="lg" mt="lg">
        <Stack gap="md" mb="lg">
          <Text size="lg" fw={600}>En Son Taramaya Göre Paketler</Text>
          <Table striped withTableBorder withRowBorders withColumnBorders stickyHeader stickyHeaderOffset={60} style={{ backgroundColor: depthBgColors[0] }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 100 }}>Label</Table.Th>
                <Table.Th style={{ width: 120 }}>Taranan Adet</Table.Th>
                <Table.Th>Barcode</Table.Th>
                <Table.Th style={{ width: 50, textAlign: 'center' }}>
                  <Button 
                    variant="subtle" 
                    size="md"
                    onClick={async () => {
                      if (!jobId) return;
                      await  (jobId);
                    }} 
                    style={{ padding: '4px', minWidth: 'auto', width: '32px', height: '32px' }}
                    title="Yenile"
                  >
                    <IconRefresh size={18} />
                  </Button>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobPackageHierarchyByLatestScan && jobPackageHierarchyByLatestScan.length > 0 ? (
                jobPackageHierarchyByLatestScan.map((item: any) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{item.label ?? '-'}</Table.Td>
                    <Table.Td>
                      <code style={{ color: 'black' }}>{item.filled_items ?? '-'}</code>
                    </Table.Td>
                    <Table.Td>
                      <code style={{ color: 'black' }}>{item.barcode ?? '-'}</code>
                    </Table.Td>
                    <Table.Td>
                      <Menu withinPortal position="bottom-end" shadow="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="İşlemler" color="gray">
                            <IconDotsVertical size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {item?.barcode ? (
                            <Menu.Item leftSection={<IconPrinter size={16} />} onClick={() => 
                              handlePrintLabel(item.barcode,
                                job?.material_name,
                                job?.gtin,
                                job?.lot,
                                job?.expiry_date,
                                undefined
                              )}>
                              Etiket Yazdır
                            </Menu.Item>
                          ) : null}
                          {item?.status === 'InProgress' ? (
                            <Menu.Item
                              leftSection={<IconLockX size={16} />}
                              c="red"
                              onClick={() => handleClickClosePackage(item.id)}
                            >
                              Yarım Kapat ({item.label})
                            </Menu.Item>
                          ) : null}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text size="sm" c="dimmed" ta="center">Kayıt bulunamadı</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>

        <Stack gap="md">
          <Text size="lg" fw={600}>Son Taranan Barkodlar ({lastScanned?.length ?? 0})</Text>
          <Table striped withTableBorder withRowBorders withColumnBorders stickyHeader stickyHeaderOffset={60} style={{ backgroundColor: depthBgColors[0] }}>
            <Table.Thead>
              <Table.Tr>
                
                <Table.Th style={{ width: 150 }}>Barkod</Table.Th>
                <Table.Th>Tarih/Saat</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lastScanned && lastScanned.length > 0 ? (
                lastScanned.map((scan, index) => (
                  <Table.Tr key={`${scan.barcode}-${scan.created_at}`}>
                    <Table.Td>
                      <code style={{ color: 'black', fontSize: '14px' }}>{scan.barcode}</code>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{new Date(scan.created_at).toLocaleString('tr-TR')}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text size="sm" c="dimmed" ta="center">Henüz taranan barkod bulunmuyor</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>
        
      </Paper>

      {isUserAdmin && (
        <Paper withBorder p="lg" mt="lg">
          <Stack gap="md">
            <Text size="lg" fw={600}>Paketler</Text>
            <Table striped withTableBorder  withRowBorders withColumnBorders stickyHeader stickyHeaderOffset={60} style={{ backgroundColor: depthBgColors[0] }}>
            <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 44 }}></Table.Th>
                  <Table.Th>Label</Table.Th>
                  <Table.Th>Barcode</Table.Th>
                <Table.Th style={{ width: 50, textAlign: 'center' }}>
                  <Button 
                    variant="subtle" 
                    size="md"
                    onClick={async () => {
                      if (!jobId) return;
                      const { fetchJobPackages } = useJobStore.getState();
                      await fetchJobPackages(jobId);
                    }} 
                    style={{ padding: '4px', minWidth: 'auto', width: '32px', height: '32px' }}
                    title="Yenile"
                  >
                    <IconRefresh size={18} />
                  </Button>
                </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {jobPackages && jobPackages.length > 0 ? (
                  renderRows(jobPackages, 0)
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text size="sm" c="dimmed">Kayıt bulunamadı</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Stack>
          
        </Paper>
       
      )}
    </>
  );
}
