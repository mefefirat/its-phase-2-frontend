// components/ZebraPrinterModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Select,
  Textarea,
  Text,
  Group,
  Stack,
  Alert,
  Loader,
  Center,
  Title,
  Divider,
  Badge
} from '@mantine/core';
import {
  IconPrinter,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconDevices
} from '@tabler/icons-react';
import type { BrowserPrintDevice, BrowserPrintAPI } from './types/browserprint';

declare global {
  interface Window {
    BrowserPrint: BrowserPrintAPI;
  }
}

interface ZebraPrinterModalProps {
  opened: boolean;
  onClose: () => void;
  zplContent?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  title?: string;
}

const ZebraPrinterModal: React.FC<ZebraPrinterModalProps> = ({ 
  opened,
  onClose,
  zplContent = '^XA^PW799^LL400^FO30,30^BXN,16,200^FD01L001C1^FS^FO300,30^A0N,80,120^FD01L00101^FS^XZ',
  onSuccess,
  onError,
  title = 'ZPL Etiket Yazdırma'
}) => {
  const [selectedDevice, setSelectedDevice] = useState<BrowserPrintDevice | null>(null);
  const [devices, setDevices] = useState<BrowserPrintDevice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customZpl, setCustomZpl] = useState<string>(zplContent);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Modal açıldığında ZPL içeriğini güncelle
  useEffect(() => {
    if (opened) {
      setCustomZpl(zplContent);
      setMessage('');
      
      // Eğer cihazlar henüz yüklenmemişse yükle
      if (devices.length === 0 && !error) {
        setupPrinter();
      }
    }
  }, [opened, zplContent]);

  const checkBrowserPrintAvailability = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (typeof window.BrowserPrint !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // 10 saniye sonra timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('BrowserPrint yüklenemedi. Lütfen Zebra BrowserPrint uygulamasının yüklü olduğundan emin olun.'));
      }, 10000);
    });
  };

  const setupPrinter = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await checkBrowserPrintAvailability();
      
      return new Promise<void>((resolve, reject) => {
        window.BrowserPrint.getDefaultDevice(
          "printer",
          (device: BrowserPrintDevice) => {
            const newDevices = [device];
            setSelectedDevice(device);
            
            window.BrowserPrint.getLocalDevices(
              (deviceList: BrowserPrintDevice[]) => {
                const allDevices = [...newDevices];
                
                deviceList.forEach((device) => {
                    // Sadece geçerli uid'li ve farklı cihazları ekle
                    if (device.uid && device.uid.trim() !== '' &&  (!selectedDevice || device.uid !== selectedDevice.uid)) {
                      allDevices.push(device);
                    }
                  });
                
                setDevices(allDevices);
               
                
                setIsLoading(false);
                setError(null);
                resolve();
              },
              (error: string) => {
                const errorMsg = `Yerel cihazlar alınamadı: ${error}`;
                setError(errorMsg);
                setIsLoading(false);
                reject(new Error(errorMsg));
              },
              "printer"
            );
          },
          (error: string) => {
            const errorMsg = `Varsayılan cihaz alınamadı: ${error}`;
            setError(errorMsg);
            setIsLoading(false);
            reject(new Error(errorMsg));
          }
        );
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info'): void => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const sendZPLLabel = (zplContent: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!selectedDevice) {
        reject(new Error('Seçili cihaz yok'));
        return;
      }

      selectedDevice.send(
        zplContent,
        () => resolve(),
        (error: string) => reject(new Error(error))
      );
    });
  };

  const handleSendZPLLabel = async (): Promise<void> => {
    if (!customZpl.trim()) {
      const errorMsg = 'Lütfen ZPL içeriği girin';
      showMessage(errorMsg, 'error');
      onError?.(errorMsg);
      return;
    }

    if (!selectedDevice) {
      const errorMsg = 'Lütfen bir printer seçin';
      showMessage(errorMsg, 'error');
      onError?.(errorMsg);
      return;
    }

    setIsProcessing(true);
    try {
      await sendZPLLabel(customZpl);
      const successMsg = 'ZPL etiketi başarıyla gönderildi!';
      showMessage(successMsg, 'success');
      onSuccess?.(successMsg);
      
      // Başarılı işlem sonrası modal'ı 2 saniye sonra kapat
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      const fullErrorMsg = `Hata: ${errorMessage}`;
      showMessage(fullErrorMsg, 'error');
      onError?.(fullErrorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeviceChange = (value: string | null): void => {
    if (value) {
      const device = devices.find(d => d.uid === value);
      if (device) {
        setSelectedDevice(device);
      }
    }
  };

  // Cihaz seçeneklerini oluştur
  const deviceOptions = devices
  .filter((device) => device.uid && device.uid.trim() !== '') // Boş uid'leri filtrele
  .map((device, index) => ({
    value: device.uid || `device-${index}`, // Fallback value
    label: `${device.name || 'Bilinmeyen Cihaz'} (${device.connection || 'Bilinmeyen'})`
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconPrinter size={24} />
          <Title order={3}>{title}</Title>
        </Group>
      }
      size="lg"
      centered
      closeButtonProps={{
        'aria-label': 'Kapat'
      }}
    >
      <Stack gap="md">
        {/* Loading State */}
        {isLoading && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="md" />
              <Text c="dimmed">Printer bağlantısı kuruluyor...</Text>
            </Stack>
          </Center>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Bağlantı Hatası"
            color="red"
            variant="light"
          >
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              <Text size="xs" c="dimmed">
                Lütfen Zebra BrowserPrint uygulamasının yüklü ve çalışır durumda olduğundan emin olun.
              </Text>
              <Button
                leftSection={<IconRefresh size={16} />}
                size="xs"
                variant="light"
                onClick={setupPrinter}
              >
                Tekrar Dene
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Success/Error Messages */}
        {message && !isLoading && !error && (
          <Alert
            icon={messageType === 'error' ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
            color={messageType === 'error' ? 'red' : messageType === 'success' ? 'green' : 'blue'}
            variant="light"
            withCloseButton
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <>
            {/* Printer Selection */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500}>
                  <IconDevices size={16} style={{ marginRight: 8 }} />
                  Printer Seçin
                </Text>
                <Badge variant="light" size="sm">
                  {devices.length} cihaz
                </Badge>
              </Group>
              
              
              <Select
                placeholder="Bir printer seçin"
                data={deviceOptions}
                value={selectedDevice?.uid || null}
                onChange={handleDeviceChange}
                searchable
                clearable={false}
                comboboxProps={{ withinPortal: false }}
              />
              
              {devices.length === 0 && (
                <Text size="sm" c="dimmed">
                  Hiç printer bulunamadı
                </Text>
              )}
            </Stack>

            <Divider />

            {/* ZPL Content */}
            <Stack gap="xs">
              <Text fw={500}>ZPL İçeriği</Text>
              <Textarea
                placeholder="ZPL kodunuzu buraya girin..."
                value={customZpl}
                onChange={(event) => setCustomZpl(event.currentTarget.value)}
                minRows={6}
                maxRows={10}
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }
                }}
              />
              <Text size="xs" c="dimmed">
                ZPL komutları (örn: ^XA ile başlayıp ^XZ ile biten)
              </Text>
            </Stack>

            <Divider />

            {/* Action Buttons */}
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={onClose}
                disabled={isProcessing}
              >
                İptal
              </Button>
              
              <Button
                leftSection={<IconPrinter size={16} />}
                onClick={handleSendZPLLabel}
                disabled={isProcessing || !selectedDevice || !customZpl.trim()}
                loading={isProcessing}
                color="blue"
              >
                {isProcessing ? 'Gönderiliyor...' : 'Yazdır'}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default ZebraPrinterModal;