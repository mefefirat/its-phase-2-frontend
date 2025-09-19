import {
  Button,
  Group,
  Title,
  ThemeIcon,
  Text,
  Modal,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMaterialStore } from '../store/materialStore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IconSquareRoundedPlusFilled, 
  IconPackage,
  IconAlertTriangle,
  IconCheck,
} from "@tabler/icons-react";
import MaterialsList from './MaterialsList';
import type { Material } from '../types/material';

export default function Materials() {
  const { 
    materials, 
    loading, 
    fetchMaterialsList,
    removeMaterial,
    total,
    page,
    total_pages,
    setPage
  } = useMaterialStore();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMaterialsList();
  }, [fetchMaterialsList]);

  const handleDelete = async () => {
    if (!materialToDelete) return;
    try {
      setIsDeleting(true);
      await removeMaterial(materialToDelete.id!);
      notifications.show({
        title: 'Başarılı',
        message: 'Ürün başarıyla silindi',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setDeleteModalOpened(false);
      setMaterialToDelete(null);
    } catch (error: any) {
      let errorMessage = 'Ürün silinirken bir hata oluştu';
      if (error.response) {
        errorMessage = error.response.data?.message || `Hata: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamıyor';
      } else {
        errorMessage = error.message || errorMessage;
      }
      notifications.show({
        title: 'Hata',
        message: errorMessage,
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    navigate('/definitions/materials/add');
  };

  const handleEdit = (material: Material) => {
    navigate(`/definitions/materials/edit/${material.id}`);
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconPackage color="#fff" stroke={1.5} />
          </ThemeIcon>
          Ürün İşlemleri
        </Title>
        <Group>
          <Button size="xs" leftSection={<IconSquareRoundedPlusFilled size={16} />} onClick={handleAddNew}>
            Yeni Ekle
          </Button>
        </Group>
      </Group>
      
      <MaterialsList 
        materials={materials}
        onEditClick={handleEdit}
        onDeleteClick={(material) => {
          setMaterialToDelete(material);
          setDeleteModalOpened(true);
        }}
        onReload={() => fetchMaterialsList()}
        loading={loading}
        total={total}
        currentPage={(page || 1) - 1}
        totalPages={total_pages}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
      />
      
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Ürün Sil"
        centered
      >
        <Stack gap="md">
          <Text>
            <b>{materialToDelete?.material_name}</b> ürününü silmek istediğinizden emin misiniz?
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setDeleteModalOpened(false)}>
              İptal
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleDelete}>
              Sil
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}


