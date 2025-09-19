import { Box, Title, LoadingOverlay, Group, Button, ThemeIcon, Modal, Text, PasswordInput } from '@mantine/core';
import { 
  IconPlus, 
  IconBuilding,
  IconFilter,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import UserList from './UserList';
import type { User } from '../types/user';

export default function Users() {
  const { 
    users, 
    loading, 
    currentPage, 
    totalPages, 
    totalRecords,
    fetchUsers,
    deleteUser,
    changePassword
  } = useUserStore();

  const navigate = useNavigate();
  const [filterOpened, setFilterOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordModalOpened, setPasswordModalOpened] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = (user: User) => {
    setUserToChangePassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordModalOpened(true);
  };

  const handleEditClick = (user: User) => {
    navigate(`/definitions/users/edit/${user.id}`);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      setDeleteModalOpened(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete user error:', error);
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  const handleAddNew = () => {
    navigate('/definitions/users/add');
  };

  const submitPasswordChange = async () => {
    if (!userToChangePassword) return;
    if (!newPassword || !confirmPassword) {
      setPasswordError('Lütfen şifre ve doğrulamasını giriniz.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setPasswordError('');
    setPasswordSubmitting(true);
    const ok = await changePassword(userToChangePassword.id, newPassword);
    setPasswordSubmitting(false);
    if (ok) {
      setPasswordModalOpened(false);
      setUserToChangePassword(null);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconBuilding color="#fff" stroke={1.5} />
          </ThemeIcon>
          Kullanıcı İşlemleri
        </Title>
        <Group>
          <Button size="xs" leftSection={<IconPlus size={16} />} onClick={handleAddNew}>
            Yeni Ekle
          </Button>
        </Group>
      </Group>
     
      <LoadingOverlay visible={loading} />
      <UserList
        users={users}
        onUserClick={handleUserClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        totalRecords={totalRecords}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setUserToDelete(null);
        }}
        title="Kullanıcı Silme Onayı"
        centered
        size="sm"
      >
        <Box p="md">
          <Text size="sm" mb="lg">
            <strong>{userToDelete?.full_name}</strong> kullanıcısını silmek istediğinizden emin misiniz?
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={() => {
                setDeleteModalOpened(false);
                setUserToDelete(null);
              }}
              size="xs"
            >
              İptal
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={confirmDelete}
              size="xs"
            >
              Sil
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        opened={passwordModalOpened}
        onClose={() => {
          setPasswordModalOpened(false);
          setUserToChangePassword(null);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordError('');
        }}
        title="Şifre Değiştir"
        centered
        size="sm"
      >
        <Box p="md">
          <Text size="sm" mb="sm">
            Kullanıcı: <strong>{userToChangePassword?.full_name}</strong>
          </Text>
          <PasswordInput
            label="Yeni Şifre"
            placeholder="Yeni şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            mb="sm"
            withAsterisk
          />
          <PasswordInput
            label="Yeni Şifre (Doğrulama)"
            placeholder="Yeni şifreyi tekrar girin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            mb="sm"
            withAsterisk
          />
          {passwordError && (
            <Text c="red" size="sm" mb="sm">{passwordError}</Text>
          )}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              onClick={() => {
                setPasswordModalOpened(false);
                setUserToChangePassword(null);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }}
              size="xs"
            >
              İptal
            </Button>
            <Button
              onClick={submitPasswordChange}
              loading={passwordSubmitting}
              size="xs"
            >
              Kaydet
            </Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
} 