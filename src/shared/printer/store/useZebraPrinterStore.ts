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

export const useZebraPrinterStore = create<ZebraPrinterState>()(
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
            window.BrowserPrint.getDefaultDevice(
              "printer",
              (defaultDevice: BrowserPrintDevice) => {
                const newDevices = [defaultDevice];
                
                window.BrowserPrint.getLocalDevices(
                  (deviceList: BrowserPrintDevice[]) => {
                    const allDevices = [...newDevices];
                    
                    deviceList.forEach((device) => {
                      console.log('Device found:', device);
                      // Sadece geçerli uid'li ve farklı cihazları ekle
                      if (device.uid && device.uid.trim() !== '' && !allDevices.find(d => d.uid === device.uid)) {
                        allDevices.push(device);
                      }
                    });
                    
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
                  (error: string) => {
                    const errorMsg = `Yerel cihazlar alınamadı: ${error}`;
                    setError(errorMsg);
                    setLoading(false);
                    reject(new Error(errorMsg));
                  },
                  "printer"
                );
              },
              (error: string) => {
                const errorMsg = `Varsayılan cihaz alınamadı: ${error}`;
                setError(errorMsg);
                setLoading(false);
                reject(new Error(errorMsg));
              }
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
      name: 'zebra-printer-store', // Redux DevTools için isim
    }
  )
);