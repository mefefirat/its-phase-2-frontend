import { useGlobalStore } from '@/store/globalStore';
import { useZebraPrinterStore } from '@/shared/printer/store/useZebraPrinterStore';

export interface PrinterConfig {
  palletPrinter: string | null;
  labelPrinter: string | null;
}

export interface PrintResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Printer ayarlarını alır
 */
export const usePrinterConfig = (): PrinterConfig => {
  const printers = useGlobalStore((state) => state.settings?.printers || { palletPrinter: null, labelPrinter: null });
  return {
    palletPrinter: printers.palletPrinter,
    labelPrinter: printers.labelPrinter,
  };
};

/**
 * Belirli bir printer ile yazdırma işlemi yapar
 */
export const printWithPrinter = async (
  printerId: string | null,
  zplContent: string
): Promise<PrintResult> => {
  if (!printerId) {
    return {
      success: false,
      message: 'Printer seçilmedi',
      error: 'Printer ID bulunamadı'
    };
  }

  if (!zplContent.trim()) {
    return {
      success: false,
      message: 'ZPL içeriği boş',
      error: 'Yazdırılacak içerik bulunamadı'
    };
  }

  try {
    // Printer store'dan cihazları al
    const { devices } = useZebraPrinterStore.getState();
    const device = devices.find(d => d.uid === printerId);

    if (!device) {
      return {
        success: false,
        message: 'Printer bulunamadı',
        error: `ID: ${printerId} olan printer bulunamadı`
      };
    }

    // Yazdırma işlemini gerçekleştir
    await new Promise<void>((resolve, reject) => {
      device.send(
        zplContent,
        () => resolve(),
        (error: string) => reject(new Error(error))
      );
    });

    return {
      success: true,
      message: 'Yazdırma işlemi başarılı'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return {
      success: false,
      message: 'Yazdırma hatası',
      error: errorMessage
    };
  }
};

/**
 * Palet printer ile yazdırma işlemi yapar
 */
export const printWithPalletPrinter = async (zplContent: string): Promise<PrintResult> => {
  const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
  return printWithPrinter(printers.palletPrinter, zplContent);
};

/**
 * Etiket printer ile yazdırma işlemi yapar
 */
export const printWithLabelPrinter = async (zplContent: string): Promise<PrintResult> => {
  const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
  return printWithPrinter(printers.labelPrinter, zplContent);
};

/**
 * Printer ayarlarının tamamlanıp tamamlanmadığını kontrol eder
 */
export const isPrinterConfigComplete = (): boolean => {
  const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
  return printers.palletPrinter !== null && printers.labelPrinter !== null;
};

/**
 * Belirli bir printer türünün ayarlanıp ayarlanmadığını kontrol eder
 */
export const isPrinterConfigured = (printerType: 'pallet' | 'label'): boolean => {
  const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
  
  if (printerType === 'pallet') {
    return printers.palletPrinter !== null;
  } else {
    return printers.labelPrinter !== null;
  }
};

/**
 * Seçili printer'in gerçekten hazır olup olmadığını güçlü şekilde kontrol eder
 * - BrowserPrint var mı?
 * - Ayarlarda printer seçili mi?
 * - Mevcut cihaz listesinde bu printer var mı?
 * - Cihaz listesi yoksa yeniden yüklemeyi dener
 */
export const ensurePrinterReady = async (
  printerType: 'pallet' | 'label' = 'label'
): Promise<{ ready: boolean; message?: string }> => {
  // BrowserPrint kontrolü
  if (typeof window === 'undefined' || typeof (window as any).BrowserPrint === 'undefined') {
    return {
      ready: false,
      message: 'Zebra BrowserPrint bulunamadı. Uygulamanın yüklü ve çalışır olduğundan emin olun.'
    };
  }

  const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
  const configuredPrinterId = printerType === 'pallet' ? printers.palletPrinter : printers.labelPrinter;

  if (!configuredPrinterId) {
    return { ready: false, message: 'Printer seçilmedi. Lütfen ayarlardan bir printer seçin.' };
  }

  const store = useZebraPrinterStore.getState();

  // Her tetiklemede listeyi tazele (USB çıkartma/takma gibi durumları yakalamak için)
  try {
    await store.loadPrinters();
  } catch (e) {
    // Yükleme hatası store.error içinde de tutuluyor
  }

  const device = useZebraPrinterStore.getState().devices.find(d => d.uid === configuredPrinterId);
  if (!device) {
    return {
      ready: false,
      message: 'Seçilen printer bağlı değil ya da bulunamadı. Lütfen bağlantıyı kontrol edin.'
    };
  }

  // BrowserPrint servisinin ayağa kalkık olduğuna dair hızlı sağlık kontrolü
  try {
    await fetch('http://127.0.0.1:9100/available', { method: 'GET' });
  } catch {
    return { ready: false, message: 'BrowserPrint servisine ulaşılamıyor. Uygulama çalışıyor mu?' };
  }

  return { ready: true };
};