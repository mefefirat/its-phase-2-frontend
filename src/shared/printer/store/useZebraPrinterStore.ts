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

const checkBrowserPrintAvailability = async (): Promise<void> => {
  // Önce BrowserPrint nesnesinin var olup olmadığını kontrol et
  if (typeof window !== 'undefined' && typeof window.BrowserPrint !== 'undefined') {
    return Promise.resolve();
  }

  // BrowserPrint servisinin erişilebilir olup olmadığını kontrol et
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
    
    const response = await fetch('http://127.0.0.1:9100/available', { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('BrowserPrint servisi yanıt vermiyor');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('BrowserPrint servisine bağlantı zaman aşımına uğradı. Servisi yeniden başlatın.');
    }
    throw new Error('Zebra BrowserPrint servisi bulunamadı. Lütfen BrowserPrint uygulamasının yüklü ve çalışır durumda olduğundan emin olun.');
  }

  // BrowserPrint script'inin yüklenmesini bekle (daha kısa aralıklarla)
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // Maksimum 50 deneme (5 saniye)
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (typeof window.BrowserPrint !== 'undefined') {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error('BrowserPrint script yüklenemedi. Sayfayı yenilemeyi deneyin.'));
      }
    }, 100);
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
            
            // BrowserPrint availability kontrolünü yap
            await checkBrowserPrintAvailability();
            
            return new Promise<void>((resolve, reject) => {
              // Timeout için timer - production ortamında daha az süre
              const timeoutDuration = process.env.NODE_ENV === 'production' ? 8000 : 10000;
              const loadTimeout = setTimeout(() => {
                setLoading(false);
                setError('Printer cihaz listesi yüklenirken zaman aşımına uğrandı. BrowserPrint servisinin çalıştığından emin olun.');
                reject(new Error('Device loading timeout'));
              }, timeoutDuration);
              
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
                  let errorMsg = 'Printer cihaz listesi alınamadı';
                  
                  // Hata tipine göre daha açıklayıcı mesajlar
                  if (error.toLowerCase().includes('timeout')) {
                    errorMsg = 'BrowserPrint servisi zaman aşımına uğradı. Servisi yeniden başlatın.';
                  } else if (error.toLowerCase().includes('connection')) {
                    errorMsg = 'BrowserPrint servisine bağlanılamadı. Servisin çalıştığından emin olun.';
                  } else if (error.toLowerCase().includes('access')) {
                    errorMsg = 'BrowserPrint servisine erişim izni reddedildi. Tarayıcı ayarlarınızı kontrol edin.';
                  } else {
                    errorMsg = `Printer cihaz listesi hatası: ${error}`;
                  }
                  
                  setError(errorMsg);
                  setLoading(false);
                  reject(new Error(errorMsg));
                },
                "printer"
              );
            });
          } catch (err) {
            let errorMessage = 'Bilinmeyen printer hatası oluştu';
            
            if (err instanceof Error) {
              if (err.message.includes('BrowserPrint servisi')) {
                errorMessage = err.message;
              } else if (err.message.includes('fetch')) {
                errorMessage = 'BrowserPrint servisine erişilemiyor. Zebra BrowserPrint uygulamasının yüklü ve çalışır durumda olduğunu kontrol edin.';
              } else {
                errorMessage = `Printer yükleme hatası: ${err.message}`;
              }
            }
            
            console.error('Printer loading error:', err);
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