import {
  Table,
  Group,
  ScrollArea,
  ThemeIcon,
  Badge,
  Text,
  Menu,
  Paper,
  Button,
  Pagination,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconRefresh,
} from "@tabler/icons-react";
import type { Job } from '../types/job';

interface JobsListProps {
  jobs: Job[];
  onEditClick: (job: Job) => void;
  onContinueScanClick: (job: Job) => void;
  onDeleteClick: (job: Job) => void;
  onReload?: () => void;
  loading?: boolean;
  total?: number;
  currentPage?: number; // zero-based in store
  totalPages?: number;
  onPageChange?: (pageZeroBased: number) => void;
}

export default function JobsList({ 
  jobs, 
  onEditClick, 
  onContinueScanClick,
  onDeleteClick,
  onReload,
  loading = false,
  total,
  currentPage,
  totalPages,
  onPageChange,
}: JobsListProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'gray';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'Taslak';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const rows = jobs?.map((element) => (
    <Table.Tr
      key={element.id}
    >
      <Table.Td>{element.material_name}</Table.Td>  
      <Table.Td>{element.planned_items}</Table.Td>
      <Table.Td>{element.scanned_items}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(element.status)} variant="light">
          {getStatusText(element.status)}
        </Badge>
      </Table.Td>
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
            {element.status.toLowerCase() === 'draft' && (
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(element);
                }}
              >
                Düzenle
              </Menu.Item>
            )}
            
            {element.status.toLowerCase() === 'in_progress' && (
              <>
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
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContinueScanClick(element);
                }}
              >
                İşe Devam Et
              </Menu.Item>
              </>
            )}
           
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

  // Skeleton rows for loading state
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
              <Table.Th fw={500}>Ürün Adı</Table.Th>
              <Table.Th style={{ width: '120px'}} fw={500}>Üretim Miktarı</Table.Th>
              <Table.Th style={{ width: '120px'}} fw={500}>Taranan Miktar</Table.Th>
              <Table.Th style={{ width: '150px'}} fw={500}>Durum</Table.Th>
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
            ) : jobs?.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9}>
                  <Text ta="center" c="dimmed" py="xl">
                    İş bulunamadı
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
        <Text size="sm" color="gray">Toplam Kayıt: {typeof total === 'number' ? total : (jobs?.length || 0)}</Text>
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
