# Printer Ayarları ve Kullanımı

Bu proje, Zebra printer'ları için ayarlama ve yazdırma özelliklerini içerir.

## Özellikler

### 1. Printer Ayarları Sayfası
- **Konum**: `/settings/printer`
- **Menü**: Ayarlar > Printer Ayarları
- **Özellikler**:
  - Palet için printer seçimi
  - Diğer etiketler için printer seçimi
  - Gerçek zamanlı printer listesi
  - Ayarların global store'da saklanması

### 2. Global Store Entegrasyonu
Printer ayarları global store'da saklanır:
```typescript
settings: {
  printers: {
    palletPrinter: string | null;
    labelPrinter: string | null;
  };
}
```

### 3. Utility Fonksiyonları
`src/utils/printerUtils.ts` dosyasında şu fonksiyonlar bulunur:

#### `usePrinterConfig()`
Mevcut printer ayarlarını alır.

#### `printWithPrinter(printerId, zplContent)`
Belirli bir printer ile yazdırma işlemi yapar.

#### `printWithPalletPrinter(zplContent)`
Palet printer ile yazdırma işlemi yapar.

#### `printWithLabelPrinter(zplContent)`
Etiket printer ile yazdırma işlemi yapar.

#### `isPrinterConfigured(printerType)`
Belirli bir printer türünün ayarlanıp ayarlanmadığını kontrol eder.

## Kullanım Örnekleri

### 1. Basit Yazdırma
```typescript
import { printWithLabelPrinter } from '@/utils/printerUtils';

const handlePrint = async () => {
  const zplContent = '^XA^PW799^LL400^FO30,30^BXN,16,200^FD123456^FS^XZ';
  const result = await printWithLabelPrinter(zplContent);
  
  if (result.success) {
    console.log('Yazdırma başarılı');
  } else {
    console.error('Hata:', result.error);
  }
};
```

### 2. Printer Kontrolü
```typescript
import { isPrinterConfigured } from '@/utils/printerUtils';

if (!isPrinterConfigured('label')) {
  // Etiket printer ayarlanmamış
  showError('Lütfen etiket printer\'ını ayarlayın');
  return;
}
```

### 3. JobScan Sayfasında Kullanım
JobScan sayfasında her paket için yazdırma butonu bulunur:
- Ana paketler için yazdırma butonu
- Alt paketler için yazdırma butonu
- Taranan barkodlar için yazdırma butonu

## ZPL Formatı
ZPL (Zebra Programming Language) formatında etiket içeriği oluşturulur:

```zpl
^XA                    // Başlangıç
^PW799                 // Sayfa genişliği
^LL400                 // Sayfa yüksekliği
^FO30,30               // Pozisyon (x,y)
^BXN,16,200            // Barkod (QR kod)
^FD123456^FS           // Veri
^FO300,30              // Pozisyon
^A0N,80,120            // Font
^FD123456^FS           // Metin
^XZ                    // Son
```

## Gereksinimler
- Zebra BrowserPrint uygulaması yüklü olmalı
- Printer'lar BrowserPrint ile tanımlanmış olmalı
- Printer ayarları yapılmış olmalı

## Hata Yönetimi
- Printer bulunamadığında hata mesajı gösterilir
- ZPL içeriği boşsa hata mesajı gösterilir
- Yazdırma işlemi başarısızsa hata mesajı gösterilir
- Printer ayarlanmamışsa kullanıcıya bilgi verilir

## Gelecek Geliştirmeler
- Farklı etiket şablonları
- Toplu yazdırma özelliği
- Yazdırma geçmişi
- Printer durumu izleme
