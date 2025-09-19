import {
  Button,
  Group,
  Center,
  Loader,
  Title,
  ThemeIcon,
  Text,
  Modal,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCompanyStore } from '../store/companyStore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IconSquareRoundedPlusFilled, 
  IconBuilding,
  IconAlertTriangle,
  IconCheck,
  IconFilter,
} from "@tabler/icons-react";
import CompanyList from './CompanyList';
import type { Company } from '../types/company';

export default function Companies() {
  const { 
    companies, 
    loading, 
    fetchCompaniesList,
    removeCompany,
    total,
    page,
    total_pages,
    setPage
  } = useCompanyStore();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Sayfa yüklendiğinde firmaları çek
    fetchCompaniesList();
  }, [fetchCompaniesList]);

  const handleDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      setIsDeleting(true);
      await removeCompany(companyToDelete.id!);
      notifications.show({
        title: 'Başarılı',
        message: 'Firma başarıyla silindi',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setDeleteModalOpened(false);
      setCompanyToDelete(null);
    } catch (error: any) {
      let errorMessage = 'Firma silinirken bir hata oluştu';
      
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
    navigate('/definitions/companies/add');
  };

  const handleEdit = (company: Company) => {
    navigate(`/definitions/companies/edit/${company.id}`);
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconBuilding color="#fff" stroke={1.5} />
          </ThemeIcon>
          Firma İşlemleri
        </Title>
        <Group>
          <Button size="xs" leftSection={<IconSquareRoundedPlusFilled size={16} />} onClick={handleAddNew}>
            Yeni Ekle
          </Button>
        </Group>
      </Group>
      
      <CompanyList 
        companies={companies}
        onEditClick={handleEdit}
        onDeleteClick={(company) => {
          setCompanyToDelete(company);
          setDeleteModalOpened(true);
        }}
        onReload={() => fetchCompaniesList()}
        loading={loading}
        total={total}
        currentPage={(page || 1) - 1}
        totalPages={total_pages}
        onPageChange={(zeroBased) => setPage(zeroBased + 1)}
      />
      
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Firma Sil"
        centered
      >
        <Stack gap="md">
          <Text>
            <b>{companyToDelete?.company_name}</b> firmasını silmek istediğinizden emin misiniz?
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