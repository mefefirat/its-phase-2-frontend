import { useEffect } from 'react';
import { Table, Group, Text, Loader, Title, ThemeIcon, Pagination, Paper } from '@mantine/core';
import { IconPill } from '@tabler/icons-react';
import { useQrcodesStore } from '../store/qrcodesStore';
import { useNavigate } from 'react-router-dom';
import type { Qrcodes } from '../types/qrcodes';

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

  useEffect(() => {
    fetchItemsList();
  }, [fetchItemsList]);

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
    setPage(newPage);
  };

  const rows = items.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>{item.gtin}</Table.Td>
      <Table.Td>{item.lot}</Table.Td>
      <Table.Td>{item.expiry_date}</Table.Td>
      <Table.Td>{item.quantity}</Table.Td>
      <Table.Td>{item.start_serial_number}</Table.Td>
      <Table.Td>{item.end_serial_number}</Table.Td>
      <Table.Td>{item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : '-'}</Table.Td>
      <Table.Td>{item.created_by}</Table.Td>
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
    </Table.Tr>
  ));

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconPill color="#fff" stroke={1.5} />
          </ThemeIcon>
          Tamamlanmış İşler
        </Title>
      </Group>

      <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" striped highlightOnHover withColumnBorders>
          <Table.Thead style={{ backgroundColor: '#228be61f' }}>
            <Table.Tr>
              <Table.Th style={{ width: '120px' }} fw={500}>GTIN</Table.Th>
              <Table.Th fw={500}>LOT</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>SKT</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>Üretilen Adet</Table.Th>
              <Table.Th style={{ width: '140px' }} fw={500}>Başlangıç Seri</Table.Th>
              <Table.Th style={{ width: '120px' }} fw={500}>Bitiş Seri</Table.Th>
              <Table.Th fw={500}>Oluşturulma Tarihi</Table.Th>
              <Table.Th fw={500}>Kullanıcı</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              skeletonRows
            ) : items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
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
    </>
  );
}
