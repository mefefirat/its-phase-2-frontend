// components/ZebraPrinterSelector.tsx
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Select,
  Text,
  Group,
  Stack,
  Alert,
  Loader,
  Button,
  SelectProps
} from '@mantine/core';
import {
  IconAlertCircle,
  IconRefresh,
  IconPrinter,
  IconSearch
} from '@tabler/icons-react';
import { useZebraPrinterStore, usePalletPrinterStore, useLabelPrinterStore } from './store/useZebraPrinterStore';

interface BrowserPrintDevice {
  uid: string;
  name: string;
  connection: string;
  deviceType: string;
  version?: number;
  provider?: string;
  manufacturer?: string;
  send: (data: string, successCallback?: () => void, errorCallback?: (error: string) => void) => void;
}

interface AvailablePrintersResponse {
  printer: BrowserPrintDevice[];
}

interface ZebraPrinterSelectorProps extends Omit<SelectProps, 'data' | 'value' | 'onChange' | 'onError'> {
  onChange?: (device: BrowserPrintDevice | null, deviceId: string | null) => void;
  onError?: (error: string) => void;
  onPrintSuccess?: (message: string) => void;
  onPrintError?: (error: string) => void;
  showRefreshButton?: boolean;
  showPrintButton?: boolean;
  hideSelect?: boolean;
  autoLoadOnMount?: boolean;
  zplContent?: string;
  label?: string;
  disabled?: boolean;
  storeType?: 'default' | 'pallet' | 'label'; // Hangi store'u kullanacağını belirler
}

export interface ZebraPrinterSelectorRef {
  print: (zplContent?: string) => Promise<void>;
  getSelectedDevice: () => BrowserPrintDevice | null;
}

const ZebraPrinterSelector = forwardRef<ZebraPrinterSelectorRef, ZebraPrinterSelectorProps>(
  ({
    onChange,
    onError,
    onPrintSuccess,
    onPrintError,
    showRefreshButton = true,
    showPrintButton = false,
    hideSelect = false,
    autoLoadOnMount = true,
    zplContent = '^XA^PW799^LL400^FO30,30^BXN,16,200^FD01L001C1^FS^FO300,30^A0N,80,120^FD01L00101^FS^XZ',
    label = "Printer Seçin",
    placeholder = "Printer seçin",
    disabled = true,
    storeType = 'default',
    ...selectProps
  }, ref) => {
    // Store tipine göre doğru store'u seç
    const getStore = () => {
      switch (storeType) {
        case 'pallet':
          return usePalletPrinterStore();
        case 'label':
          return useLabelPrinterStore();
        default:
          return useZebraPrinterStore();
      }
    };

    // Zustand store'dan state'leri al
    const {
      selectedDevice,
      devices,
      isLoading,
      error,
      setSelectedDevice,
      loadPrinters,
      refreshPrinters
    } = getStore();

    const [isPrinting, setIsPrinting] = useState<boolean>(false);

    // Component mount olduğunda printer'ları yükle
    useEffect(() => {
      if (autoLoadOnMount && devices.length === 0 && !isLoading && !error) {
        loadPrinters();
      }
    }, [autoLoadOnMount, devices.length, isLoading, error, loadPrinters]);

    // Seçili cihaz değiştiğinde parent'a bildir
    useEffect(() => {
      onChange?.(selectedDevice, selectedDevice?.uid || null);
    }, [selectedDevice, onChange]);

    // Hata durumlarını parent'a bildir
    useEffect(() => {
      if (error) {
        onError?.(error);
      }
    }, [error, onError]);

    const showPrintMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info'): void => {
      if (type === 'success') {
        onPrintSuccess?.(msg);
      } else if (type === 'error') {
        onPrintError?.(msg);
      } else if (type === 'info') {
        // Info mesajları için onPrintSuccess kullanabiliriz (mavi renk için)
        onPrintSuccess?.(msg);
      }
    };

    // BrowserPrint available endpoint'ini kontrol eder
    const checkPrinterAvailability = async (deviceUid: string): Promise<boolean> => {
      const maxRetries = 5; // 5 saniye boyunca dene
      const retryInterval = 1000; // Her saniye kontrol et

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 Available check attempt ${attempt}/${maxRetries} for ${deviceUid}`);
          
          const response = await fetch('http://127.0.0.1:9100/available', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Timeout ekle
            signal: AbortSignal.timeout(2000) // 2 saniye timeout per request
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data: AvailablePrintersResponse = await response.json();
          console.log('Available printers:', data);

          // Seçilen printer'ın available listesinde olup olmadığını kontrol et
          const isAvailable = data.printer?.some(p => p.uid === deviceUid);
          
          if (isAvailable) {
            console.log(`✅ Printer ${deviceUid} is available`);
            return true;
          }
          
          console.log(`⚠️ Printer ${deviceUid} not found in available list, retrying...`);
          
          // Son attempt değilse bekle
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryInterval));
          }
          
        } catch (error) {
          console.error(`❌ Available check failed (attempt ${attempt}):`, error);
          
          // Son attempt değilse bekle
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryInterval));
          }
        }
      }

      console.log(`❌ Printer ${deviceUid} not available after ${maxRetries} attempts`);
      return false;
    };

    const sendZPLLabel = (zplData: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!selectedDevice) {
          reject(new Error('Seçili cihaz yok'));
          return;
        }

        console.log(`Sending ZPL to ${selectedDevice.name}:`, zplData);

        // Timeout ekle
        const timeout = setTimeout(() => {
          reject(new Error('Yazdırma timeout - Printer 10 saniye içinde yanıt vermedi. Printer açık ve hazır mı?'));
        }, 10000); // 10 saniye timeout

        selectedDevice.send(
          zplData,
          () => {
            // Success callback - BrowserPrint API başarıyla printer'a gönderdi
            clearTimeout(timeout);
            console.log(`ZPL successfully sent to ${selectedDevice.name}`);
            resolve();
          },
          (error: string) => {
            // Error callback - BrowserPrint API bir hata ile karşılaştı
            clearTimeout(timeout);
            console.error(`ZPL send failed to ${selectedDevice.name}:`, error);
            reject(new Error(error || 'BrowserPrint API hatası'));
          }
        );
      });
    };

    // Printer bağlantı durumunu ve kullanılabilirliğini test eder
    const testPrinterConnection = async (device: BrowserPrintDevice): Promise<boolean> => {
      try {
        // Önce device'ın temel bilgilerini kontrol et
        if (!device.uid || !device.name || !device.connection) {
          console.warn('Device bilgileri eksik:', device);
          return false;
        }

        console.log(`🔍 Testing printer: ${device.name} (${device.uid})`);

        // 1. Adım: Available endpoint'ini kontrol et (5 saniye boyunca dene)
        console.log('Step 1: Checking printer availability...');
        const isAvailable = await checkPrinterAvailability(device.uid);
        
        if (!isAvailable) {
          console.warn(`❌ Printer ${device.name} not available in BrowserPrint`);
          return false;
        }

        console.log(`✅ Printer ${device.name} is available, testing connection...`);

        // 2. Adım: ZPL test komutu gönder
        console.log('Step 2: Testing ZPL connection...');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('ZPL connection timeout - Printer 5 saniye içinde yanıt vermedi'));
          }, 5000); // 5 saniye timeout

          // BrowserPrint API'sinde success callback çağrılması = başarılı gönderim
          // Error callback çağrılması = hata var  
          device.send(
            '^XA^XZ', // Minimal ZPL command - boş etiket (hiçbir şey yazdırmaz)
            () => {
              // Success callback - BrowserPrint API başarıyla printer'a ulaştı
              clearTimeout(timeout);
              console.log(`✅ ZPL connection test successful: ${device.name}`);
              resolve();
            },
            (error: string) => {
              // Error callback - BrowserPrint API bir hata ile karşılaştı
              clearTimeout(timeout);
              console.error(`❌ ZPL connection test failed: ${device.name} - ${error}`);
              reject(new Error(error || 'ZPL bağlantı hatası'));
            }
          );
        });
        
        console.log(`🎉 Full printer test successful: ${device.name}`);
        return true;
      } catch (error) {
        console.warn(`⚠️ Printer test failed for ${device.name}:`, error);
        return false;
      }
    };

    const handleDeviceChange = async (deviceId: string | null): Promise<void> => {
      if (deviceId) {
        const device = devices.find(d => d.uid === deviceId);
        if (device) {
          // Önce device'ı seç
          setSelectedDevice(device);
          
          // Device bilgilerini logla (debug için)
          console.log('Selected device details:', {
            uid: device.uid,
            name: device.name,
            connection: device.connection,
            deviceType: device.deviceType,
            version: device.version,
            provider: device.provider
          });
          
          // Printer seçildiğinde kapsamlı kontrol yap (Available endpoint + ZPL test)
          showPrintMessage(`🔍 ${device.name} (${device.connection}) kontrol ediliyor... (5 saniye test)`, 'info');
          
          const isFullyReady = await testPrinterConnection(device);
          
          if (isFullyReady) {
            showPrintMessage(`✅ ${device.name} printer hazır ve bağlı! Kullanıma hazır.`, 'success');
          } else {
            // Daha detaylı hata mesajı ver
            let errorDetail = '';
            if (device.connection?.toLowerCase().includes('usb')) {
              errorDetail = 'USB kablosu bağlı mı ve printer açık mı kontrol edin.';
            } else if (device.connection?.toLowerCase().includes('network')) {
              errorDetail = 'Ağ bağlantısı ve printer IP adresi kontrol edin.';
            } else if (device.connection?.toLowerCase().includes('driver')) {
              errorDetail = 'Printer sürücüsü doğru kurulu mu ve printer açık mı kontrol edin.';
            } else {
              errorDetail = 'Printer açık ve hazır mı kontrol edin.';
            }
            
            showPrintMessage(`❌ ${device.name} 5 saniye içinde bulunamadı veya bağlantı kurulamadı. ${errorDetail}`, 'error');
          }
        } else {
          console.warn('Device not found in list:', deviceId);
          showPrintMessage('Seçilen printer bulunamadı', 'error');
        }
      } else {
        setSelectedDevice(null);
        showPrintMessage('Printer seçimi kaldırıldı', 'info');
      }
    };

    const print = async (customZplContent?: string): Promise<void> => {
      const contentToPrint = customZplContent || zplContent;
      
      if (!contentToPrint.trim()) {
        const errorMsg = 'Lütfen ZPL içeriği girin';
        showPrintMessage(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      if (!selectedDevice) {
        const errorMsg = 'Lütfen bir printer seçin';
        showPrintMessage(errorMsg, 'error');
        throw new Error(errorMsg);
      }

      setIsPrinting(true);
      
      // Debug için ZPL içeriğini ve printer bilgisini logla
      console.log('Printing ZPL:', contentToPrint);
      console.log('To printer:', selectedDevice);
      
      try {
        showPrintMessage(`🖨️ ${selectedDevice.name} printer'a gönderiliyor...`, 'info');
        await sendZPLLabel(contentToPrint);
        const successMsg = `✅ ZPL etiketi ${selectedDevice.name} printer'a başarıyla gönderildi!`;
        showPrintMessage(successMsg, 'success');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        const fullErrorMsg = `❌ ${selectedDevice.name} yazdırma hatası: ${errorMessage}`;
        console.error('Print error details:', err, selectedDevice);
        showPrintMessage(fullErrorMsg, 'error');
        throw err;
      } finally {
        setIsPrinting(false);
      }
    };

  const handleDirectPrint = async (): Promise<void> => {
    try {
      await print();
    } catch (err) {
      // Hata mesajı zaten print fonksiyonunda gösteriliyor
    }
  };

  const handleTestPrint = async (): Promise<void> => {
    try {
      await print('^XA^XZ');
    } catch (err) {
      // Hata mesajı zaten print fonksiyonunda gösteriliyor
    }
  };

    // Cihaz seçeneklerini oluştur
    const deviceOptions = devices
      .filter((device) => device.uid && device.uid.trim() !== '') // Boş uid'leri filtrele
      .map((device, index) => ({
        value: device.uid || `device-${index}`, // Fallback value
        label: `${device.name || 'Bilinmeyen Cihaz'} (${device.connection || 'Bilinmeyen'})`
      }));

    // Public methods
    const getSelectedDevice = (): BrowserPrintDevice | null => {
      return selectedDevice;
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      print,
      getSelectedDevice
    }));

    if (isLoading) {
      return (
        <Stack gap="xs">
          {label && (
            <Text fw={500}>
              {label}
            </Text>
          )}
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Printer'lar yükleniyor...</Text>
          </Group>
        </Stack>
      );
    }

    if (error) {
      return (
        <Stack gap="xs">
          {label && (
            <Text fw={500}>
              {label}
            </Text>
          )}
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
              {showRefreshButton && (
                <Button
                  leftSection={<IconRefresh size={16} />}
                  size="xs"
                  variant="light"
                  onClick={refreshPrinters}
                >
                  Tekrar Dene
                </Button>
              )}
            </Stack>
          </Alert>
        </Stack>
      );
    }

    return (
      <Stack gap="xs">
        {/* Label ve Butonlar */}
        {(label || showPrintButton || showRefreshButton) && (
          <Group justify="space-between">
            {label && (
              <Text fw={500}>
                {label}
              </Text>
            )}
            <Group gap="xs">
              {showPrintButton && (
                <Button
                  size="xs"
                  variant="filled"
                  color="blue"
                  leftSection={<IconPrinter size={12} />}
                  onClick={handleDirectPrint}
                  disabled={!selectedDevice || isLoading || isPrinting || disabled}
                  loading={isPrinting}
                 
                >
                  {isPrinting ? 'Yazdırılıyor...' : 'Yazdır'}
                </Button>
              )}
              {showRefreshButton && !hideSelect && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconRefresh size={12} />}
                  onClick={refreshPrinters}
                  disabled={isLoading}
                >
                  Yenile
                </Button>
              )}
              {showRefreshButton && !hideSelect && (
                <Button
                  size="xs"
                  variant="outline"
                  color="green"
                  onClick={handleTestPrint}
                  disabled={!selectedDevice || isLoading || isPrinting || disabled}
                  loading={isPrinting}
                >
                  Test
                </Button>
              )}
            </Group>
          </Group>
        )}
        
        {/* Select Dropdown - Sadece hideSelect false ise göster */}
        {!hideSelect && (
          <>
            <Select
              placeholder={placeholder}
              data={deviceOptions}
              value={selectedDevice?.uid || null}
              onChange={handleDeviceChange}
              searchable
              clearable
              leftSection={<IconSearch size={16} />}
              comboboxProps={{ withinPortal: false }}
              {...selectProps}
            />
            
            {devices.length === 0 && (
              <Text size="sm" c="dimmed">
                Hiç printer bulunamadı
              </Text>
            )}
          </>
        )}
      </Stack>
    );
  }
);

ZebraPrinterSelector.displayName = 'ZebraPrinterSelector';

export default ZebraPrinterSelector;