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
