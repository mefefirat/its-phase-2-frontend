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
import { useJobStore } from '../store/jobStore';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  IconSquareRoundedPlusFilled, 
  IconBriefcase,
  IconAlertTriangle,
  IconCheck,
  IconFilter,
} from "@tabler/icons-react";
import JobsList from './JobsList';
import type { Job } from '../types/job';

export default function Jobs() {
  const { 
    jobs, 
    loading, 
    fetchJobsList,
    removeJob,
    total,
    page,
    total_pages,
    setPage
  } = useJobStore();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Sayfa yüklendiğinde işleri çek
    fetchJobsList();
  }, [fetchJobsList]);

  // URL değiştiğinde jobları yeniden çek
  useEffect(() => {
    fetchJobsList();
  }, [location.search, fetchJobsList]);

  const handleDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      setIsDeleting(true);
      await removeJob(jobToDelete.id!);
      notifications.show({
        title: 'Başarılı',
        message: 'İş başarıyla silindi',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setDeleteModalOpened(false);
      setJobToDelete(null);
    } catch (error: any) {
      let errorMessage = 'İş silinirken bir hata oluştu';
      
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
    navigate('/jobs/add');
  };

  const handleEdit = (job: Job) => {
    navigate(`/jobs/edit/${job.id}`);
  };

  const handleContinueScan = (job: Job) => {
    navigate(`/jobs/scan/${job.id}`);
  };

  return (
    <>
      <Group className='page-header' justify="space-between" mb="lg">
        <Title order={1} className='h1'>
          <ThemeIcon className="page-title-icon" size={30} radius="md" color="blue">
            <IconBriefcase color="#fff" stroke={1.5} />
          </ThemeIcon>
          İş Listesi
        </Title>
        <Group>
          <Button size="xs" leftSection={<IconSquareRoundedPlusFilled size={16} />} onClick={handleAddNew}>
            Yeni Ekle
          </Button>
        </Group>
      </Group>
      
      <JobsList 
        jobs={jobs}
        onEditClick={handleEdit}
        onContinueScanClick={handleContinueScan}
        onDeleteClick={(job: Job) => {
          setJobToDelete(job);
          setDeleteModalOpened(true);
        }}
        onReload={() => fetchJobsList()}
        loading={loading}
        total={total}
        currentPage={(page || 1) - 1}
        totalPages={total_pages}
        onPageChange={(zeroBased: number) => setPage(zeroBased + 1)}
      />
      
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="İş Sil"
        centered
      >
        <Stack gap="md">
          <Text>
            <b>{jobToDelete?.company_code}</b> kodlu işi silmek istediğinizden emin misiniz?
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
