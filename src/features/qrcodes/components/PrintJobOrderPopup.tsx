import { Modal, Stack, Text, Paper, Group, Button, ThemeIcon, Box } from '@mantine/core';
import { IconPrinter, IconDeviceFloppy, IconReceipt2 } from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import ZebraPrinterSelector, { ZebraPrinterSelectorRef } from '@/shared/printer/ZebraPrinterSelector';
import type { Qrcodes } from '../types/qrcodes';
import { useQrcodesStore } from '../store/qrcodesStore';

interface PrintJobOrderPopupProps {
  opened: boolean;
  onClose: () => void;
  jobOrder: Qrcodes | null;
}

export default function PrintJobOrderPopup({ opened, onClose, jobOrder }: PrintJobOrderPopupProps) {
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [isPrintingJobOrder, setIsPrintingJobOrder] = useState(false);
  const printerSelectorRef = useRef<ZebraPrinterSelectorRef>(null);
  const { completeItem } = useQrcodesStore();
  
  // Test modu - burada değiştirerek normal/test mod arasında geçiş yapabilirsiniz
  const mode = 'normal';

  const handlePrinterTest = async () => {
    if (!selectedPrinter && mode !== 'test') {
      notifications.show({
        title: 'Printer Hatası',
        message: 'Lütfen test için bir printer seçin',
        color: 'red'
      });
      return;
    }

    setIsTestingPrinter(true);
    
    try {
      // Test ZPL content - aynı yapıda test label
      const testZPL = `^XA
                        ^FO15,30
                        ^BXN,4,200
                        ^FD(01)12345678901234(21)TEST123456(10)LOT001(17)250101^FS
                        ^FO120,30^A0N,18,18^FD(01) 12345678901234^FS
                        ^FO120,55^A0N,18,18^FD(21) TEST123456^FS
                        ^FO120,80^A0N,18,18^FD(10) LOT001^FS
                        ^FO120,105^A0N,18,18^FD(17) 250101^FS
                        ^XZ`;

      notifications.show({
        id: 'printer-test',
        title: mode === 'test' ? 'Test Modu - Printer Testi' : 'Printer Testi',
        message: mode === 'test' ? 'Test HTTP endpoint\'e gönderiliyor...' : 'Test yazdırma işlemi başlatılıyor...',
        color: 'blue',
        loading: true,
        autoClose: false
      });

      if (mode === 'test') {
        // Test modunda HTTP endpoint'e gönder
        const response = await fetch('http://127.0.0.1:9100/write', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: testZPL
        });

        if (response.ok) {
          console.log('Test Mode - Test ZPL HTTP endpoint\'e gönderildi:', testZPL);
          notifications.update({
            id: 'printer-test',
            title: 'Test Başarılı',
            message: 'Test verisi HTTP endpoint\'e başarıyla gönderildi',
            color: 'green',
            loading: false,
            autoClose: 3000
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        // Normal mod - gerçek yazdırıcıya gönder
        if (printerSelectorRef.current) {
          await printerSelectorRef.current.print(testZPL);
          
          notifications.update({
            id: 'printer-test',
            title: 'Test Başarılı',
            message: 'Printer testi başarıyla tamamlandı',
            color: 'green',
            loading: false,
            autoClose: 3000
          });
        }
      }
    } catch (error: any) {
      console.error('Printer test failed:', error);
      
      notifications.update({
        id: 'printer-test',
        title: 'Test Başarısız',
        message: error?.message || 'Printer test edilirken hata oluştu',
        color: 'red',
        loading: false,
        autoClose: 5000
      });
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handlePrintJobOrder = async () => {
    if (!selectedPrinter && mode !== 'test') {
      notifications.show({
        title: 'Printer Hatası',
        message: 'Lütfen yazdırma için bir printer seçin',
        color: 'red'
      });
      return;
    }

    if (!jobOrder) {
      notifications.show({
        title: 'Hata',
        message: 'İş emri bilgileri bulunamadı',
        color: 'red'
      });
      return;
    }

    setIsPrintingJobOrder(true);

    try {
      // Format expiry date from YYYY-MM-DD to YYMMDD format for ZPL
      const formattedExpiry = jobOrder.expiry_date ? jobOrder.expiry_date.replace(/-/g, '').substring(2) : 'N/A';
      
      // Başlangıç seri numarasını sayıya çevir
      const startSerialNumber = parseInt(jobOrder.start_serial_number || '0');
      const quantity = jobOrder.quantity || 1;
      
      // Tüm etiketleri için ZPL içeriklerini hazırla
      const zplContents: string[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const currentSerialNumber = (startSerialNumber + i).toString().padStart(16, '0');
        
        const jobOrderZPL = `^XA
                ^FO15,30
                ^BXN,4,200
                ^FD(01)${jobOrder.gtin || 'N/A'}(21)${currentSerialNumber}(10)${jobOrder.lot || 'N/A'}(17)${formattedExpiry}^FS

                ^FO120,30^A0N,18,18^FD(01) ${jobOrder.gtin || 'N/A'}^FS
                ^FO120,55^A0N,18,18^FD(21) ${currentSerialNumber}^FS
                ^FO120,80^A0N,18,18^FD(10) ${jobOrder.lot || 'N/A'}^FS
                ^FO120,105^A0N,18,18^FD(17) ${formattedExpiry}^FS

                ^XZ`;
        
        zplContents.push(jobOrderZPL);
      }

      notifications.show({
        id: 'job-order-print',
        title: mode === 'test' ? 'Test Modu - İş Emri Yazdırma' : 'İş Emri Yazdırma',
        message: `${quantity} adet etiket ${mode === 'test' ? 'test ediliyor' : 'yazdırılıyor'}...`,
        color: 'blue',
        loading: true,
        autoClose: false
      });

      // Her etiketi sırayla yazdır ve progress göster
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < zplContents.length; i++) {
        try {
          if (mode === 'test') {
            // Test modunda HTTP endpoint'e gönder
            const response = await fetch('http://127.0.0.1:9100/write', {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain',
              },
              body: zplContents[i]
            });

            if (response.ok) {
              successCount++;
              console.log(`Test Mode - Etiket ${i + 1} HTTP endpoint'e gönderildi:`, zplContents[i]);
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } else {
            // Normal mod - gerçek yazdırıcıya gönder
            if (printerSelectorRef.current) {
              await printerSelectorRef.current.print(zplContents[i]);
              successCount++;
            }
          }
          
          // Progress güncellemesi
          notifications.update({
            id: 'job-order-print',
            title: mode === 'test' ? 'Test Modu - İş Emri Yazdırma' : 'İş Emri Yazdırma',
            message: `${i + 1}/${quantity} etiket ${mode === 'test' ? 'test edildi' : 'yazdırıldı'} (Başarılı: ${successCount}, Hatalı: ${failCount})`,
            color: failCount > 0 ? 'orange' : 'blue',
            loading: i < quantity - 1,
            autoClose: false
          });
          
        } catch (printError: any) {
          console.error(`Etiket ${i + 1} ${mode === 'test' ? 'test' : 'yazdırma'} hatası:`, printError);
          failCount++;
          
          // Progress güncellemesi
          notifications.update({
            id: 'job-order-print',
            title: mode === 'test' ? 'Test Modu - İş Emri Yazdırma' : 'İş Emri Yazdırma',
            message: `${i + 1}/${quantity} etiket işlendi (Başarılı: ${successCount}, Hatalı: ${failCount})`,
            color: 'orange',
            loading: i < quantity - 1,
            autoClose: false
          });
        }
        
        // Etiketler arası kısa bekleme
        if (i < zplContents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Final sonuç
      const finalColor = failCount === 0 ? 'green' : failCount < quantity ? 'yellow' : 'red';
      const finalTitle = failCount === 0 ? 
        (mode === 'test' ? 'Test Başarılı' : 'Yazdırma Başarılı') : 
        failCount < quantity ? 
        (mode === 'test' ? 'Test Kısmen Başarılı' : 'Yazdırma Kısmen Başarılı') : 
        (mode === 'test' ? 'Test Başarısız' : 'Yazdırma Başarısız');
      
      const actionText = mode === 'test' ? 'test edildi' : 'yazdırıldı';
      
      notifications.update({
        id: 'job-order-print',
        title: finalTitle,
        message: `Toplam ${quantity} etiketden ${successCount} tanesi başarıyla ${actionText}${failCount > 0 ? `, ${failCount} tanesi hatalı` : ''}`,
        color: finalColor,
        loading: false,
        autoClose: 5000
      });

      // Test modunda veya normal modda yazdırma işlemi başarıyla tamamlandıysa backend'e bildir
      if ((mode === 'test' || failCount === 0) && jobOrder?.id) {
        try {
          await completeItem(jobOrder.id);
          console.log(`İş emri tamamlandı olarak işaretlendi: ${jobOrder.id}`);
        } catch (error) {
          console.error('İş emri tamamlama hatası:', error);
          // completeItem kendi notification'ını göstereceği için burada ek notification göstermiyoruz
        }
      }
      
    } catch (error: any) {
      console.error('Job order print failed:', error);
      
      notifications.update({
        id: 'job-order-print',
        title: 'Yazdırma Başarısız',
        message: error?.message || 'İş emri yazdırılırken hata oluştu',
        color: 'red',
        loading: false,
        autoClose: 5000
      });
    } finally {
      setIsPrintingJobOrder(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="blue" size="lg" radius="md">
            <IconPrinter size={20} />
          </ThemeIcon>
          <Text fw={600} size="lg">İş Emrini Yazdır</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="lg">
        {/* Printer Seçimi */}
        <Paper p="md" withBorder>
          <ZebraPrinterSelector
            ref={printerSelectorRef}
            label="Printer Seçin"
            placeholder="İş emri yazdırmak için bir printer seçin"
            storeType="label"
            showRefreshButton={true}
            autoLoadOnMount={true}
            disabled={false}
            onChange={(device, deviceId) => {
              setSelectedPrinter(device);
            }}
            onError={(error) => {
              notifications.show({
                title: 'Printer Hatası',
                message: error,
                color: 'red'
              });
            }}
          />
        </Paper>

        {/* Üretilecek İş Emri Bilgileri */}
        {jobOrder && (
          <Paper bg="#f8f9fa" p="md" radius="md">
            <Group gap="sm" mb="md">
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconReceipt2 size={16} />
              </ThemeIcon>
              <Text fw={500} size="sm">
                Üretilecek İş Emri Bilgileri - İş Emri No: {jobOrder.order_number}
              </Text>
            </Group>
            
            <Stack gap="sm">
              <Box>
                <Text size='sm' c='dimmed'>Üretilecek Adet:</Text>
                <Text size='sm' fw={500}>{jobOrder.quantity}</Text>
              </Box>

              <Box>
                <Text size='sm' c='dimmed'>Başlangıç Seri No:</Text>
                <Text size='sm' fw={500}>{jobOrder.start_serial_number}</Text>
              </Box>

              <Box>
                <Text size='sm' c='dimmed'>Bitiş Seri No:</Text>
                <Text size='sm' fw={500}>{jobOrder.end_serial_number}</Text>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button
            variant="outline"
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handlePrinterTest}
            loading={isTestingPrinter}
            disabled={(mode !== 'test' && !selectedPrinter) || isPrintingJobOrder}
          >
            {mode === 'test' ? 'Test Et (HTTP)' : 'Yazıcıyı Test Et'}
          </Button>
          
          <Button
            leftSection={<IconPrinter size={16} />}
            onClick={handlePrintJobOrder}
            loading={isPrintingJobOrder}
            disabled={(mode !== 'test' && !selectedPrinter) || isTestingPrinter}
          >
            {mode === 'test' ? 'Test Et (HTTP)' : 'İş Emrini Yazdır'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
