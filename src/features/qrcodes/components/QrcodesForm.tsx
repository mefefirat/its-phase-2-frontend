import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Paper, Title, ThemeIcon, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQrcodesStore } from '../store/qrcodesStore';
import { useState, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPill, IconArrowLeft, IconX, IconDeviceFloppy, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Qrcodes } from '../types/qrcodes';
import { printWithLabelPrinter, ensurePrinterReady, batchPrintWithLabelPrinter, batchPrintWithSpecificDevice, printWithPreparedDevice } from '@/utils/printerUtils';
import ZebraPrinterSelector, { ZebraPrinterSelectorRef } from '@/shared/printer/ZebraPrinterSelector';

interface QrcodesFormProps {
  initialData?: Partial<Qrcodes>;
  editMode?: boolean;
  itemId?: string;
}

export default function QrcodesForm({ initialData, editMode = false, itemId }: QrcodesFormProps) {
  const { addItem, editItem, fetchItemById, currentOrderNumber, currentSerialNumber, fetchCurrentOrder, fetchCurrentSerial } = useQrcodesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ opened: false, message: '' });
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionModal, setCompletionModal] = useState({ opened: false, message: '' });
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const printerSelectorRef = useRef<ZebraPrinterSelectorRef>(null);
  
  // URL'den editMode ve itemId'yi belirle
  const isEditModeFromUrl = location.pathname.includes('/edit/');
  const itemIdFromUrl = isEditModeFromUrl ? params.id : undefined;
  
  // Props'tan gelen değerler varsa onları kullan, yoksa URL'den al
  const finalEditMode = editMode || isEditModeFromUrl;
  const finalItemId = itemId || itemIdFromUrl;

  const form = useForm<Partial<Qrcodes>>({
    initialValues: initialData || {
      gtin: '',
      lot: '',
      expiry_date: '',
      quantity: 1,
      order_number: 0,
    },
    validate: {
      gtin: (value) => (!value || value.trim().length < 1 ? 'Lütfen GTIN giriniz' : null),
      lot: (value) => (!value || value.trim().length < 1 ? 'Lütfen LOT giriniz' : null),
      expiry_date: (value) => (!value || value.trim().length < 1 ? 'Lütfen Son Kullanma Tarihi giriniz' : null),
      order_number: (value) => {
        if (!value) return 'Lütfen Sipariş Numarası giriniz';
        const numValue = Number(value);
        if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
          return 'Sipariş numarası pozitif bir tam sayı olmalıdır';
        }
        return null;
      },
      quantity: (value) => {
        if (!value || value <= 0) return 'Lütfen geçerli bir miktar giriniz';
        if (isNaN(Number(value))) return 'Miktar sayı olmalıdır';
        return null;
      },
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      setIsLoading(true);
      try {
        // Sadece yeni kayıt oluştururken current order number ve current serial number'ı fetch et
        if (!finalEditMode) {
          await fetchCurrentOrder();
          await fetchCurrentSerial();
        }
        
        if (finalEditMode && finalItemId) {
          await fetchItemData();
        }
      } catch (error: any) {
        console.error('Critical error during form initialization:', error);
        
        // Critical hata - modal ile göster
        setErrorModal({
          opened: true,
          message: 'Form bilgileri alınamadığı için form kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
        });
        return;
      } finally {
        setIsLoading(false);
      }
    };

    initializeForm();
  }, [finalEditMode, finalItemId]);

  // Current order number güncellendiğinde form'u güncelle
  useEffect(() => {
    if (!finalEditMode && currentOrderNumber !== null) {
      // Eğer backend'den gelen currentOrderNumber 0 veya boş ise 4000001'den başlat
      const nextOrderNumber = (currentOrderNumber === 0 || !currentOrderNumber) 
        ? 4000001 
        : currentOrderNumber + 1;
      
      form.setFieldValue('order_number', nextOrderNumber);
    }
  }, [currentOrderNumber, finalEditMode]);

  const fetchItemData = async () => {
    if (!finalItemId) return;
    
    setIsLoading(true);
    try {
      const itemData = await fetchItemById(finalItemId);
      form.setValues({
        gtin: itemData.gtin,
        lot: itemData.lot,
        expiry_date: itemData.expiry_date,
        quantity: itemData.quantity,
        order_number: itemData.order_number,
      });
    } catch (error: any) {
      // Store zaten error notification gösterdi
      console.error('Failed to load qrcodes item data:', error);
      
      // Kritik hata - formu kullanamaz durumda
      // Kullanıcıyı geri yönlendir
      navigate('/qrcodes/list');
    } finally {
      setIsLoading(false);
    }
  };

  // ZPL template function with dynamic data replacement
  const generateZPLContent = (gtin: string, lot: string, expiry_date: string, serial_number: string): string => {
    // Format expiry date from YYYY-MM-DD to YYMMDD format for ZPL
    const formattedExpiry = expiry_date.replace(/-/g, '').substring(2); // Remove dashes and take last 6 digits (YYMMDD)
    
    let start_number = 1;


    return `^XA

^FO15,30
^BXN,4,200
^FD(01)${gtin}(21)${serial_number}(10)${lot}(17)${formattedExpiry}^FS

^FO120,30^A0N,18,18^FD(01) ${gtin}^FS
^FO120,55^A0N,18,18^FD(21) ${serial_number}^FS
^FO120,80^A0N,18,18^FD(10) ${lot}^FS
^FO120,105^A0N,18,18^FD(17) ${formattedExpiry}^FS

^XZ
`;
  };

  // Print Test fonksiyonu - tek test yazdırma işlemi
  const handlePrintTest = async () => {
    // Form validasyonu
    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: 'Form Hatası',
        message: 'Lütfen önce tüm zorunlu alanları doldurun',
        color: 'red'
      });
      return;
    }

    const values = form.values;

    // Printer kontrolü
    if (!selectedPrinter) {
      notifications.show({
        title: 'Printer Hatası',
        message: 'Lütfen yazdırma için bir printer seçin',
        color: 'red'
      });
      return;
    }

    // BrowserPrint kontrolü
    if (typeof window === 'undefined' || typeof (window as any).BrowserPrint === 'undefined') {
      notifications.show({
        title: 'Printer Hatası',
        message: 'Zebra BrowserPrint bulunamadı. Lütfen Zebra BrowserPrint uygulamasının yüklü ve çalışır durumda olduğundan emin olun.',
        color: 'red'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Test için tek bir serial number oluştur (test-001 formatında)
      const testSerialNumber = '00000001TEST0001';
      
      // ZPL içeriği oluştur
      const zplContent = generateZPLContent(
        values.gtin?.trim() || '', 
        values.lot?.trim() || '', 
        values.expiry_date?.trim() || '', 
        testSerialNumber
      );

      notifications.show({
        id: 'print-test',
        title: 'Test Yazdırma',
        message: 'Test etiketi yazdırılıyor...',
        color: 'blue',
        loading: true,
        autoClose: false
      });

      // Test yazdırma işlemi
      const result = await printWithPreparedDevice(selectedPrinter, zplContent, 10000);

      notifications.hide('print-test');

      if (result.success) {
        notifications.show({
          title: 'Test Başarılı',
          message: 'Test etiketi başarıyla yazdırıldı',
          color: 'green'
        });
      } else {
        notifications.show({
          title: 'Test Başarısız',
          message: result.error || result.message || 'Test yazdırma işlemi başarısız',
          color: 'red'
        });
      }

    } catch (error: any) {
      console.error('Print test failed:', error);
      
      notifications.hide('print-test');
      notifications.show({
        title: 'Test Başarısız',
        message: error?.message || 'Beklenmeyen bir hata oluştu',
        color: 'red'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI LAYER - SADECE UI STATE VE LOADING HANDLE ET
  const handleSubmit = async (values: Partial<Qrcodes>) => {
    // Backend geliştirme için print kontrolü - true: print yapar, false: print yapmaz ama sanki yapmış gibi devam eder
    const enablePrinting = true;
    
    setIsSubmitting(true);
    
    try {
      // Convert quantity to number (form inputs are always strings)
      const quantityValue = parseInt(String(values.quantity || '1'));

      // Generate start and end serial numbers based on current serial number from server
      // Sunucudan gelen son seri numarasından sonrakini başlat
      const nextSerialStart = (currentSerialNumber || 0) + 1; // Sunucudan gelen son seri + 1
      const startSerialNumber = nextSerialStart.toString().padStart(8, '0'); // e.g., 00000001
      const endSerialNumber = (nextSerialStart + quantityValue - 1).toString().padStart(8, '0'); // e.g., 00000010
      const newCurrentSerialNumber = nextSerialStart + quantityValue - 1; // En son üretilen seri numarası (integer olarak)

      const payload: Partial<Qrcodes> = {
        gtin: (values.gtin || '').trim(),
        lot: (values.lot || '').trim(),
        expiry_date: (values.expiry_date || '').trim(),
        order_number: Number(values.order_number || 0),
        quantity: quantityValue,
        start_serial_number: startSerialNumber,
        end_serial_number: endSerialNumber,
        current_serial_number: newCurrentSerialNumber,
      };

  
      // Validate required fields
      if (!payload.gtin || !payload.lot || !payload.expiry_date || !payload.order_number || !payload.quantity) {
        notifications.show({
          title: 'Eksik Bilgi',
          message: 'Lütfen tüm alanları doldurun',
          color: 'red'
        });
        return;
      }

      // Validate order_number is a valid integer
      if (isNaN(payload.order_number) || payload.order_number <= 0) {
        notifications.show({
          title: 'Geçersiz Sipariş Numarası',
          message: 'Sipariş numarası pozitif bir sayı olmalıdır',
          color: 'red'
        });
        return;
      }

      const quantity = payload.quantity;
      if (isNaN(quantity) || quantity <= 0) {
        notifications.show({
          title: 'Geçersiz Miktar',
          message: 'Miktar pozitif bir sayı olmalıdır',
          color: 'red'
        });
        return;
      }

      // Check printer configuration (only if printing is enabled)
      if (enablePrinting) {
        // Kullanıcı tarafından seçilen printer'ı kontrol et
        if (!selectedPrinter) {
          notifications.show({
            title: 'Printer Hatası',
            message: 'Lütfen yazdırma için bir printer seçin',
            color: 'red'
          });
          return;
        }
        
        // BrowserPrint servisinin mevcut olup olmadığını kontrol et
        if (typeof window === 'undefined' || typeof (window as any).BrowserPrint === 'undefined') {
          notifications.show({
            title: 'Printer Hatası',
            message: 'Zebra BrowserPrint bulunamadı. Lütfen Zebra BrowserPrint uygulamasının yüklü ve çalışır durumda olduğundan emin olun.',
            color: 'red'
          });
          return;
        }
        
        // Seçili printer'ın geçerli olup olmadığını kontrol et
        if (!selectedPrinter.uid || !selectedPrinter.send) {
          notifications.show({
            title: 'Printer Hatası',
            message: 'Seçilen printer geçersiz. Lütfen başka bir printer seçin veya printer listesini yenileyin.',
            color: 'red'
          });
          return;
        }
      }

      // Print labels based on quantity
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      notifications.show({
        id: 'printing-progress',
        title: 'Yazdırma İşlemi',
        message: `${quantity} adet etiket ${enablePrinting ? 'yazdırılıyor' : 'simüle ediliyor'}...`,
        color: 'blue',
        loading: true,
        autoClose: false
      });

      if (enablePrinting) {
        // Gerçek yazdırma - optimized batch printing
        const zplContents: string[] = [];
        
        // Generate all ZPL contents first
        for (let i = 1; i <= quantity; i++) {
          const serial_number = (nextSerialStart + i - 1).toString().padStart(16, '0');
          const zplContent = generateZPLContent(payload.gtin, payload.lot, payload.expiry_date, serial_number);
          zplContents.push(zplContent);
        }
        
        // Batch print with selected printer
        const batchResult = await batchPrintWithSpecificDevice(
          selectedPrinter,
          zplContents,
          (current, total, success, message) => {
            // Update progress in real-time
            if (success) {
              successCount++;
            } else {
              failCount++;
            }
            
            notifications.update({
              id: 'printing-progress',
              title: 'Yazdırma İşlemi',
              message: `${current}/${total} etiket yazdırıldı (Başarılı: ${successCount}, Hatalı: ${failCount})`,
              color: failCount > 0 ? 'orange' : 'blue',
              loading: current < total,
              autoClose: false
            });
          }
        );
        
        successCount = batchResult.successCount;
        failCount = batchResult.failCount;
        errors.push(...batchResult.errors);
        
      } else {
        // Yazdırma simülasyonu - simulate progress updates
        for (let i = 1; i <= quantity; i++) {
          successCount++;
          
          notifications.update({
            id: 'printing-progress',
            title: 'Yazdırma İşlemi',
            message: `${i}/${quantity} etiket simüle edildi`,
            color: 'blue',
            loading: i < quantity,
            autoClose: false
          });
          
          // Add small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Show final result
      notifications.hide('printing-progress');

      if (successCount === quantity) {
        await addItem(payload);
        
        // Set completion state and show completion modal
        setIsCompleted(true);
        setCompletionModal({
          opened: true,
          message: `${quantity} adet karekod başarıyla üretildi ve yazdırıldı.`
        });
      } else if (successCount > 0) {
        notifications.show({
          title: 'Kısmi Başarı',
          message: `${successCount}/${quantity} etiket yazdırıldı. ${failCount} etiket başarısız.`,
          color: 'orange'
        });
        
        // Show detailed errors
        if (errors.length > 0) {
          console.error('Printing errors:', errors);
        }
      } else {
        notifications.show({
          title: 'Yazdırma Başarısız',
          message: `Hiçbir etiket yazdırılamadı. ${errors.length > 0 ? errors[0] : 'Bilinmeyen hata'}`,
          color: 'red'
        });
      }
      
    } catch (error: any) {
      console.error(finalEditMode ? 'Form update failed:' : 'Form submission failed:', error);
      
      notifications.show({
        title: 'İşlem Başarısız',
        message: error?.message || 'Beklenmeyen bir hata oluştu',
        color: 'red'
      });
      
    } finally {
      setIsSubmitting(false);
      notifications.hide('printing-progress');
    }
  };

  const handleBack = () => {
    navigate('/qrcodes/list');
  };

  const handleErrorModalClose = () => {
    setErrorModal({ opened: false, message: '' });
    navigate('/qrcodes/list');
  };

  const handleCompletionModalClose = () => {
    setCompletionModal({ opened: false, message: '' });
    navigate('/qrcodes/list');
  };

  return (
    <>
      {/* Error Modal */}
      <Modal
        opened={errorModal.opened}
        onClose={handleErrorModalClose}
        title={
          <Group>
            <ThemeIcon color="red" size="lg" radius="md">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg">Kritik Hata</Text>
          </Group>
        }
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Text mb="xl">{errorModal.message}</Text>
        <Group justify="flex-end">
          <Button 
            onClick={handleErrorModalClose}
            color="blue"
            leftSection={<IconArrowLeft size={16} />}
          >
            Tamam
          </Button>
        </Group>
      </Modal>

      {/* Completion Modal */}
      <Modal
        opened={completionModal.opened}
        onClose={handleCompletionModalClose}
        title={
          <Group>
            <ThemeIcon color="green" size="lg" radius="md">
              <IconCheck size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg">İşlem Tamamlandı</Text>
          </Group>
        }
        centered
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
      >
        <Text mb="xl">{completionModal.message}</Text>
        <Group justify="flex-end">
          <Button 
            onClick={handleCompletionModalClose}
            color="green"
            leftSection={<IconCheck size={16} />}
          >
            Tamam
          </Button>
        </Group>
      </Modal>

      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconPill color="#fff" stroke={1.5} />
          </ThemeIcon>
          {finalEditMode ? 'Düzenle' : 'Yeni Karekod Oluştur'}
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

      <Paper p="lg" withBorder mb="lg">
        <ZebraPrinterSelector
          ref={printerSelectorRef}
          label="Printer Seçin"
          placeholder="QR kod yazdırmak için bir printer seçin"
          storeType="label"
          showRefreshButton={true}
          autoLoadOnMount={true}
          disabled={false}
          onChange={(device, deviceId) => {
            setSelectedPrinter(device);
          }}
          onError={(error) => {
            notifications.show({
              title: 'Printer Hatası',
              message: error,
              color: 'red'
            });
          }}
        />
      </Paper>
      
      <LoadingOverlay visible={isLoading} />
      <form onSubmit={form.onSubmit(handleSubmit)} autoComplete='off'>
        <Paper p="lg" withBorder mb="lg">
       
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="İş Emri Numarası"
                type="number"
                placeholder="Ör: 123456"
                {...form.getInputProps('order_number')}
                withAsterisk
                required
                description="Sipariş numarası"
                readOnly
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Kaç Adet Üretilecek"
                type="number"
                placeholder="Ör: 100"
                {...form.getInputProps('quantity')}
                withAsterisk
                required
                description="Üretilecek karekod sayısı"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="GTIN"
                placeholder="Ör: 1234567890123"
                {...form.getInputProps('gtin')}
                withAsterisk
                required
                description="Ürün için benzersiz tanımlayıcı"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="LOT"
                placeholder="Ör: LOT123456"
                {...form.getInputProps('lot')}
                withAsterisk
                required
                description="Parti numarası"
              />
            </Grid.Col>
           
            <Grid.Col span={4}>
              <TextInput
                label="Son Kullanma Tarihi"
                type="date"
                placeholder="Ör: 2025-12-31"
                {...form.getInputProps('expiry_date')}
                withAsterisk
                required
                description="YYYY-MM-DD formatında"
              />
            </Grid.Col>
            
          </Grid>
        </Paper>

        <Group justify="flex-end" mt="lg">
        <Button 
            type="button"
            variant="outline"
            onClick={handlePrintTest}
            size="xs"  
            loading={isSubmitting}
            disabled={isCompleted}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Print Test
          </Button>
          <Button 
            type="submit" 
            size="xs" 
            loading={isSubmitting}
            disabled={isCompleted}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Karekod Üret
          </Button>
        </Group>
      </form>
    </>
  );
}
