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
import { useZebraPrinterStore } from './store/useZebraPrinterStore';

interface BrowserPrintDevice {
  uid: string;
  name: string;
  connection: string;
  deviceType: string;
  send: (data: string, successCallback?: () => void, errorCallback?: (error: string) => void) => void;
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
    placeholder = "Bir printer seçin",
    disabled = true,
    ...selectProps
  }, ref) => {
    // Zustand store'dan state'leri al
    const {
      selectedDevice,
      devices,
      isLoading,
      error,
      setSelectedDevice,
      loadPrinters,
      refreshPrinters
    } = useZebraPrinterStore();

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
      }
    };

    const sendZPLLabel = (zplData: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!selectedDevice) {
          reject(new Error('Seçili cihaz yok'));
          return;
        }

        selectedDevice.send(
          zplData,
          () => resolve(),
          (error: string) => reject(new Error(error))
        );
      });
    };

    const handleDeviceChange = (deviceId: string | null): void => {
      if (deviceId) {
        const device = devices.find(d => d.uid === deviceId);
        if (device) {
          setSelectedDevice(device);
        }
      } else {
        setSelectedDevice(null);
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
      try {
        await sendZPLLabel(contentToPrint);
        const successMsg = 'ZPL etiketi başarıyla gönderildi!';
        showPrintMessage(successMsg, 'success');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        const fullErrorMsg = `Yazdırma hatası: ${errorMessage}`;
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