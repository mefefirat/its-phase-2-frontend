import {
  Table,
  Group,
  Text,
  Menu,
  Paper,
  Button,
  Pagination,
  ThemeIcon,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";
import type { Material } from '../types/material';

interface MaterialsListProps {
  materials: Material[];
  onEditClick: (material: Material) => void;
  onDeleteClick: (material: Material) => void;
  onReload?: () => void;
  loading?: boolean;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (pageZeroBased: number) => void;
}

export default function MaterialsList({
  materials,
  onEditClick,
  onDeleteClick,
  onReload,
  loading = false,
  total,
  currentPage,
  totalPages,
  onPageChange,
}: MaterialsListProps) {
  const rows = materials?.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td style={{ minWidth: '100px' }}>{element.company_code}</Table.Td>
      <Table.Td style={{ minWidth: '240px' }}>{element.material_name}</Table.Td>
      <Table.Td style={{ minWidth: '160px' }}>{element.sku || '-'}</Table.Td>
      <Table.Td style={{ minWidth: '160px' }}>{element.gtin || '-'}</Table.Td>
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
              leftSection={<IconEdit size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(element);
              }}
            >
              Düzenle
            </Menu.Item>
            
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(element);
              }}
            >
              Sil
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  const skeletonRows = Array.from({ length: 5 }).map((_, index) => (
    <Table.Tr key={`skeleton-${index}`}>
      <Table.Td style={{ textAlign: 'center' }}>
        <div style={{ height: 20, backgroundColor: '#f0f0f0', borderRadius: 4 }} />
      </Table.Td>
      <Table.Td style={{ minWidth: '250px' }}>
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
      <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" striped highlightOnHover withColumnBorders>
          <Table.Thead style={{ backgroundColor: '#228be61f' }}>
            <Table.Tr>
              <Table.Th style={{ width: '100px'}} fw={500}>Firma Kodu</Table.Th>
              <Table.Th fw={500}>Ürün Adı</Table.Th>
              <Table.Th style={{ width: '160px'}} fw={500}>SKU</Table.Th>
              <Table.Th style={{ width: '160px'}} fw={500}>GTIN</Table.Th>
              <Table.Th style={{ width: 50, textAlign: 'center' }} fw={500}>
                <Button 
                  variant="subtle" 
                  size="md"
                  onClick={onReload} 
                  style={{ padding: '4px', minWidth: 'auto', width: '32px', height: '32px' }}
                  title="Yenile"
                >
                  <IconRefresh size={18} />
                </Button>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              skeletonRows
            ) : materials?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="xl">
                    Ürün bulunamadı
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
        <Text size="sm" color="gray">Toplam Kayıt: {typeof total === 'number' ? total : (materials?.length || 0)}</Text>
        {!!totalPages && typeof currentPage === 'number' && (
          <>
            <Text size="sm" color="gray">Sayfa: {(currentPage + 1)} / {totalPages}</Text>
            <Pagination 
              total={totalPages} 
              value={(currentPage + 1)} 
              onChange={(page) => onPageChange && onPageChange(page - 1)}
              style={{ alignSelf: 'center' }}
              size="sm"
            />
          </>
        )}
      </Group>
    </>
  );
}


