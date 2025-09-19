import React from 'react';
import { UnstyledButton, Text } from '@mantine/core';

interface MainMenuButtonProps {
  icon: React.ComponentType<any>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const MainMenuButton: React.FC<MainMenuButtonProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}) => {
  // ITS için kırmızı, diğerleri için gri
  const iconColor = label === 'ITS - Faz II' ? '#e03131' : '#616161';
  return (
    <UnstyledButton 
      onClick={onClick} 
      className={isActive ? `active${label === 'ITS - Faz II' ? ' jobs' : ''}` : ''}
    >
      <Icon size={24} color={iconColor} stroke={1.5} />
      <Text size="xs" style={{fontSize: '10px', color: '#616161'}}>
        {label}
      </Text>
    </UnstyledButton>
  );
};