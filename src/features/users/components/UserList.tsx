import {
  Table,
  Group,
  Paper,
  ThemeIcon,
  Badge,
  Text,
  Menu,
  Pagination,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconLockOpen,
} from "@tabler/icons-react";
import type { User } from '../types/user';

interface UserListProps {
  users: User[];
  onUserClick: (user: User) => void;
  onEditClick: (user: User) => void;
  onDeleteClick: (user: User) => void;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
}

export default function UserList({ 
  users, 
  onUserClick, 
  onEditClick, 
  onDeleteClick,
  totalPages,
  currentPage,
  onPageChange,
  totalRecords
}: UserListProps) {
  const rows = users?.map((element) => (
    <Table.Tr
      key={element.id}
      style={{ cursor: 'pointer' }}
      onClick={() => onUserClick(element)}
    >
       
      <Table.Td style={{ width: '200px' }}>{element.full_name}</Table.Td>
      <Table.Td>{element.username}</Table.Td> 
      <Table.Td>{element.email}</Table.Td>
      <Table.Td style={{ width: '100px', textAlign: 'center' }}>
        <Badge color={element.role === 'admin' ? 'blue' : 'gray'}>
          {element.role === 'admin' ? 'Admin' : 'Worker'}
        </Badge>
      </Table.Td>
      <Table.Td style={{ width: '120px', textAlign: 'center' }}>
        <Badge color={element.is_active ? 'green' : 'red'}>
          {element.is_active ? 'Aktif' : 'Pasif'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200} position="bottom-end">
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
              leftSection={<IconLockOpen size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onUserClick(element);
              }}
            >
              Sifre Değiştir
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash size={14} />}
              color="red"
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

  return (
    <>
      
      <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" striped highlightOnHover withColumnBorders>
          <Table.Thead style={{ backgroundColor: '#228be61f' }}>
            <Table.Tr>
              
              <Table.Th style={{ width: '200px' }}>Ad Soyad</Table.Th>
              <Table.Th style={{ width: '130px' }}>Kullanıcı Adı</Table.Th>
              <Table.Th>E-posta</Table.Th>
              <Table.Th style={{ width: '100px' }}>Rol</Table.Th>
              <Table.Th style={{ minWidth: 100, width: '120px' }}>Durum</Table.Th>
              <Table.Th style={{ width: 50 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
        </Paper>
     
      
      <Group justify="flex-end" mt="md">
        <Text size="sm" color="gray">Toplam Kayıt: {typeof totalRecords === 'number' ? totalRecords : users?.length}</Text>
        <Text size="sm" color="gray">Sayfa: {currentPage + 1} / {totalPages}</Text>
        <Pagination 
          total={totalPages} 
          value={currentPage + 1} 
          onChange={(page) => onPageChange(page - 1)}
          style={{ alignSelf: 'center' }}
          size="sm"
        />
      </Group>
    </>
  );
} 