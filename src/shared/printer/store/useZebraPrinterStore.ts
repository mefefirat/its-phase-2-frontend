// store/useZebraPrinterStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BrowserPrintDevice, BrowserPrintAPI } from '../types/browserprint';

declare global {
  interface Window {
    BrowserPrint: BrowserPrintAPI;
  }
}

interface ZebraPrinterState {
  // State
  selectedDevice: BrowserPrintDevice | null;
  devices: BrowserPrintDevice[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedDevice: (device: BrowserPrintDevice | null) => void;
  setDevices: (devices: BrowserPrintDevice[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadPrinters: () => Promise<void>;
  refreshPrinters: () => void;
  reset: () => void;
}

const initialState = {
  selectedDevice: null,
  devices: [],
  isLoading: false,
  error: null,
};

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

// Store factory function - her printer türü için ayrı instance oluşturur
export const createZebraPrinterStore = (storeName: string) => {
  return create<ZebraPrinterState>()(
    devtools(
      (set, get) => ({
        ...initialState,

        setSelectedDevice: (device) => 
          set({ selectedDevice: device }, false, 'setSelectedDevice'),

        setDevices: (devices) => 
          set({ devices }, false, 'setDevices'),

        setLoading: (isLoading) => 
          set({ isLoading }, false, 'setLoading'),

        setError: (error) => 
          set({ error }, false, 'setError'),

        loadPrinters: async () => {
          const { setLoading, setError, setDevices, setSelectedDevice, selectedDevice } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await checkBrowserPrintAvailability();
            
            return new Promise<void>((resolve, reject) => {
              // Timeout için timer
              const loadTimeout = setTimeout(() => {
                setLoading(false);
                setError('Printer yükleme zaman aşımı - BrowserPrint yanıt vermiyor');
                reject(new Error('Load timeout'));
              }, 10000); // 10 saniye timeout
              
              window.BrowserPrint.getLocalDevices(
                (deviceList: BrowserPrintDevice[]) => {
                  clearTimeout(loadTimeout);
                  
                  const allDevices: BrowserPrintDevice[] = [];
                  
                  deviceList.forEach((device) => {
                    console.log('Device found:', device);
                    // Sadece geçerli uid'li ve farklı cihazları ekle
                    if (device.uid && device.uid.trim() !== '' && !allDevices.find(d => d.uid === device.uid)) {
                      allDevices.push(device);
                    }
                  });
                  
                  // Default device'ı da almaya çalış ama hata verirse devam et
                  window.BrowserPrint.getDefaultDevice(
                    "printer",
                    (defaultDevice: BrowserPrintDevice) => {
                      // Default device'ı listeye ekle (eğer yoksa)
                      if (defaultDevice.uid && !allDevices.find(d => d.uid === defaultDevice.uid)) {
                        allDevices.unshift(defaultDevice); // Başa ekle
                      }
                      
                      setDevices(allDevices);
                      
                      // Eğer seçili cihaz yoksa veya artık mevcut değilse, ilk cihazı seç
                      if (!selectedDevice || !allDevices.find(d => d.uid === selectedDevice.uid)) {
                        if (allDevices.length > 0) {
                          setSelectedDevice(allDevices[0]);
                        }
                      }
                      
                      setLoading(false);
                      setError(null);
                      resolve();
                    },
                    (defaultError: string) => {
                      // Default device alınamadı ama devam et
                      console.warn('Default device alınamadı:', defaultError);
                      
                      setDevices(allDevices);
                      
                      if (!selectedDevice || !allDevices.find(d => d.uid === selectedDevice.uid)) {
                        if (allDevices.length > 0) {
                          setSelectedDevice(allDevices[0]);
                        }
                      }
                      
                      setLoading(false);
                      setError(null);
                      resolve();
                    }
                  );
                },
                (error: string) => {
                  clearTimeout(loadTimeout);
                  const errorMsg = `Cihazlar alınamadı: ${error}`;
                  setError(errorMsg);
                  setLoading(false);
                  reject(new Error(errorMsg));
                },
                "printer"
              );
            });
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
            setError(errorMessage);
            setLoading(false);
            throw err;
          }
        },

        refreshPrinters: () => {
          get().loadPrinters();
        },

        reset: () => 
          set(initialState, false, 'reset'),
      }),
      {
        name: `zebra-printer-store-${storeName}`, // Her store için benzersiz isim
      }
    )
  );
};

// Varsayılan store (geriye uyumluluk için)
export const useZebraPrinterStore = createZebraPrinterStore('default');

// Palet printer için ayrı store
export const usePalletPrinterStore = createZebraPrinterStore('pallet');

// Etiket printer için ayrı store  
export const useLabelPrinterStore = createZebraPrinterStore('label');