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
 * Device bağlantısını test eder
 */
const testDeviceConnection = async (device: any): Promise<boolean> => {
  try {
    // Simple test command to check connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 3000); // 3 saniye timeout

      device.send(
        '^XA^XZ', // Minimal ZPL command to test connection
        () => {
          clearTimeout(timeout);
          resolve();
        },
        (error: string) => {
          clearTimeout(timeout);
          reject(new Error(error));
        }
      );
    });
    return true;
  } catch (error) {
    console.warn('Device connection test failed:', error);
    return false;
  }
};

/**
 * Printer store'dan fresh device instance alır
 */
const getFreshDevice = async (printerId: string): Promise<any> => {
  try {
    // Store'dan cihazları yeniden yükle
    await useZebraPrinterStore.getState().loadPrinters();
    const { devices } = useZebraPrinterStore.getState();
    return devices.find(d => d.uid === printerId);
  } catch (error) {
    console.error('Failed to reload devices:', error);
    return null;
  }
};

/**
 * Belirli bir printer ile yazdırma işlemi yapar (retry mechanism ile)
 */
export const printWithPrinter = async (
  printerId: string | null,
  zplContent: string,
  maxRetries: number = 2
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

  let lastError: string = '';
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Her denemede fresh device al
      let device = await getFreshDevice(printerId);
      
      if (!device) {
        lastError = `Printer bulunamadı (ID: ${printerId})`;
        
        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt + 1}: Device not found, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
          continue;
        }
        break;
      }

      // Bağlantıyı test et (sadece ilk denemede)
      if (attempt === 0) {
        const connectionOk = await testDeviceConnection(device);
        if (!connectionOk) {
          // Bağlantı problemi varsa device'ı yenile
          device = await getFreshDevice(printerId);
          if (!device) {
            lastError = `Printer bağlantısı kurulamadı (ID: ${printerId})`;
            continue;
          }
        }
      }

      // Yazdırma işlemini gerçekleştir
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Print timeout - Printer yanıt vermiyor'));
        }, 15000); // 15 saniye timeout

        device.send(
          zplContent,
          () => {
            clearTimeout(timeout);
            resolve();
          },
          (error: string) => {
            clearTimeout(timeout);
            reject(new Error(error));
          }
        );
      });

      return {
        success: true,
        message: attempt > 0 ? `Yazdırma başarılı (${attempt + 1}. denemede)` : 'Yazdırma başarılı'
      };

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Bilinmeyen hata';
      
      if (attempt < maxRetries) {
        console.warn(`Print attempt ${attempt + 1} failed: ${lastError}, retrying...`);
        
        // Connection closed hatası ise biraz daha bekle
        if (lastError.includes('connection closed') || lastError.includes('writing to port')) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
        }
      }
    }
  }

  return {
    success: false,
    message: 'Yazdırma işlemi başarısız',
    error: `${maxRetries + 1} deneme sonucu başarısız: ${lastError}`
  };
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
 * Printer durumunu detaylı şekilde tanılar
 */
export const diagnosePrinterIssues = async (
  printerType: 'pallet' | 'label' = 'label'
): Promise<{
  browserPrintAvailable: boolean;
  printerConfigured: boolean;
  configuredPrinterId: string | null;
  availableDevices: any[];
  deviceFound: boolean;
  serviceReachable: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // BrowserPrint kontrolü
  const browserPrintAvailable = typeof window !== 'undefined' && typeof (window as any).BrowserPrint !== 'undefined';
  if (!browserPrintAvailable) {
    issues.push('Zebra BrowserPrint bulunamadı');
    recommendations.push('Zebra BrowserPrint uygulamasını indirin ve yükleyin');
  }

  const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
  const configuredPrinterId = printerType === 'pallet' ? printers.palletPrinter : printers.labelPrinter;
  const printerConfigured = configuredPrinterId !== null;

  if (!printerConfigured) {
    issues.push('Printer ayarlanmamış');
    recommendations.push('Ayarlar sayfasından bir printer seçin');
  }

  // Cihaz listesini kontrol et
  const store = useZebraPrinterStore.getState();
  let availableDevices: any[] = [];
  let deviceFound = false;

  try {
    await store.loadPrinters();
    availableDevices = useZebraPrinterStore.getState().devices;
    deviceFound = configuredPrinterId ? availableDevices.some(d => d.uid === configuredPrinterId) : false;
  } catch (e) {
    issues.push('Cihaz listesi yüklenemiyor');
    recommendations.push('BrowserPrint servisinin çalıştığını kontrol edin');
  }

  if (configuredPrinterId && !deviceFound) {
    issues.push(`Seçili printer (${configuredPrinterId}) bulunamadı`);
    recommendations.push('Printer\'ın açık ve bilgisayara bağlı olduğunu kontrol edin');
    recommendations.push('BrowserPrint uygulamasını yeniden başlatın');
    recommendations.push('Ayarlar sayfasından mevcut bir printer seçin');
  }

  // Eğer device bulundu ise bağlantıyı test et
  if (deviceFound && configuredPrinterId) {
    try {
      const device = availableDevices.find(d => d.uid === configuredPrinterId);
      if (device) {
        const connectionTestOk = await testDeviceConnection(device);
        if (!connectionTestOk) {
          issues.push('Printer bağlantısı test edilemedi');
          recommendations.push('Printer\'ın fiziksel bağlantısını kontrol edin');
          recommendations.push('Printer\'ı kapatıp açın');
        }
      }
    } catch (e) {
      issues.push('Printer bağlantı testi başarısız');
      recommendations.push('Printer iletişim hatası - USB kablosunu kontrol edin');
    }
  }

  // BrowserPrint servis kontrolü
  let serviceReachable = false;
  if (browserPrintAvailable) {
    try {
      await fetch('http://127.0.0.1:9100/available', { method: 'GET' });
      serviceReachable = true;
    } catch {
      issues.push('BrowserPrint servisine ulaşılamıyor');
      recommendations.push('BrowserPrint uygulamasının çalıştığını kontrol edin');
    }
  }

  return {
    browserPrintAvailable,
    printerConfigured,
    configuredPrinterId,
    availableDevices,
    deviceFound,
    serviceReachable,
    issues,
    recommendations
  };
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
): Promise<{ ready: boolean; message?: string; diagnosis?: any }> => {
  // Detaylı tanı çalıştır
  const diagnosis = await diagnosePrinterIssues(printerType);
  
  if (diagnosis.issues.length > 0) {
    return {
      ready: false,
      message: diagnosis.issues.join(', '),
      diagnosis
    };
  }

  return { ready: true, diagnosis };
};

/**
 * Batch printing için printer hazırlığını kontrol eder ve device'ı döner
 */
export const preparePrinterForBatch = async (
  printerType: 'pallet' | 'label' = 'label'
): Promise<{ success: boolean; device?: any; error?: string }> => {
  try {
    // Printer hazırlığını kontrol et
    const readiness = await ensurePrinterReady(printerType);
    if (!readiness.ready) {
      return {
        success: false,
        error: readiness.message || 'Printer hazır değil'
      };
    }

    // Printer ID'yi al
    const printers = useGlobalStore.getState().settings?.printers || { palletPrinter: null, labelPrinter: null };
    const printerId = printerType === 'pallet' ? printers.palletPrinter : printers.labelPrinter;
    
    if (!printerId) {
      return {
        success: false,
        error: 'Printer ayarlanmamış'
      };
    }

    // Device'ı al ve bağlantıyı test et
    const device = await getFreshDevice(printerId);
    if (!device) {
      return {
        success: false,
        error: `Printer bulunamadı (ID: ${printerId})`
      };
    }

    // Bağlantıyı test et
    const connectionOk = await testDeviceConnection(device);
    if (!connectionOk) {
      return {
        success: false,
        error: 'Printer bağlantısı kurulamadı'
      };
    }

    return {
      success: true,
      device
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Hazırlanmış device ile direkt yazdırma (batch printing için optimize edilmiş)
 */
export const printWithPreparedDevice = async (
  device: any,
  zplContent: string,
  timeout: number = 15000
): Promise<PrintResult> => {
  if (!device) {
    return {
      success: false,
      message: 'Device bulunamadı',
      error: 'Prepared device is null'
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
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Print timeout - Printer yanıt vermiyor'));
      }, timeout);

      device.send(
        zplContent,
        () => {
          clearTimeout(timeoutId);
          resolve();
        },
        (error: string) => {
          clearTimeout(timeoutId);
          reject(new Error(error));
        }
      );
    });

    return {
      success: true,
      message: 'Yazdırma başarılı'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Yazdırma işlemi başarısız',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }
};

/**
 * Batch yazdırma işlemi - printer kontrol bir kez yapılır, ardından tüm etiketler yazdırılır
 */
export const batchPrintWithLabelPrinter = async (
  zplContents: string[],
  onProgress?: (current: number, total: number, success: boolean, message?: string) => void
): Promise<{
  totalCount: number;
  successCount: number;
  failCount: number;
  errors: string[];
}> => {
  const results = {
    totalCount: zplContents.length,
    successCount: 0,
    failCount: 0,
    errors: [] as string[]
  };

  if (zplContents.length === 0) {
    return results;
  }

  // Printer'ı bir kez hazırla
  const preparation = await preparePrinterForBatch('label');
  if (!preparation.success) {
    // Tüm işlemler başarısız
    results.failCount = zplContents.length;
    const errorMsg = preparation.error || 'Printer hazırlık hatası';
    for (let i = 0; i < zplContents.length; i++) {
      results.errors.push(`Etiket ${i + 1}: ${errorMsg}`);
      onProgress?.(i + 1, zplContents.length, false, errorMsg);
    }
    return results;
  }

  // Tüm etiketleri sırayla yazdır (aynı device ile)
  for (let i = 0; i < zplContents.length; i++) {
    try {
      const printResult = await printWithPreparedDevice(preparation.device!, zplContents[i]);
      
      if (printResult.success) {
        results.successCount++;
        onProgress?.(i + 1, zplContents.length, true, 'Başarılı');
      } else {
        results.failCount++;
        const errorMsg = printResult.error || printResult.message;
        results.errors.push(`Etiket ${i + 1}: ${errorMsg}`);
        onProgress?.(i + 1, zplContents.length, false, errorMsg);
      }
    } catch (error: any) {
      results.failCount++;
      const errorMessage = error?.message || 'Bilinmeyen hata';
      results.errors.push(`Etiket ${i + 1}: ${errorMessage}`);
      onProgress?.(i + 1, zplContents.length, false, errorMessage);
    }
  }

  return results;
};

/**
 * Belirli bir device ile batch printing yapar
 */
export const batchPrintWithSpecificDevice = async (
  device: any,
  zplContents: string[],
  onProgress?: (current: number, total: number, success: boolean, message?: string) => void
): Promise<{
  totalCount: number;
  successCount: number;
  failCount: number;
  errors: string[];
}> => {
  const results = {
    totalCount: zplContents.length,
    successCount: 0,
    failCount: 0,
    errors: [] as string[]
  };

  if (zplContents.length === 0) {
    return results;
  }

  if (!device) {
    // Tüm işlemler başarısız
    results.failCount = zplContents.length;
    const errorMsg = 'Printer device bulunamadı';
    for (let i = 0; i < zplContents.length; i++) {
      results.errors.push(`Etiket ${i + 1}: ${errorMsg}`);
      onProgress?.(i + 1, zplContents.length, false, errorMsg);
    }
    return results;
  }

  // Tüm etiketleri sırayla yazdır (belirtilen device ile)
  for (let i = 0; i < zplContents.length; i++) {
    try {
      const printResult = await printWithPreparedDevice(device, zplContents[i]);
      
      if (printResult.success) {
        results.successCount++;
        onProgress?.(i + 1, zplContents.length, true, 'Başarılı');
      } else {
        results.failCount++;
        const errorMsg = printResult.error || printResult.message;
        results.errors.push(`Etiket ${i + 1}: ${errorMsg}`);
        onProgress?.(i + 1, zplContents.length, false, errorMsg);
      }
    } catch (error: any) {
      results.failCount++;
      const errorMessage = error?.message || 'Bilinmeyen hata';
      results.errors.push(`Etiket ${i + 1}: ${errorMessage}`);
      onProgress?.(i + 1, zplContents.length, false, errorMessage);
    }
  }

  return results;
};