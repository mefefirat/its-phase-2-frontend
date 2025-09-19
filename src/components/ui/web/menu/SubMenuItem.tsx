import React from 'react';
import { UnstyledButton, Group, Text } from '@mantine/core';
import type { SubMenuItem as SubMenuItemType } from '@/constants/menuConfig';
import { useLayoutEditorStore } from '@/store/menuStore';

interface SubMenuItemProps {
  item: SubMenuItemType;
  isSelected: boolean;
  onNavigate: (path: string) => void;
}

export const SubMenuItem: React.FC<SubMenuItemProps> = ({ 
  item, 
  isSelected, 
  onNavigate 
}) => {
  const Icon = item.icon;
  const { openLayoutEditorPopup } = useLayoutEditorStore();
  
  const handleClick = () => {
    // Layout editor için özel popup açma
    if (item.id === 'layout-editor') {
      openLayoutEditorPopup();
    } else {
      // Diğer menü öğeleri için normal navigasyon
      onNavigate(item.path);
    }
  };
  
  return (
    <UnstyledButton 
      className={isSelected ? 'active' : ''} 
      variant="unstyled" 
      onClick={handleClick}
    >
      <Group gap="xs">
        <Icon 
          size={17} 
          color={isSelected ? '#228BE6' : '#616161'} 
        />
        <Text style={{ 
          color: isSelected ? '#228BE6' : '#616161' 
        }}>
          {item.label}
        </Text>
      </Group>
    </UnstyledButton>
  );
};