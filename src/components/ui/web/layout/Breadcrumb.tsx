import React from 'react';
import { Group, Text } from '@mantine/core';
import { IconHomeFilled, IconArrowRight } from '@tabler/icons-react';
import { useCurrentCompany } from '@/store/globalStore';

interface BreadcrumbProps {
  isDefinitions: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  isDefinitions,
}) => {
  const currentCompany = useCurrentCompany();

  return (
    <Group className='breadcrumb'>
      <IconHomeFilled size={18} color="#458BC9" />
     
              <Text size="xs" fw={400}>{currentCompany?.name || 'Firma Seçilmedi'}</Text>
         </Group>
  );
};