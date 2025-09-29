import { TextInput, Button, Grid, Text, LoadingOverlay, Group, Paper, Title, ThemeIcon, Modal } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQrcodesStore } from '../store/qrcodesStore';
import { useState, useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPill, IconArrowLeft, IconX, IconDeviceFloppy, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Qrcodes } from '../types/qrcodes';

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
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  
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



  const handleSubmit = async (values: Partial<Qrcodes>) => {
    setIsSubmitting(true);
    
    try {
      // Convert quantity to number (form inputs are always strings)
      const quantityValue = parseInt(String(values.quantity || '1'));

      // Generate start and end serial numbers based on current serial number from server
      const nextSerialStart = (currentSerialNumber || 0) + 1;
      const startSerialNumber = nextSerialStart.toString().padStart(8, '0');
      const endSerialNumber = (nextSerialStart + quantityValue - 1).toString().padStart(8, '0');
      const newCurrentSerialNumber = nextSerialStart + quantityValue - 1;

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

      // İş emrini oluştur
      await addItem(payload);
      
      // İşlem tamamlandı durumunu ayarla ve modal göster
      setIsCompleted(true);
      setCompletionModal({
        opened: true,
        message: `İş emri başarıyla oluşturuldu. ${quantityValue} adet etiket için hazır.`
      });
      
    } catch (error: any) {
      console.error(finalEditMode ? 'Form update failed:' : 'Form submission failed:', error);
      
      notifications.show({
        title: 'İşlem Başarısız',
        message: error?.message || 'Beklenmeyen bir hata oluştu',
        color: 'red'
      });
      
    } finally {
      setIsSubmitting(false);
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
    navigate('/qrcodes/?status=pending');
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
            type="submit" 
            size="xs" 
            loading={isSubmitting}
            disabled={isCompleted}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            İş Emri Oluştur
          </Button>
        </Group>
      </form>
    </>
  );
}
