import { useEffect, useState } from 'react';
import { Table, Group, Text, Loader, Title, ThemeIcon, Pagination, Paper, Menu, Drawer, Badge, Stack, Grid, Box, UnstyledButton, Divider } from '@mantine/core';
import { IconPill, IconDotsVertical, IconPrinter, IconEye, IconTrash, IconX, IconReceipt2, IconCalendar, IconHash, IconUser } from '@tabler/icons-react';
import { useQrcodesStore } from '../store/qrcodesStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Qrcodes } from '../types/qrcodes';
import PrintJobOrderPopup from './PrintJobOrderPopup';

export default function QrcodesList() {
  const { 
    items, 
    loading, 
    fetchItemsList, 
    removeItem, 
    page, 
    total, 
    total_pages, 
    setPage 
  } = useQrcodesStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Qrcodes | null>(null);
  const [printPopupOpened, setPrintPopupOpened] = useState(false);
  const [selectedPrintItem, setSelectedPrintItem] = useState<Qrcodes | null>(null);
  
  // Status'a göre sayfa başlığını belirle
  const status = searchParams.get('status');
  const getTitle = () => {
    switch (status) {
      case 'pending':
        return 'Bekleyen iş emirleri';
      case 'completed':
        return 'Tamamlanmış iş emirleri';
      default:
        return 'Tüm İşler';
    }
  };

  useEffect(() => {
    fetchItemsList(status || undefined);
  }, [fetchItemsList, searchParams]);

  const handleEdit = (item: Qrcodes) => {
    navigate(`/qrcodes/edit/${item.id}`);
  };

  const handleDelete = async (item: Qrcodes) => {
    if (window.confirm(`"${item.gtin} - ${item.lot}" öğesini silmek istediğinizden emin misiniz?`)) {
      try {
        await removeItem(item.id!);
      } catch (error) {
        // Store zaten error notification gösterdi
        console.error('Delete failed:', error);
      }
    }
  };

  const handlePrint = (item: Qrcodes) => {
    setSelectedPrintItem(item);
    setPrintPopupOpened(true);
  };

  const handleDetails = (item: Qrcodes) => {
    setSelectedItem(item);
    setDrawerOpened(true);
  };

  const handleAddNew = () => {
    navigate('/qrcodes/add');
  };

  if (loading) {
    return (
      <Group justify="center" mt="xl">
        <Loader size="md" />
        <Text>Veriler yükleniyor...</Text>
      </Group>
    );
  }

  const handlePageChange = (newPage: number) => {
    const status = searchParams.get('status');
    setPage(newPage, status || undefined);
  };

  const rows = items.map((item) => (
    <Table.Tr key={item.id}>
       <Table.Td>{item.order_number}</Table.Td>
      <Table.Td>{item.gtin}</Table.Td>
      <Table.Td>{item.lot}</Table.Td>
      <Table.Td>{item.expiry_date}</Table.Td>
      <Table.Td>{item.quantity}</Table.Td>
      <Table.Td>{item.start_serial_number}</Table.Td>
      <Table.Td>{item.end_serial_number}</Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <ThemeIcon
              variant="light"
              color="gray"
              style={{ cursor: 'pointer' }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical size={14} />
            </ThemeIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconPrinter size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handlePrint(item);
              }}
            >
              İş Emrini Yazdır
            </Menu.Item>
            
            <Menu.Item
              leftSection={<IconEye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleDetails(item);
              }}
            >
              Detaylar
            </Menu.Item>
           
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              Sil
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  // Skeleton rows for loading state
  const skeletonRows = Array.from({ length: 5 }).map((_, index) => (
    <Table.Tr key={`skeleton-${index}`}>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconPill color="#fff" stroke={1.5} />
          </ThemeIcon>
          {getTitle()}
        </Title>
      </Group>

      <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" striped highlightOnHover withColumnBorders>
          <Table.Thead style={{ backgroundColor: '#228be61f' }}>
            <Table.Tr>
            <Table.Th fw={500}>İş Emri No</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>GTIN</Table.Th>
              <Table.Th fw={500}>LOT</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>SKT</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>Üretilen Adet</Table.Th>
              <Table.Th style={{ width: '140px' }} fw={500}>Başlangıç Seri</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>Bitiş Seri</Table.Th>
              <Table.Th fw={500} style={{ width: '20px' }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              skeletonRows
            ) : items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={10}>
                  <Text ta="center" c="dimmed" py="xl">
                    Henüz QR Kod öğesi bulunmamaktadır.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      </Paper>
      
      <Group justify="flex-end" mt="md">
        <Text size="sm" color="gray">Toplam Kayıt: {typeof total === 'number' ? total : (items?.length || 0)}</Text>
        {!!total_pages && typeof page === 'number' && (
          <>
            <Text size="sm" color="gray">Sayfa: {page} / {total_pages}</Text>
            <Pagination 
              total={total_pages} 
              value={page} 
              onChange={handlePageChange}
              style={{ alignSelf: 'center' }}
              size="sm"
            />
          </>
        )}
      </Group>

      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size="md"
        offset={8}
        radius={8}
        withCloseButton={false}
      >
        {selectedItem && (
          <Stack gap="md">
            <Group justify="space-between" mb="lg">
              <Group gap="sm">
                <ThemeIcon className="page-title-icon" size={33} radius="md" color="blue">
                  <IconPill color="#fff" stroke={1.5} size={20} />
                </ThemeIcon>
                <Title order={5} style={{textAlign: 'left'}}>İş Emri Detayları</Title>
              </Group>
              
              <UnstyledButton variant="close" color="gray" size="sm" onClick={() => setDrawerOpened(false)}>
                <IconX size={20} />
              </UnstyledButton>
            </Group>

            {/* İş Emri Bilgileri */}
            <Paper bg="#f8f9fa" p="md" radius="md">
              <Group gap="sm" mb="md">
                <ThemeIcon size="sm" color="blue" variant="light">
                  <IconReceipt2 size={16} />
                </ThemeIcon>
                <Text fw={500} size="sm">İş Emri Bilgileri</Text>
              </Group>
              
              <Stack gap="sm">
                {selectedItem.order_number && (
                  <Box>
                    <Text size='sm' c='dimmed'>İş Emri No</Text>
                    <Badge radius={4} color="blue">{selectedItem.order_number}</Badge>
                  </Box>
                )}

                {selectedItem.gtin && (
                  <Box>
                    <Text size='sm' c='dimmed'>GTIN</Text>
                    <Text size='sm'>{selectedItem.gtin}</Text>
                  </Box>
                )}

                {selectedItem.lot && (
                  <Box>
                    <Text size='sm' c='dimmed'>LOT</Text>
                    <Text size='sm'>{selectedItem.lot}</Text>
                  </Box>
                )}

                {selectedItem.expiry_date && (
                  <Box>
                    <Text size='sm' c='dimmed'>Son Kullanma Tarihi</Text>
                    <Text size='sm'>{selectedItem.expiry_date}</Text>
                  </Box>
                )}

                {selectedItem.quantity && (
                  <Box>
                    <Text size='sm' c='dimmed'>Üretilen Adet</Text>
                    <Text size='sm'>{selectedItem.quantity}</Text>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Seri Numarası Bilgileri */}
            <Paper bg="#f8f9fa" p="md" radius="md">
              <Group gap="sm" mb="md">
                <ThemeIcon size="sm" color="green" variant="light">
                  <IconHash size={16} />
                </ThemeIcon>
                <Text fw={500} size="sm">Seri Numarası Bilgileri</Text>
              </Group>
              
              <Stack gap="sm">
                {selectedItem.start_serial_number && (
                  <Box>
                    <Text size='sm' c='dimmed'>Başlangıç Seri No</Text>
                    <Text size='sm'>{selectedItem.start_serial_number}</Text>
                  </Box>
                )}

                {selectedItem.end_serial_number && (
                  <Box>
                    <Text size='sm' c='dimmed'>Bitiş Seri No</Text>
                    <Text size='sm'>{selectedItem.end_serial_number}</Text>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Kayıt Bilgileri */}
            <Paper bg="#f8f9fa" p="md" radius="md">
              <Group gap="sm" mb="md">
                <ThemeIcon size="sm" color="orange" variant="light">
                  <IconUser size={16} />
                </ThemeIcon>
                <Text fw={500} size="sm">Kayıt Bilgileri</Text>
              </Group>
              
              <Stack gap="sm">
                {selectedItem.created_by && (
                  <Box>
                    <Text size='sm' c='dimmed'>Oluşturan</Text>
                    <Text size='sm'>{selectedItem.created_by}</Text>
                  </Box>
                )}

                {selectedItem.created_at && (
                  <Box>
                    <Text size='sm' c='dimmed'>Oluşturma Tarihi</Text>
                    <Text size='sm'>
                      {new Date(selectedItem.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </Box>
                )}

                {selectedItem.completed_by && (
                  <Box>
                    <Text size='sm' c='dimmed'>Tamamlayan</Text>
                    <Text size='sm'>{selectedItem.completed_by}</Text>
                  </Box>
                )}

                {selectedItem.completed_at && (
                  <Box>
                    <Text size='sm' c='dimmed'>Tamamlanma Tarihi</Text>
                    <Text size='sm'>
                      {new Date(selectedItem.completed_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </Box>
                )}

                <Box>
                  <Text size='sm' c='dimmed'>Durum</Text>
                  <Badge color={selectedItem.status === 'completed' ? 'green' : selectedItem.status === 'pending' ? 'orange' : 'blue'} radius={4}>
                    {selectedItem.status === 'completed' ? 'Tamamlandı' : 
                     selectedItem.status === 'pending' ? 'Beklemede' : 
                     selectedItem.status}
                  </Badge>
                </Box>
              </Stack>
            </Paper>

            {/* Actions */}
            <Group justify="flex-end" mt="lg">
              <ThemeIcon 
                size="lg" 
                color="blue" 
                variant="light" 
                style={{ cursor: 'pointer' }}
                onClick={() => handlePrint(selectedItem)}
                title="İş Emrini Yazdır"
              >
                <IconPrinter size={18} />
              </ThemeIcon>
            </Group>
          </Stack>
        )}
      </Drawer>

      {/* Print Job Order Popup */}
      <PrintJobOrderPopup
        opened={printPopupOpened}
        onClose={() => {
          setPrintPopupOpened(false);
          setSelectedPrintItem(null);
        }}
        jobOrder={selectedPrintItem}
      />
    </>
  );
}
