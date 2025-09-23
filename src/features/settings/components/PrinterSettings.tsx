import React from 'react';
import {
  Stack,
  Text,
  Title,
  Card,
  Group,
  Alert,
  Button,
  Divider
} from '@mantine/core';
import {
  IconPrinter,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react';
import ZebraPrinterSelector from '@/shared/printer/ZebraPrinterSelector';
import { usePalletPrinter, useLabelPrinter } from '@/store/globalStore';
import { notifications } from '@mantine/notifications';

const PrinterSettings: React.FC = () => {
  const { palletPrinter, setPalletPrinter } = usePalletPrinter();
  const { labelPrinter, setLabelPrinter } = useLabelPrinter();

  const handlePalletPrinterChange = (device: any, deviceId: string | null) => {
    setPalletPrinter(deviceId);
    if (deviceId) {
      notifications.show({
        title: 'Başarılı',
        message: 'Palet printer\'ı başarıyla seçildi',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    }
  };

  const handleLabelPrinterChange = (device: any, deviceId: string | null) => {
    setLabelPrinter(deviceId);
    if (deviceId) {
      notifications.show({
        title: 'Başarılı',
        message: 'Etiket printer\'ı başarıyla seçildi',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    }
  };

  const handlePalletPrinterError = (error: string) => {
    notifications.show({
      title: 'Hata',
      message: `Palet printer hatası: ${error}`,
      color: 'red',
      icon: <IconAlertCircle size={16} />,
    });
  };

  const handleLabelPrinterError = (error: string) => {
    notifications.show({
      title: 'Hata',
      message: `Etiket printer hatası: ${error}`,
      color: 'red',
      icon: <IconAlertCircle size={16} />,
    });
  };

  return (
    <Stack gap="lg">
      <Group>
        <IconPrinter size={24} />
        <Title order={2}>Printer Ayarları</Title>
      </Group>

      <Alert
        icon={<IconAlertCircle size={16} />}
        title="Önemli Bilgi"
        color="blue"
        variant="light"
      >
        <Text size="sm">
          Printer ayarlarınızı yapın. Seçtiğiniz printer'lar diğer sayfalardan yazdırma işlemlerinde kullanılacaktır.
        </Text>
      </Alert>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Palet Printer</Title>
          <Text size="sm" c="dimmed">
            Palet etiketleri için kullanılacak printer'ı seçin.
          </Text>
          
          <ZebraPrinterSelector
            label="Palet için Printer Seçin"
            placeholder="Palet printer'ı seçin"
            onChange={handlePalletPrinterChange}
            onError={handlePalletPrinterError}
            showRefreshButton={true}
            showPrintButton={false}
            hideSelect={false}
            autoLoadOnMount={true}
            disabled={false}
            storeType="pallet"
          />

          {palletPrinter && (
            <Alert
              icon={<IconCheck size={16} />}
              title="Palet Printer Seçildi"
              color="green"
              variant="light"
            >
              <Text size="sm">
                Palet printer'ı başarıyla ayarlandı.
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Diğer Etiketler için Printer</Title>
          <Text size="sm" c="dimmed">
            Ürün etiketleri ve diğer etiketler için kullanılacak printer'ı seçin.
          </Text>
          
          <ZebraPrinterSelector
            label="Diğer Etiketler için Printer Seçin"
            placeholder="Etiket printer'ı seçin"
            onChange={handleLabelPrinterChange}
            onError={handleLabelPrinterError}
            showRefreshButton={true}
            showPrintButton={false}
            hideSelect={false}
            autoLoadOnMount={true}
            disabled={false}
            storeType="label"
          />

          {labelPrinter && (
            <Alert
              icon={<IconCheck size={16} />}
              title="Etiket Printer Seçildi"
              color="green"
              variant="light"
            >
              <Text size="sm">
                Etiket printer'ı başarıyla ayarlandı.
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      <Divider />

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3}>Mevcut Ayarlar</Title>
          
          <Group gap="md">
            <div>
              <Text fw={500} size="sm">Palet Printer:</Text>
              <Text size="sm" c={palletPrinter ? "green" : "dimmed"}>
                {palletPrinter ? `Seçildi (ID: ${palletPrinter})` : 'Seçilmedi'}
              </Text>
            </div>
            
            <div>
              <Text fw={500} size="sm">Etiket Printer:</Text>
              <Text size="sm" c={labelPrinter ? "green" : "dimmed"}>
                {labelPrinter ? `Seçildi (ID: ${labelPrinter})` : 'Seçilmedi'}
              </Text>
            </div>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

export default PrinterSettings;
